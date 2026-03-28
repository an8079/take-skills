# performance-reviewer

> 性能专项审查技能 — 前端/后端性能问题识别、量化分析、优化建议

## 触发词
`perf`, `performance`, `性能审查`, `慢`, `优化`, `performance-review`

## 概述

作为 performance-reviewer，专注于识别和量化性能问题。涵盖前端渲染性能、后端 API 响应、数据库查询、内存使用、网络请求等维度。

## 核心审查维度

### 1. 前端性能

**渲染性能**
- 首屏加载时间（LCP < 2.5s）
- 首次内容绘制（FCP < 1.8s）
- 交互准备时间（TTI < 3.8s）
- 累计布局偏移（CLS < 0.1）
- 阻塞时间（TBT < 200ms）

**运行时性能**
- React/Vue 组件重渲染分析
- 虚拟滚动实现检查（大列表）
- 防抖/节流正确使用
- 动画性能（使用 transform/opacity）
- 内存泄漏检测（未清理的定时器/订阅）

**资源优化**
- 图片优化（格式、WebP、懒加载）
- 字体优化（字体子集、display:swap）
- CSS/JS 打包优化（code splitting）
- CDN 使用检查
- 缓存策略（强缓存/协商缓存）

### 2. 后端性能

**API 响应时间**
- P50/P95/P99 延迟
- 超时配置合理性
- 并发处理能力

**数据库性能**
- 索引使用情况
- N+1 查询问题
- 全表扫描检测
- 慢查询识别（>100ms）
- 查询复杂度分析

**缓存策略**
- Redis/Memcached 命中率
- 缓存穿透/击穿/雪崩风险
- 缓存一致性

### 3. 网络性能

**请求优化**
- 请求合并
- 请求取消（AbortableFetch）
- 预加载/预连接
- HTTP/2 或 HTTP/3 使用

**资源大小**
- 响应体大小（gzip 后 < 500KB）
- 大文件 CDN 化
- 图片压缩质量

## 性能审查检查清单

```
[ ] Core Web Vitals
    - [ ] LCP < 2.5s
    - [ ] FCP < 1.8s
    - [ ] TTI < 3.8s
    - [ ] CLS < 0.1
    - [ ] TBT < 200ms

[ ] 前端优化
    - [ ] 图片使用正确格式（WebP/AVIF）
    - [ ] 图片有懒加载
    - [ ] 字体子集化 + display:swap
    - [ ] JS/CSS code splitting
    - [ ] 无大型内联脚本
    - [ ] 第三方脚本异步加载

[ ] React/Vue 性能
    - [ ] 大列表使用虚拟滚动
    - [ ] useMemo/useCallback 合理使用
    - [ ] Context 避免频繁更新
    - [ ] 无内存泄漏（定时器/订阅清理）

[ ] 后端性能
    - [ ] 数据库有适当索引
    - [ ] 无 N+1 查询
    - [ ] 慢查询 < 100ms
    - [ ] 缓存命中率 > 80%（热点数据）
    - [ ] API 有超时限制

[ ] 网络优化
    - [ ] 静态资源使用 CDN
    - [ ] 开启 gzip/brotli
    - [ ] 有 HTTP/2 或 HTTP/3
    - [ ] 预连接关键域名
```

## 执行流程

### Step 1: 性能测量

**前端性能测量**
```bash
# Lighthouse CLI
npx lighthouse <url> --output=json --output-path=report.json

# WebPageTest（严重情况下）
# Chrome DevTools Protocol
```

**后端性能测量**
```bash
# 慢查询日志分析
# APM 工具（New Relic/Datadog/Sentry）
# 数据库 EXPLAIN 分析
```

### Step 2: 代码分析
- 读取关键文件（路由、组件、数据库查询）
- 识别明显性能问题
- 分析算法复杂度

### Step 3: 量化优先级

按性能影响排序：
```
P0: 阻塞首屏（用户直接看到）
P1: 影响核心功能（显著卡顿）
P2: 体验优化（轻微延迟）
P3: 未来优化（可以接受）
```

### Step 4: 输出报告
```markdown
## 性能审查报告

### 关键指标
| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| LCP | 4.2s | <2.5s | 🔴 |
| FCP | 2.1s | <1.8s | 🟡 |
| TTI | 5.8s | <3.8s | 🔴 |

### Top 性能问题
| 优先级 | 问题 | 影响 | 修复方案 |
|--------|------|------|----------|
| P0 | 图片无懒加载 | +1.8s LCP | 添加 loading="lazy" |
| P1 | N+1 查询 | 500ms+ | 使用 JOIN 或批量查询 |
```

## 量化标准

| 指标 | 优秀 | 合格 | 需优化 |
|------|------|------|--------|
| LCP | <1.5s | <2.5s | >2.5s |
| FCP | <1.0s | <1.8s | >1.8s |
| TTI | <2.5s | <3.8s | >3.8s |
| CLS | <0.05 | <0.1 | >0.1 |
| API P99 | <100ms | <300ms | >300ms |
| DB Query | <10ms | <100ms | >100ms |

## 优化建议原则

1. **先量化，后优化** — 每个问题有具体数据
2. **ROI 导向** — 高影响低成本优先
3. **避免过度优化** — 不要为了 5ms 投入 2 小时
4. **缓存优先** — 能用缓存解决的问题最简单

## 工具推荐

**前端:**
- Lighthouse / PageSpeed Insights
- Web Vitals Chrome Extension
- React DevTools Profiler
- Vue DevTools

**后端:**
- PostgreSQL: `EXPLAIN ANALYZE`
- MongoDB: `.explain()`
- Redis: `MONITOR` 命令
- APM: Sentry, Datadog, New Relic
