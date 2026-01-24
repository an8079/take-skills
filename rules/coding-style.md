# 代码风格规则

遵循以下代码风格规则，确保代码质量。

## 命名规范

### 变量命名

- 使用 camelCase
- 名称应具有描述性
- 避免单字母变量（循环索引除外）

```typescript
// ✅ 好的命名
const userCount = 10;
const isLoggedIn = true;
const getUserName = () => {};

// ❌ 不好的命名
const x = 10;
const flag = true;
const fn = () => {};
```

### 常量命名

- 使用 UPPER_SNAKE_CASE
- 定义在文件顶部

```typescript
// ✅ 好的命名
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ 不好的命名
const maxRetry = 3;
const apiUrl = 'https://api.example.com';
```

### 函数命名

- 使用 camelCase
- 动词开头
- 清晰表达功能

```typescript
// ✅ 好的命名
function getUserById(id: string): User {}
function isValidEmail(email: string): boolean {}
function sendNotification(user: User): void {}

// ❌ 不好的命名
function user(id: string): User {}
function check(email: string): boolean {}
function doIt(user: User): void {}
```

### 类命名

- 使用 PascalCase
- 名词形式

```typescript
// ✅ 好的命名
class UserService {}
class OrderManager {}
class HttpClient {}

// ❌ 不好的命名
class userService {}
class manageOrder {}
class client {}
```

### 私有成员

- 使用下划线前缀

```typescript
// ✅ 好的命名
class UserService {
  private _userRepository: UserRepository;
  private _internalMethod(): void {}
}
```

## 文件组织

### 单一职责

- 每个文件只负责一个功能/模块
- 文件大小不超过 800 行

### 目录结构

```
src/
├── api/              # API 路由层
├── services/         # 业务逻辑层
├── repositories/     # 数据访问层
├── models/           # 数据模型
├── types/            # 类型定义
├── utils/            # 工具函数
├── config/           # 配置
└── main.ts           # 入口文件
```

## 函数设计

### 函数长度

- 函数不超过 20-30 行
- 如果更长，拆分为小函数

```typescript
// ❌ 太长的函数
async function processOrder(orderId: string) {
  // 100+ 行代码
}

// ✅ 拆分为小函数
async function processOrder(orderId: string) {
  const order = await fetchOrder(orderId);
  const validated = validateOrder(order);
  const processed = await processItems(order);
  const result = await saveOrder(processed);
  return result;
}
```

### 参数数量

- 函数参数不超过 3-4 个
- 更多参数使用对象

```typescript
// ❌ 参数太多
function createUser(name: string, email: string, age: number, address: string, phone: string) {}

// ✅ 使用对象
function createUser(options: CreateUserOptions) {}
```

### 纯函数优先

- 优先使用无副作用的纯函数
- 便于测试和理解

```typescript
// ✅ 纯函数
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ❌ 有副作用
function calculateTotal(items: OrderItem[]): number {
  totalItems = items.length; // 副作用
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

## 代码组织

### 提前返回

- 使用提前返回减少嵌套

```typescript
// ❌ 深层嵌套
function processUser(user: User | null) {
  if (user) {
    if (user.active) {
      if (user.permissions.includes('write')) {
        if (resource) {
          // 处理逻辑
        }
      }
    }
  }
}

// ✅ 提前返回
function processUser(user: User | null) {
  if (!user) return;
  if (!user.active) return;
  if (!user.permissions.includes('write')) return;
  if (!resource) return;
  // 处理逻辑
}
```

### 使用常量

- 避免魔法数字和字符串

```typescript
// ❌ 魔法数字
if (status === 2 && attempts > 3) {
  retry();
}

// ✅ 使用常量
const ORDER_STATUS_CONFIRMED = 2;
const MAX_RETRY_ATTEMPTS = 3;

if (status === ORDER_STATUS_CONFIRMED && attempts > MAX_RETRY_ATTEMPTS) {
  retry();
}
```

## 注释规范

### 需要注释的情况

- 复杂的业务逻辑
- 不明显的算法
- 临时解决方案（标记 TODO）

### 不需要注释的情况

- 简单的代码
- 自解释的代码

```typescript
// ✅ 好的注释（说明为什么）
// 使用二分查找而不是线性查找，因为数据量大
function findItem(items: Item[], id: string): Item {
  // ...
}

// ❌ 不好的注释（重复代码）
// 获取用户 ID
const userId = user.id;
```

## 错误处理

### 不吞掉异常

- catch 块至少要记录日志

```typescript
// ✅ 好的错误处理
try {
  await processOrder();
} catch (error) {
  logger.error('订单处理失败', { error });
  throw error;
}

// ❌ 吞掉异常
try {
  await processOrder();
} catch (error) {
  // 空 catch
}
```

### 使用具体的错误类型

```typescript
// ✅ 使用自定义错误
class OrderError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

// ❌ 使用通用错误
throw new Error('出错了');
```

## 代码重复

- 提取重复代码为函数
- 使用继承或组合复用代码

```typescript
// ❌ 重复代码
function processOrder1() {
  const items = getOrderItems1();
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return total;
}

function processOrder2() {
  const items = getOrderItems2();
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return total;
}

// ✅ 提取公共函数
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function processOrder1() {
  return calculateTotal(getOrderItems1());
}

function processOrder2() {
  return calculateTotal(getOrderItems2());
}
```

## TypeScript 规则

### 启用严格模式

- tsconfig.json 必须启用 strict: true

### 避免使用 any

- 优先使用具体类型
- 使用 unknown 代替 any

```typescript
// ❌ 使用 any
function process(data: any) {}

// ✅ 使用具体类型
function process(data: ProcessData) {}

// ✅ 使用 unknown
function parse(data: unknown): ProcessData {
  if (isProcessData(data)) {
    return data;
  }
  throw new Error('Invalid data');
}
```

### 明确返回类型

- 函数应明确声明返回类型

```typescript
// ✅ 明确返回类型
function getUser(id: string): User | null {}

// ❌ 不明确的返回类型
function getUser(id: string) {}
```

## 格式化

- 使用 Prettier 自动格式化
- 使用 ESLint 进行代码检查
- 不要在代码中添加 emoji
