---
name: tdd
description: 测试驱动开发工作流。测试先行，红-绿-重构。
---

# /tdd - TDD 工作流

进入测试驱动开发模式。

## 使用方式

```
/tdd
```

## TDD 流程

```
RED → GREEN → IMPROVE
  ↓       ↓        ↓
写测试   实现最小   重构优化
 代码    代码让    改善设计
         测试通过
```

## 三个步骤

### 1. RED - 编写失败的测试

```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = { email: 'test@example.com', password: 'pass123' };
    const result = await userService.createUser(userData);

    expect(result).toHaveProperty('id');
    expect(result.email).toBe('test@example.com');
  });
});
```

运行测试，确保失败：
```bash
npm test
```

### 2. GREEN - 实现最小代码

编写最少的代码让测试通过：

```typescript
class UserService {
  async createUser(userData: UserData): Promise<User> {
    return {
      id: '1',
      email: userData.email,
      createdAt: new Date(),
    };
  }
}
```

运行测试，确保通过：
```bash
npm test
```

### 3. IMPROVE - 重构优化

在保持测试通过的前提下改善代码：

```typescript
class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: UserData): Promise<User> {
    this.validateEmail(userData.email);
    const user = await this.userRepository.create(userData);
    return user;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email');
    }
  }
}
```

运行测试，确保仍然通过：
```bash
npm test
```

## TDD 优点

| 优点 | 说明 |
|------|------|
| 清晰的设计需求 | 测试就是需求文档 |
| 降低 bug 风险 | 测试驱动确保代码正确 |
| 更容易重构 | 有测试保护，重构更安全 |
| 更好的代码结构 | 为了可测试性，代码更模块化 |

## 覆盖率目标

| 类型 | 目标覆盖率 |
|------|-----------|
| 语句覆盖 | 85% |
| 分支覆盖 | 80% |
| 函数覆盖 | 90% |

---

**提示：** TDD 不是教条，而是工具。在合适的时候使用，能显著提高代码质量。
