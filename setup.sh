#!/bin/bash
# Claude Dev Assistant Setup Script
# 安装脚本 - Claude开发助手插件

set -e

PLUGIN_NAME="claude-dev-assistant"
PLUGIN_DIR="${HOME}/.claude/plugins/${PLUGIN_NAME}"
CURRENT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  Claude Dev Assistant 安装程序"
echo "========================================="
echo ""

# 检查Claude Code是否已安装
if ! command -v claude &> /dev/null; then
    echo "错误: Claude Code 未安装"
    echo "请先安装 Claude Code: https://claude.ai/code"
    exit 1
fi

echo "[1/4] 检查环境..."
CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
echo "  Claude Code版本: ${CLAUDE_VERSION}"

# 创建插件目录
echo ""
echo "[2/4] 创建插件目录..."
mkdir -p "${PLUGIN_DIR}"
echo "  插件目录: ${PLUGIN_DIR}"

# 复制插件文件
echo ""
echo "[3/4] 安装插件文件..."
cp -r "${CURRENT_DIR}/.claude-plugin/"* "${PLUGIN_DIR}/"
cp -r "${CURRENT_DIR}/agents" "${PLUGIN_DIR}/"
cp -r "${CURRENT_DIR}/commands" "${PLUGIN_DIR}/"
cp -r "${CURRENT_DIR}/skills" "${PLUGIN_DIR}/"
cp -r "${CURRENT_DIR}/contexts" "${PLUGIN_DIR}/"
cp -r "${CURRENT_DIR}/rules" "${PLUGIN_DIR}/"
cp "${CURRENT_DIR}/CLAUDE.md" "${PLUGIN_DIR}/"
echo "  插件文件已复制"

# 验证安装
echo ""
echo "[4/4] 验证安装..."
if [ -f "${PLUGIN_DIR}/plugin.json" ]; then
    echo "  plugin.json ✓"
else
    echo "  plugin.json ✗"
    exit 1
fi

if [ -f "${PLUGIN_DIR}/commands/interview.md" ]; then
    echo "  commands ✓"
else
    echo "  commands ✗"
    exit 1
fi

if [ -d "${PLUGIN_DIR}/agents" ]; then
    echo "  agents ✓"
else
    echo "  agents ✗"
    exit 1
fi

echo ""
echo "========================================="
echo "  安装完成!"
echo "========================================="
echo ""
echo "下一步:"
echo "  1. 重启 Claude Code"
echo "  2. 使用 /interview 开始需求访谈"
echo "  3. 使用 /help 查看所有可用命令"
echo ""
