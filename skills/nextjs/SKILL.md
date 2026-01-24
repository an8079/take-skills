---
name: nextjs
description: Next.js 全栈框架开发技能。App Router、SSR、Server Actions、路由等。
tags: [nextjs, react, fullstack]
---

# Next.js 开发技能

## When to Use This Skill

- 使用 Next.js 开发应用时
- 实现服务端渲染时
- 使用 Server Actions 时
- 配置 Next.js 路由时

## Quick Reference

### 核心概念

| 概念 | 说明 | 文件位置 |
|------|------|----------|
| App Router | 新路由系统 | app/ |
| Server Actions | 服务端操作 | *.tsx |
| Server Components | 服务端组件 | *.tsx |
| Client Components | 客户端组件 | 'use client' |
| Middleware | 中间件 | middleware.ts |
| Config | 配置文件 | next.config.js |

## 项目结构

### App Router 结构

```
myapp/
├── app/
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                  # 首页
│   ├── loading.tsx               # 加载状态
│   ├── error.tsx                 # 错误边界
│   ├── not-found.tsx             # 404 页面
│   ├── globals.css               # 全局样式
│   ├── api/                     # API 路由
│   │   └── users/
│   │       └── route.ts
│   ├── (auth)/                  # 路由组
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── users/
│       ├── page.tsx
│       └── [id]/               # 动态路由
│           └── page.tsx
├── components/                   # 共享组件
│   ├── ui/                      # UI 组件
│   ├── layout/                  # 布局组件
│   └── features/               # 功能组件
├── lib/                        # 工具库
│   ├── db.ts                   # 数据库配置
│   ├── auth.ts                 # 认证配置
│   └── utils.ts                # 工具函数
├── public/                     # 静态资源
├── types/                      # TypeScript 类型
├── middleware.ts               # 中间件
└── next.config.js             # Next.js 配置
```

## 布局和页面

### 根布局

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My App',
  description: 'A Next.js application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

### 嵌套布局

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}
```

### 基本页面

```tsx
// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
      <Link href="/dashboard">
        Go to Dashboard
      </Link>
    </div>
  );
}
```

### 动态路由

```tsx
// app/users/[id]/page.tsx
interface Params {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Params) {
  return {
    title: `User ${params.id}`,
  };
}

async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

export default async function UserPage({ params }: Params) {
  const user = await getUser(params.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Server Components

### 默认为 Server Components

```tsx
// app/products/page.tsx
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }, // ISR 缓存 1 小时
  });
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border p-4">
          <h2>{product.name}</h2>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

## Client Components

### 使用 'use client'

```tsx
// components/ui/Button.tsx
'use client';

import { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${
        variant === 'primary'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-800'
      } ${isPressed ? 'opacity-75' : ''}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </button>
  );
}
```

### 交互式组件

```tsx
// app/counter/page.tsx
'use client';

import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  );
}
```

## Server Actions

### 基本 Action

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

export async function createUser(formData: FormData) {
  const validated = schema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  // 数据库操作
  await db.user.create({
    data: validated,
  });

  // 重新验证缓存
  revalidatePath('/users');
}

export async function deleteUser(id: string) {
  await db.user.delete({
    where: { id },
  });

  revalidatePath('/users');
}
```

### 在表单中使用

```tsx
// app/users/create/page.tsx
import { createUser } from '../../actions';

export default function CreateUserPage() {
  return (
    <form action={createUser}>
      <input
        name="name"
        type="text"
        placeholder="Name"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
      />
      <button type="submit">Create User</button>
    </form>
  );
}
```

### 带错误处理的 Action

```tsx
// app/actions.ts
'use server';

export async function createUserWithValidation(
  prevState: { error?: string },
  formData: FormData
) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (name.length < 3) {
      return { error: 'Name must be at least 3 characters' };
    }

    await db.user.create({ data: { name, email } });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to create user' };
  }
}
```

```tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

export default function CreateUserForm() {
  const [state, formAction] = useFormState(createUserWithValidation, {});

  return (
    <form action={formAction}>
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      {state.error && <p className="text-red-500">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
```

## API Routes

### Route Handler

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  const users = await db.user.findMany({
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = schema.parse(body);

  const user = await db.user.create({
    data: validated,
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const user = await db.user.update({
    where: { id: body.id },
    data: body,
  });

  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  await db.user.delete({
    where: { id: id as string },
  });

  return NextResponse.json({ success: true });
}
```

### 动态 API Route

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
```

## 数据获取

### 使用 fetch

```tsx
// app/products/page.tsx
async function getProducts() {
  // 缓存策略
  const res = await fetch('https://api.example.com/products', {
    // force-cache: 强制使用缓存
    // no-store: 不缓存
    // revalidate: 缓存并重新验证
    next: {
      revalidate: 60, // 60 秒后重新验证
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      {products.map((p: any) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
```

### 并行数据获取

```tsx
export default async function DashboardPage() {
  const [user, posts, stats] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchStats(),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <StatsPanel stats={stats} />
    </div>
  );
}
```

## 认证

### 使用 NextAuth.js

```tsx
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = await authenticateUser(
          credentials?.email,
          credentials?.password
        );
        return user;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
```

```tsx
// components/providers/session-provider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## 中间件

### 基本中间件

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // 检查认证
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 添加请求头
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'custom-value');

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 错误处理

### 错误页面

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-red-500">{error.message}</p>
        <button onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
```

### 404 页面

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-6xl font-bold">404</h2>
        <p className="text-xl">Page not found</p>
        <Link href="/" className="text-blue-500">
          Go back home
        </Link>
      </div>
    </div>
  );
}
```

### 加载状态

```tsx
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}
```

## 元数据

### 静态元数据

```tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about our company',
    images: ['/og-image.jpg'],
  },
};

export default function AboutPage() {
  return <div>About content</div>;
}
```

### 动态元数据

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}
```

## 最佳实践

1. **默认使用 Server Components** - 只在需要交互时使用 Client Components
2. **正确设置缓存** - 使用 revalidate 而非完全禁用缓存
3. **使用 Server Actions** - 替代传统的 API 路由进行表单处理
4. **优化图片** - 使用 next/image 组件
5. **使用 TypeScript** - 充分利用类型检查
6. **按路由分组** - 使用路由组组织代码
7. **正确设置布局** - 利用嵌套布局避免重复代码
8. **错误边界** - 为不同区域设置错误边界

## 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [App Router 文档](https://nextjs.org/docs/app)
- [Server Actions 文档](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
