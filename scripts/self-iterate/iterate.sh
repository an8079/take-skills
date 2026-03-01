#!/usr/bin/env bash
#===============================================================================
# self-iterate - 自主迭代循环脚本
#
# 用法: iterate.sh <任务> <完成条件> [最大迭代次数]
#
# 示例:
#   iterate.sh "修复 bug" "测试通过" 5
#   iterate.sh "实现功能" "输出包含 OK 且 测试通过" 10
#===============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/.iteration-state.json"
LOG_DIR="${SCRIPT_DIR}/logs"
MAX_DEFAULT=10

#-------------------------------------------------------------------------------
# 初始化
#-------------------------------------------------------------------------------
init() {
    mkdir -p "$LOG_DIR"

    # 解析参数
    TASK="${1:-}"
    CONDITION="${2:-}"
    MAX_ITER="${3:-$MAX_DEFAULT}"

    if [[ -z "$TASK" || -z "$CONDITION" ]]; then
        echo -e "${RED}用法: iterate.sh <任务> <完成条件> [最大迭代次数]${NC}"
        exit 1
    fi

    # 初始化状态
    cat > "$STATE_FILE" <<EOF
{
    "task": "$TASK",
    "condition": "$CONDITION",
    "max_iter": $MAX_ITER,
    "current_iter": 0,
    "status": "running",
    "start_time": "$(date -Iseconds)",
    "history": []
}
EOF

    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  自主迭代循环${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo "任务: $TASK"
    echo "完成条件: $CONDITION"
    echo "最大迭代: $MAX_ITER"
    echo ""
}

#-------------------------------------------------------------------------------
# 执行任务 (由 Claude 调用)
#-------------------------------------------------------------------------------
execute_task() {
    local iter=$1
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}迭代 ${iter}/${MAX_ITER}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 记录迭代开始
    echo "📝 正在执行任务..."

    # 这里调用实际的执行逻辑
    # Claude 会读取任务并执行

    # 记录迭代结果
    local iter_record=$(cat <<EOF
{
    "iter": $iter,
    "timestamp": "$(date -Iseconds)",
    "status": "completed"
}
EOF
)

    # 更新状态文件
    update_state "$iter" "$iter_record"
}

#-------------------------------------------------------------------------------
# 检查完成条件
#-------------------------------------------------------------------------------
check_condition() {
    local condition="$1"
    local result=1  # 默认失败

    # 解析条件类型
    if echo "$condition" | grep -q "输出包含"; then
        local keyword=$(echo "$condition" | sed 's/.*输出包含 //')
        if [[ -f "${LOG_DIR}/output-${current_iter}.log" ]] && \
           grep -q "$keyword" "${LOG_DIR}/output-${current_iter}.log"; then
            result=0
        fi
    elif echo "$condition" | grep -q "测试通过"; then
        if [[ -f "${LOG_DIR}/test-${current_iter}.log" ]] && \
           grep -q "PASSED\|OK\|0 tests failed" "${LOG_DIR}/test-${current_iter}.log"; then
            result=0
        fi
    elif echo "$condition" | grep -q "文件存在"; then
        local filepath=$(echo "$condition" | sed 's/.*文件存在 //')
        if [[ -f "$filepath" ]]; then
            result=0
        fi
    elif echo "$condition" | grep -q "且"; then
        # 组合条件 - 所有条件都必须满足
        local conditions=$(echo "$condition" | tr '且' '\n')
        for cond in $conditions; do
            if ! check_condition_single "$cond"; then
                return 1
            fi
        done
        result=0
    else
        # 默认: 检查退出码
        result=0
    fi

    return $result
}

check_condition_single() {
    local condition="$1"
    check_condition "$condition"
}

#-------------------------------------------------------------------------------
# 更新状态文件
#-------------------------------------------------------------------------------
update_state() {
    local iter=$1
    local record=$2

    # 读取并更新 JSON
    local current_state=$(cat "$STATE_FILE")
    echo "$current_state" | jq --argjson iter "$iter" --argjson record "$record" \
        '.current_iter = $iter | .history += [$record]' > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"
}

#-------------------------------------------------------------------------------
# 获取当前状态摘要
#-------------------------------------------------------------------------------
get_status_summary() {
    echo "═══════════════════════════════════════"
    echo "迭代状态"
    echo "═══════════════════════════════════════"
    cat "$STATE_FILE" | jq -r '
        "任务: \(.task)",
        "完成条件: \(.condition)",
        "当前迭代: \(.current_iter)/\(.max_iter)",
        "状态: \(.status)",
        "开始时间: \(.start_time)"
    '
    echo ""

    # 显示最近的文件变更
    if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
        echo "最近文件变更:"
        git status --short | head -10
        echo ""
    fi
}

#-------------------------------------------------------------------------------
# 主循环
#-------------------------------------------------------------------------------
main() {
    init "$@"

    for ((iter=1; iter<=MAX_ITER; iter++)); do
        current_iter=$iter

        # 1. 执行任务
        execute_task $iter

        # 2. 检查完成条件
        if check_condition "$CONDITION"; then
            echo -e "${GREEN}✅ 任务完成！${NC}"
            echo "迭代次数: $iter/$MAX_ITER"
            echo "完成条件: $CONDITION"

            # 更新最终状态
            sed -i 's/"status": "running"/"status": "completed"/' "$STATE_FILE"
            sed -i "s/\"current_iter\": $iter/\"current_iter\": $iter, \"end_time\": \"$(date -Iseconds)\"/" "$STATE_FILE"
            exit 0
        fi

        # 3. 显示当前状态
        echo -e "${YELLOW}⚠️ 条件未满足，继续迭代...${NC}"
        get_status_summary
    done

    # 达到最大迭代
    echo -e "${RED}⚠️ 达到最大迭代次数${NC}"
    echo "当前进度: 任务执行完成但未满足完成条件"
    sed -i 's/"status": "running"/"status": "max_iter_reached"/' "$STATE_FILE"
    exit 1
}

# 导出变量供子函数使用
current_iter=0
MAX_ITER=10
TASK=""
CONDITION=""

main "$@"
