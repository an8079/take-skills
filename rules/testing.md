# 测试规则

代码必须经过充分测试，确保质量和可靠性。

## 测试类型

### 单元测试

- 测试单个函数/类
- 不依赖外部系统
- 快速执行（毫秒级）

```typescript
describe('stringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });
});
```

### 集成测试

- 测试模块间交互
- 可以使用内存数据库或测试数据库
- 验证数据流正确

```typescript
describe('Order API', () => {
  it('should create order successfully', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ userId: '1', items: [...] })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });
});
```

### E2E 测试

- 测试完整用户流程
- 使用真实浏览器或 API
- 验证端到端功能

```typescript
test('should complete order flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('.product-card');
  await page.click('button:has-text("加入购物车")');
  await page.click('text=购物车');
  await page.click('button:has-text("提交订单")');
  await expect(page.locator('text=订单创建成功')).toBeVisible();
});
```

## 覆盖率要求

| 类型 | 最低要求 | 目标 |
|------|----------|------|
| 语句覆盖 | 80% | 85% |
| 分支覆盖 | 70% | 80% |
| 函数覆盖 | 85% | 90% |
| 行覆盖 | 80% | 85% |

## TDD 工作流

```
RED → GREEN → IMPROVE
```

1. **RED** - 编写失败的测试
2. **GREEN** - 实现最小代码让测试通过
3. **IMPROVE** - 重构改善设计

## 测试命名规范

### 测试描述

- 清晰描述测试内容
- 使用 "should" 或 "when...then..." 格式

```typescript
// ✅ 好的命名
it('should create user with valid data', () => {});
it('should throw error when email is invalid', () => {});

// ✅ 清晰的场景描述
describe('when user is logged in', () => {
  it('should show user profile', () => {});
});

describe('when user is not logged in', () => {
  it('should redirect to login', () => {});
});
```

### 测试结构

```typescript
describe('[模块/类名]', () => {
  describe('[方法/场景]', () => {
    beforeEach(() => {
      // 每个测试前的准备
    });

    it('should [预期行为] when [条件]', async () => {
      // Arrange - 准备测试数据
      const input = { ... };

      // Act - 执行被测代码
      const result = await functionUnderTest(input);

      // Assert - 验证结果
      expect(result).toBe(expected);
    });

    afterEach(() => {
      // 每个测试后的清理
    });
  });
});
```

## Mock 规则

### Mock 外部依赖

- 不调用真实外部 API
- 使用 mock 模拟返回值

```typescript
// Mock 数据库
jest.mock('../../src/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    create: jest.fn(),
  })),
}));

// Mock API
jest.mock('../../src/services/external-api', () => ({
  ExternalApiService: jest.fn().mockImplementation(() => ({
    fetchUserData: jest.fn().mockResolvedValue({ id: '1', name: 'John' }),
  })),
}));
```

### 测试隔离

- 每个测试独立运行
- 测试之间互不影响

```typescript
describe('UserService', () => {
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

## 测试数据

### 使用工厂模式创建测试数据

```typescript
// test/factories/user.factory.ts
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

// 使用
const user = createUser({ email: 'custom@example.com' });
```

### 边界情况测试

```typescript
describe('calculateTotal', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should handle large numbers', () => {
    const items = Array(1000).fill({ price: 100, quantity: 1 });
    expect(calculateTotal(items)).toBe(100000);
  });

  it('should handle decimal values', () => {
    const items = [{ price: 1.99, quantity: 3 }];
    expect(calculateTotal(items)).toBeCloseTo(5.97, 2);
  });
});
```

## 异步测试

### 正确处理异步

```typescript
// ✅ 使用 async/await
it('should fetch user', async () => {
  const user = await userService.getUser('1');
  expect(user).toBeDefined();
});

// ✅ 使用 promise 返回
it('should fetch user', () => {
  return userService.getUser('1').then(user => {
    expect(user).toBeDefined();
  });
});

// ❌ 忘记 await
it('should fetch user', () => {
  const user = userService.getUser('1'); // Promise 未等待
  expect(user).toBeDefined();
});
```

## 错误测试

### 测试错误情况

```typescript
describe('createOrder', () => {
  it('should throw error with empty items', async () => {
    await expect(orderService.createOrder({ items: [] }))
      .rejects.toThrow('订单必须包含商品');
  });

  it('should throw error with invalid user', async () => {
    await expect(orderService.createOrder({ userId: '', items: [...] }))
      .rejects.toThrow('用户ID不能为空');
  });
});
```

## 测试命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test order.service.test.ts

# 运行匹配的测试
npm test -- -t "should create order"

# 监视模式
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage

# 并行运行
npm test -- --maxWorkers=4
```

## 测试检查清单

代码提交前确认：

- [ ] 新代码有对应测试
- [ ] 测试覆盖率达标（80%+）
- [ ] 边界情况已测试
- [ ] 错误情况已测试
- [ ] Mock 正确配置
- [ ] 测试可以独立运行
- [ ] 无测试泄漏（未清理的状态）

## 质量指标

| 指标 | 标准 |
|------|------|
| 测试覆盖率 | >= 80% |
| 关键路径覆盖率 | 100% |
| 测试执行时间 | < 5 分钟 |
| 失败测试数 | 0 |

---

**记住：** 没有测试的代码是技术债务。测试是代码质量的保障。
