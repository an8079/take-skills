---
name: webapp-testing
description: Web 应用测试技能。单元测试、集成测试、E2E 测试。
tags: [testing, e2e, playwright]
---

# Web 应用测试技能

## When to Use This Skill

- 编写 Web 应用测试时
- 使用 Playwright/E2E 测试时
- 需要测试最佳实践时
- 用户说 `/test` 时

## Quick Reference

### 测试金字塔

```
        /\
       /  \      E2E 测试 (10%)
      /    \     - 真实用户场景
     /------\    - 关键路径验证
    /        \
   /__________\
   单元测试 (70%)   - 函数/类测试
                      - 边界情况
                      - 错误处理
```

### 测试类型

| 类型 | 框架 | 覆盖范围 | 目标覆盖率 |
|------|------|----------|-----------|
| 单元测试 | Jest/Vitest | 函数/类 | 80%+ |
| 集成测试 | Jest + Supertest | 模块间交互 | 关键路径 100% |
| E2E 测试 | Playwright/Cypress | 用户流程 | 核心功能 100% |

## Playwright E2E 测试

### 基础测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('应该显示登录表单', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('应该成功登录', async ({ page }) => {
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 等待跳转
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('应该显示错误信息', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=登录失败')).toBeVisible();
  });
});
```

### 页面对象模式

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent();
  }
}

// 使用
test('登录测试', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### 完整用户流程测试

```typescript
test.describe('购物车流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('应该完成从浏览到下单的完整流程', async ({ page }) => {
    // 1. 浏览商品
    await page.click('.product-card >> nth=0');
    await expect(page).toHaveURL(/\/products\/.+/);

    // 2. 添加到购物车
    await page.click('button:has-text("加入购物车")');
    await expect(page.locator('text=已加入购物车')).toBeVisible();

    // 3. 查看购物车
    await page.click('text=购物车');
    await page.waitForURL('/cart');
    await expect(page.locator('.cart-items')).toHaveCount(1);

    // 4. 创建订单
    await page.click('button:has-text("提交订单")');
    await page.waitForURL(/\/orders\/.+/);

    // 5. 确认订单创建成功
    await expect(page.locator('text=订单创建成功')).toBeVisible();
    const orderId = await page.locator('[data-order-id]').getAttribute('data-order-id');
    expect(orderId).toBeTruthy();
  });
});
```

### 测试数据管理

```typescript
import { test as setup } from '@playwright/test';

// 数据文件
const users = {
  valid: { email: 'user@example.com', password: 'password123' },
  invalidEmail: { email: 'invalid', password: 'password123' },
  invalidPassword: { email: 'user@example.com', password: 'wrong' },
};

