# 安全规则

代码必须遵守以下安全规则，交付前必须通过安全审查。

## 绝对禁止

### 硬编码密钥

- 绝不允许在代码中硬编码密钥
- 使用环境变量存储敏感信息

```typescript
// ❌ 硬编码密钥
const apiKey = 'sk-1234567890abcdef';

// ✅ 使用环境变量
const apiKey = process.env.API_KEY;
```

### SQL 注入风险

- 使用参数化查询
- 不拼接字符串构建 SQL

```sql
-- ❌ SQL 注入风险
SELECT * FROM users WHERE id = '$userId'

-- ✅ 参数化查询
SELECT * FROM users WHERE id = ?
```

### XSS 风险

- 用户输入必须转义
- 使用安全的 API

```javascript
// ❌ XSS 风险
div.innerHTML = userComment;

// ✅ 安全实现
div.textContent = userComment;
// 或
div.innerHTML = DOMPurify.sanitize(userComment);
```

### 命令注入风险

- 不直接执行用户输入
- 使用参数化方式

```javascript
// ❌ 命令注入风险
exec(`ls ${userInput}`);

// ✅ 安全实现
execFile('ls', [sanitizedInput]);
```

## 必须遵守

### 输入验证

- 所有用户输入必须验证
- 验证类型、长度、格式

```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  if (email.length > 255) {
    throw new Error('Email too long');
  }
  return true;
}
```

### 密码存储

- 密码必须使用 bcrypt 或类似算法哈希
- 不使用 MD5、SHA1 等弱算法

```typescript
// ❌ 弱哈希
const hash = md5(password);

// ✅ 使用 bcrypt
const hash = await bcrypt.hash(password, 10);
```

### HTTPS

- 生产环境必须使用 HTTPS
- 不允许明文传输敏感数据

### 认证授权

- 所有敏感操作必须验证用户身份
- 使用 RBAC 或 ABAC 进行权限控制

```typescript
// ✅ 检查权限
if (!user.permissions.includes('delete:orders')) {
  throw new UnauthorizedError('Insufficient permissions');
}
```

### CSRF 保护

- 状态修改操作必须防范 CSRF
- 使用 CSRF Token

### 速率限制

- API 接口必须有速率限制
- 防止暴力破解

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts'
});
```

### 错误处理

- 生产环境不返回详细错误信息
- 错误消息不泄露敏感信息

```typescript
// ❌ 泄露信息
if (error) {
  res.status(500).json({ error: error.message });
}

// ✅ 安全的错误处理
if (error) {
  logger.error('Operation failed', { error });
  res.status(500).json({ error: 'Internal server error' });
}
```

### 敏感数据

- 不在日志中记录敏感信息
- 不在响应中返回敏感数据

```typescript
// ❌ 记录敏感信息
logger.info('User data', { user });

// ✅ 只记录必要信息
logger.info('User action', { userId: user.id, action: 'login' });
```

## OWASP Top 10 检查

| 类别 | 检查项 | 验证方法 |
|------|--------|----------|
| A01 访问控制 | 水平/垂直越权、IDOR | 代码审查、测试 |
| A02 加密失效 | 硬编码密钥、弱算法 | 扫描工具、审查 |
| A03 注入 | SQL、命令、NoSQL 注入 | SAST 工具、审查 |
| A04 不安全设计 | 缺少安全设计 | 架构审查 |
| A05 配置错误 | 调试信息、默认账户 | 配置审查 |
| A06 易受攻击组件 | 过时依赖 | 依赖扫描 |
| A07 身份验证 | 弱密码、无 MFA | 安全审查 |
| A08 数据完整性 | 未验证依赖、签名 | 供应链检查 |
| A09 日志监控 | 未记录安全事件 | 日志审查 |
| A10 SSRF | 可控制的 URL 请求 | 代码审查 |

## 安全检查工具

```bash
# 依赖漏洞扫描
npm audit
yarn audit
pip-audit

# 密钥扫描
trufflehog git://path/to/repo
git-secrets scan

# SAST (静态分析)
semgrep
codeql

# 安全 Lint
npm install -D eslint-plugin-security
```

## 安全审查清单

交付前必须确认：

- [ ] 无硬编码密钥
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险
- [ ] 无命令注入风险
- [ ] 密码正确哈希存储
- [ ] 输入已验证
- [ ] 使用 HTTPS
- [ ] 有认证授权
- [ ] 有 CSRF 保护
- [ ] 有速率限制
- [ ] 错误处理安全
- [ ] 依赖无已知漏洞
- [ ] 日志不包含敏感信息

**任何一项未通过都不能交付。**
