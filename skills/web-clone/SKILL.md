# web-clone

> 网页克隆/还原技能 — 快速将设计稿或参考网站还原为高质量代码

## 触发词
`web-clone`, `clone this page`, `还原网页`, `网页克隆`, `clone`

## 概述

作为 web-clone specialist，将用户提供的设计稿截图、URL 参考或 Figma 链接快速还原为高质量的前端代码。目标是高保真还原 + 干净可维护的代码。

## 核心工作流程

### 阶段 1: 素材采集

**URL 参考分析（如提供）**
1. 使用 browser 工具访问目标 URL
2. 截图全页面（desktop + mobile）
3. 提取关键样式信息（颜色、字体、间距）
4. 分析布局结构（CSS Grid/Flexbox/Grid）

**设计稿截图分析**
1. 使用 images_understand 分析截图
2. 识别布局区块
3. 提取颜色值（#RRGGBB 格式）
4. 识别字体和图标
5. 判断响应式断点

**Figma 链接处理**
1. 提取 Figma 链接中的节点/frame ID
2. 分析设计系统 token
3. 导出关键资源

### 阶段 2: 架构设计

**选择技术栈**
```
- React + Tailwind CSS（推荐）
- Vue + UnoCSS
- 纯 HTML + CSS（简单页面）
- Next.js（需要 SEO 的页面）
```

**组件拆分**
将页面拆分为独立组件：
- Header / Navbar
- Hero Section
- Features / Cards
- Pricing
- Testimonials
- CTA
- Footer

### 阶段 3: 精确还原

**布局还原**
- 100% 还原设计稿的视觉结构
- 使用 CSS Grid/Flexbox 实现精确布局
- 响应式断点：375px / 768px / 1024px / 1440px

**样式还原**
- 使用 Tailwind CSS 的 JIT 模式精确匹配
- 自定义 CSS 变量处理设计 token
- 使用真实图标库（Lucide / Heroicons / Phosphor）

**交互还原**
- Hover / Active / Focus 状态
- 动画过渡效果
- 表单交互（验证、提交反馈）

### 阶段 4: 代码质量

**清洁代码标准**
- 组件文件 < 200 行
- 无内联样式（除非动态值）
- 有意义的类名/变量名
- Props 接口定义清晰

**性能优化**
- 图片懒加载
- 字体 display: swap
- CSS 压缩

## 执行命令

```bash
# 1. 分析参考页面
browser open --url https://example.com --profile openclaw
browser screenshot --full-page true

# 2. 分析截图
images_understand --file screenshot.png --prompt "分析布局结构、颜色、字体、组件"

# 3. 创建组件
# 使用 init_react_project 或手动创建

# 4. 验证还原度
browser open --url http://localhost:3000
# 对比截图和还原效果
```

## 输出标准

1. **视觉还原度 ≥ 95%**（主要元素完全一致）
2. **代码可读性** — 清洁、结构化
3. **响应式完整** — 至少支持 3 个断点
4. **交互完整** — 所有状态有对应样式

## 还原度自检清单

```
[ ] 布局还原
    - [ ] 页面结构一致
    - [ ] 间距比例正确
    - [ ] 容器宽度匹配

[ ] 样式还原
    - [ ] 颜色值匹配（误差 < 5%）
    - [ ] 字体系列匹配
    - [ ] 字体大小层级正确
    - [ ] 边框/圆角/阴影一致

[ ] 交互还原
    - [ ] Hover 效果存在
    - [ ] Focus 状态可见
    - [ ] 按钮点击反馈
    - [ ] 动画流畅

[ ] 响应式
    - [ ] 移动端布局正常
    - [ ] 平板布局合理
    - [ ] 桌面端最佳体验
```

## 限制
- 不复制版权内容（文字用占位符替代）
- 不使用未经授权的字体/CDN
- 保持代码原创性（避免直接复制源码）

## 使用示例

**场景 1: URL 还原**
```
用户: "帮我把这个页面克隆出来: https://stripe.com/pricing"
Agent: 访问页面 → 分析布局 → 生成组件 → 输出完整页面
```

**场景 2: 截图还原**
```
用户: [发送设计稿截图]
Agent: 分析截图 → 提取设计 token → 生成 React + Tailwind 代码
```

**场景 3: Figma 还原**
```
用户: "帮我还原这个 Figma: https://figma.com/file/xxx"
Agent: 解析链接 → 提取设计资源 → 生成代码
```
