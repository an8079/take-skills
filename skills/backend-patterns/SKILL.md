---
name: backend-patterns
description: 后端开发模式技能。API、数据库、缓存等后端最佳实践。
tags: [backend, api, database, caching]
---

# 后端开发模式技能

## When to Use This Skill

- 开发后端服务时
- 设计 API 接口时
- 数据库设计时
- 缓存策略设计时

## Quick Reference

### 分层架构

```
┌─────────────────────────────────────────────────────┐
│                   API Layer                       │
│            (路由、参数验证、认证)                 │
└─────────────────────┬─────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│                Service Layer                     │
│            (业务逻辑、领域模型)                   │
└─────────────────────┬─────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│              Repository Layer                    │
│            (数据访问、查询构建)                   │
└─────────────────────┬─────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│                Database / Cache                  │
└─────────────────────────────────────────────────────┘
```

### Repository 模式

```typescript
// 接口定义
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

// 实现
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return row ? this.mapToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return row ? this.mapToUser(row) : null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const row = await this.db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [data.email, await bcrypt.hash(data.password, 10)]
    );
    return this.mapToUser(row);
  }

  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      createdAt: new Date(row.created_at),
    };
  }
}
```

### Service 模式

```typescript
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async register(data: RegisterDto): Promise<User> {
    // 验证
    this.validateEmail(data.email);
    this.validatePassword(data.password);

    // 检查是否已存在
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // 创建用户
    const user = await this.userRepository.create(data);

    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(user);

    this.logger.info('User registered', { userId: user.id });

    return user;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
  }
}
```

### API 设计

#### RESTful API

```typescript
// 用户资源
router.get('/users', userController.list);      // 列表
router.get('/users/:id', userController.get);    // 获取单个
router.post('/users', userController.create);     // 创建
router.put('/users/:id', userController.update);  // 更新
router.delete('/users/:id', userController.delete); // 删除

// 嵌套资源
router.get('/users/:userId/orders', orderController.listByUser);
```

#### 统一响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 成功响应
function success<T>(data: T, pagination?: any): ApiResponse<T> {
  return { success: true, data, pagination };
}

// 错误响应
function error(code: string, message: string, details?: any): ApiResponse<null> {
  return { success: false, error: { code, message, details } };
}

// 使用
app.get('/users/:id', async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    res.json(success(user));
  } catch (e) {
    if (e instanceof NotFoundError) {
      res.status(404).json(error('NOT_FOUND', e.message));
    } else {
      res.status(500).json(error('INTERNAL_ERROR', 'Internal server error'));
    }
  }
});
```

### 分页

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function listUsers(
  params: PaginationParams
): Promise<PaginatedResult<User>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db.query(
      'SELECT * FROM users ORDER BY $1 $2 LIMIT $3 OFFSET $4',
      [params.sortBy ?? 'created_at', params.sortOrder ?? 'DESC', limit, offset]
    ),
    db.query('SELECT COUNT(*) FROM users')
  ]);

  const total = parseInt(totalResult[0].count);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 缓存策略

```typescript
interface CacheOptions {
  ttl?: number; // 过期时间（秒）
  keyPrefix?: string;
}

class CachedRepository<T> implements Repository<T> {
  constructor(
    private repository: Repository<T>,
    private cache: CacheClient,
    private options: CacheOptions = {}
  ) {}

  async findById(id: string): Promise<T | null> {
    const key = `${this.options.keyPrefix}:${id}`;

    // 先从缓存获取
    const cached = await this.cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，从数据库获取
    const item = await this.repository.findById(id);
    if (item) {
      // 写入缓存
      await this.cache.set(key, JSON.stringify(item), this.options.ttl);
    }

    return item;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const item = await this.repository.update(id, data);
    // 更新后删除缓存
    const key = `${this.options.keyPrefix}:${id}`;
    await this.cache.del(key);
    return item;
  }
}

// 使用
const userRepo = new PostgresUserRepository(db);
const cachedUserRepo = new CachedRepository(
  userRepo,
  redis,
  { ttl: 3600, keyPrefix: 'user' }
);
```

### 错误处理

```typescript
// 自定义错误类
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

// 错误处理中间件
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error', { error: err });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}
```

## Examples

### Example 1: 用户注册 API

```typescript
// 路由
router.post('/users/register', validateBody(registerSchema), async (req, res) => {
  const result = await userService.register(req.body);
  res.status(201).json(success(result, {
    user: result,
    token: result.token,
  }));
});

// Service
async register(data: RegisterDto): Promise<RegisterResult> {
  // 1. 验证
  this.validateEmail(data.email);
  this.validatePassword(data.password);

  // 2. 检查重复
  const existing = await this.userRepo.findByEmail(data.email);
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  // 3. 创建用户
  const user = await this.userRepo.create({
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 10),
  });

  // 4. 生成 token
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: '7d',
  });

  return { user, token };
}
```

### Example 2: 文件上传

```typescript
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    throw new ValidationError('Only JPEG and PNG images are allowed');
  }

  // 生成文件名
  const ext = path.extname(file.originalname);
  const filename = `${uuid()}${ext}`;

  // 保存文件
  const filepath = path.join(config.uploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);

  // 返回 URL
  const url = `${config.baseUrl}/uploads/${filename}`;
  res.json(success({ url }));
});
```

## References

- [take-skills/skills/backend-patterns/SKILL.md](../take-skills/skills/backend-patterns/SKILL.md)
- [everything-claude-code/skills/backend-patterns/SKILL.md](../everything-claude-code/skills/backend-patterns/SKILL.md)

## Maintenance

- 来源：结合两个项目的后端开发经验
- 最后更新：2026-01-24
