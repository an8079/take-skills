# 安全审查上下文模式

> 安全审计与漏洞扫描的专用上下文

---

## 模式激活

当前工作模式：**安全审查（Security Review）**

## 审查维度

### OWASP Top 10 (2023)

| 类别 | 描述 | 检查项 |
|------|------|--------|
| A01:2021 | 访问控制失效 | 未授权访问、权限绕过 |
| A02:2021 | 加密失效 | 敏感数据明文传输/存储 |
| A03:2023 | 注入漏洞 | SQL 注入、命令注入、XSS |
| A04:2023 | 不安全设计 | 缺少安全架构考虑 |
| A05:2021 | 安全配置错误 | 默认凭证、调试接口暴露 |
| A06:2023 | 易受攻击组件 | 已知漏洞的依赖 |
| A07:2021 | 身份识别和身份验证失败 | 弱密码、会话管理不当 |
| A08:2023 | 软件和数据完整性失效 | CI/CD 管道未签名 |
| A09:2023 | 安全日志和监控失效 | 缺少审计日志 |
| A10:2023 | 服务器端请求伪造 (SSRF) | 未限制的 URL 请求 |

## 检查清单

### 认证与授权

- [ ] 所有 API 端点都有认证检查
- [ ] 密码使用 bcrypt/argon2 等安全哈希
- [ ] JWT token 有合理的过期时间
- [ ] 实现了速率限制
- [ ] 敏感操作需要二次验证

### 数据保护

- [ ] 敏感数据（密码、密钥）不在代码中硬编码
- [ ] 数据库连接使用环境变量
- [ ] API 密钥存储在 `.env` 文件中
- [ ] 生产环境不返回详细错误信息
- [ ] 敏感数据在日志中已脱敏

### 输入验证

- [ ] 所有用户输入都经过验证
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 对 HTML 输出进行转义防止 XSS
- [ ] 文件上传有类型和大小限制
- [ ] URL 参数有白名单验证

### HTTPS 与传输安全

- [ ] 生产环境强制 HTTPS
- [ ] 配置了安全的 HTTP 头（HSTS, CSP）
- [ ] Cookie 设置了 Secure 和 HttpOnly 标志
- [ ] API 调用使用证书验证

### 依赖安全

- [ ] 依赖包定期更新
- [ ] 运行 `npm audit` 或 `pip-audit` 检查漏洞
- [ ] 锁定依赖版本
- [ ] 避免使用已废弃的包

### 配置安全

- [ ] `.env` 文件在 `.gitignore` 中
- [ ] 生产配置与开发配置分离
- [ ] 调试模式在生产环境关闭
- [ ] 管理接口有额外的安全措施

### 日志与监控

- [ ] 关键操作有审计日志
- [ ] 登录失败有记录
- [ ] 异常登录有告警
- [ ] 敏感信息不在日志中

## 常见漏洞模式

### SQL 注入

```python
# ❌ 危险：直接拼接字符串
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ 安全：参数化查询
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

### XSS 跨站脚本

```python
# ❌ 危险：直接输出 HTML
html = f"<div>{user_input}</div>"

# ✅ 安全：转义输出
from markupsafe import escape
html = f"<div>{escape(user_input)}</div>"
```

### 命令注入

```python
# ❌ 危险：直接执行命令
os.system(f"rm -rf {user_path}")

# ✅ 安全：使用安全函数
os.unlink(user_path)  # 使用系统 API 而非命令
```

### 敏感信息泄露

```python
# ❌ 危险：返回完整错误
return {"error": str(exception), "traceback": traceback.format_exc()}

# ✅ 安全：只返回用户友好的错误
return {"error": "操作失败，请稍后重试"}
```

## 安全代码示例

### 密码哈希

```python
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

### JWT 认证

```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET")

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token 已过期")
    except jwt.InvalidTokenError:
        raise ValueError("Token 无效")
```

### 输入验证

```python
from pydantic import BaseModel, EmailStr, constr

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: constr(min_length=1, max_length=100)
    password: constr(min_length=8, regex=r"^(?=.*[A-Za-z])(?=.*\d)")

    class Config:
        extra = "forbid"
```

### 安全的 HTTP 头

```python
# Flask 示例
from flask import Flask

app = Flask(__name__)

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

## 扫描命令

### 依赖漏洞扫描

```bash
# Node.js
npm audit
npm audit fix

# Python
pip-audit
safety check

# Go
go list -json -m all | nancy sleuth

# Rust
cargo audit
```

### 静态分析

```bash
# JavaScript
npm run lint
npm run security-check

# Python
bandit -r src/
pylint src/
```

### 容器安全

```bash
# Docker 镜像扫描
docker scan myapp:latest

# Trivy 扫描
trivy image myapp:latest
trivy fs .
```

## 审查报告格式

```
🔒 **安全审查报告**

**项目：** [项目名称]
**日期：** [日期]
**审查范围：** [范围]

### 高危漏洞 (Critical)
1. **[文件:行号]** [漏洞类型] - [描述]
   - 严重程度：高危
   - 修复建议：[建议]
   - 参考：[OWASP/CVE]

### 中危漏洞 (High)
1. **[文件:行号]** [漏洞类型] - [描述]
   - 严重程度：中危
   - 修复建议：[建议]

### 低危漏洞 (Medium/Low)
1. **[文件:行号]** [漏洞类型] - [描述]
   - 严重程度：低危
   - 修复建议：[建议]

### 依赖漏洞
| 依赖 | 版本 | 漏洞 | 修复版本 |

### 安全评分
- 总体评分：[A/B/C/D/F]
- 通过项：[数量]
- 需修复项：[数量]

### 建议
1. [建议1]
2. [建议2]
```

## 下一步

- 修复高危和中危漏洞
- 更新有漏洞的依赖
- 添加自动化安全扫描到 CI/CD
- 定期进行安全审计
