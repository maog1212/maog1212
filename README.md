# 🎤 VoiceChart — 语音流程图生成器

对着麦克风说话，AI 自动生成专业流程图。**部署一次，任何设备打开链接即用。**

[![License: MIT](https://img.shields.io/badge/License-MIT-818cf8.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/voicechart)

---

## ✨ 功能

- **🎙 全平台语音** — iOS Safari / Android Chrome / Firefox / 桌面浏览器全覆盖
- **🤖 DeepSeek AI** — 理解自然语言，输出标准 Mermaid 图表代码
- **📱 移动端优化** — 图表在上、控制在下，捏合缩放，PWA 可安装
- **8 种图表** — 流程图、时序图、思维导图、类图、状态图、ER 图、甘特图、饼图
- **导出** — SVG（矢量）、PNG（2× 高清）、Mermaid 代码

---

## 🚀 部署（选一种）

### 方式一：Railway（推荐，免费，2 分钟完成）

1. Fork 本仓库到你的 GitHub 账号
2. 打开 [railway.com](https://railway.com) → New Project → Deploy from GitHub Repo
3. 选择 fork 的仓库 → Railway 自动识别 `Dockerfile`
4. 进入 Variables 标签 → 添加环境变量：
   ```
   DEEPSEEK_API_KEY = sk-xxxxxxxxxxxxxxxx
   ```
5. 点击 Deploy → 等待 2-3 分钟
6. 点击生成的域名（如 `voicechart-xxx.up.railway.app`）→ 在手机浏览器打开即可使用

---

### 方式二：Render（免费，自动休眠）

1. Fork 本仓库
2. 打开 [render.com](https://render.com) → New → Web Service → Connect GitHub
3. 选择仓库 → Render 自动识别 `render.yaml`
4. 添加环境变量 `DEEPSEEK_API_KEY`
5. 点击 Create → 部署完成后获得 HTTPS 链接

---

### 方式三：Docker（自有服务器）

```bash
git clone https://github.com/maog1212/maog1212.git
cd maog1212

# 设置 API Key 后一键启动
DEEPSEEK_API_KEY=sk-xxxx docker compose up -d

# 或使用 .env 文件
echo "DEEPSEEK_API_KEY=sk-xxxx" > .env
docker compose up -d
```

服务运行在 `http://0.0.0.0:8000`。确保服务器开放 8000 端口。

> 提示：如需外网 HTTPS 访问，建议套一层 Nginx + Certbot（Let's Encrypt）。

---

### 方式四：本地运行

```bash
# 依赖 Python 3.10+ 和 ffmpeg
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg

pip install -r requirements.txt
DEEPSEEK_API_KEY=sk-xxxx python app.py
# 打开 http://localhost:8000
```

---

## 📱 手机端使用

部署完成后，在手机浏览器打开服务 URL：

| 浏览器 | 语音方式 | 体验 |
|--------|---------|------|
| iOS Safari 14.5+ | Web Speech API | 实时识别 ✅ |
| Android Chrome | Web Speech API | 实时识别 ✅ |
| Android Firefox | MediaRecorder → Whisper | 录完自动识别 ✅ |
| 其他 | MediaRecorder → Whisper | 录完自动识别 ✅ |

> 首次使用 Firefox 等浏览器时，后端会自动下载 Whisper `base` 模型（~145MB），下载完成后每次识别只需 1-2 秒。Docker 部署版本在构建时已预下载。

**添加到主屏幕**（可选）：
- iOS Safari：分享 → 添加到主屏幕
- Android Chrome：菜单 → 添加到主屏幕

---

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|-------|------|
| `DEEPSEEK_API_KEY` | — | **必填**，DeepSeek API 密钥 |
| `WHISPER_MODEL` | `base` | 语音模型大小：`tiny`(快) / `base`(均衡) / `small`(准) |
| `PORT` | `8000` | 监听端口（Railway/Render 自动设置） |
| `ENV` | — | 设为 `production` 关闭热重载 |

---

## 🏗 架构

```
┌─────────────────────────────────────────┐
│  浏览器（手机 / PC）                     │
│  - Web Speech API  → 实时语音 → 文字    │
│  - MediaRecorder   → 录音文件            │
└──────────┬──────────────────────────────┘
           │  HTTPS
┌──────────▼──────────────────────────────┐
│  FastAPI 后端                           │
│  POST /api/transcribe ← Whisper 识别    │
│  POST /api/generate   → DeepSeek API   │
│  GET  /               → 前端页面        │
└─────────────────────────────────────────┘
```

**技术栈：**
- Backend: Python + FastAPI + faster-whisper
- AI: DeepSeek（OpenAI 兼容 API）
- Frontend: 原生 JS + Mermaid.js v11（无框架，无打包）
- 容器: Docker / docker-compose

---

## 🗣 示例描述

> "用户登录，输入账号密码，系统验证失败提示重试，验证通过跳转首页"

> "前端发请求给后端，后端查数据库，返回数据给前端渲染页面"

> "项目分三阶段：需求一周，开发三周，测试两周"

---

## 📄 License

MIT © 2026 [maog1212](https://github.com/maog1212)
