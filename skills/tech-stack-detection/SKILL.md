---
name: tech-stack-detection
description: >-
  Technical stack auto-detection specialist that analyzes project
  requirements and recommends optimal technology choices. Provides
  configuration generation, project structure creation, and skill
  recommendations based on industry best practices.
allowed-tools: Read, Write, Bash, Task, WebSearch
---
# Tech Stack Auto-Detection - 技术栈自动检测专家

> **版本：** v1.0.0 | **优先级：** P0
> **目标：** 根据项目需求自动推荐和配置技术栈

---

## 触发条件

| 场景 | 触发模式 | 动作 |
|------|----------|------|
| 用户创建新项目 | 检测"创建新项目"、"初始化项目"关键词 | 自动启动检测 |
| 访谈完成后 | 在规格设计阶段开始前 | 提示用户是否需要技术栈建议 |
| 用户询问 | 检测"用什么技术"、"技术栈"、"framework"等关键词 | 提供技术栈推荐 |
| 技术选型阶段 | 在设计规格文档时 | 提供行业技术栈参考 |

---

## 核心能力

### 1. 项目类型识别

自动识别项目类型并匹配推荐技术栈：

```javascript
const PROJECT_PATTERNS = {
  'web-app': {
    keywords: ['网站', 'web', '前端', '网页', '官网', 'landing', 'static'],
    recommend: {
      frontend: ['Next.js', 'React', 'Vue', 'SvelteKit'],
      css: ['Tailwind CSS', 'CSS Modules', 'Sass'],
      hosting: ['Vercel', 'Netlify', 'Cloudflare Pages']
    }
  },
  'ecommerce': {
    keywords: ['电商', '商城', '购物', '支付', '订单', '店铺', 'store'],
    recommend: {
      frontend: ['Next.js', 'Shopify', 'WooCommerce'],
      backend: ['Node.js', 'PHP', 'Java'],
      database: ['PostgreSQL', 'MySQL'],
      payment: ['Stripe', 'PayPal', '支付宝']
    }
  },
  'saas': {
    keywords: ['saas', '平台', '服务', '订阅', 'b2b', '企业服务'],
    recommend: {
      frontend: ['React', 'Vue'],
      backend: ['Node.js', 'Go', 'Java'],
      database: ['PostgreSQL', 'MongoDB'],
      auth: ['OAuth', 'SSO', 'JWT']
    }
  },
  'api': {
    keywords: ['api', '接口', 'backend', '服务端', '数据服务', '微服务'],
    recommend: {
      backend: ['Node.js', 'Python/FastAPI', 'Go', 'Java/Spring'],
      database: ['PostgreSQL', 'MongoDB', 'Redis'],
      apiSpec: ['OpenAPI', 'GraphQL']
    }
  },
  'mobile': {
    keywords: ['app', '移动端', 'ios', 'android', 'react native', 'flutter'],
    recommend: {
      framework: ['React Native', 'Flutter', 'Ionic'],
      backend: ['Node.js', 'Python'],
      database: ['PostgreSQL', 'MongoDB']
    }
  },
  'dashboard': {
    keywords: ['管理后台', 'dashboard', 'admin', 'cms', '内容管理系统'],
    recommend: {
      frontend: ['Next.js', 'Vue', 'Ant Design'],
      backend: ['Node.js', 'PHP/Laravel'],
      database: ['MySQL', 'PostgreSQL']
    }
  },
  'data-analysis': {
    keywords: ['数据', '分析', '报表', '图表', '可视化', 'bi'],
    recommend: {
      frontend: ['React', 'Vue'],
      backend: ['Python/Flask', 'Node.js'],
      database: ['PostgreSQL', 'MongoDB', 'ClickHouse'],
      visualization: ['D3.js', 'Chart.js', 'ECharts']
    }
  },
  'ai': {
    keywords: ['ai', '人工智能', '机器学习', 'nlp', 'llm', '智能'],
    recommend: {
      backend: ['Python', 'Node.js'],
      database: ['PostgreSQL', 'Qdrant', 'Vector DB'],
      ai: ['OpenAI API', 'Anthropic', 'Hugging Face']
    }
  }
};
```

