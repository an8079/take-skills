#!/usr/bin/env bash
#===============================================================================
# get-state.sh - 读取迭代状态
#
# 收集当前迭代的外部状态，供 Claude 在下一次迭代中参考
#===============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/.iteration-state.json"
LOG_DIR="${SCRIPT_DIR}/logs"

#-------------------------------------------------------------------------------
# 读取当前迭代号
#-------------------------------------------------------------------------------
get_current_iter() {
    if [[ -f "$STATE_FILE" ]]; then
        jq -r '.current_iter // 0' "$STATE_FILE"
    else
        echo "0"
    fi
}

#-------------------------------------------------------------------------------
# 获取 Git 差异
#-------------------------------------------------------------------------------
get_git_diff() {
    local since="${1:-0}"

    if ! command -v git &> /dev/null; then
        echo "git: not installed"
        return
    fi

    if ! git rev-parse --git-dir &> /dev/null; then
        echo "git: not a repository"
        return
    fi

    echo "## Git 差异 (最近 $since 次提交)"

    local log_output
    log_output=$(git log -"$since" --oneline 2>/dev/null || echo "无提交历史")
    echo "### 最近提交:"
    echo "$log_output"

    echo ""
    echo "### 未提交变更:"
    local diff_output
    diff_output=$(git diff --stat 2>/dev/null || echo "无变更")
    echo "$diff_output"

    echo ""
    echo "### 详细差异:"
    git diff 2>/dev/null || echo "无差异"
}

#-------------------------------------------------------------------------------
# 获取测试结果
#-------------------------------------------------------------------------------
get_test_output() {
    local iter=$(get_current_iter)
    local test_log="${LOG_DIR}/test-${iter}.log"

    echo "## 测试结果 (迭代 $iter)"

    if [[ -f "$test_log" ]]; then
        cat "$test_log"
    else
        echo "无测试日志"
    fi
}

#-------------------------------------------------------------------------------
# 获取文件变更列表
#-------------------------------------------------------------------------------
get_files_changed() {
    if ! command -v git &> /dev/null || ! git rev-parse --git-dir &> /dev/null; then
        echo "## 文件变更"
        echo "Git 不可用"
        return
    fi

    echo "## 文件变更"

    # 暂存的文件
    echo "### 已暂存:"
    git diff --cached --name-only 2>/dev/null || echo "无"

    # 未暂存的修改
    echo "### 已修改 (未暂存):"
    git diff --name-only 2>/dev/null || echo "无"

    # 未跟踪的文件
    echo "### 未跟踪:"
    git ls-files --others --exclude-standard 2>/dev/null || echo "无"
}

#-------------------------------------------------------------------------------
# 获取错误日志
#-------------------------------------------------------------------------------
get_last_error() {
    local iter=$(get_current_iter)
    local error_log="${LOG_DIR}/error-${iter}.log"

    echo "## 最近错误 (迭代 $iter)"

    if [[ -f "$error_log" ]]; then
        tail -50 "$error_log"
    else
        echo "无错误记录"
    fi
}

#-------------------------------------------------------------------------------
# 获取任务状态
#-------------------------------------------------------------------------------
get_task_status() {
    echo "## 任务状态"

    if [[ ! -f "$STATE_FILE" ]]; then
        echo "无活动任务"
        return
    fi

    jq -r '
        "任务: " + .task,
        "完成条件: " + .condition,
        "当前迭代: " + (.current_iter | tostring) + "/" + (.max_iter | tostring),
        "状态: " + .status,
        "开始时间: " + .start_time
    ' "$STATE_FILE"
}

#-------------------------------------------------------------------------------
# 获取完整状态报告
#-------------------------------------------------------------------------------
get_full_report() {
    local git_count="${1:-3}"

    echo "═══════════════════════════════════════"
    echo "  迭代状态报告"
    echo "═══════════════════════════════════════"
    echo ""

    get_task_status
    echo ""

    get_files_changed
    echo ""

    get_git_diff "$git_count"
    echo ""

    get_test_output
    echo ""

    get_last_error

    echo ""
    echo "═══════════════════════════════════════"
}

#-------------------------------------------------------------------------------
# 主逻辑
#-------------------------------------------------------------------------------
main() {
    local mode="${1:-full}"

    case "$mode" in
        full)
            get_full_report 3
            ;;
        task)
            get_task_status
            ;;
        files)
            get_files_changed
            ;;
        git)
            get_git_diff "${2:-3}"
            ;;
        test)
            get_test_output
            ;;
        error)
            get_last_error
            ;;
        iter)
            get_current_iter
            ;;
        *)
            echo "未知模式: $mode"
            echo "可用模式: full, task, files, git, test, error, iter"
            exit 1
            ;;
    esac
}

main "$@"
