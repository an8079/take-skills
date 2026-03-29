"""
code-review Skill Agent
触发词：审查代码 / 检查bug / review代码
功能：安全漏洞检测 + 代码异味识别 + 性能隐患分析
"""
import re
from typing import Any

REQUIREMENTS = []

async def execute(params: dict, context: dict) -> dict[str, Any]:
    """
    输入：待审查的代码字符串或文件路径
    输出：结构化审查报告
    """
    code = params.get("code", "") or params.get("input", "")
    language = params.get("language", "python")

    if not code:
        return {"success": False, "error": "缺少code参数"}

    issues = []
    issues += _check_security(code, language)
    issues += _check_code_smell(code, language)
    issues += _check_performance(code, language)

    score = max(0, 100 - len(issues) * 10)

    return {
        "success": True,
        "result": {
            "score": score,
            "level": "通过" if score >= 80 else "警告" if score >= 60 else "危险",
            "issues": issues,
            "summary": f"审查{len(issues)}个问题，综合评分{score}/100",
            "语言": language,
            "行数": len(code.splitlines()),
        }
    }

def _check_security(code: str, lang: str) -> list[dict]:
    issues = []
    # SQL注入
    if re.search(r"execute\s*\([^)]*\%", code) or re.search(r"'\s*\+.*sql", code, re.I):
        issues.append({"severity": "HIGH", type: "security", "rule": "R01", "msg": "可能存在SQL注入风险，使用参数化查询"})
    # 硬编码凭证
    if re.search(r"password\s*=\s*['\"][^'\"]+['\"]", code, re.I) or re.search(r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]", code, re.I):
        issues.append({"severity": "HIGH", type: "security", "rule": "R02", "msg": "发现硬编码凭证，请使用环境变量"})
    # eval
    if re.search(r"\beval\s*\(", code):
        issues.append({"severity": "HIGH", type: "security", "rule": "R03", "msg": "禁止使用eval()，存在代码注入风险"})
    # 反序列化
    if re.search(r"pickle\.loads|yaml\.load\s*\(", code):
        issues.append({"severity": "MEDIUM", type: "security", "rule": "R04", "msg": "不安全的反序列化，可能导致RCE"})
    # 路径遍历
    if re.search(r"open\s*\([^,]*\s*\+", code) and "path" in code.lower():
        issues.append({"severity": "MEDIUM", type: "security", "rule": "R05", "msg": "可能存在路径遍历风险"})
    return issues

def _check_code_smell(code: str, lang: str) -> list[dict]:
    issues = []
    lines = code.splitlines()
    # 文件过长
    if len(lines) > 300:
        issues.append({"severity": "MEDIUM", type: "smell", "rule": "R06", "msg": f"文件过长（{len(lines)}行），建议拆分"})
    # 超长行
    for i, line in enumerate(lines[:50], 1):
        if len(line) > 120:
            issues.append({"severity": "LOW", type: "smell", "rule": "R07", "msg": f"第{i}行超过120字符"})
            break
    # TODO/FIXME
    if re.search(r"\bTODO\b|\bFIXME\b|\bHACK\b", code):
        issues.append({"severity": "LOW", type: "smell", "rule": "R08", "msg": "发现TODO/FIXME注释，需要处理"})
    # 嵌套过深
    if re.findall(r"  {6}", code):
        issues.append({"severity": "MEDIUM", type: "smell", "rule": "R09", "msg": "存在超过3层嵌套，代码可读性差"})
    return issues

def _check_performance(code: str, lang: str) -> list[dict]:
    issues = []
    # 嵌套循环
    if len(re.findall(r"\bfor\b", code)) > 5:
        issues.append({"severity": "MEDIUM", type: "performance", "rule": "R10", "msg": "发现多个循环，注意算法复杂度"})
    # 同步sleep
    if re.search(r"time\.sleep", code) and "asyncio" not in code:
        issues.append({"severity": "LOW", type: "performance", "rule": "R11", "msg": "发现同步sleep，可能阻塞事件循环"})
    # 大数据加载
    if re.search(r"read\(\)|\.readlines\(\)", code) and "for line in" not in code:
        issues.append({"severity": "LOW", type: "performance", "rule": "R12", "msg": "可能一次性加载全量数据，建议流式处理"})
    return issues
