---
name: smart-skill-selector
description: 智能技能推荐系统。根据项目上下文、技术栈、当前阶段自动推荐最合适的 Skills，大幅提升开发效率。
tags: [skill, intelligence, recommendation, context]
---

# 智能技能推荐系统

## 目标

让 AI 能够根据当前上下文**自动**推荐最合适的 Skills，无需用户手动指定。

## 智能推荐机制

### 1. 上下文感知层

**每个 Skill 推荐都应该基于以下上下文：**

| 上下文维度 | 优先级 | 来源 |
|-----------|--------|------|
| 项目类型 | 高 | memory-bank/项目进展.md |
| 技术栈 | 高 | 规格文档 / package.json / requirements.txt |
| 当前阶段 | 高 | memory-bank/项目进展.md |
| 当前任务 | 中 | memory-bank/当前任务.md |
| 用户意图 | 中 | 当前对话 |
| 历史偏好 | 低 | memory-bank/学习记录.md |

### 2. 智能推荐流程

```
用户输入 → 上下文采集 → 特征匹配 → Skill 推荐 → 展示理由
                                    ↓
                              自动激活（可选）
```

### 3. 推荐策略

#### 策略一：基于项目类型

```
项目类型 = "Web应用"
    → 推荐: frontend-patterns, backend-patterns, api-design
    
项目类型 = "数据处理"
    → 推荐: preprocessing-data, database-design, etl
    
项目类型 = "AI/ML"
    → 推荐: ml-pipeline, model-training, vector-search
```

#### 策略二：基于技术栈

```
检测到技术栈包含 "React"
    → 推荐: nextjs, frontend-design, webapp-testing
    
检测到技术栈包含 "FastAPI"
    → 推荐: fastapi-backend, api-design
    
检测到技术栈包含 "PostgreSQL"
    → 推荐: database-design, sql-optimization
```

#### 策略三：基于当前阶段

```
阶段 = "编码实现"
    → 根据任务类型推荐 Skills
    
阶段 = "测试验证"
    → 自动加载: tdd-workflow, webapp-testing
    
阶段 = "代码审查"
    → 自动加载: code-review, security-review
```

#### 策略四：基于任务特征

```
任务包含 "登录" "认证" "JWT"
    → 推荐: security-review, auth-patterns
    
任务包含 "数据库" "模型" "CRUD"
    → 推荐: database-design, orm-patterns
    
任务包含 "API" "接口" "REST"
    → 推荐: api-design, graphql
```

### 4. 推荐优先级

当有多个 Skills 可用时，优先级排序：

```
1. 当前阶段强制需要 (必须)
2. 技术栈匹配 (高优先级)
3. 任务特征匹配 (中优先级)
4. 历史使用偏好 (低优先级)
5. 用户明确指定 (最高优先级)
```

## Skill 推荐矩阵

### 按项目类型

| 项目类型 | 核心 Skills | 辅助 Skills |
|----------|------------|-------------|
| Web 全栈 | frontend-patterns, backend-patterns, api-design | security-review, performance-tuning |
| 后端服务 | fastapi-backend, database-design | api-design, docker |
| 前端应用 | nextjs, frontend-design, frontend-patterns | webapp-testing, performance-tuning |
| 数据处理 | preprocessing-data, database-design, etl | vector-search, ray-data |
| AI/ML 应用 | langchain-arch, embedding-generation | nlp-pipeline, computer-vision |
| API 服务 | api-design, fastapi-backend | graphql, security-review |
| 移动端 | react-native, mobile-patterns | webapp-testing |
| 区块链 | smart-contract, web3-patterns | security-review |

### 按技术栈

| 技术栈 | 推荐 Skills |
|--------|------------|
| React | frontend-patterns, nextjs, webapp-testing |
| Vue | vue-patterns, frontend-design |
| Angular | angular-patterns, typescript |
| Node.js | backend-patterns, express-patterns |
| Python | fastapi-backend, python-patterns |
| Go | go-patterns, microservices |
| Java | java-spring, spring-boot |
| Rust | rust-patterns, systems-programming |
| PostgreSQL | database-design, postgresql-optimization |
| MongoDB | database-design, mongodb-patterns |
| Redis | caching-patterns, performance-tuning |
| Docker | devops-delivery, kubernetes |
| Kubernetes | kubernetes, container-orchestration |

### 按任务类型

| 任务类型 | 推荐 Skills |
|----------|------------|
| 新功能开发 | tdd-workflow, code-review |
| Bug 修复 | error-recovery, debug-helper |
| 性能优化 | performance-tuning, profiling |
| 安全加固 | security-review, auth-patterns |
| API 设计 | api-design, graphql |
| 数据库设计 | database-design, orm-patterns |
| 测试编写 | tdd-workflow, webapp-testing |
| 代码重构 | refactoring, code-review |
| 文档编写 | doc-writing, api-documentation |
| 部署上线 | devops-delivery, kubernetes |

