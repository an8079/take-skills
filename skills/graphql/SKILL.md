---
name: graphql
description: GraphQL API 开发技能。Schema 设计、查询、变更、订阅等。
tags: [graphql, api, typescript]
---

# GraphQL 开发技能

## When to Use This Skill

- 设计 GraphQL Schema 时
- 编写 GraphQL Resolvers 时
- 优化 GraphQL 查询性能时
- 实现 GraphQL 订阅时

## Quick Reference

### 基本概念

| 概念 | 说明 | 示例 |
|------|------|------|
| Query | 查询操作 | `getUser(id: ID!)` |
| Mutation | 变更操作 | `createUser(input: UserInput!)` |
| Subscription | 订阅操作 | `onUserCreated` |
| Type | 类型定义 | `type User` |
| Input | 输入类型 | `input UserInput` |
| Interface | 接口 | `interface Node` |
| Union | 联合类型 | `union SearchResult = User \| Post` |
| Scalar | 标量 | `scalar Date` |

## Schema 设计

### 基本 Schema

```graphql
# schema.graphql
type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  posts(limit: Int, offset: Int): [Post!]!
}

type Mutation {
  createUser(input: UserInput!): User!
  updateUser(id: ID!, input: UserInput!): User!
  deleteUser(id: ID!): Boolean!
}

type Subscription {
  userCreated: User!
}

type User implements Node {
  id: ID!
  email: String!
  name: String!
  posts(limit: Int): [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  createdAt: DateTime!
}

input UserInput {
  email: String!
  name: String!
}

interface Node {
  id: ID!
}

scalar DateTime
```

### 最佳实践

```graphql
# ✅ 好的 Schema 设计
type Query {
  # 单个资源查询，返回类型可能为 null
  user(id: ID!): User

  # 列表查询，返回数组，非空
  users(filter: UserFilter, sort: SortInput): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

input UserFilter {
  search: String
  status: UserStatus
  createdAfter: DateTime
  createdBefore: DateTime
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}
```

## Resolver 实现

### 基础 Resolver

```typescript
// resolvers.ts
import { GraphQLContext } from './context';

export const resolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return context.prisma.user.findUnique({ where: { id } });
    },

    users: async (_: any, args: any, context: GraphQLContext) => {
      const { filter, sort } = args;
      return context.prisma.user.findMany({
        where: buildFilter(filter),
        orderBy: buildSort(sort),
      });
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      return context.prisma.user.create({
        data: input,
      });
    },
  },

  User: {
    posts: async (user: any, args: any, context: GraphQLContext) => {
      return context.prisma.post.findMany({
        where: { authorId: user.id },
        take: args.limit,
      });
    },
  },
};
```

### 订阅 Resolver

```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const resolvers = {
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator(['USER_CREATED']),
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      const user = await context.prisma.user.create({ data: input });
      pubsub.publish('USER_CREATED', { userCreated: user });
      return user;
    },
  },
};
```

## 查询示例

### 基础查询

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    createdAt
  }
}
```

### 嵌套查询

```graphql
query GetPostWithAuthor($id: ID!) {
  post(id: $id) {
    id
    title
    content
    author {
      id
      name
      avatar
    }
  }
}
```

### 别名和片段

```graphql
query GetUsersAndPosts {
  users: users(limit: 10) {
    ...UserFields
  }

  posts: posts(limit: 10) {
    id
    title
    author {
      ...UserFields
    }
  }
}

fragment UserFields on User {
  id
  name
  email
  avatar
}
```

### 分页查询

```graphql
query GetUsers($first: Int, $after: String) {
  users(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        name
        email
      }
    }
    pageInfo {
      hasNextPage
      endCursor
      totalCount
    }
  }
}
```

## 变更示例

### 创建资源

```graphql
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}

# 变量
{
  "input": {
    "email": "user@example.com",
    "name": "Test User"
  }
}
```

### 批量变更

```graphql
mutation UpdateUsers($ids: [ID!]!, $input: UserInput!) {
  updateUsers(ids: $ids, input: $input) {
    id
    name
  }
}
```

## 性能优化

### DataLoader 解决 N+1 问题

```typescript
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (ids: readonly string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
  });
  return ids.map((id) => users.find((u) => u.id === id));
});

