#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  NexusCore (OpenClaw 中国版) 安卓一键部署脚本
#  适用平台：Android + Termux（无需 Root）
#  作者：Claude Code  版本：1.0
# ============================================================

set -e

# ── 颜色定义 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()    { echo -e "\n${BOLD}${BLUE}>>> $*${NC}"; }

# ── 横幅 ─────────────────────────────────────────────────
clear
echo -e "${BOLD}${CYAN}"
cat << 'EOF'
  _   _                     ____
 | \ | | _____  ___   _ ___/ ___|___  _ __ ___
 |  \| |/ _ \ \/ / | | / __| |   / _ \| '__/ _ \
 | |\  |  __/>  <| |_| \__ \ |__| (_) | | |  __/
 |_| \_|\___/_/\_\\__,_|___/\____\___/|_|  \___|

       NexusCore (OpenClaw 龙国版) 一键部署
       适用于 Android 安卓手机 · 无需 Root
EOF
echo -e "${NC}"

# ── 环境检测 ─────────────────────────────────────────────
log_step "第 1 步：检测运行环境"

if [ -z "$PREFIX" ] || [ ! -d "/data/data/com.termux" ]; then
    log_error "请在 Termux 应用中运行此脚本！"
    log_error "下载地址（F-Droid）：https://f-droid.org/packages/com.termux/"
    exit 1
fi
log_ok "Termux 环境确认"

ANDROID_VER=$(getprop ro.build.version.release 2>/dev/null || echo "未知")
log_ok "Android 版本：${ANDROID_VER}"

# 检查网络
if ! ping -c 1 -W 3 registry.npmmirror.com &>/dev/null; then
    log_warn "网络连接不稳定，请确认已连接 Wi-Fi"
fi

# ── 更新包管理器（使用国内镜像）───────────────────────────
log_step "第 2 步：配置国内镜像并更新软件包"

# 切换到清华镜像
if [ -f "$PREFIX/etc/apt/sources.list" ]; then
    sed -i 's|https://packages.termux.dev|https://mirrors.tuna.tsinghua.edu.cn/termux|g' \
        "$PREFIX/etc/apt/sources.list" 2>/dev/null || true
fi
if [ -d "$PREFIX/etc/apt/sources.list.d" ]; then
    find "$PREFIX/etc/apt/sources.list.d" -name "*.list" -exec \
        sed -i 's|https://packages.termux.dev|https://mirrors.tuna.tsinghua.edu.cn/termux|g' {} \; 2>/dev/null || true
fi

log_info "正在更新软件包列表..."
apt-get update -qq 2>/dev/null || pkg update -y -q 2>/dev/null || true
log_ok "软件包列表已更新"

# ── 安装依赖 ──────────────────────────────────────────────
log_step "第 3 步：安装必要依赖"

PACKAGES="nodejs-lts git curl tmux"
for pkg in $PACKAGES; do
    if ! command -v "${pkg%%-*}" &>/dev/null; then
        log_info "正在安装 ${pkg}..."
        pkg install -y "$pkg" -q 2>/dev/null || apt-get install -y "$pkg" -q 2>/dev/null
        log_ok "${pkg} 安装完成"
    else
        log_ok "${pkg} 已存在，跳过"
    fi
done

