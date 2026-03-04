# 最佳实践

## 概述

本文档汇集 CLAUDE-STUDIO 项目的最佳实践，包括代码规范、Git 提交规范、测试规范、安全实践和性能优化。

---

## 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `userName`, `orderTotal` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 函数 | camelCase，动词开头 | `getUser()`, `createOrder()` |
| 类 | PascalCase，名词 | `UserService`, `OrderManager` |
| 接口 | PascalCase，I 前缀 | `IUserRepository` |
| 私有成员 | 下划线前缀 | `_internalMethod`, `_privateField` |
| 文件名 | kebab-case | `user-service.ts`, `order-manager.ts` |
| 组件文件 | PascalCase | `UserList.tsx`, `OrderCard.tsx` |

### 函数设计原则

1. **单一职责**
   ```typescript
   // ✅ 好的设计
   function calculateTotal(items: OrderItem[]): number {
     return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
   }

   // ❌ 职责过多
   function processOrder(order) {
     // 计算总价
     // 验证库存
     // 发送通知
     // 更新库存
   }
   ```

2. **参数控制**
   - 参数不超过 4 个
   - 超过使用对象
   ```typescript
   // ✅ 参数过多用对象
   function createUser({ name, email, role, age }: CreateUserDTO): User {}

   // ❌ 参数过多
   function createUser(name, email, role, age, address, phone) {}
   ```

3. **提前返回**
   ```typescript
   // ✅ 提前返回
   function processUser(user: User | null): string {
     if (!user) return 'No user';
     if (!user.isActive) return 'Inactive';
     return user.name;
   }

   // ❌ 嵌套过深
   function processUser(user) {
     if (user) {
       if (user.isActive) {
         return user.name;
       } else {
         return 'Inactive';
       }
     } else {
       return 'No user';
     }
   }
   ```

4. **函数长度**
   - 不超过 30 行
   - 超过需要拆分

### 代码格式

```typescript
// 空格和缩进
const foo = 'bar';
function bar() {
  return foo;
}

// 引号
const str = 'string'; // 使用单引号

// 分号
const x = 1; // 使用分号

// 尾随逗号
const obj = {
  a: 1,
  b: 2,
};
```

---

## 错误处理

### 原则

1. **不要吞掉异常**
   ```typescript
   // ✅ 正确
   try {
     await doSomething();
   } catch (error) {
     logger.error('操作失败', { error });
     throw new AppError('操作失败，请稍后重试');
   }

   // ❌ 错误
   try {
     await doSomething();
   } catch {
     // 空 catch 块
   }
   ```

2. **使用具体错误类型**
   ```typescript
   class NotFoundError extends Error {
     constructor(public resource: string) {
       super(`${resource} not found`);
       this.name = 'NotFoundError';
     }
   }

   class ValidationError extends Error {
     constructor(public field: string, message: string) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

3. **提供有意义的错误信息**
   ```typescript
   // ✅ 好的错误信息
   throw new ValidationError('email', '邮箱格式不正确');

   // ❌ 模糊的错误信息
   throw new Error('Error');
   ```

### 异步处理

```typescript
// ✅ 使用 async/await
async function fetchUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  return user;
}

// ✅ 并行执行独立的异步操作
async function fetchOrderDetails(orderId: string) {
  const [order, items, payments] = await Promise.all([
    orderRepository.findById(orderId),
    itemRepository.findByOrderId(orderId),
    paymentRepository.findByOrderId(orderId),
  ]);

  return { order, items, payments };
}
```

---

## Git 提交规范

### 提交信息格式

```
<类型>: <简短描述>

<详细描述>

<脚注>
```

### 类型 (Type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | 添加用户认证 |
| `fix` | Bug 修复 | 修复登录问题 |
| `docs` | 文档更新 | 更新 README |
| `style` | 代码格式 | 格式化代码 |
| `refactor` | 重构 | 优化代码结构 |
| `test` | 测试 | 添加单元测试 |
| `chore` | 维护 | 更新依赖 |
| `perf` | 性能优化 | 优化查询 |

### 示例

```
feat: 添加用户认证功能

实现 JWT 认证，支持登录/注册/登出

- 添加 jwt 依赖
- 实现 Token 生成和验证
- 添加认证中间件

Closes #123
Fixes #456
```

### 分支命名

```
feature/add-user-auth    # 新功能
bugfix/fix-login        # Bug 修复
hotfix/critical-bug     # 紧急修复
refactor/cleanup-code   # 重构
docs/update-readme      # 文档
```

---

## 测试规范

### 测试金字塔

```
           /\
          /  \
         / E2E \       ← 10%  端到端测试
        /--------\
       / 集成测试 \    ← 20%  集成测试
      /------------\
     /   单元测试   \  ← 70%  单元测试