**识别流程：**
1. 分析用户描述中的关键词
2. 匹配到项目类型模式
3. 返回推荐技术栈
4. 询问用户偏好（如果有）

### 2. 技术栈推荐

基于项目类型和用户偏好推荐技术栈：

```javascript
// 技术栈评分系统
const TECH_SCORES = {
  'frontend': {
    'Next.js': { trend: 95, ecosystem: 90, performance: 85, learning: 70 },
    'React': { trend: 90, ecosystem: 95, performance: 80, learning: 85 },
    'Vue': { trend: 85, ecosystem: 80, performance: 85, learning: 90 },
    'Svelte': { trend: 80, ecosystem: 70, performance: 95, learning: 95 }
  },
  'backend': {
    'Node.js': { trend: 90, ecosystem: 95, performance: 85, learning: 90 },
    'Python/FastAPI': { trend: 88, ecosystem: 85, performance: 80, learning: 75 },
    'Go': { trend: 85, ecosystem: 75, performance: 95, learning: 80 },
    'Java/Spring': { trend: 80, ecosystem: 90, performance: 85, learning: 60 }
  },
  'database': {
    'PostgreSQL': { trend: 90, ecosystem: 95, features: 95, performance: 80 },
    'MySQL': { trend: 85, ecosystem: 95, features: 85, performance: 85 },
    'MongoDB': { trend: 80, ecosystem: 90, features: 75, performance: 90 },
    'Redis': { trend: 88, ecosystem: 90, features: 70, performance: 98 }
  }
};
```

**推荐逻辑：**
1. 根据项目类型匹配推荐集
2. 按综合评分排序（趋势+生态+性能）
3. 提供多个选项供用户选择
4. 考虑团队技能（如果有）

### 3. 自动配置

自动生成配置文件：

```json
// package.json (Node.js)
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "项目描述",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@radix-ui/react": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@types/node": "^20.0.0"
  }
}
```

```python
# requirements.txt (Python)
fastapi==0.104.0
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.0
pytest==7.4.0
```

### 4. Skills 推荐

推荐相关的 Skills 给用户：

| 项目类型 | 推荐 Skills |
|---------|------------|
| Next.js 项目 | nextjs, frontend-patterns, frontend-design |
| React 项目 | frontend-patterns, frontend-design |
| Python/FastAPI | fastapi-backend, backend-patterns |
| 数据库设计 | database-design |
| API 开发 | api-design, graphql |
| 机器学习 | embedding-generation, nlp-pipeline |
| 容器化 | kubernetes, devops-delivery |

---

## 工作流程

### 阶段一：项目分析

```
用户描述 → 关键词提取 → 项目类型识别 → 需求推断
```

**分析维度：**
- 项目规模（小型/中型/大型）
- 用户类型（个人/团队/企业）
- 性能要求（低/中/高）
- 维护周期（短期/长期）
- 团队技能（如果有）

### 阶段二：技术栈推荐

```
项目类型 → 匹配推荐集 → 评分排序 → 生成推荐方案
```

**推荐结构：**
1. **主推荐方案** - 最佳平衡
2. **备选方案1** - 性能优先
3. **备选方案2** - 学习曲线友好
4. **备选方案3** - 企业级

### 阶段三：配置生成

```
技术栈选择 → 生成配置文件 → 创建目录结构 → 初始化依赖
```

**生成文件：**
- `package.json` / `requirements.txt`
- `tsconfig.json` / `pyproject.toml`
- `.env.example`
- `Dockerfile`
- `docker-compose.yml`
- `.gitignore`
- `README.md`

### 阶段四：Skills 集成

```
项目特征 → 匹配 Skills → 生成使用建议 → 更新 CLAUDE.md
```

---

## 输出格式

### 技术栈推荐报告