# 验证 Node.js 版本
NODE_VER=$(node --version 2>/dev/null | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
log_info "Node.js 版本：v${NODE_VER}"
if [ "$NODE_MAJOR" -lt 22 ] 2>/dev/null; then
    log_warn "Node.js 版本低于 22，尝试升级..."
    pkg install -y nodejs -q 2>/dev/null || true
fi

# ── 配置 NPM 国内镜像 ─────────────────────────────────────
log_step "第 4 步：配置 NPM 国内加速镜像"

npm config set registry https://registry.npmmirror.com
npm config set disturl https://npmmirror.com/mirrors/node
log_ok "NPM 已切换至淘宝镜像（npmmirror.com）"

# ── 安装 NexusCore（openclaw-cn）──────────────────────────
log_step "第 5 步：安装 NexusCore（OpenClaw 中国版）"

log_info "正在从国内镜像下载安装，请稍候..."
npm install -g openclaw-cn@latest --prefer-online 2>&1 | tail -3
log_ok "NexusCore 安装完成"

# 验证安装
if ! command -v openclaw-cn &>/dev/null; then
    log_error "安装失败，请检查网络后重试"
    exit 1
fi

NC_VERSION=$(openclaw-cn --version 2>/dev/null || echo "未知")
log_ok "NexusCore 版本：${NC_VERSION}"

# ── 创建配置文件 ──────────────────────────────────────────
log_step "第 6 步：初始化配置"

CONFIG_DIR="$HOME/.openclaw"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"
mkdir -p "$CONFIG_DIR"

# 如果配置文件不存在则创建默认配置
if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << 'CONF'
{
  "agent": {
    "model": "anthropic/claude-sonnet-4-6"
  },
  "gateway": {
    "port": 18789
  }
}
CONF
    log_ok "默认配置文件已创建：${CONFIG_FILE}"
else
    log_ok "配置文件已存在，跳过创建"
fi

# ── 设置 Termux 保活 ──────────────────────────────────────
log_step "第 7 步：配置后台保活（防止被系统杀死）"

# 激活 wake-lock
if command -v termux-wake-lock &>/dev/null; then
    termux-wake-lock 2>/dev/null && log_ok "Wake-lock 已激活" || \
        log_warn "Wake-lock 激活失败（需安装 Termux:API 应用）"
else
    log_warn "termux-wake-lock 未找到，请从 F-Droid 安装 Termux:API"
fi

# 创建启动脚本（方便后续一键启动）
LAUNCH_SCRIPT="$HOME/start-nexuscore.sh"
cat > "$LAUNCH_SCRIPT" << 'LAUNCH'
#!/data/data/com.termux/files/usr/bin/bash
# NexusCore 快速启动脚本
termux-wake-lock 2>/dev/null || true
SESSION="nexuscore"
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "NexusCore 已在运行，附加到会话..."
    tmux attach-session -t "$SESSION"
else
    tmux new-session -d -s "$SESSION" "openclaw-cn gateway --port 18789 --verbose"
    echo "NexusCore 已在后台启动！"
    echo "查看日志：tmux attach -t nexuscore"
    echo "停止服务：tmux kill-session -t nexuscore"
fi
LAUNCH
chmod +x "$LAUNCH_SCRIPT"
log_ok "快速启动脚本已创建：~/start-nexuscore.sh"

# ── 运行初始化向导 ────────────────────────────────────────
log_step "第 8 步：运行 NexusCore 初始化向导"

echo ""
echo -e "${YELLOW}即将启动初始化配置，您需要：${NC}"
echo "  1. 选择 AI 服务商（推荐：Google Gemini 免费额度）"
echo "  2. 输入 API Key"
echo "  3. 选择连接的消息平台（微信/WhatsApp/Telegram 等）"
echo ""
read -p "按 Enter 开始配置，或按 Ctrl+C 跳过（稍后手动运行）..." _

openclaw-cn onboard --install-daemon

# ── 启动服务 ──────────────────────────────────────────────
log_step "第 9 步：在后台启动 NexusCore 网关"

tmux new-session -d -s nexuscore "openclaw-cn gateway --port 18789 --verbose" 2>/dev/null && \
    log_ok "NexusCore 已在后台运行（端口 18789）" || \
    log_warn "后台启动失败，请手动运行：bash ~/start-nexuscore.sh"

# ── 完成 ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}=================================================${NC}"
echo -e "${BOLD}${GREEN}   NexusCore 部署完成！${NC}"
echo -e "${BOLD}${GREEN}=================================================${NC}"
echo ""
echo -e "${BOLD}常用命令：${NC}"
echo "  启动服务：bash ~/start-nexuscore.sh"
echo "  查看日志：tmux attach -t nexuscore"
echo "  停止服务：tmux kill-session -t nexuscore"
echo "  更新版本：npm install -g openclaw-cn@latest"
echo ""
echo -e "${YELLOW}重要提示：${NC}"
echo "  · 手机充电时保持屏幕常亮（开发者选项 > 保持唤醒状态）"
echo "  · 在电池优化设置中将 Termux 设为「不限制」"
echo "  · 如需从其他设备访问，使用手机局域网 IP:18789"
echo ""
