"""Authenticated ChatTTS adapter for 知课. Deploy separately from the web Worker."""
import io
import os
import secrets
import threading
import wave
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field

engine = None
speaker = None
lock = threading.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, speaker
    import ChatTTS
    import torch
    if len(os.environ.get("CHATTTS_API_KEY", "")) < 32:
        raise RuntimeError("CHATTTS_API_KEY must contain at least 32 characters")
    torch.manual_seed(42)
    engine = ChatTTS.Chat()
    model_dir = os.environ.get("CHATTTS_MODEL_DIR")
    loaded = engine.load(source="custom", custom_path=model_dir, compile=False) if model_dir else engine.load(compile=False)
    if loaded is False:
        raise RuntimeError("ChatTTS model failed to load")
    speaker = engine.sample_random_speaker()
    yield

app = FastAPI(title="Zhike ChatTTS", lifespan=lifespan, docs_url=None, redoc_url=None)

class Speech(BaseModel):
    input: str = Field(min_length=1, max_length=500)
    model: str = "chattts"
    voice: str = "default"
    response_format: str = "wav"

@app.get("/health")
def health():
    return {"ready": engine is not None}

@app.post("/v1/audio/speech")
def speech(data: Speech, authorization: str = Header(default="")):
    expected = "Bearer " + os.environ["CHATTTS_API_KEY"]
    if not secrets.compare_digest(authorization, expected):
        raise HTTPException(401, "Unauthorized")
    if data.model != "chattts" or data.voice != "default" or data.response_format != "wav":
        raise HTTPException(422, "Use chattts/default/wav")
    if not data.input.strip():
        raise HTTPException(422, "Empty input")
    if not lock.acquire(blocking=False):
        raise HTTPException(429, "Speech worker is busy")
    try:
        import ChatTTS
        # Avoid text refinement rewriting the teacher's original sentence.
        audio = engine.infer([data.input], skip_refine_text=True,
            params_infer_code=ChatTTS.Chat.InferCodeParams(spk_emb=speaker, temperature=0.3))[0]
        samples = np.asarray(audio).reshape(-1)
        if not samples.size or not np.isfinite(samples).all():
            raise RuntimeError("Invalid waveform")
        pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
        if pcm.nbytes > 9_000_000:
            raise HTTPException(413, "Audio too long")
        output = io.BytesIO()
        with wave.open(output, "wb") as stream:
            stream.setnchannels(1)
            stream.setsampwidth(2)
            stream.setframerate(24000)
            stream.writeframes(pcm.tobytes())
        return Response(output.getvalue(), media_type="audio/wav", headers={"Cache-Control": "no-store"})
    except HTTPException:
        raise
    except Exception:
        # Do not expose input text, tokens or filesystem details in API errors.
        raise HTTPException(500, "Speech generation failed") from None
    finally:
        lock.release()