```markdown
# 技术栈推荐报告

> **分析时间：** 2026-02-28
> **项目描述：** [你的产品想法]
> **识别类型：** [项目类型]

---

## 项目分析

### 识别的特征
| 特征 | 识别结果 | 置信度 |
|------|----------|--------|
| 项目类型 | Web 应用 | 高 |
| 规模 | 中型 | 中 |
| 用户群体 | B2C | 高 |
| 核心功能 | 用户注册、内容管理 | 高 |

### 需求推断
| 需求 | 优先级 | 实现难度 |
|------|--------|----------|
| 用户认证 | P0 | 中 |
| 内容管理 | P0 | 中 |
| 数据持久化 | P0 | 低 |
| 响应式设计 | P1 | 低 |

---

## 推荐方案

### 🌟 方案一：主推荐（最佳平衡）

**适合：** 快速开发、中小型项目、团队技能未知

#### 技术栈
| 层 | 技术 | 理由 |
|----|------|------|
| 前端 | Next.js 14 + React 18 | SSR/SEO 支持，生态成熟 |
| UI | Tailwind CSS + shadcn/ui | 快速开发，设计系统化 |
| 后端 | Node.js + Express | 同语言栈，学习成本低 |
| 数据库 | PostgreSQL + Prisma ORM | 类型安全，关系型 |
| 认证 | NextAuth.js | 开箱即用 |
| 部署 | Vercel | 一键部署，免费层充足 |

#### 优势
- ✅ 全栈 JavaScript/TypeScript，降低学习成本
- ✅ Next.js 提供完整的 SSR/SEO 解决方案
- ✅ Tailwind CSS + shadcn/ui 开发效率极高
-   ✅ PostgreSQL 适合关系型数据，Prisma 提供类型安全
- ✅ Vercel 部署简单，支持预览环境

#### 劣势
- ⚠️ Node.js 单线程，CPU 密集型任务需优化
- ⚠️ Prisma 学习曲线陡峭
- ⚠️ Vercel 免费层功能有限

#### 预期开发周期
- MVP: 2-3 周
- 完整功能: 4-6 周

---

### 🚀 方案二：性能优先

**适合：** 高流量场景、实时性要求

#### 技术栈
| 层 | 技术 | 理由 |
|----|------|------|
| 前端 | SvelteKit | 编译时优化，性能最佳 |
| 后端 | Go + Gin | 高性能，并发能力强 |
| 数据库 | PostgreSQL + Redis | 缓存层 |
| 部署 | Docker + Kubernetes | 可扩展 |

#### 优势
- ✅ SvelteKit 性能优异，包体小
- ✅ Go 性能出色，适合高并发
- ✅ Redis 提供缓存支持

#### 劣势
- ⚠️ SvelteKit 生态相对较新
- ⚠️ Go 学习曲线较陡
- ⚠️ Kubernetes 运维复杂

#### 预期开发周期
- MVP: 3-4 周
- 完整功能: 6-8 周

---

### 📚 方案三：学习曲线友好

**适合：** 个人开发者、快速原型

#### 技术栈
| 层 | 技术 | 理由 |
|----|------|------|
| 前端 | Vue 3 | 学习曲线平缓 |
| UI | Element Plus | 开箱即用组件 |
| 后端 | Python/FastAPI | 代码简洁，上手快 |
| 数据库 | SQLite | 无需额外配置 |
| 部署 | Railway / Render | 简单部署 |

#### 优势
- ✅ Vue 文档友好，社区活跃
- ✅ FastAPI 代码清晰，自动生成文档
- ✅ SQLite 零配置，适合小型项目

#### 劣势
- ⚠️ SQLite 不适合高并发
- ⚠️ Railway/Railway 功能有限

#### 预期开发周期
- MVP: 1-2 周
- 完整功能: 3-4 周

---

## 相关 Skills 推荐

基于你的项目，推荐以下 Skills：

### 必学 Skills

1. **nextjs** - Next.js 开发最佳实践
   - 学习 Next.js 项目结构
   - 理解 SSR/ISR/SSR
   - 配置路由和中间件

2. **frontend-patterns** - 前端开发模式
   - 状态管理最佳实践
   - 组件化设计
   - 性能优化技巧

3. **database-design** - 数据库设计
   - 数据建模方法
   - 索引优化策略
   - 数据迁移管理

### 可选 Skills

- **api-design** - API 设计（如需开发 API）
- **devops-delivery** - 应用交付（如需配置部署）
- **security-review** - 安全审查（生产环境必备）

---

## 下一步

### 方案确认

请选择一个推荐方案：

1. **方案一（主推荐）** - 最佳平衡，推荐
2. **方案二（性能优先）** - 高如性能场景
3. **方案三（学习友好）** - 快速上手
4. **自定义** - 我想自己组合技术栈

确认后，我将：
1. 生成完整的项目结构
2. 创建所有配置文件
3. 初始化项目依赖
4. 设置开发环境

### 可选调整

如果你想调整推荐方案，可以：

**前端偏好：**
- [ ] 优先考虑性能
- [ ] 优先考虑学习曲线
- [ ] 优先考虑生态成熟度
- [ ] 需要移动端支持

**后端偏好：**
- [ ] 同语言栈（JS/TS）
- [ ] Python 优先
- [ ] Go/Rust 等高性能语言
- [ ] Java 企业级方案

**数据库偏好：**
- [ ] SQL（关系型）
- [ ] NoSQL（文档型）
- [ ] 需要全文搜索
- [ ] 需要 Redis 缓存

**部署偏好：**
- [ ] Serverless（无服务器）
- [ ] Docker 容器化
- [ ] Kubernetes 集群
- [ ] 传统 VPS

---

## 技术决策记录

确认方案后，将记录到 `memory-bank/技术决策.md`：

| 决策 | 选择 | 备选 | 选择原因 | 日期 |
|------|------|------|----------|------|
| 前端框架 | Next.js | React, Vue | SSR 支持，生态成熟 | 2026-02-28 |
| 后端框架 | Node.js | Python, Go | 同语言栈，降低成本 | 2026-02-28 |
| 数据库 | PostgreSQL | MySQL, MongoDB | ACID 支持，类型安全 | 2026-02-28 |
| ORM | Prisma | TypeORM, Sequelize | 类型安全，自动迁移 | 2026-02-28 |
| 部署方案 | Vercel | AWS, Railway | 简单部署，免费层充足 | 2026-02-28 |

---

*此报告由 Tech Stack Auto-Detection Skill 生成*
```

