# 安全规范

## 概述

本文档定义 CLAUDE-STUDIO 项目的安全标准和最佳实践。

---

## 安全原则

### 1. 纵深防御

```
┌─────────────────────────────────────────┐
│           网络层安全                      │
│  - 防火墙                              │
│  - WAF                                 │
│  - DDoS 防护                           │
├─────────────────────────────────────────┤
│           应用层安全                      │
│  - 输入验证                             │
│  - 输出编码                             │
│  - 认证授权                            │
├─────────────────────────────────────────┤
│           数据层安全                      │
│  - 加密存储                            │
│  - 传输加密                            │
│  - 访问控制                            │
└─────────────────────────────────────────┘
```

### 2. 最小权限

- 用户只应获得完成任务所需的最小权限
- 服务账户使用最小权限原则
- 避免过度权限分配

### 3. 默认安全

- 安全配置应为默认
- 禁用不必要的功能
- 关闭调试模式

---

## 认证安全

### 1. 密码存储

```typescript
// ✅ 使用强哈希算法
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ❌ 禁止使用
// - MD5, SHA1 (可被破解)
// - 不加盐的哈希
// - Base64 编码
```

### 2. 密码策略

```typescript
// 密码强度要求
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// 至少 8 位，包含大小写字母、数字和特殊字符
```

### 3. 多因素认证 (MFA)

```typescript
// ✅ 支持 TOTP
import speakeasy from 'speakeasy';

const generateTOTPSecret = (): string => {
  return speakeasy.generateSecret({ length: 20 }).base32;
};

const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
};
```

---

## 会话管理

### 1. Session 安全

```typescript
// ✅ 安全 Session 配置
const sessionConfig = {
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // 防止 XSS
    sameSite: 'strict', // CSRF 防护
    maxAge: 3600000    // 1 小时
  },
  name: '__Host-session',  // 防止子域名攻击
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
};
```

### 2. Token 安全

```typescript
// ✅ JWT 安全配置
const jwtConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'my-app',
  audience: 'my-app-users'
};

// ✅ Token 存储
// - Access Token: 内存存储
// - Refresh Token: HttpOnly Cookie
// - 避免 LocalStorage (XSS 风险)
```

---

## 授权安全

### 1. 访问控制

```typescript
// ✅ 基于角色的访问控制 (RBAC)
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

const permissions = {
  [Role.ADMIN]: ['*'],
  [Role.USER]: ['read', 'write:own'],
  [Role.GUEST]: ['read']
};

// 检查权限
const hasPermission = (userRole: Role, resource: string, action: string): boolean => {
  const rolePermissions = permissions[userRole];
  return rolePermissions.includes('*') ||
         rolePermissions.includes(action) ||
         rolePermissions.includes(`${action}:own`);
};
```

### 2. 资源所有权

```typescript
// ✅ 检查资源所有权
const canAccessResource = async (
  userId: string,
  resource: { userId: string }
): Promise<boolean> => {
  const user = await getUser(userId);
  return user.role === Role.ADMIN || resource.userId === userId;
};
```

---

## 输入验证

### 1. 数据验证

```typescript
// ✅ 使用验证库
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest'])
});

const validateUser = (data: unknown) => {
  return UserSchema.safeParse(data);
};
```

### 2. SQL 注入防护

```typescript
// ✅ 参数化查询
const getUserById = async (id: string) => {
  return db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]  // 参数化
  );
};

// ✅ ORM/Query Builder
const user = await db.users.findUnique({
  where: { id }
});

// ❌ 禁止
const query = `SELECT * FROM users WHERE id = '${id}'`;
```

### 3. NoSQL 注入

```typescript
// ✅ 验证输入类型
const query = {
  userId: typeof userId === 'string' ? userId : null
};

// ❌ 禁止
const query = {
  $where: userInput  // NoSQL 注入
};
```

---

## 输出安全

### 1. XSS 防护

```typescript
// ✅ HTML 转义
import { escape } from 'html-escaper';

const safeHtml = escape(userInput);

// ✅ React 默认防护
// React 自动转义

// ✅ Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'"
  );
  next();
});
```

### 2. JSON 输出

