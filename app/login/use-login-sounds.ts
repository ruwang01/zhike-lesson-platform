'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
type LoginSound='click'|'success'|'error';
const preferenceKey='zhike-login-sound';
export function useLoginSounds(){
  const [enabled,setEnabled]=useState(true);
  const enabledRef=useRef(true);
  const player=useRef<HTMLAudioElement|null>(null);
  const stop=useCallback(()=>{
    const current=player.current;player.current=null;
    if(current){current.pause();current.removeAttribute('src');current.load()}
  },[]);
  useEffect(()=>{
    try{const value=localStorage.getItem(preferenceKey)!=='off';enabledRef.current=value;setEnabled(value)}catch{/* Sound preference is optional. */}
    return stop;
  },[stop]);
  const play=useCallback((kind:LoginSound)=>{
    if(!enabledRef.current)return;
    stop();
    try{
      const audio=new Audio(`/login/audio/login-${kind}.wav`);audio.volume=.32;player.current=audio;
      void audio.play().catch(()=>{/* Playback must never affect authentication. */});
    }catch{/* Audio is an optional visual-feedback companion. */}
  },[stop]);
  const toggle=useCallback(()=>{
    const value=!enabledRef.current;enabledRef.current=value;setEnabled(value);
    if(!value)stop();
    try{localStorage.setItem(preferenceKey,value?'on':'off')}catch{/* Keep the in-memory choice. */}
  },[stop]);
  return {enabled,play,toggle};
}
