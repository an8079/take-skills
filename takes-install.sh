#!/bin/bash
# takes-install.sh — orchestration-service 技能安装器
# 用法：
#   curl -sSL https://raw.githubusercontent.com/an8079/take-skills/main/takes-install.sh | bash                    # 全部安装
#   curl -sSL https://raw.githubusercontent.com/an8079/take-skills/main/takes-install.sh | bash -s -- skill-name   # 安装单个
#   takes-install.sh list                                                                              # 列出可用技能
#   takes-install.sh remove skill-name                                                                  # 卸载

set -e

REPO="an8079/take-skills"
BRANCH="main"
INSTALL_DIR="${TAKES_DIR:-$HOME/.openclaw/skills}"
SKILLS_INDEX_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/skills/SKILLS_INDEX.md"
TAKES_MASTER_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/skills/takes-master"
SKILL_CREATOR_URL="https://raw.githubusercontent.com/an8079/skill-creator/main"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# 核心技能列表（带真实代码的）
CORE_SKILLS=(
    "takes-master:https://github.com/an8079/take-skills.git"
    "skill-creator:https://github.com/an8079/skill-creator.git"
    "pua:file:///workspace/skills/pua-1.0.0"
    "maxclaw-helper:file:///root/.openclaw/skills/maxclaw-helper-1.1.0"
    "cron-mastery:file:///workspace/skills/cron-mastery-1.0.3"
)

list_available() {
    echo ""
    echo "=== 可用技能（按推荐程度）==="
    echo ""
    echo "⭐ 核心技能（生产可用，有真实代码）："
    echo "  takes-master      orchestration-service项目管理 | /takes:update"
    echo "  skill-creator    技能创建器 | /skill:create"
    echo "  pua              监督引擎 | 30min巡检"
    echo "  cron-mastery     定时任务管理 | Cron调度"
    echo "  maxclaw-helper   MaxClaw平台助手 | 使用指引"
    echo ""
    echo "📦 可从 clawhub 安装（curl -sSL ...）："
    echo "  weather, feishu-doc, minimax-pdf, minimax-xlsx, pptx-generator"
    echo "  wecom-connect, weixin-connect, tencent-docs, weibo-hot-search"
    echo ""
    echo "💡 全部安装：curl -sSL .../takes-install.sh | bash"
    echo ""
}

list_installed() {
    echo ""
    echo "=== 已安装技能 ==="
    if [ -d "$INSTALL_DIR" ]; then
        ls -1 "$INSTALL_DIR" 2>/dev/null | grep -v "^maxclaw" | while read d; do
            ver=$(cat "$INSTALL_DIR/$d/SKILL.md" 2>/dev/null | grep "^version:" | cut -d: -f2 | tr -d ' ' || echo "unknown")
            echo "  ✅ $d (v$ver)"
        done
    else
        echo "  (未安装任何技能)"
    fi
    echo ""
}

install_skill() {
    local name="$1"; local url="$2"
    local dest="$INSTALL_DIR/$name"
    
    if [ -d "$dest" ]; then
        info "$name 已安装，跳过"
        return 0
    fi
    
    info "安装 $name..."
    
    if [[ "$url" == file://* ]]; then
        local src="${url#file://}"
        if [ -d "$src" ]; then
            mkdir -p "$(dirname "$dest")"
            cp -r "$src" "$dest" && info "$name 安装成功 ✅" || error "$name 安装失败"
        else
            error "$name 源码不存在: $src"
        fi
    elif [[ "$url" == https://* ]] || [[ "$url" == git@* ]]; then
        mkdir -p "$INSTALL_DIR"
        git clone --depth=1 "${url%.git}" "$dest" 2>/dev/null && info "$name 安装成功 ✅" || {
            # fallback: wget single SKILL.md
            mkdir -p "$dest"
            curl -sSL "https://raw.githubusercontent.com/$REPO/$BRANCH/skills/$name/SKILL.md" -o "$dest/SKILL.md" 2>/dev/null
            if [ -f "$dest/SKILL.md" ]; then
                info "$name (SKILL.md only) 安装成功 ✅"
            else
                error "$name 安装失败"
                rm -rf "$dest"
            fi
        }
    fi
}

install_all() {
    info "开始安装核心技能..."
    mkdir -p "$INSTALL_DIR"
    for entry in "${CORE_SKILLS[@]}"; do
        name="${entry%%:*}"; url="${entry#*:}"
        install_skill "$name" "$url"
    done
    info "安装完成！"
    list_installed
}

remove_skill() {
    local name="$1"; local dest="$INSTALL_DIR/$name"
    if [ -d "$dest" ]; then
        rm -rf "$dest" && info "$name 已卸载 ✅"
    else
        warn "$name 未安装"
    fi
}

self_update() {
    info "更新 takes-install.sh..."
    curl -sSL "https://raw.githubusercontent.com/$REPO/$BRANCH/takes-install.sh" -o /tmp/takes-install-new.sh 2>/dev/null
    if [ -s /tmp/takes-install-new.sh ]; then
        mv /tmp/takes-install-new.sh /tmp/takes-install.sh
        chmod +x /tmp/takes-install.sh
        info "更新成功 ✅"
    else
        error "更新失败，请手动下载"
    fi
}

# 主逻辑
CMD="${1:-help}"
case "$CMD" in
    list)       list_installed ;;
    available)  list_available ;;
    install)
        if [ -z "$2" ]; then
            install_all
        else
            install_skill "$2" "https://github.com/$REPO.git"
        fi
        ;;
    remove)     [ -z "$2" ] && { error "用法: takes-install.sh remove <skill-name>"; exit 1; } || remove_skill "$2" ;;
    update)     self_update ;;
    help|--help|-h) echo "takes-install.sh — 一行命令安装技能"
        echo ""
        echo "用法:"
        echo "  takes-install.sh list                      # 列出已安装"
        echo "  takes-install.sh available                 # 列出可用"
        echo "  takes-install.sh install [name]            # 安装(全部或指定)"
        echo "  takes-install.sh remove <name>             # 卸载"
        echo "  takes-install.sh update                    # 更新自身"
        echo ""
        echo "安装目录: $INSTALL_DIR"
        echo ""
        echo "一行安装全部核心技能:"
        echo "  curl -sSL https://bit.ly/takes-install | bash"
        ;;
    *)           error "未知命令: $CMD"; echo "用 takes-install.sh help 查看帮助" ;;
esac