// 使用 setup
setup('should登录成功', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', users.valid.email);
  await page.fill('input[name="password"]', users.valid.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

// 参数化测试
for (const [name, user] of Object.entries(users)) {
  test(`应该处理 ${name}用户`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');

    if (name === 'valid') {
      await expect(page).toHaveURL('/dashboard');
    } else {
      await expect(page.locator('[data-testid="error"]')).toBeVisible();
    }
  });
}
```

## 集成测试

### API 集成测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('API 集成测试', () => {
  test('应该创建用户', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });

  test('应该获取用户列表', async ({ request }) => {
    const response = await request.get('/api/users');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### 页面集成测试

```typescript
test.describe('搜索功能集成测试', () => {
  test('应该显示搜索结果', async ({ page }) => {
    await page.goto('/search');

    // 输入搜索关键词
    await page.fill('input[name="query"]', 'TypeScript');
    await page.keyboard.press('Enter');

    // 等待搜索结果加载
    await page.waitForSelector('.search-results', { timeout: 5000 });

    // 验证结果
    const results = page.locator('.search-result-item');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // 验证结果内容
    await expect(results.first()).toContainText('TypeScript');
  });
});
```

## 测试配置

### Playwright 配置

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 10000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## 测试最佳实践

### 1. 等待策略

```typescript
// ❌ 固定等待
await page.waitForTimeout(5000);

// ✅ 使用等待元素
await page.waitForSelector('.element');
await page.waitForLoadState('domcontentloaded');

// ✅ 使用等待状态
await page.waitForURL(/dashboard/);
await page.waitForFunction(() => window.someGlobal !== undefined);

// ✅ 使用等待网络请求
await page.waitForResponse('/api/data');
await page.waitForResponse(response => response.url().includes('/api/'));
```

### 2. 选择器策略

```typescript
// ✅ 优先使用 data-testid
await page.click('[data-testid="submit-button"]');

// ✅ 使用可访问的属性
await page.click('button:has-text("提交")');
await page.click('aria-label="关闭"]');

// ⚠️ 慎用 CSS 类（可能变化）
await page.click('.btn-primary');

// ❌ 避免使用结构化选择器
await page.click('div > div > button');
```

### 3. 测试隔离

```typescript
// 每个测试独立清理状态
test.afterEach(async ({ page }) => {
  // 清理登录状态
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

// 或使用独立的上下文
test.describe('独立测试套', () => {
  test.use({ storageState: 'state.json' });

  test('测试1', async ({ page }) => {
    // 测试代码
  });

  test('测试2', async ({ page }) => {
    // 测试代码
  });
});
```

### 4. 测试数据准备

```typescript
// 使用 setup 进行数据准备
test.beforeEach(async ({ page }) => {
  // 准备测试数据
  await page.evaluate(() => {
    window.testData = {
      user: { email: 'test@example.com', password: 'password123' },
      products: [...]
    };
  });
});

test('使用准备的数据', async ({ page }) => {
  const data = await page.evaluate(() => window.testData);
  // 使用 data.user...
});
```

## 常见测试场景

### 表单提交测试

```typescript
test('应该验证表单并提交', async ({ page }) => {
  await page.goto('/register');

  // 测试必填字段验证
  await page.click('button[type="submit"]');
  await expect(page.locator('text=邮箱是必填的')).toBeVisible();
  await expect(page.locator('text=密码是必填的')).toBeVisible();

  // 填写有效数据
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 验证成功提交
  await expect(page).toHaveURL('/dashboard');
});
```

### 错误处理测试

```typescript
test('应该优雅处理网络错误', async ({ page, context }) => {
  // 模拟网络失败
  await context.route('**/api/users', route => route.abort());

  await page.goto('/users');
  await page.click('button:has-text("加载用户")');

  // 验证错误提示
  await expect(page.locator('text=加载失败，请重试')).toBeVisible();
});

test('应该处理 API 错误', async ({ page }) => {
  await page.route('**/api/users', route => {
    return route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await page.goto('/users');
  await expect(page.locator('text=服务器错误')).toBeVisible();
});
```

### 响应式测试

```typescript
const devices = [
  { name: 'mobile', viewport: { width: 375, height: 667 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'desktop', viewport: { width: 1920, height: 1080 } },
];

for (const device of devices) {
  test(`应该在 ${device.name}上正确显示`, async ({ page }) => {
    await page.setViewportSize(device.viewport);
    await page.goto('/');

    if (device.name === 'mobile') {
      // 移动端行为
      await expect(page.locator('.mobile-menu')).toBeVisible();
    } else {
      // 桌面端行为
      await expect(page.locator('.desktop-menu')).toBeVisible();
    }
  });
}
```

## 测试运行命令

```bash
# 运行所有测试
npx playwright test

# 运行特定文件
npx playwright test tests/e2e/login.spec.ts

# 运行特定测试
npx playwright test -g "登录"

# 调试模式
npx playwright test --debug

# 查看测试报告
npx playwright show-report

# 运行特定项目
npx playwright test --project=mobile-chrome
```

## References

- [take-skills/skills/webapp-testing/SKILL.md](../take-skills/skills/webapp-testing/SKILL.md)
- [everything-claude-code/agents/e2e-runner.md](../everything-claude-code/agents/e2e-runner.md)

## Maintenance

- 来源：基于两个项目的 E2E 测试经验
- 最后更新：2026-01-24
