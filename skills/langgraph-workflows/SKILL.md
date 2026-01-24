---
name: langgraph-workflows
description: LangGraph 多 Agent 工作流技能。Supervisor-Worker 模式、状态持久化、Checkpointing。
tags: [langgraph, agents, workflows]
---

# LangGraph 多 Agent 工作流技能

## When to Use This Skill

- 构建复杂多 Agent 协作系统时
- 需要 Agent 间状态管理和持久化时
- 需要 Supervisor-Worker 模式时
- 需要人工介入节点时

## Quick Reference

### LangGraph 核心概念

```
┌─────────────────────────────────────────┐
│           LangGraph                    │
├─────────────────────────────────────────┤
│  Nodes (节点)                      │
│    - Agent Nodes (调用 LLM)         │
│    - Tool Nodes (调用工具)          │
│    - Conditional Nodes (条件判断）   │
│                                     │
│  Edges (边)                        │
│    - Normal Edges (顺序执行）       │
│    - Conditional Edges (条件跳转）  │
└─────────────────────────────────────────┘
```

### Supervisor-Worker 模式

```
         ┌──────────────┐
         │  Supervisor │ ◄─────────────────────┐
         └──────┬───────┘                      │
                │                              │
         ┌────────┴────────┐                 │
         │                 │                 │
    ┌────▼────┐    ┌───────▼────┐    ┌────▼────┐
    │ Researcher│  │ Coder       │  │Reviewer │
    └──────────┘    └─────────────┘    └──────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
                              │
                    ┌───────────▼────────────┐
                    │  Shared State Store   │
                    │  (检查点持久化）        │
                    └──────────────────────┘
```

## 核心组件

### 1. Agent Node

```python
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain.tools import Tool

def create_agent_node(name: str, tools: list, llm: ChatOpenAI):
    """创建 Agent 节点"""
    agent_executor = create_react_agent(llm, tools)

    async def agent_node(state):
        """Agent 节点函数"""
        result = await agent_executor.ainvoke(state)
        return {
            "messages": [state["messages"][-1], result["output"]],
            f"{name}_result": result["output"]
        }

    return agent_node
```

### 2. Tool Node

```python
from langchain.tools import tool

@tool
def search_documents(query: str) -> str:
    """搜索文档"""
    # 实现搜索逻辑
    return "搜索结果..."

def create_tool_node(tools: list):
    """创建工具节点"""

    async def tool_node(state):
        """工具节点函数"""
        tool_name = state["next"]
        selected_tool = next(t for t in tools if t.name == tool_name)
        result = selected_tool.invoke(state["input"])
        return {
            "messages": [state["messages"][-1], {"role": "assistant", "content": result}]
        }

    return tool_node
```

### 3. Conditional Node

```python
def should_continue(state):
    """判断是否继续"""
    messages = state["messages"]
    last_message = messages[-1]

    if "end" in last_message.content.lower():
        return "end"
    return "continue"

def route_to_agent(state):
    """路由到合适的 Agent"""
    # 根据任务类型路由
    task = state.get("task_type", "default")

    if task == "research":
        return "researcher"
    elif task == "code":
        return "coder"
    elif task == "review":
        return "reviewer"
    return "supervisor"
```

## State 定义

```python
from typing import TypedDict, List, Annotated
from langgraph.graph.message import add_messages

class GraphState(TypedDict):
    """图状态定义"""
    messages: Annotated[List, add_messages]
    task_type: str
    researcher_result: str
    coder_result: str
    reviewer_result: str
    next_step: str
    iteration_count: int
```

## Graph 构建

### 基本 Graph

```python
from langgraph.graph import StateGraph, END

# 创建图
workflow = StateGraph(GraphState)

# 添加节点
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("coder", coder_node)
workflow.add_node("reviewer", reviewer_node)

# 添加边
workflow.add_edge("supervisor", "researcher")
workflow.add_edge("researcher", "coder")
workflow.add_edge("coder", "reviewer")
workflow.add_edge("reviewer", END)

# 添加条件边
workflow.add_conditional_edges(
    "supervisor",
    route_to_agent,
    {
        "researcher": "researcher",
        "coder": "coder",
        "reviewer": "reviewer",
        END: END
    }
)

# 编译图
app = workflow.compile()
```