export const resolvers = {
  Post: {
    author: async (post: any) => {
      return userLoader.load(post.authorId);
    },
  },
};
```

### 查询复杂度分析

```typescript
import { graphql } from 'graphql';

const complexity = (field: any, args: any) => {
  // 根据字段类型和参数计算复杂度
  if (field.name === 'users') {
    return args.first || 10;
  }
  return 1;
};

// 在执行查询前验证复杂度
if (totalComplexity > MAX_COMPLEXITY) {
  throw new Error('Query too complex');
}
```

## 错误处理

### 格式化错误

```typescript
import { GraphQLError } from 'graphql';

export const formatError = (error: GraphQLError) => {
  if (error.originalError instanceof ValidationError) {
    return {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: error.originalError.fields,
    };
  }

  if (error.originalError instanceof AuthenticationError) {
    return {
      message: 'Authentication required',
      code: 'AUTHENTICATION_ERROR',
    };
  }

  return {
    message: error.message,
    code: 'INTERNAL_ERROR',
  };
};
```

### 业务错误

```graphql
type Mutation {
  login(email: String!, password: String!): LoginResult!
}

union LoginResult = LoginSuccess | LoginError

type LoginSuccess {
  token: String!
  user: User!
}

type LoginError {
  message: String!
  code: LoginErrorCode!
}

enum LoginErrorCode {
  INVALID_CREDENTIALS
  ACCOUNT_LOCKED
  EMAIL_NOT_VERIFIED
}
```

## 中间件

### 认证中间件

```typescript
export const authMiddleware = async (
  resolve: any,
  parent: any,
  args: any,
  context: GraphQLContext,
  info: any
) => {
  const { user } = context;

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return resolve(parent, args, context, info);
};

// 应用到需要认证的解析器
export const resolvers = {
  Mutation: {
    updateUser: authMiddleware(
      async (_: any, args: any, context: GraphQLContext) => {
        return context.prisma.user.update({
          where: { id: args.id },
          data: args.input,
        });
      }
    ),
  },
};
```

### 权限中间件

```typescript
export const requirePermission = (permission: string) => {
  return (resolver: any) => {
    return async (parent: any, args: any, context: GraphQLContext, info: any) => {
      const { user } = context;

      if (!user || !user.permissions.includes(permission)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      return resolver(parent, args, context, info);
    };
  };
};

// 使用
export const resolvers = {
  Mutation: {
    deleteUser: requirePermission('users:delete')(
      async (_: any, args: any, context: GraphQLContext) => {
        return context.prisma.user.delete({ where: { id: args.id } });
      }
    ),
  },
};
```

## 测试

### Resolver 测试

```typescript
import { resolvers } from './resolvers';

describe('User resolvers', () => {
  it('should return user by id', async () => {
    const context = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: '1',
            name: 'Test User',
          }),
        },
      },
    };

    const result = await resolvers.Query.user(null, { id: '1' }, context);

    expect(result).toEqual({
      id: '1',
      name: 'Test User',
    });
  });
});
```

### 集成测试

```typescript
import { graphql } from 'graphql';
import { schema } from './schema';

describe('User API', () => {
  it('should create user', async () => {
    const mutation = `
      mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
          id
          name
          email
        }
      }
    `;

    const variables = {
      input: {
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    const result = await graphql(schema, mutation, null, null, variables);

    expect(result.errors).toBeUndefined();
    expect(result.data?.createUser).toEqual({
      id: expect.any(String),
      name: 'Test User',
      email: 'test@example.com',
    });
  });
});
```

## 最佳实践

1. **Schema 优先** - 先设计 Schema，再实现 Resolver
2. **分页使用游标** - 避免使用 offset，使用 cursor-based 分页
3. **使用 DataLoader** - 解决 N+1 查询问题
4. **错误信息明确** - 提供清晰的错误信息和错误码
5. **查询深度限制** - 防止过深的嵌套查询
6. **字段权限控制** - 敏感字段需要权限验证
7. **使用类型生成** - 从 Schema 生成 TypeScript 类型

## 工具推荐

- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - GraphQL 服务器
- [Apollo Client](https://www.apollographql.com/docs/react/) - GraphQL 客户端
- [GraphQL Code Generator](https://www.graphql-code-generator.com/) - 代码生成
- [DataLoader](https://github.com/graphql/dataloader) - 批量查询优化
- [GraphQL Playground](https://github.com/prisma-labs/graphql-playground) - IDE
