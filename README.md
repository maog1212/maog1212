# NexusCore 安卓一键部署脚本

> **NexusCore** = OpenClaw 中国优化版，可在安卓手机上运行的个人 AI Agent（来自大孙哥抖音介绍）

## 使用方法

### 前置条件
1. 从 **F-Droid** 安装 [Termux](https://f-droid.org/packages/com.termux/)（不要用 Google Play 版本，已停止维护）
2. 打开 Termux，允许「安装未知来源应用」权限
3. 连接 Wi-Fi

### 一键部署（分两步执行，避免手机换行报错）

在 Termux 中**依次**复制粘贴以下两条命令：

```bash
# 第一步：下载脚本
curl -sL https://raw.githubusercontent.com/maog1212/maog1212/claude/android-nexuscore-deployment-rMPtN/nexuscore-deploy.sh -o ~/nc.sh
```

```bash
# 第二步：运行脚本
bash ~/nc.sh
```

> **为什么分两步？** 手机屏幕较窄，一行长命令复制时容易在 URL 和 `|` 之间自动插入换行符，导致 `bash: syntax error near unexpected token '|'` 报错。分两步即可避免。

脚本会自动完成：
- 配置清华大学国内镜像（加速下载）
- 安装 Node.js、Git 等依赖
- 安装 NexusCore（openclaw-cn 中国版）
- 初始化配置向导
- 后台启动服务

### 部署后常用命令

| 操作 | 命令 |
|------|------|
| 启动服务 | `bash ~/start-nexuscore.sh` |
| 查看运行日志 | `tmux attach -t nexuscore` |
| 停止服务 | `tmux kill-session -t nexuscore` |
| 更新到最新版 | `npm install -g openclaw-cn@latest` |

## 手机省电设置（重要）

为防止系统杀死 NexusCore 进程：

1. **开发者选项** → 启用「充电时保持屏幕唤醒」
2. **设置 → 电池** → 找到 Termux → 改为「不限制」或「无限制」
3. 从 F-Droid 安装 **Termux:API**（用于 wake-lock 保活）

## 系统要求

- Android 10 或以上
- 建议剩余存储空间 2GB+
- 无需 Root

## API Key 获取

初始化时需要 AI 服务商的 API Key，推荐：
- **Google Gemini**（免费额度）：[aistudio.google.com](https://aistudio.google.com)
- **Anthropic Claude**：[console.anthropic.com](https://console.anthropic.com)
- **OpenAI**：[platform.openai.com](https://platform.openai.com)
