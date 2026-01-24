---
name: security-review
description: 安全审查技能。检查 OWASP Top 10 漏洞、安全最佳实践。
tags: [security, owasp, audit]
---

# 安全审查技能

## When to Use This Skill

- 交付前必须执行
- 代码审查时
- 安全审计时
- 用户说 `/security` 时

## OWASP Top 10 检查清单

### A01:2021 - 访问控制失效

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 水平越权 | Critical | 检查用户是否能访问他人资源 |
| 垂直越权 | Critical | 检查普通用户能否执行管理员操作 |
| IDOR | Critical | 检查是否直接使用可预测的 ID |
| 缺少权限验证 | Critical | 检查所有需要认证的端点 |

```typescript
// ❌ IDOR 风险
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.findOrder(req.params.id);
  return res.json(order);
});

// ✅ 安全实现
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.findOrder(req.params.id);
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(order);
});
```

### A02:2021 - 加密失效

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 硬编码密钥 | Critical | 代码扫描 |
| 弱加密算法 | Important | 算法检查 |
| 明文存储密码 | Critical | 审计密码存储 |
| 传输未加密 | Critical | 检查 HTTPS 使用 |

```typescript
// ❌ 硬编码密钥
const apiKey = 'sk-1234567890abcdef';

// ✅ 使用环境变量
const apiKey = process.env.API_KEY;

// ❌ 明文存储密码
await db.saveUser({ username, password: 'plaintext' });

// ✅ 使用 bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
await db.saveUser({ username, password: hashedPassword });
```

### A03:2021 - 注入

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| SQL 注入 | Critical | 检查 SQL 构建方式 |
| 命令注入 | Critical | 检查命令执行 |
| NoSQL 注入 | Important | 检查 NoSQL 查询 |
| XSS | Critical | 检查输出转义 |

```sql
-- ❌ SQL 注入风险
SELECT * FROM users WHERE id = '$userId'

-- ✅ 参数化查询
SELECT * FROM users WHERE id = ?
```

```javascript
// ❌ XSS 风险
div.innerHTML = userComment;

// ✅ 安全实现
div.textContent = userComment;
// 或
div.innerHTML = DOMPurify.sanitize(userComment);
```

### A04:2021 - 不安全设计

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 缺少安全设计 | Important | 架构审查 |
| 默认启用不安全配置 | Critical | 配置审计 |
| 缺少速率限制 | Important | 检查 API 限流 |
| 缺少 CSRF 保护 | Important | 检查表单保护 |

### A05:2021 - 安全配置错误

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 暴露调试信息 | Important | 错误处理审计 |
| 默认账户 | Critical | 检查默认凭据 |
| 过时的依赖 | Important | 依赖扫描 |
| CORS 过于宽松 | Important | CORS 配置审计 |

```typescript
// ❌ 暴露调试信息
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack });
});

// ✅ 安全的错误处理
app.use((err, req, res, next) => {
  logger.error('Operation failed', { error });
  res.status(500).json({ error: 'Internal server error' });
});

// ❌ CORS 过于宽松
app.use(cors({ origin: '*' }));

// ✅ 限制 CORS
app.use(cors({
  origin: ['https://example.com'],
  credentials: true,
}));
```

### A06:2021 - 易受攻击组件

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 过时的依赖 | High | npm audit |
| 不再维护的包 | Medium | 检查包维护状态 |
| 未锁定依赖版本 | Medium | 检查 lock 文件 |

```bash
# 依赖漏洞扫描
npm audit
npm audit fix
yarn audit
pip-audit
```

### A07:2021 - 身份验证失败

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 弱密码策略 | Important | 密码策略检查 |
| 密码未哈希 | Critical | 密码存储审计 |
| 会话固定 | High | 会话管理审计 |
| 缺少 MFA | Medium | 多因素认证检查 |

```typescript
// ✅ 密码策略验证
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }

  return { valid: errors.length === 0, errors };
}
```

### A08:2021 - 数据完整性失效

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 未验证依赖签名 | High | 包签名检查 |
| 未验证数据完整性 | Important | 数据校验检查 |
| CI/CD 不安全 | Critical | 构建流程审计 |

### A09:2021 - 日志监控失败

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 未记录安全事件 | Medium | 日志审计 |
| 敏感信息日志 | Important | 日志内容检查 |
| 缺少告警 | Medium | 监控配置检查 |

```typescript
// ❌ 记录敏感信息
logger.info('User data', { user }); // 可能包含密码

// ✅ 只记录必要信息
logger.info('User action', { userId: user.id, action: 'login' });
```

### A10:2021 - SSRF

| 检查项 | 严重级别 | 检查方法 |
|--------|----------|----------|
| 可控制的 URL 请求 | Critical | URL 参数检查 |
| 未验证重定向 | High | 重定向目标验证 |

```typescript
// ❌ SSRF 风险
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);
  return res.json(await response.json());
});

// ✅ 安全实现
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];

app.get('/api/fetch', async (req, res) => {
  const url = new URL(req.query.url);
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    return res.status(400).json({ error: 'Invalid domain' });
  }
  const response = await fetch(req.query.url);
  return res.json(await response.json());
});
```

## 安全检查工具

```bash
# 依赖漏洞扫描
npm audit
yarn audit
pip-audit

# 密钥扫描
trufflehog git://path/to/repo
git-secrets scan

# SAST (静态分析）
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

## 安全审查报告模板

```markdown
## 🔒 安全审查报告

**审查时间：** [日期时间]
**审查范围：** [范围]

---

## 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 访问控制 | ⭐⭐⭐⭐☆ | [说明] |
| 加密安全 | ⭐⭐⭐⭐⭐ | [说明] |
| 注入防护 | ⭐⭐⭐☆☆ | [说明] |
| 配置安全 | ⭐⭐⭐⭐☆ | [说明] |

---

## 发现的问题

### Critical Issues (X)
[问题列表]

### High Issues (X)
[问题列表]

---

## 修复建议
[修复方案]

---

**记住：** 安全是不可妥协的要求。一个漏洞可能导致严重的数据泄露和经济损失。
```

## References

- [take-skills/agents/security-reviewer.md](../take-skills/agents/security-reviewer.md)
- [everything-claude-code/agents/security-reviewer.md](../everything-claude-code/agents/security-reviewer.md)

## Maintenance

- 来源：基于 OWASP Top 10 2021
- 最后更新：2026-01-24
