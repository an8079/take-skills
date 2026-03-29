#!/usr/bin/env bash
#==========================================
# take-skills 一键安装脚本
# 支持：Claude Code / Cursor IDE / Windsurf
# 用法：curl -fsSL .../install.sh | bash
#       install.sh --claude [--global|--local]
#       install.sh --cursor [--global|--local]
#==========================================

set -e

REPO="https://github.com/an8079/take-skills.git"
INSTALL_DIR="${TAKE_SKILLS_DIR:-$HOME/take-skills}"

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
step()    { echo -e "${BLUE}[STEP]${NC} $1"; }

# 默认参数
TARGET=""        # claude | cursor | windsurf
SCOPE="global"   # global | local
SKILLS=()        # 要安装的skill列表，默认全部

usage() {
    cat << EOF
take-skills 安装脚本

用法:
  curl -fsSL https://raw.githubusercontent.com/an8079/take-skills/main/install.sh | bash
  install.sh [OPTIONS]

选项:
  --claude    安装到 Claude Code
  --cursor    安装到 Cursor IDE
  --windsurf  安装到 Windsurf
  --global    全局安装（所有项目可用）【默认】
  --local    本地安装（仅当前目录）
  --skill SKILL   只安装指定技能（如 takes-master）
  --all-skills    安装全部技能【默认】
  --help          显示此帮助

示例:
  # Claude Code 全局安装
  curl -fsSL https://.../install.sh | bash -s -- --claude

  # Cursor 本地安装
  curl -fsSL https://.../install.sh | bash -s -- --cursor --local

  # 只安装 takes-master
  curl -fsSL https://.../install.sh | bash -s -- --skill takes-master

EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --claude)    TARGET="claude"; shift ;;
        --cursor)    TARGET="cursor"; shift ;;
        --windsurf)  TARGET="windsurf"; shift ;;
        --global)    SCOPE="global"; shift ;;
        --local)     SCOPE="local"; shift ;;
        --skill)     SKILLS+=("$2"); shift 2 ;;
        --all-skills) ALL=true; shift ;;
        --help|-h)  usage; exit 0 ;;
        *)           warn "未知参数: $1"; shift ;;
    esac
done

# 自动检测目标
if [[ -z "$TARGET" ]]; then
    if command -v claude &>/dev/null; then
        TARGET="claude"
    elif [[ -d "$HOME/.cursor" ]]; then
        TARGET="cursor"
    else
        error "无法自动检测工具。请指定：--claude / --cursor / --windsurf"
        usage
        exit 1
    fi
    info "自动检测到目标工具: $TARGET"
fi

# 安装函数
install_claude() {
    local dest="$HOME/.claude/skills"
    [[ "$SCOPE" == "local" ]] && dest="./.claude/skills"

    step "安装到 Claude Code (${SCOPE})..."
    mkdir -p "$dest"

    if [[ -d "$INSTALL_DIR/skills" ]]; then
        for skill in "$INSTALL_DIR/skills"/*/; do
            [[ -d "$skill" ]] || continue
            skill_name=$(basename "$skill")
            if [[ ${#SKILLS[@]} -gt 0 ]] && [[ "$ALL" != true ]]; then
                # 只安装指定的
                skip=true
                for s in "${SKILLS[@]}"; do
                    [[ "$s" == "$skill_name" ]] && skip=false && break
                done
                [[ "$skip" == true ]] && info "跳过: $skill_name" && continue
            fi
            cp -r "$skill" "$dest/"
            info "✅ 安装: $skill_name"
        done
    else
        warn "Skills目录不存在，尝试克隆..."
        git clone --depth=1 "$REPO" "$INSTALL_DIR"
        mkdir -p "$dest"
        for skill in "$INSTALL_DIR/skills"/*/; do
            [[ -d "$skill" ]] || continue
            cp -r "$skill" "$dest/"
            info "✅ 安装: $(basename $skill)"
        done
    fi

    cat << 'EOF'

✅ Claude Code 安装完成！

验证方法：
  1. 重启 Claude Code
  2. 在聊天框输入以下测试：

     takes:update
     审查一下代码

  3. 如果看到 Skills 被激活，说明安装成功！

提示：可以编辑 ~/.clauderc 自定义触发词
EOF
}

install_cursor() {
    local rules_dir="$HOME/.cursor/rules"
    [[ "$SCOPE" == "local" ]] && rules_dir="./.cursor/rules"

    step "安装到 Cursor IDE (${SCOPE})..."
    mkdir -p "$rules_dir"

    local skills_src="$INSTALL_DIR/skills"
    if [[ ! -d "$skills_src" ]]; then
        git clone --depth=1 "$REPO" "$INSTALL_DIR"
    fi

    for skill in "$skills_src"/*/; do
        [[ -d "$skill" ]] || continue
        skill_name=$(basename "$skill")
        if [[ ${#SKILLS[@]} -gt 0 ]] && [[ "$ALL" != true ]]; then
            skip=true
            for s in "${SKILLS[@]}"; do
                [[ "$s" == "$skill_name" ]] && skip=false && break
            done
            [[ "$skip" == true ]] && info "跳过: $skill_name" && continue
        fi
        cp "$skill/SKILL.md" "$rules_dir/${skill_name}.md"
        info "✅ 安装: $skill_name → $rules_dir/${skill_name}.md"
    done

    cat << EOF

✅ Cursor IDE 安装完成！

激活方法：
  1. 重启 Cursor
  2. 打开 Settings → AI → Custom Instructions
  3. 在 Custom Instructions 框里添加引用：

     @~/.cursor/rules/takes-master.md
     @~/.cursor/rules/code-review.md

  4. 保存设置
  5. 在聊天框输入 "takes:update" 测试

提示：也可以直接在 Custom Instructions 里粘贴 SKILL.md 的内容
EOF
}

install_windsurf() {
    local rules_dir="$HOME/.windsurf/rules"
    [[ "$SCOPE" == "local" ]] && rules_dir="./.windsurf/rules"

    step "安装到 Windsurf (${SCOPE})..."
    mkdir -p "$rules_dir"

    local skills_src="$INSTALL_DIR/skills"
    if [[ ! -d "$skills_src" ]]; then
        git clone --depth=1 "$REPO" "$INSTALL_DIR"
    fi

    for skill in "$skills_src"/*/; do
        [[ -d "$skill" ]] || continue
        cp "$skill/SKILL.md" "$rules_dir/$(basename $skill).md"
        info "✅ 安装: $(basename $skill)"
    done

    cat << 'EOF'

✅ Windsurf 安装完成！

激活方法：
  1. 重启 Windsurf
  2. Settings → AI → Rules → Add Rule
  3. 选择 takes-master.md
EOF
}

# 主逻辑
main() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║   take-skills 一键安装器 v9         ║"
    echo "║   Claude Code / Cursor / Windsurf    ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""

    case "$TARGET" in
        claude)   install_claude ;;
        cursor)   install_cursor ;;
        windsurf) install_windsurf ;;
        *)        error "未知目标: $TARGET" ;;
    esac

    echo ""
    info "安装目录: $INSTALL_DIR"
    info "了解更多: https://github.com/an8079/take-skills"
}

main
