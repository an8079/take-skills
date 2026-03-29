"""
api-reviewer Skill Agent
触发词：分析接口 / 审查API / endpoint检查
功能：RESTful规范 + 安全性 + 性能审查
"""
import re
from typing import Any

async def execute(params: dict, context: dict) -> dict[str, Any]:
    """
    输入：API定义（OpenAPI JSON / 接口代码 / 接口文档）
    输出：问题列表 + 严重程度 + 修复建议
    """
    api_def = params.get("api_def", "") or params.get("code", "")
    language = params.get("language", "python")

    if not api_def:
        return {"success": False, "error": "缺少api_def参数"}

    issues = []
    issues += _check_security(api_def)
    issues += _check_restfulness(api_def)
    issues += _check_performance(api_def)
    issues += _check_error_handling(api_def)

    score = max(0, 100 - sum({"HIGH": 20, "MEDIUM": 10, "LOW": 5}.get(i["severity"], 0) for i in issues))

    return {
        "success": True,
        "result": {
            "score": score,
            "level": "优秀" if score >= 85 else "良好" if score >= 70 else "需改进" if score >= 50 else "危险",
            "issues": issues,
            "summary": f"发现{len(issues)}个问题，API评分{score}/100",
            "recommendation": "建议优先修复HIGH问题，再处理MEDIUM问题" if issues else "API设计良好，无需强制修改"
        }
    }

def _check_security(api_def: str) -> list[dict]:
    issues = []
    # 无认证
    if "authorization" not in api_def.lower() and "bearer" not in api_def.lower():
        if re.search(r"GET|POST|PUT|DELETE", api_def):
            issues.append({"severity": "HIGH", type: "security", "rule": "S01", "msg": "接口缺少认证机制（Authorization/Bearer Token）"})
    # SQL注入（参数化缺失）
    if re.search(r"\{.*\}\s*\+|f['\"].*\%", api_def) and "param" in api_def.lower():
        issues.append({"severity": "HIGH", type: "security", "rule": "S02", "msg": "参数拼接可能存在注入风险，必须使用参数化查询"})
    # 敏感数据明文
    if re.search(r"password.*in\s+response|token.*in\s+url", api_def, re.I):
        issues.append({"severity": "HIGH", type: "security", "rule": "S03", "msg": "敏感数据（密码/token）出现在响应或URL中，风险极高"})
    # 缺少权限校验
    if re.search(r"admin|delete|drop|truncate", api_def, re.I) and "permission" not in api_def.lower():
        issues.append({"severity": "MEDIUM", type: "security", "rule": "S04", "msg": "高危操作（admin/delete）缺少权限校验"})
    return issues

def _check_restfulness(api_def: str) -> list[dict]:
    issues = []
    # 动词不对
    verbs = re.findall(r"(GET|POST|PUT|DELETE|PATCH)", api_def)
    if "POST" in str(verbs) and ("get" in api_def.lower() or "query" in api_def.lower()):
        if "search" not in api_def.lower():
            issues.append({"severity": "LOW", type": "规范", "rule": "R01", "msg": "建议查询类操作使用GET而非POST"})
    # 路径命名不规范
    if re.search(r"[A-Z]", re.sub(r"\{[^}]+\}", "", api_def)):
        issues.append({"severity": "LOW", type": "规范", "rule": "R02", "msg": "RESTful路径应全小写，用连字符分隔：/user-orders"})
    # 复数形式
    if re.search(r"/user[s]?", api_def) and not re.search(r"/users", api_def):
        issues.append({"severity": "LOW", type": "规范", "rule": "R03", "msg": "RESTful资源命名应用复数形式：/users而非/user"})
    return issues

def _check_performance(api_def: str) -> list[dict]:
    issues = []
    # 无分页
    if re.search(r"list|getAll|query", api_def, re.I) and "page" not in api_def.lower() and "limit" not in api_def.lower():
        issues.append({"severity": "MEDIUM", type: "performance", "rule": "P01", "msg": "列表类接口缺少分页机制，大数据量时性能风险"})
    # 无缓存头
    if "GET" in api_def and "cache" not in api_def.lower():
        issues.append({"severity": "LOW", type": "performance", "rule": "P02", "msg": "GET接口建议添加Cache-Control缓存头"})
    # 无限流
    if "rate" not in api_def.lower() and "limit" not in api_def.lower():
        issues.append({"severity": "MEDIUM", type": "performance", "rule": "P03", "msg": "接口缺少限流机制（Rate Limit），有被刷风险"})
    return issues

def _check_error_handling(api_def: str) -> list[dict]:
    issues = []
    # 缺少错误码定义
    if "error" not in api_def.lower() and "4" not in api_def and "5" not in api_def:
        issues.append({"severity": "MEDIUM", type: "健壮性", "rule": "E01", "msg": "接口缺少标准错误码定义，建议使用RFC 7807错误格式"})
    # 500未处理
    if "server" not in api_def.lower() and ("error" in api_def.lower() or "exception" in api_def.lower()):
        issues.append({"severity": "LOW", type": "健壮性", "rule": "E02", "msg": "建议对500类服务端错误有兜底处理"})
    return issues
