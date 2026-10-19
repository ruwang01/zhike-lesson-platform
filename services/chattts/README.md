# 知课 ChatTTS 独立语音服务

此目录是服务代码与部署说明，尚未在 GPU 服务器运行。网站端已适配该接口。需要一台运行 ChatTTS 的独立机器；网页托管 Worker 不运行 PyTorch 模型。

1. 准备 Python 3.11 环境，按 ChatTTS 官方说明安装适配机器的 torch、ChatTTS 与模型，再安装 requirements.txt。
2. 在服务器密钥管理或仅服务器可读的环境文件设置 CHATTTS_API_KEY（至少32位随机值）。不要放在公开仓库。
3. 可选 CHATTTS_MODEL_DIR 指向已下载的模型目录；否则首次启动会按 ChatTTS 默认方式获取模型，需要外网与存储空间。
4. 启动 `uvicorn app:app --host 127.0.0.1 --port 8000 --workers 1`，只启一个模型进程。反向代理设置 HTTPS、请求体限制、访问限速与120秒超时，并将 /v1/audio/speech 转发到本机8000端口。服务不提供跨域访问，只有网站服务端调用。
5. 网站服务端配置 SPEECH_PROVIDER=chattts、SPEECH_BASE_URL=https://你的语音域名/v1、SPEECH_API_KEY=同一密钥。SPEECH_MODEL 和 SPEECH_VOICE 在此模式可不填。
6. GET /health 可检查模型是否加载；POST /v1/audio/speech 使用 Bearer 密钥，正文 `{ "model":"chattts", "voice":"default", "input":"去我们学校的车很多，非常方便。", "response_format":"wav" }`，返回 WAV 二进制。

每次最多500字，单进程同时只接受一个合成任务，繁忙返回429，网站会提示重试。设定固定采样种子生成默认音色，关闭文本润色步骤，避免主动改写原句；仍需试听核对漏字、多音字、停顿及音色稳定性。生成超过网站110秒超时需减少文本或提高硬件性能。

上线前需在真实服务器完成模型下载、中文试听、超时与并发验证。当前只验证了网站适配协议与封装代码语法，不代表已完成真实语音合成。

官方来源：https://github.com/2noise/ChatTTS 。官方说明代码采用 AGPLv3+，模型采用 CC BY-NC 4.0、用于教育研究且非商业；公开提供服务前应按实际用途遵守对应许可。服务封装不复制模型文件。

## 从零部署的顺序

- 先确定独立服务器：建议支持 CUDA 的 Linux GPU 机器，以缩短多人使用的等待；官方示例称30秒音频至少约4GB显存，实际还需给运行环境和并发留余量。不要在网站 Worker 中安装模型。
- 先在服务器本机验证 ChatTTS 官方最小示例，再启动本封装，避免同时排查模型与网站两个环节。
- 配置域名、TLS 反向代理、防火墙，模型端口8000不直接暴露公网。服务密钥仅放在语音服务器和知课网站服务端。
- 用短句验证200响应及 WAV 文件；再验证401（错误密钥）、429（正在合成）和过长文本422。
- 把 HTTPS 地址与同一密钥填入知课配置后，先试听原句，再测试两名教师同时请求；当前繁忙策略为拒绝并提示重试，尚未实现任务队列。
- 若没有服务器账号，下一步需要先选定服务器提供商及预算，再由用户开通账号与机器。此阶段没有购买服务器、域名或启动收费资源。

官方硬件与使用说明：https://github.com/2noise/ChatTTS#faq 。上述部署步骤不是已完成部署的记录。

目录另附 Caddyfile.example（替换域名的 HTTPS 反向代理样例）和 zhike-chattts.service.example（需替换用户与路径的 systemd 样例）。这两份样例尚未在目标服务器部署，不能直接视为已验证的生产配置。环境文件 /etc/zhike-chattts.env 仅服务用户可读，写入 CHATTTS_API_KEY 与可选模型目录。