```

### 单元测试

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const dto = { name: 'John', email: 'john@example.com' };
      const user = await userService.createUser(dto);

      expect(user).toHaveProperty('id');
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
    });

    it('should throw error with invalid email', async () => {
      const dto = { name: 'John', email: 'invalid' };

      await expect(userService.createUser(dto))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### 测试命名

| 场景 | 命名格式 |
|------|----------|
| 正常流程 | should do something |
| 异常流程 | should throw error when |
| 边界条件 | should handle edge case |
| 权限验证 | should reject unauthorized |

---

## 安全实践

### 敏感信息

```typescript
// ❌ 禁止硬编码
const API_KEY = 'sk-1234567890abcdef';

// ✅ 使用环境变量
const API_KEY = process.env.API_KEY;

// ✅ 使用密钥管理
const API_KEY = await keyManager.get('api-key');
```

### 输入验证

```typescript
// ✅ 验证用户输入
function createUser(dto: CreateUserDTO) {
  if (!dto.email || !isValidEmail(dto.email)) {
    throw new ValidationError('email', 'Invalid email');
  }
  if (!dto.password || dto.password.length < 8) {
    throw new ValidationError('password', 'Password too short');
  }
}

// ✅ 使用参数化查询
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### 输出转义

```typescript
// ✅ HTML 转义
function escapeHtml(text: string): string {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### 依赖安全

```bash
# 定期检查漏洞
npm audit
npm audit fix

# 使用可预测版本
npm install lodash@4.17.21  # 固定版本
npm install lodash@^4.17.0   # 兼容版本
```

---

## 性能优化

### 1. 数据库优化

```sql
-- ✅ 使用索引
CREATE INDEX idx_users_email ON users(email);

-- ✅ 避免 SELECT *
SELECT id, name, email FROM users;

-- ✅ 使用 LIMIT
SELECT * FROM orders LIMIT 100;

-- ❌ 避免 N+1 查询
-- 不好: 循环中查询
for (const order of orders) {
  const user = await db.users.find(order.userId);
}

-- 好: JOIN
SELECT o.*, u.name FROM orders o
JOIN users u ON o.user_id = u.id;
```

### 2. 缓存策略

```typescript
// ✅ 缓存频繁访问的数据
const cache = new Map<string, User>();

async function getUser(id: string): Promise<User> {
  const cached = cache.get(id);
  if (cached) return cached;

  const user = await db.users.find(id);
  cache.set(id, user);
  return user;
}

// ✅ 设置过期时间
const user = await cache.getOrSet(
  `user:${id}`,
  () => db.users.find(id),
  { ttl: 300 } // 5 分钟
);
```

### 3. 代码优化

```typescript
// ✅ 懒加载
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// ✅ 避免不必要的循环
const activeUsers = users.filter(u => u.isActive);
const userMap = new Map(users.map(u => [u.id, u]));

// ✅ 使用合适的数据结构
const userIds = new Set(users.map(u => u.id)); // O(1) 查找
```

---

## 文档规范

### README 结构

```markdown
# 项目名称

一行项目描述

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 快速开始

### 安装

```bash
npm install
```

### 使用

```typescript
import { Something } from 'package';

const result = Something.do();
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 获取用户列表 |
| POST | /users | 创建用户 |

## 配置

| 变量 | 说明 | 默认值 |
|------|------|----------|
| PORT | 服务器端口 | 3000 |
| DB_URL | 数据库连接 | - |

## 贡献

请阅读 CONTRIBUTING.md

## 许可

MIT
```

### 代码注释

```typescript
/**
 * 创建用户
 * @param dto 用户数据
 * @returns 创建的用户
 * @throws ValidationError 当数据无效时
 */
async function createUser(dto: CreateUserDTO): Promise<User> {}

/**
 * 处理用户订单
 * - 验证订单状态
 * - 计算总价
 * - 扣减库存
 * 注意: 此方法需要事务支持
 */
async function processOrder(orderId: string) {}
```

---

## 代码审查清单

### 代码质量

- [ ] 代码可读性良好
- [ ] 命名有意义
- [ ] 无重复代码
- [ ] 函数长度合理
- [ ] 适当的注释

### 错误处理

- [ ] 所有可能出错的地方有处理
- [ ] 错误信息清晰
- [ ] 无空 catch 块
- [ ] 边界情况已考虑

### 安全

- [ ] 无硬编码密钥
- [ ] 输入已验证
- [ ] 输出已转义
- [ ] SQL 使用参数化

### 性能

- [ ] 无不必要的循环
- [ ] 数据库查询已优化
- [ ] 大数据量已分页
- [ ] 缓存已考虑