```typescript
// ✅ 设置正确的 Content-Type
res.setHeader('Content-Type', 'application/json');

// ✅ 敏感字段过滤
const safeUser = {
  ...user,
  password: undefined,
  token: undefined
};
```

---

## 加密

### 1. 传输加密

```typescript
// ✅ HTTPS only
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.hostname + req.url);
  }
  next();
});
```

### 2. 敏感数据加密

```typescript
// ✅ 使用 AES-256-GCM
import crypto from 'crypto';

const encrypt = (text: string, key: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

const decrypt = (encrypted: string, key: string): string => {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
```

---

## 日志与监控

### 1. 安全日志

```typescript
// ✅ 记录安全事件
const logSecurityEvent = (event: SecurityEvent) => {
  logger.info('Security Event', {
    type: event.type,
    userId: event.userId,
    ip: event.ip,
    timestamp: new Date().toISOString(),
    details: event.details
  });
};

// 记录的事件
const events = {
  LOGIN_SUCCESS: '用户登录成功',
  LOGIN_FAILED: '用户登录失败',
  PASSWORD_CHANGED: '密码修改',
  PERMISSION_DENIED: '权限拒绝',
  SUSPICIOUS_ACTIVITY: '可疑活动'
};
```

### 2. 审计日志

```typescript
// ✅ 审计日志
const auditLog = async (
  action: string,
  userId: string,
  resource: string,
  details: Record<string, unknown>
) => {
  await db.auditLogs.create({
    data: {
      action,
      userId,
      resource,
      details,
      timestamp: new Date(),
      ip: getClientIp()
    }
  });
};
```

---

## 依赖安全

### 1. 依赖检查

```bash
# 定期扫描漏洞
npm audit
npm audit fix

# 使用 Snyk
npm install -g snyk
snyk test
```

### 2. 依赖版本

```json
{
  "dependencies": {
    "lodash": "^4.17.21"  // 锁定小版本
  }
}
```

---

## 常见漏洞防护

### 1. OWASP Top 10

| 漏洞 | 防护措施 |
|------|----------|
| A01: 失效的访问控制 | 实施 RBAC, 检查所有权 |
| A02: 加密失败 | 使用强算法, 密钥管理 |
| A03: 注入 | 参数化查询, 输入验证 |
| A04: 不安全的设计 | 威胁建模, 安全设计 |
| A05: 安全配置错误 | 强化配置, 关闭调试 |
| A06: 易受攻击的组件 | 定期更新, 漏洞扫描 |
| A07: 认证失败 | MFA, 强密码策略 |
| A08: 数据泄露 | 加密传输/存储, 脱敏 |
| A09: 日志不足 | 记录安全事件, 监控 |
| A10: 服务端请求伪造 | 验证 URL, 禁用重定向 |

### 2. CSRF 防护

```typescript
// ✅ CSRF Token
app.use(csrf({ cookie: true }));

// SameSite Cookie
res.cookie('session', sessionId, {
  sameSite: 'strict'
});
```

### 3. CORS 配置

```typescript
// ✅ 限制性 CORS
app.use(cors({
  origin: ['https://example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 应急响应

### 1. 安全事件处理流程

```
1. 检测 → 2. 遏制 → 3. 根除 → 4. 恢复 → 5. 复盘
```

### 2. 泄露响应

```typescript
// 如果发生数据泄露
// 1. 立即禁用受影响账户
// 2. 通知受影响的用户
// 3. 调查泄露原因
// 4. 修复漏洞
// 5. 报告监管部门（如需要）
```

---

## 安全检查清单

### 开发时

- [ ] 输入验证所有用户输入
- [ ] 使用参数化查询
- [ ] 加密敏感数据
- [ ] 实施认证和授权
- [ ] 使用安全的 Session/Token
- [ ] 记录安全日志

### 上线前

- [ ] 关闭调试模式
- [ ] 配置安全的 HTTP 头
- [ ] 使用 HTTPS
- [ ] 扫描漏洞
- [ ] 安全配置审查
- [ ] 渗透测试

### 运维时

- [ ] 监控安全日志
- [ ] 定期更新依赖
- [ ] 备份和恢复测试
- [ ] 漏洞扫描
- [ ] 安全审计