---

## 记忆更新

分析完成后，更新记忆系统：

### memory-bank/技术决策.md

```markdown
## 技术选型

| 技术领域 | 选择 | 备选方案 | 选择原因 | 决策日期 |
|---------|------|----------|----------|----------|
| 前端框架 | [技术] | [备选] | [理由] | 2026-02-28 |
| 后端框架 | [技术] | [备选] | [理由] | 2026-02-28 |
| 数据库 | [技术] | [备选] | [理由] | 2026-02-28 |
| 部署方案 | [技术] | [备选] | [理由] | 2026-02-28 |
```

### memory-bank/项目进展.md

```markdown
### 技术选型完成

**技术栈：** [列表]
**配置状态：** 已生成
**Skills 推荐：** [列表]
```

---

## 注意事项

1. **团队技能** - 考虑团队现有技能，避免新技术带来的学习成本
2. **项目周期** - 短期项目优先稳定技术，长期项目可尝试新技术
3. **维护成本** - 考虑长期维护的复杂度和成本
4. **社区支持** - 优先选择社区活跃、文档完善的技术
5. **扩展性** - 为未来增长预留技术扩展空间

---

**记住：** 技术栈选择不是一成不变的，要根据实际项目需求和团队情况灵活调整。本 Skill 的目标是提供基于行业最佳实践的推荐，帮助做出更好的决策。