### 按阶段

| 阶段 | 自动推荐 Skills |
|------|----------------|
| 需求访谈 | requirement-analysis |
| 规格设计 | spec-writing, api-design |
| 实现计划 | tdd-workflow |
| 编码实现 | 根据任务动态推荐 |
| 测试验证 | tdd-workflow, webapp-testing |
| 代码审查 | code-review, security-review |
| 打包交付 | devops-delivery, kubernetes |
| 迭代优化 | performance-tuning |

## 实现示例

### 示例一：用户说"帮我做个登录功能"

**上下文采集：**
```
项目类型: Web应用
技术栈: React + FastAPI + PostgreSQL
当前实现
当前阶段: 编码任务: T-05 用户认证模块
```

**智能推荐：**
```
1. security-review (必须) - 涉及安全
2. api-design (高优先级) - 需要设计认证 API
3. backend-patterns (中优先级) - 后端实现
4. frontend-patterns (中优先级) - 前端登录页
```

**展示给用户：**
```
💡 根据当前上下文，推荐以下 Skills：

| Skill | 原因 |
|-------|------|
| security-review | 登录涉及安全认证 |
| api-design | 需要设计认证 API |
| frontend-patterns | React 前端登录页 |

是否需要我自动激活这些 Skills？
```

### 示例二：用户说"优化数据库查询性能"

**上下文采集：**
```
项目类型: Web应用
技术栈: PostgreSQL + FastAPI
当前阶段: 性能优化
```

**智能推荐：**
```
1. database-design - 数据库优化
2. performance-tuning - 性能调优
3. sql-optimization - SQL 优化
```

## 自动激活规则

### 完全自动激活（无需确认）

当满足以下条件时，Skills 自动激活：

| 条件 | 激活的 Skill |
|------|--------------|
| 遇到任何错误 | error-recovery |
| 对话超过 20 轮 | context-manager |
| 任务完成 | reflection |
| 代码保存后 | auto-critique |
| 会话开始 | progress-tracking |

### 建议后激活（需要确认）

当满足以下条件时，建议激活：

| 条件 | 推荐的 Skill | 确认方式 |
|------|-------------|----------|
| 技术栈包含 React | frontend-patterns | 建议 |
| 技术栈包含 FastAPI | fastapi-backend | 建议 |
| 任务涉及数据库 | database-design | 建议 |
| 进入测试阶段 | tdd-workflow | 建议 |
| 进入审查阶段 | code-review | 建议 |

### 用户偏好学习

系统会学习用户的偏好：

```
记忆用户偏好：
- 如果用户经常说"不用"某个 Skill，降低推荐优先级
- 如果用户经常手动启用某个 Skill，提高推荐优先级
- 用户的项目类型偏好
- 用户的技术栈偏好
```

## 推荐输出格式

### 简洁模式

```
💡 推荐: frontend-patterns, api-design
```

### 详细模式

```
💡 **智能推荐**

基于分析：
- 项目类型: Web 全栈
- 技术栈: React + FastAPI
- 当前任务: 用户认证模块

推荐 Skills：
| Skill | 原因 | 优先级 |
|-------|------|--------|
| security-review | 涉及安全认证 | 必须 |
| api-design | 设计认证 API | 高 |
| frontend-patterns | React 登录页 | 中 |

[自动激活] 或 [手动选择]
```

## 检查清单

每次需要推荐 Skill 时，执行以下检查：

```
□ 1. 采集上下文
   - 读取 memory-bank/项目进展.md
   - 读取当前任务
   - 分析用户输入

□ 2. 特征匹配
   - 项目类型匹配
   - 技术栈匹配
   - 阶段匹配

□ 3. 生成推荐
   - 按优先级排序
   - 给出推荐理由

□ 4. 展示和激活
   - 简洁展示
   - 提供激活选项
```

## 与其他 Skills 的关系

- **progress-tracking**: 提供上下文（项目阶段、任务）
- **continuous-learning**: 学习用户偏好
- **error-recovery**: 错误时自动触发
- **context-manager**: 上下文过多时触发

## 注意事项

1. **不要过度推荐** - 最多 3-5 个 Skills
2. **给出理由** - 让用户知道为什么推荐
3. **尊重选择** - 用户可以拒绝推荐
4. **记住偏好** - 学习用户的使用习惯
5. **动态调整** - 根据项目进展调整推荐
