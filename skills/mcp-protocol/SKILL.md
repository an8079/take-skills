---
name: mcp-protocol
description: Model Context Protocol (MCP) 开发与集成技能。用于构建 MCP 服务器、编写 MCP 工具、处理 MCP 客户端集成、调试 MCP 连接问题。
tags: [mcp, protocol, integration, tools, claude-code]
---

# MCP Protocol - Model Context Protocol 开发指南

## 概述

MCP（Model Context Protocol）是 Anthropic 推出的开放标准协议，用于将 AI 模型与外部工具和数据源连接。本技能涵盖 MCP 服务器开发、客户端集成和最佳实践。

## 核心概念

### MCP 架构
```
┌─────────────┐       MCP Protocol       ┌─────────────────┐
│  AI Client  │◄────────────────────────►│  MCP Server     │
│  (Claude)   │   stdio / SSE / HTTP    │  (你的工具)      │
└─────────────┘                          └─────────────────┘
```

### 传输方式
1. **stdio** - 通过标准输入输出通信（本地工具）
2. **SSE** - Server-Sent Events（Web 场景）
3. **HTTP+SSE** - 远程 MCP 服务器

### 协议消息类型
- `initialize` - 握手初始化
- `tools/list` - 列出可用工具
- `tools/call` - 调用工具
- `resources/list` - 列出资源
- `resources/read` - 读取资源
- `prompts/list` - 列出提示模板
- `notifications/` - 通知消息

## MCP Server 开发

### 项目结构
```
mcp-server/
├── src/
│   ├── index.ts          # 主入口
│   ├── server.ts          # 服务器核心
│   └── tools/            # 工具实现
│       ├── calculator.ts
│       └── file-search.ts
├── package.json
└── tsconfig.json
```

### 基础服务器模板
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types";

// 定义工具
const tools = [
  {
    name: "calculator",
    description: "执行数学计算",
    inputSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "数学表达式" }
      },
      required: ["expression"]
    }
  }
];

// 创建服务器
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0"
});

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "calculator") {
    const result = eval(args.expression);
    return { content: [{ type: "text", text: String(result) }] };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
server.run(transport);
```

### Claude Code 配置
在 `.claude/mcp.json` 中注册：
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

## 工具定义规范

### 输入 Schema 最佳实践
```typescript
// ✅ 好的实践：明确的类型和描述
{
  name: "search_docs",
  description: "搜索文档库中的相关内容",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索关键词",
        minLength: 2,
        maxLength: 500
      },
      max_results: {
        type: "number",
        description: "最大返回结果数",
        default: 5,
        minimum: 1,
        maximum: 50
      },
      filters: {
        type: "object",
        description: "可选的过滤条件",
        properties: {
          date_from: { type: "string", format: "date" },
          date_to: { type: "string", format: "date" },
          category: { type: "string", enum: ["api", "guide", "reference"] }
        }
      }
    },
    required: ["query"]
  }
}
```

### 响应格式
```typescript
// 标准文本响应
return {
  content: [{ type: "text", text: "结果文本" }]
};

// 带结构的响应
return {
  content: [
    { type: "text", text: "结果概述" },
    {
      type: "resource",
      resource: {
        uri: "file://results.json",
        mimeType: "application/json",
        text: JSON.stringify(results)
      }
    }
  ]
};

// 图像响应
return {
  content: [
    { type: "image", data: base64Image, mimeType: "image/png" }
  ]
};

// 错误响应
return {
  content: [{ type: "text", text: "错误信息" }],
  isError: true
};
```

## 资源管理

### 静态资源
```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "docs://api-reference",
        name: "API Reference",
        description: "完整 API 文档",
        mimeType: "text/markdown"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "docs://api-reference") {
    return {
      contents: [{
        uri: "docs://api-reference",
        mimeType: "text/markdown",
        text: await readFile("docs/api.md")
      }]
    };
  }
});
```

## 提示模板
```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "code_review",
        description: "代码审查提示",
        arguments: [
          { name: "language", description: "编程语言", required: true },
          { name: "focus", description: "审查重点", required: false }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "code_review") {
    const { language, focus = "best_practices" } = request.params.arguments;
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `请审查以下 ${language} 代码，重点关注：${focus}`
        }
      }]
    };
  }
});
```

## 调试技巧

### 本地测试
```bash
# 直接运行 MCP 服务器
node dist/index.js

# 使用 MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### 日志记录
```typescript
import { Logger } from "@modelcontextprotocol/sdk/logger";

const logger = new Logger("debug", "debug");
logger.debug("Tool called", { tool: name, args });
```

### 常见问题排查
1. **连接失败** - 检查命令路径是否正确
2. **工具未出现** - 确认 schema 格式正确
3. **超时** - 增加 timeout 配置
4. **stdio 无响应** - 确保输出是有效的 JSONLines

## 安全最佳实践

```typescript
// 输入验证
function validateInput(input: unknown, schema: JSONSchema) {
  // 使用 ajv 或 zod 进行严格验证
}

// 沙箱执行
function safeExecute(code: string, context: Record<string, unknown>) {
  // 限制可访问的 API
  // 超时控制
  // 内存限制
}

// 凭证管理
function getCredentials() {
  // 从环境变量或安全存储获取
  // 不在代码中硬编码密钥
}
```

## 完整示例：文件搜索 MCP 服务器

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types";
import { readdir, stat } from "fs/promises";
import { join } from "path";

const server = new McpServer({ name: "file-search", version: "1.0.0" });

async function searchFiles(dir: string, query: string, depth: number = 3): Promise<string[]> {
  if (depth === 0) return [];
  
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.name.includes(query)) {
        results.push(fullPath);
      }
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const subResults = await searchFiles(fullPath, query, depth - 1);
        results.push(...subResults);
      }
    }
  } catch (e) {
    // 忽略权限错误
  }
  return results;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "search_files",
    description: "递归搜索文件",
    inputSchema: {
      type: "object",
      properties: {
        directory: { type: "string", description: "搜索目录" },
        query: { type: "string", description: "搜索关键词" },
        depth: { type: "number", description: "递归深度", default: 3 }
      },
      required: ["directory", "query"]
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "search_files") {
    const results = await searchFiles(args.directory, args.query, args.depth || 3);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    };
  }
  throw new Error("Unknown tool");
});

const transport = new StdioServerTransport();
server.run(transport);
```

## 参考资源
- [MCP SDK 文档](https://github.com/modelcontextprotocol/sdk)
- [MCP 规范](https://modelcontextprotocol.io)
- [Anthropic MCP 指南](https://docs.anthropic.com/en/docs/claude-code/mcp)
