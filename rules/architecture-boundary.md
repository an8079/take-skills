# 架构边界规则

> 强制分层架构，依赖单向流动

## 分层规范

### 允许的层次（从外到内）

```
UI (User Interface)        # 前端组件、页面
  ↓
Runtime (运行时)          # API 路由、控制器
  ↓
Service (服务层)         # 业务逻辑
  ↓
Repository (数据访问)     # 数据库操作
  ↓
Config (配置层)          # 配置、模型定义
  ↓
Types (类型定义)          # 接口、类型
```

### 禁止的层次

- ❌ 无层次的"平铺"代码
- ❌ UI 层直接操作数据库
- ❌ Config 层依赖 Service 层

## 依赖规则

### 单向依赖（必须遵守）

```
Types  → Config  → Repository  → Service  → Runtime  → UI
   ↑                                                    |
   └────────────────────────────────────────────────────┘
```

### 禁止的依赖

```
❌ Service → Types (Service 不应定义类型)
❌ Repository → Service (数据访问不应包含业务逻辑)
❌ UI → Repository (前端不应直接访问数据库)
❌ Config → Runtime (配置不应依赖运行时)
```

### 循环依赖检测

```
❌ A → B → C → A (循环)
❌ A → B → A (循环)
```

## 目录结构示例

```
src/
├── types/              # 类型定义 (无依赖)
│   ├── user.type.ts
│   └── api.types.ts
├── config/            # 配置层 (仅依赖 Types)
│   ├── database.ts
│   └── index.ts
├── repositories/      # 数据访问 (依赖 Config, Types)
│   ├── user.repository.ts
│   └── db.ts
├── services/          # 业务逻辑 (依赖 Repository)
│   ├── user.service.ts
│   └── order.service.ts
├── runtime/          # 运行时/API (依赖 Service)
│   ├── routes/
│   └── controllers/
├── ui/               # 前端 (依赖 Runtime)
│   ├── components/
│   └── pages/
└── index.ts          # 入口
```

## 验证规则

### 1. 导入路径检查

```typescript
// ✅ 正确：同层或内层依赖外层
import { User } from '../types/user.type';
import { UserRepository } from '../repositories/user.repository';

// ❌ 错误：外层依赖内层
import { UserService } from '../services/user.service';  // 从 UI 层
import { DbConnection } from '../repositories/db';      // 从 Service 层
```

### 2. 循环依赖检查

- 禁止模块间的循环导入
- 禁止接口和实现之间的循环引用

### 3. 层次穿透检查

- 禁止跳过中间层直接调用
- 例如：UI 层不能直接调用 Repository

## 执行标准

### 文件命名约定

| 层次 | 命名后缀 | 示例 |
|------|----------|------|
| Types | `.type.ts`, `.types.ts` | `user.type.ts` |
| Config | `.config.ts`, `.ts` | `database.config.ts` |
| Repository | `.repository.ts` | `user.repository.ts` |
| Service | `.service.ts` | `user.service.ts` |
| Runtime | `.routes.ts`, `.controller.ts` | `user.routes.ts` |
| UI | `.component.tsx`, `.page.tsx` | `UserPage.tsx` |

### 依赖注入

- ✅ 使用构造函数注入
- ✅ 使用接口抽象
- ❌ 禁止直接实例化

```typescript
// ✅ 正确
class UserService {
  constructor(private userRepo: IUserRepository) {}
}

// ❌ 错误
class UserService {
  private userRepo = new UserRepository();
}
```

## 豁免规则

以下情况可以豁免：

1. **测试文件** - `*.test.ts` 可以导入任何层
2. **入口文件** - `index.ts` 可以导入任何层
3. **类型重导出** - 重新导出类型定义

## 违规处理

| 严重程度 | 处理方式 |
|----------|----------|
| Critical | 阻止写入，强制重构 |
| Major | Post-Hook 警告，建议修复 |
| Minor | 代码注释提醒 |

## 验证工具

运行架构验证：

```bash
node scripts/architecture-validator.js check
```

检查依赖方向：

```bash
node scripts/architecture-validator.js analyze
```
