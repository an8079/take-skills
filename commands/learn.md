---
name: learn
description: 提取学习模式，保存可复用的经验和模式。
---

# /learn - 提取学习模式

从当前会话中提取可复用的模式和经验。

## 使用方式

```
/learn
```

或

```
提取模式
提取学习
```

## 何时使用

| 时机 | 说明 |
|------|------|
| 会话进行中 | 发现好的模式，想保存供未来使用 |
| 会话结束时 | 总结本次会话的经验教训 |
| 项目完成后 | 提取项目中可复用的模式 |

## 提取的模式类型

| 类型 | 示例 |
|------|------|
| 代码模式 | Repository 模式、中间件模式、装饰器模式 |
| 配置模式 | Nginx 配置、Docker 配置、K8s 配置 |
| 错误处理模式 | 统一错误响应、错误边界、重试机制 |
| 测试模式 | 测试组织、Mock 策略、测试数据准备 |
| 工作流模式 | Git 工作流、发布流程、部署流程 |

## 提取流程

1. 分析当前会话
2. 识别可复用的模式
3. 组织成可学习的格式
4. 保存到对应位置

## 保存位置

| 模式类型 | 保存位置 |
|----------|----------|
| 通用模式 | `~/.claude/skills/learned/` |
| 项目模式 | `memory-bank/学习记录.md` |
| 领域模式 | `skills/[领域]/SKILL.md` |

## 模式保存格式

```markdown
### 模式名称：[名称]

**类型：** [架构/设计/代码]

**来源：** [项目/会话]

**描述：**
[模式描述]

**问题：**
[解决的问题]

**解决方案：**
```typescript
// 代码示例
```

**适用场景：**
- [场景1]
- [场景2]

**注意事项：**
- 注意1
- 注意2

**相关模式：**
- [模式1]
- [模式2]
```

## 提取示例

```
📚 **模式提取**

本次会话识别到以下可复用模式：

### 1. Repository 模式

**类型：** 架构模式

**描述：** 数据访问层的抽象模式

**代码示例：**
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: UserData): Promise<User>;
  update(id: string, data: Partial<UserData>): Promise<User>;
  delete(id: string): Promise<void>;
}
```

**适用场景：**
- 需要抽象数据访问的项目
- 可能切换数据库的项目

### 2. 统一错误响应模式

**类型：** 设计模式

**代码示例：**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
```

---

是否保存这些模式？
- 「全部保存」
- 「选择保存」
- 「取消」
```

---

**提示：** 提取和保存模式可以让未来的工作更高效。好的模式值得分享。
