# VoiceChart — 语音流程图生成器

对着麦克风描述你的想法，AI 自动生成专业流程图。

## 功能特性

- **语音输入** — 使用浏览器内置 Web Speech API，中英文均支持
- **8 种图表类型** — 流程图、时序图、思维导图、类图、状态图、ER图、甘特图、饼图
- **AI 生成** — 由 DeepSeek 大模型理解语义，输出标准 Mermaid 代码
- **实时预览** — Mermaid.js 即时渲染，所见即所得
- **代码编辑** — 可直接修改 Mermaid 代码并实时预览
- **导出** — 一键复制代码或下载 SVG

## 快速启动

```bash
pip install -r requirements.txt
python app.py
```

访问 http://localhost:8000

## 配置

复制 `.env.example` 为 `.env` 并填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=your_api_key_here
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/⌘ + Enter` | 生成图表 |
| `Ctrl/⌘ + M` | 开始/停止录音 |

## 使用示例

> "用户打开 App，注册账号，填写手机号和密码，系统发送验证码，验证通过后跳转到主页"

> "产品经理提需求给开发，开发评估工期，评估完成后启动开发，开发完成后测试，测试通过上线"

## 浏览器支持

语音识别需要 Chrome 或 Edge 浏览器，需允许麦克风权限。文字输入模式所有现代浏览器均支持。

## Tech Stack

- **Backend**: Python + FastAPI
- **AI**: DeepSeek (OpenAI-compatible API)
- **Frontend**: Vanilla JS + CSS
- **Charts**: Mermaid.js v11
- **Voice**: Web Speech API
