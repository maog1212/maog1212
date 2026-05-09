# 🎤 VoiceChart — 语音流程图生成器

> 对着麦克风说话，AI 自动生成专业流程图。支持全平台浏览器与手机端。

[![License: MIT](https://img.shields.io/badge/License-MIT-818cf8.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Mermaid](https://img.shields.io/badge/Mermaid-v11-FF3670?logo=mermaid&logoColor=white)](https://mermaid.js.org)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🎙️ 跨浏览器语音 | Chrome/Edge 实时识别；Firefox/Safari/手机 → MediaRecorder + Whisper |
| 📱 手机端 PWA | 可添加到桌面，图表在顶部，控制在底部，支持捏合缩放 |
| 🤖 DeepSeek AI | 理解自然语言描述，自动选择最合适的图表结构 |
| 🗂 8 种图表 | 流程图、时序图、思维导图、类图、状态图、ER 图、甘特图、饼图 |
| 🔍 缩放控制 | 鼠标滚轮缩放 / 触摸捏合缩放 / 适应窗口 |
| 📤 多格式导出 | SVG（矢量）、PNG（高清 2× 分辨率）、Mermaid 代码复制 |
| ✏️ 实时编辑 | 修改 Mermaid 代码即时重新渲染预览 |
| ⌨️ 快捷键 | `Ctrl/⌘+Enter` 生成 · `Ctrl/⌘+M` 录音开关 |

---

## 🚀 快速启动

### 1. 克隆并安装依赖

```bash
git clone https://github.com/maog1212/maog1212.git
cd maog1212
pip install -r requirements.txt
```

> **注意**：跨浏览器语音识别需要 [ffmpeg](https://ffmpeg.org/download.html)
> - macOS: `brew install ffmpeg`
> - Ubuntu: `sudo apt install ffmpeg`
> - Windows: [下载安装包](https://ffmpeg.org/download.html#build-windows)

### 2. 配置 API Key

```bash
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key
```

### 3. 启动服务

```bash
python app.py
```

打开 http://localhost:8000 即可使用。

---

## 🌐 浏览器支持

| 浏览器 | 语音识别方式 | 说明 |
|--------|------------|------|
| Chrome / Edge | Web Speech API ✅ | 实时识别，说话即显示文字 |
| Firefox | MediaRecorder + Whisper ✅ | 录音后自动识别，首次使用下载模型约 145MB |
| Safari (iOS/Mac) | MediaRecorder + Whisper ✅ | 同上 |
| 手机浏览器 | MediaRecorder + Whisper ✅ | Android/iOS 均支持 |

---

## 📱 手机端使用

1. 在手机浏览器打开 `http://服务器IP:8000`
2. 点击地址栏 **"添加到主屏幕"** 安装为 PWA 应用
3. 允许麦克风权限
4. 图表预览在上方，麦克风和控制在下方（方便拇指操作）

---

## ⚙️ 配置

| 环境变量 | 默认值 | 说明 |
|---------|-------|------|
| `DEEPSEEK_API_KEY` | — | DeepSeek API 密钥（必填） |
| `WHISPER_MODEL` | `base` | Whisper 模型大小：`tiny`(75MB) / `base`(145MB) / `small`(488MB) |

---

## 🏗 技术架构

```
VoiceChart
├── app.py                 # FastAPI 后端
│   ├── /api/generate      # DeepSeek → Mermaid 代码
│   ├── /api/transcribe    # Whisper 语音识别（跨浏览器）
│   └── /api/capabilities  # 功能检测
│
└── static/
    ├── index.html         # 前端单页应用（原生 JS，无框架）
    ├── manifest.json      # PWA 配置
    └── icon.svg           # 应用图标
```

**关键依赖：**
- [FastAPI](https://fastapi.tiangolo.com) — 异步后端框架
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — 高效本地语音识别
- [OpenAI SDK](https://github.com/openai/openai-python) — DeepSeek API 调用
- [Mermaid.js v11](https://mermaid.js.org) — 图表渲染

---

## 💬 使用示例

**流程图：**
> "用户打开 App，注册账号，填写手机号和密码，系统发送验证码，验证通过跳转主页，验证失败重新输入"

**时序图：**
> "前端发请求给后端，后端查数据库，数据库返回数据，后端处理后响应给前端"

**甘特图：**
> "项目分三个阶段：需求分析一周，开发三周，测试两周，上线一天"

---

## 📄 License

MIT © 2026 [maog1212](https://github.com/maog1212)
