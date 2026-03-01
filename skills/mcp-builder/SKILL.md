---
name: mcp-builder
description: MCP 服务构建技能。MCP Server 开发、协议实现、工具定义。
tags: [mcp, server, tools]
---

# MCP 服务构建技能

## When to Use This Skill

- 创建 MCP Server 时
- 需要添加自定义工具时
- 需要实现 MCP 协议时
- 需要调试 MCP 连接时

## Quick Reference

### MCP 架构

```
┌─────────────────────────────────────────┐
│          Client                      │
└─────────────────┬───────────────┘
                  │ JSON-RPC 2.0
                  │
┌─────────────────▼───────────────┐
│           MCP Server                 │
├────────────────────────────────────┤
│  Tools (工具)                      │
│    - File System Tools            │
│    - Database Tools              │
│    - Custom Tools                 │
│                                     │
│  Resources (资源）                 │
│    - File Prompts                  │
│    - Templates                     │
│                                     │
│  Prompts (提示）                   │
│    - System Prompts                │
└─────────────────────────────────────┘
```

## Python MCP Server

### 基本结构

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json

# 创建 Server 实例
server = Server("my-mcp-server")

# 注册工具
@server.list_resources()
async def list_resources() -> list[str]:
    """列出可用资源"""
    return ["file:///config.json", "file:///template.md"]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """读取资源内容"""
    if uri == "file:///config.json":
        return json.dumps({"version": "1.0.0"}, indent=2)
    raise ValueError(f"Unknown resource: {uri}")

# 注册工具
tools = [
    Tool(
        name="read_file",
        description="读取文件内容",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                }
            },
            "required": ["path"]
        }
    )
]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """调用工具"""
    if name == "read_file":
        path = arguments["path"]
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return [TextContent(
            type="text",
            text=f"文件内容：\n{content}"
        )]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 数据库工具

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import sqlite3
from typing import Optional

server = Server("db-mcp-server")

# 数据库连接
def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

# 工具定义
tools = [
    Tool(
        name="query_database",
        description="执行 SQL 查询",
        inputSchema={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "SQL 查询语句"
                }
            },
            "required": ["query"]
        }
    ),
    Tool(
        name="get_table_schema",
        description="获取表结构",
        inputSchema={
            "type": "object",
            "properties": {
                "table": {
                    "type": "string",
                    "description": "表名"
                }
            },
            "required": ["table"]
        }
    )
]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "query_database":
        query = arguments["query"]
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            conn.close()

            return [TextContent(
                type="text",
                text=json.dumps([dict(row) for row in rows], indent=2)
            )]
        except Exception as e:
            conn.close()
            return [TextContent(
                type="text",
                text=f"查询失败：{str(e)}"
            )]

    elif name == "get_table_schema":
        table = arguments["table"]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table})")
        schema = cursor.fetchall()
        conn.close()

        return [TextContent(
            type="text",
            text=json.dumps([dict(row) for row in schema], indent=2)
        )]
```

### 文件系统工具

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent
import os
import base64

server = Server("fs-mcp-server")

# 工具定义
tools = [
    Tool(
        name="list_files",
        description="列出目录中的文件",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "目录路径，默认为当前目录"
                }
            }
        }
    ),
    Tool(
        name="read_file",
        description="读取文件内容",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                }
            }
        }
    ),
    Tool(
        name="write_file",
        description="写入文件内容",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                },
                "content": {
                    "type": "string",
                    "description": "文件内容"
                }
            }
        }
    )
]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "list_files":
        path = arguments.get("path", ".")
        try:
            files = os.listdir(path)
            return [TextContent(
                type="text",
                text="\n".join(files)
            )]
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"列出文件失败：{str(e)}"
            )]

    elif name == "read_file":
        path = arguments["path"]
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return [TextContent(
                type="text",
                text=content
            )]
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"读取文件失败：{str(e)}"
            )]

    elif name == "write_file":
        path = arguments["path"]
        content = arguments["content"]
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return [TextContent(
                type="text",
                text=f"文件已写入：{path}"
            )]
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"写入文件失败：{str(e)}"
            )]
```

## TypeScript MCP Server

### 基本结构

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent
} from '@modelcontextprotocol/sdk/types.js';

