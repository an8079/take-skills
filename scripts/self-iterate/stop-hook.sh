#!/usr/bin/env bash
#===============================================================================
# stop-hook.sh - Stop Hook 拦截脚本
#
# 当 Claude 尝试完成任务/退出时，此脚本会:
# 1. 检查是否在迭代循环中
# 2. 收集当前状态
# 3. 检查是否满足完成条件
# 4. 如果未满足，注入状态并要求继续迭代
#
# 使用方式: 在 Claude Code 的 hooks 配置中设置
#===============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/.iteration-state.json"
GET_STATE_SCRIPT="${SCRIPT_DIR}/get-state.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

#-------------------------------------------------------------------------------
# 检查是否在迭代循环中
#-------------------------------------------------------------------------------
is_iterating() {
    if [[ ! -f "$STATE_FILE" ]]; then
        return 1  # 不在迭代中
    fi

    local status=$(jq -r '.status' "$STATE_FILE" 2>/dev/null || echo "none")
    [[ "$status" == "running" ]]
}

#-------------------------------------------------------------------------------
# 获取当前迭代信息
#-------------------------------------------------------------------------------
get_iter_info() {
    if [[ ! -f "$STATE_FILE" ]]; then
        echo "[]"
        return
    fi

    jq -r '{
        task: .task,
        condition: .condition,
        current_iter: .current_iter,
        max_iter: .max_iter,
        status: .status
    }' "$STATE_FILE"
}

#-------------------------------------------------------------------------------
# 检查完成条件是否满足
#-------------------------------------------------------------------------------
check_completion() {
    local condition=$(jq -r '.condition' "$STATE_FILE")
    local iter=$(jq -r '.current_iter' "$STATE_FILE")

    # 检查测试结果
    local test_log="${SCRIPT_DIR}/logs/test-${iter}.log"
    if [[ -f "$test_log" ]]; then
        if grep -qE "PASSED|OK|0 tests failed|✓" "$test_log"; then
            return 0
        fi
    fi

    # 检查输出文件
    local output_log="${SCRIPT_DIR}/logs/output-${iter}.log"
    if [[ -f "$output_log" ]]; then
        if echo "$condition" | grep -q "输出包含"; then
            local keyword=$(echo "$condition" | sed 's/.*输出包含 //')
            if grep -q "$keyword" "$output_log"; then
                return 0
            fi
        fi
    fi

    # 检查文件存在条件
    if echo "$condition" | grep -q "文件存在"; then
        local filepath=$(echo "$condition" | sed 's/.*文件存在 //')
        if [[ -f "$filepath" ]]; then
            return 0
        fi
    fi

    return 1
}

#-------------------------------------------------------------------------------
# 生成继续迭代的提示
#-------------------------------------------------------------------------------
generate_continue_prompt() {
    local info
    info=$(get_iter_info)

    local task=$(echo "$info" | jq -r '.task')
    local condition=$(echo "$info" | jq -r '.condition')
    local current_iter=$(echo "$info" | jq -r '.current_iter')
    local max_iter=$(echo "$info" | jq -r '.max_iter')

    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}  🔄 迭代循环拦截${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}任务:${NC} $task"
    echo -e "${CYAN}完成条件:${NC} $condition"
    echo -e "${CYAN}当前迭代:${NC} $current_iter / $max_iter"
    echo ""
    echo -e "${RED}⚠️  完成条件未满足！${NC}"
    echo ""
    echo -e "${BLUE}上次迭代状态:${NC}"

    # 显示文件变更
    "$GET_STATE_SCRIPT" files
    echo ""

    # 显示 git 差异
    "$GET_STATE_SCRIPT" git 3

    echo ""
    echo -e "${YELLOW}请基于以上状态，继续执行任务。${NC}"
    echo -e "${YELLOW}如果已达到完成条件，请明确说明。${NC}"
    echo ""
}

#-------------------------------------------------------------------------------
# 生成终止提示
#-------------------------------------------------------------------------------
generate_termination_prompt() {
    local info
    info=$(get_iter_info)

    local task=$(echo "$info" | jq -r '.task')
    local current_iter=$(echo "$info" | jq -r '.current_iter')
    local max_iter=$(echo "$info" | jq -r '.max_iter')

    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ⚠️ 达到最大迭代次数${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}任务:${NC} $task"
    echo -e "${CYAN}执行迭代:${NC} $current_iter / $max_iter"
    echo ""
    echo -e "${RED}任务未能完成，但已达到最大迭代次数。${NC}"
    echo ""
    echo -e "${BLUE}最终状态:${NC}"
    "$GET_STATE_SCRIPT" full
    echo ""
    echo -e "${YELLOW}请报告当前进度并请求人工介入。${NC}"
    echo ""
}

#-------------------------------------------------------------------------------
# 主逻辑
#-------------------------------------------------------------------------------
main() {
    # 检查是否在迭代循环中
    if ! is_iterating; then
        # 不在迭代中，正常退出
        exit 0
    fi

    # 检查是否满足完成条件
    if check_completion; then
        # 完成任务，更新状态并允许退出
        local task=$(jq -r '.task' "$STATE_FILE")
        local iter=$(jq -r '.current_iter' "$STATE_FILE")

        sed -i 's/"status": "running"/"status": "completed"/' "$STATE_FILE"
        sed -i "s/\"current_iter\": $iter/\"current_iter\": $iter, \"end_time\": \"$(date -Iseconds)\"/" "$STATE_FILE"

        echo ""
        echo -e "${GREEN}✅ 任务完成！${NC}"
        echo "任务: $task"
        echo "迭代次数: $iter"
        echo ""

        # 输出完成信息供 Claude 读取
        echo "ITERATION_COMPLETE: $task completed in $iter iterations"
        exit 0
    fi

    # 检查是否达到最大迭代
    local current_iter=$(jq -r '.current_iter' "$STATE_FILE")
    local max_iter=$(jq -r '.max_iter' "$STATE_FILE")

    if [[ "$current_iter" -ge "$max_iter" ]]; then
        generate_termination_prompt
        # 输出终止标记
        echo "ITERATION_MAX_REACHED: $current_iter/$max_iter"
        exit 1  # 阻止退出
    fi

    # 未满足条件，生成继续提示并阻止退出
    generate_continue_prompt

    # 输出拦截标记
    echo "ITERATION_CONTINUE: condition not met, iteration $current_iter/$max_iter"
    exit 1  # 阻止退出，Claude 会继续执行
}

main "$@"