### 持久化 Graph (Checkpointing)

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# 使用内存保存
memory = MemorySaver()
app_with_memory = workflow.compile(checkpointer=memory)

# 使用 SQLite 持久化
checkpoint_saver = SqliteSaver.from_conn_string("checkpoints.sqlite")
app_with_checkpoint = workflow.compile(checkpointer=checkpoint_saver)

# 运行时指定 thread_id
config = {"configurable": {"thread_id": "user_123"}}
result = app_with_memory.invoke(state, config)
```

### 子图 (Subgraph)

```python
from langgraph.graph import StateGraph, END

# 创建子图
subgraph = StateGraph(SubgraphState)
subgraph.add_node("step1", step1_node)
subgraph.add_node("step2", step2_node)
subgraph.add_edge("step1", "step2")
subgraph.add_edge("step2", END)

# 编译子图
subgraph_app = subgraph.compile()

# 添加到主图
main_graph.add_node("subgraph", subgraph_app)
main_graph.add_edge("start", "subgraph")
main_graph.add_edge("subgraph", "end")
```

## 完整示例：代码审查系统

```python
from typing import Literal
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

# 定义状态
class CodeReviewState(TypedDict):
    messages: list
    code: str
    review_result: str
    test_result: str
    next: str

# LLM
llm = ChatOpenAI(temperature=0.2)

# 节点函数
async def supervisor(state: CodeReviewState):
    """主控节点，决定下一步"""
    if not state.get("review_result"):
        return {"next": "review"}
    elif not state.get("test_result"):
        return {"next": "test"}
    else:
        return {"next": END}

async def review_code(state: CodeReviewState):
    """代码审查节点"""
    prompt = f"""请审查以下代码，关注：
1. 代码质量
2. 潜在 bug
3. 最佳实践

代码：
{state['code']}

请用中文回答。"""

    response = await llm.ainvoke(prompt)
    return {
        "review_result": response.content,
        "messages": [{"role": "assistant", "content": response.content}]
    }

async def write_tests(state: CodeReviewState):
    """测试生成节点"""
    prompt = f"""基于代码审查结果，为以下代码生成单元测试：

代码：
{state['code']}

审查结果：
{state['review_result']}

请用 Python 和 pytest 编写测试。"""

    response = await llm.ainvoke(prompt)
    return {
        "test_result": response.content,
        "messages": [{"role": "assistant", "content": response.content}]
    }

# 条件函数
def should_continue(state: CodeReviewState):
    if not state.get("test_result"):
        return "test"
    return END

# 构建图
workflow = StateGraph(CodeReviewState)

workflow.add_node("supervisor", supervisor)
workflow.add_node("review", review_code)
workflow.add_node("test", write_tests)

workflow.set_entry_point("supervisor")

workflow.add_conditional_edges(
    "supervisor",
    should_continue,
    {
        "review": "review",
        "test": "test",
        END: END
    }
)

workflow.add_edge("review", "supervisor")
workflow.add_edge("test", "supervisor")

# 添加检查点
checkpoint_saver = SqliteSaver.from_conn_string("code_review.db")
app = workflow.compile(checkpointer=checkpoint_saver)

# 运行
config = {"configurable": {"thread_id": "session_1"}}
state = {"code": "def add(a, b): return a + b"}
result = app.invoke(state, config)
```

## 人工介入

```python
from langgraph.types import interrupt

def human_approval_node(state):
    """人工审批节点"""
    review_result = state.get("review_result", "")

    # 中断并等待人工输入
    return interrupt({
        "message": f"审查结果：\n{review_result}\n\n请确认是否继续",
        "options": ["继续", "修改代码", "终止"]
    })

# 条件判断
def check_approval(state):
    if state.get("human_input") == "继续":
        return "continue"
    elif state.get("human_input") == "修改代码":
        return "modify"
    else:
        return "end"

workflow.add_node("human_check", human_approval_node)
workflow.add_conditional_edges(
    "human_check",
    check_approval,
    {
        "continue": "next_step",
        "modify": "modify_code",
        "end": END
    }
)
```

## References

- LangGraph 文档: https://python.langchain.com/docs/langgraph
- [everything-claude-code/skills/langgraph-workflows/SKILL.md](../everything-claude-code/skills/langgraph-workflows/SKILL.md)

## Maintenance

- 来源：基于 LangGraph 最佳实践
- 最后更新：2026-01-24
