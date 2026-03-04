# 架构模式

## 概述

本文档定义 CLAUDE-STUDIO 项目的标准架构模式，包括分层架构、设计模式和验证规则。

---

## 分层架构

### 核心原则

分层架构的核心是**依赖单向流动**：
- 内层不知道外层
- 外层依赖内层
- 禁止跨层依赖

### 标准分层（从外到内）

```
┌─────────────────────────────────────────────┐
│  UI Layer (用户界面)                        │
│  - React/Vue 组件                          │
│  - 页面                                     │
│  - 样式                                    │
└──────────────────────┬──────────────────────┘
                       ↓
┌──────────────────────┬──────────────────────┐
│  Runtime Layer (运行时)                    │
│  - API 路由                                │
│  - 控制器                                  │
│  - 中间件                                  │
└──────────────────────┬──────────────────────┘
                       ↓
┌──────────────────────┬──────────────────────┐
│  Service Layer (服务层)                    │
│  - 业务逻辑                                │
│  - 业务规则                                │
│  - 事务管理                                │
└──────────────────────┬──────────────────────┘
                       ↓
┌──────────────────────┬──────────────────────┐
│  Repository Layer (数据访问层)              │
│  - 数据库操作                              │
│  - 数据映射                                │
│  - 查询构建                                │
└──────────────────────┬──────────────────────┘
                       ↓
┌──────────────────────┬──────────────────────┐
│  Config Layer (配置层)                     │
│  - 数据库配置                              │
│  - 环境配置                                │
│  - 常量定义                                │
└──────────────────────┬──────────────────────┘
                       ↓
┌──────────────────────┬──────────────────────┐
│  Types Layer (类型层)                      │
│  - 接口定义                                │
│  - 类型别名                                │
│  - 枚举                                    │
└─────────────────────────────────────────────┘
```

---

## 目录结构

### 标准结构

```
src/
├── types/                    # 类型定义（无依赖）
│   ├── user.type.ts
│   ├── api.types.ts
│   └── index.ts
├── config/                   # 配置层（依赖 types）
│   ├── database.config.ts
│   ├── app.config.ts
│   └── index.ts
├── repositories/             # 数据访问（依赖 config, types）
│   ├── user.repository.ts
│   ├── base.repository.ts
│   └── index.ts
├── services/                 # 服务层（依赖 repository）
│   ├── user.service.ts
│   ├── auth.service.ts
│   └── index.ts
├── runtime/                  # 运行时（依赖 service）
│   ├── routes/
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── index.ts
│   └── index.ts
├── ui/                       # UI 层（依赖 runtime）
│   ├── components/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── index.ts
│   └── index.ts
└── index.ts                  # 入口文件
```

### 分层职责

| 层次 | 职责 | 文件命名 |
|------|------|----------|
| Types | 类型/接口定义 | `*.type.ts`, `*.types.ts` |
| Config | 配置管理 | `*.config.ts` |
| Repository | 数据访问 | `*.repository.ts` |
| Service | 业务逻辑 | `*.service.ts` |
| Runtime | 请求处理 | `*.routes.ts`, `*.controller.ts` |
| UI | 用户界面 | `*.tsx`, `*.vue` |

---

## 依赖规则

### 允许的依赖

```typescript
// ✅ UI → Runtime
import { UserAPI } from '../runtime/api';

// ✅ Runtime → Service
import { UserService } from '../services/user.service';

// ✅ Service → Repository
import { UserRepository } from '../repositories/user.repository';

// ✅ Repository → Config
import { dbConfig } from '../config/database.config';

// ✅ Config → Types
import { User } from '../types/user.type';
```

### 禁止的依赖

```typescript
// ❌ UI → Repository（禁止）
import { UserRepository } from '../repositories/user.repository';

// ❌ Service → UI（禁止）
import { Button } from '../ui/components';

// ❌ Runtime → Types（仅在必需时允许）
// 建议通过 Service 传递类型

// ❌ 循环依赖（禁止）
// A → B → C → A
```

---

## 设计模式

### 1. 仓库模式 (Repository Pattern)

```typescript
// 定义接口
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}

// 实现
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.users.findUnique({ where: { id } });
  }

  async create(data: CreateUserDTO): Promise<User> {
    return this.db.users.create({ data });
  }

  // ... 其他方法
}
```

### 2. 服务层模式 (Service Layer)

```typescript
interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDTO): Promise<User>;
  updateUser(id: string, data: UpdateUserDTO): Promise<User>;
}

class UserService implements IUserService {
  constructor(
    private userRepo: IUserRepository,
    private logger: Logger
  ) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    return user;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    // 业务逻辑验证
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('Email already exists');
    }

    // 创建用户
    const user = await this.userRepo.create(data);
    this.logger.info('User created', { userId: user.id });

    return user;
  }
}
```

### 3. 控制器模式 (Controller)

```typescript
class UserController {
  constructor(private userService: IUserService) {}

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
```

### 4. 依赖注入 (DI)

```typescript
// 构造函数注入（推荐）
class UserService {
  constructor(
    private userRepo: IUserRepository,
    private logger: Logger,
    private cache: CacheService
  ) {}
}

// 属性注入（不推荐）
class UserService {
  @Inject()
  private userRepo: IUserRepository;
}

// 方法注入（特殊场景）
class UserService {
  setRepository(repo: IUserRepository) {
    this.userRepo = repo;
  }
}
```

---

## 验证工具

### CLI 命令

```bash
# 检查架构违规
node scripts/architecture-validator.js check

# 分析依赖关系
node scripts/architecture-validator.js analyze

# 验证目录结构
node scripts/architecture-validator.js validate
```

### 违规示例

| 违规类型 | 示例 | 严重程度 |
|----------|------|----------|
| 跨层依赖 | UI → Repository | Critical |
| 同层反向 | Service → UI | Critical |
| 循环依赖 | A → B → C → A | Critical |
| 跳过中间层 | Runtime → Repository | Major |

---

## 豁免规则

以下情况可以豁免架构检查：

1. **测试文件**
   ```typescript
   // tests/user.service.test.ts
   import { UserRepository } from '../src/repositories/...'; // 允许
   ```

2. **入口文件**
   ```typescript
   // src/index.ts
   // 可以导入所有层
   ```

3. **类型重导出**
   ```typescript
   // types/index.ts
   export * from './user.type'; // 允许
   ```

4. **Mock/Stub**
   ```typescript
   // mocks/user.repository.ts
   // 可以导入任何层用于测试
   ```

---

## 常见问题

### Q1: UI 层需要直接调用 Repository 怎么办？
A: 这是设计问题。应该在 Runtime 层暴露 API，UI 层通过 API 调用。

### Q2: 循环依赖如何解决？
A:
1. 提取共同依赖到新模块
2. 使用接口抽象
3. 延迟导入

### Q3: 配置层可以调用服务层吗？
A: 不可以。配置层是内层，服务层是外层，依赖只能从外到内。
