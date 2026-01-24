---
name: tdd-workflow
description: TDD 工作流技能。测试驱动开发，红-绿-重构。
tags: [testing, tdd, development]
---

# TDD 工作流技能

## When to Use This Skill

- 用户说 `/tdd` 时
- 开发新功能时
- 重构现有代码时
- 用户强调测试优先时

## TDD 流程

```
RED → GREEN → IMPROVE
```

### 1. RED - 编写失败的测试

编写测试，确保它失败（如果通过了说明测试有问题）

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

### 2. GREEN - 实现最小代码

编写最少的代码让测试通过

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

### 3. IMPROVE - 重构优化

在保持测试通过的前提下改善代码

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

## Quick Reference

### TDD 三步循环

| 步骤 | 目标 | 验证 |
|------|------|------|
| RED | 明确需求 | 测试失败 |
| GREEN | 实现功能 | 测试通过 |
| IMPROVE | 改善设计 | 测试仍通过 |

### 测试编写原则

1. **一个测试一个断言** — 每个测试只验证一个行为
2. **测试名称清晰** — 描述测试的内容
3. **使用 AAA 模式** — Arrange, Act, Assert
4. **独立可运行** — 测试之间互不影响

### 代码重构原则

1. **保持测试通过** — 重构不改变行为
2. **小步重构** — 每次只改一点
3. **频繁验证** — 每次重构后运行测试

## Examples

### Example 1: 计算器功能

**RED - 编写测试**
```typescript
describe('Calculator', () => {
  it('should add two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });

  it('should subtract two numbers', () => {
    const calc = new Calculator();
    expect(calc.subtract(5, 3)).toBe(2);
  });
});
```

**GREEN - 最小实现**
```typescript
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }
}
```

**IMPROVE - 重构**
```typescript
class Calculator {
  private operations: Record<string, (a: number, b: number) => number> = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
  };

  operate(op: string, a: number, b: number): number {
    const fn = this.operations[op];
    if (!fn) throw new Error('Unknown operation');
    return fn(a, b);
  }

  add(a: number, b: number): number {
    return this.operate('add', a, b);
  }

  subtract(a: number, b: number): number {
    return this.operate('subtract', a, b);
  }
}
```

### Example 2: API 端点

**RED - 编写测试**
```typescript
describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const userData = { email: 'test@example.com', password: 'pass123' };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      email: 'test@example.com',
      id: expect.any(String),
    });
  });

  it('should return 400 with invalid email', async () => {
    const userData = { email: 'invalid', password: 'pass123' };

    await request(app)
      .post('/api/users')
      .send(userData)
      .expect(400);
  });
});
```

**GREEN - 最小实现**
```typescript
app.post('/api/users', async (req, res) => {
  const { email, password } = req.body;

  // 简单验证
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const user = await db.create('users', { email, password });
  return res.status(201).json(user);
});
```

**IMPROVE - 重构**
```typescript
// 提取验证逻辑
function validateUserData(data: UserData): { valid: boolean; error?: string } {
  if (!data.email || !emailRegex.test(data.email)) {
    return { valid: false, error: 'Invalid email' };
  }
  if (!data.password || data.password.length < 6) {
    return { valid: false, error: 'Password too short' };
  }
  return { valid: true };
}

app.post('/api/users', async (req, res) => {
  const validation = validateUserData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const user = await db.create('users', req.body);
  return res.status(201).json(user);
});
```

## TDD 优点

| 优点 | 说明 |
|------|------|
| 清晰的需求 | 测试就是需求文档 |
| 降低 bug 风险 | 测试驱动确保代码正确 |
| 更容易重构 | 有测试保护，重构更安全 |
| 更好的代码结构 | 为了可测试性，代码更模块化 |

## 覆盖率目标

| 类型 | 目标覆盖率 |
|------|-----------|
| 语句覆盖 | 85% |
| 分支覆盖 | 80% |
| 函数覆盖 | 90% |

## References

- [take-skills/skills/code-review/SKILL.md](../take-skills/skills/code-review/SKILL.md)
- [everything-claude-code/agents/tdd-guide.md](../everything-claude-code/agents/tdd-guide.md)

## Maintenance

- 来源：结合两个项目的 TDD 经验
- 最后更新：2026-01-24