// 创建 Server 实例
const server = new Server(
  {
    name: 'my-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'echo',
        description: '回显输入的文本',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '要回显的文本',
            },
          },
          required: ['text'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: { text } = {} } = request.params;

  if (name === 'echo') {
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${text}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

## MCP 配置

### MCP Server 配置

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "python",
      "args": ["path/to/server.py"],
      "env": {
        "API_KEY": "your-api-key"
      }
    },
    "typescript-mcp": {
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}
```

### 多 Server 配置

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/@modelcontextprotocol/server-filesystem/dist/index.js", "/workspace"]
    },
    "brave-search": {
      "command": "node",
      "args": ["/path/to/brave-search/dist/index.js"]
    },
    "postgres": {
      "command": "python",
      "args": ["-m", "mcp_postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

## 工具设计最佳实践

### 1. 清晰的描述

```python
Tool(
    name="search_codebase",
    description="在代码库中搜索代码。支持按文件名、函数名、内容搜索。",
    inputSchema={...}
)
```

### 2. 验证输入

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    # 验证必需参数
    if "path" not in arguments:
        return [TextContent(
            type="text",
            text="错误：缺少必需参数 'path'"
        )]

    # 验证参数类型
    path = arguments["path"]
    if not isinstance(path, str):
        return [TextContent(
            type="text",
            text="错误：'path' 必须是字符串"
        )]
```

### 3. 错误处理

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        # 工具逻辑
        result = execute_operation(arguments)
        return [TextContent(type="text", text=str(result))]
    except FileNotFoundError as e:
        return [TextContent(
            type="text",
            text=f"文件未找到：{arguments.get('path')}"
        )]
    except PermissionError as e:
        return [TextContent(
            type="text",
            text=f"权限不足：{str(e)}"
        )]
    except Exception as e:
        return [TextContent(
            type="text",
            text=f"错误：{str(e)}"
        )]
```

## Examples

### Example 1: Git 操作工具

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import subprocess

server = Server("git-mcp-server")

tools = [
    Tool(
        name="git_status",
        description="查看 Git 状态",
        inputSchema={
            "type": "object",
            "properties": {
                "repo_path": {
                    "type": "string",
                    "description": "仓库路径"
                }
            }
        }
    ),
    Tool(
        name="git_commit",
        description="提交更改",
        inputSchema={
            "type": "object",
            "properties": {
                "repo_path": {
                    "type": "string"
                },
                "message": {
                    "type": "string",
                    "description": "提交信息"
                }
            }
        }
    )
]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    repo_path = arguments.get("repo_path", ".")

    if name == "git_status":
        result = subprocess.run(
            ["git", "status"],
            cwd=repo_path,
            capture_output=True,
            text=True
        )
        return [TextContent(type="text", text=result.stdout)]

    elif name == "git_commit":
        message = arguments["message"]
        result = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=repo_path,
            capture_output=True,
            text=True
        )
        return [TextContent(type="text", text=result.stdout)]
```

### Example 2: 项目分析工具

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import os
import ast

server = Server("project-analyzer-mcp")

tools = [
    Tool(
        name="analyze_project",
        description="分析项目结构",
        inputSchema={
            "type": "object",
            "properties": {
                "project_path": {
                    "type": "string"
                }
            }
        }
    )
]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "analyze_project":
        project_path = arguments["project_path"]

        # 分析文件结构
        files = []
        for root, dirs, filenames in os.walk(project_path):
            for filename in filenames:
                if filename.endswith('.py'):
                    files.append(os.path.join(root, filename))

        # 分析代码行数
        total_lines = 0
        for filepath in files:
            with open(filepath, 'r', encoding='utf-8') as f:
                total_lines += len(f.readlines())

        return [TextContent(
            type="text",
            text=f"项目分析：\nPython 文件数：{len(files)}\n总代码行数：{total_lines}"
        )]
```

## 调试技巧

### 1. 启用详细日志

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mcp-server")

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    logger.info(f"调用工具: {name}")
    logger.debug(f"参数: {arguments}")
    # ...
```

### 2. 测试工具

```python
# 独立测试函数
async def test_read_file():
    result = await call_tool("read_file", {"path": "test.txt"})
    print(result)

# 测试 Server
import asyncio

async def test_server():
    from mcp.server import Server
    from mcp.server.stdio import stdio_server

    server = Server("test-server")
    # ... 添加工具

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream,
                         server.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(test_server())
```

## References

- MCP SDK 文档: https://modelcontextprotocol.io/docs

## Maintenance

- 来源：基于两个项目的 MCP 开发经验
- 最后更新：2026-01-24
