---
name: langchain-arch
description: LangChain 架构技能。Agent、Chain、RAG 系统设计。
tags: [langchain, llm, agents]
---

# LangChain 架构技能

## When to Use This Skill

- 构建 LLM 应用时
- 设计 Agent 系统时
- 实现 RAG 系统时
- 需要 LangChain 最佳实践时

## Quick Reference

### LangChain 核心组件

```
┌─────────────────────────────────────────┐
│            LangChain                 │
├─────────────────────────────────────────┤
│  Prompts  │  Chains   │  Agents   │
├─────────────────────────────────────────┤
│  Memory   │  Tools    │  Callbacks │
├─────────────────────────────────────────┤
│  LLMs     │  Chat Models │ Embeddings│
└─────────────────────────────────────────┘
```

### Prompt 模板

```typescript
import { PromptTemplate } from 'langchain/prompts';

// 基础模板
const prompt = PromptTemplate.fromTemplate(`
你是一个{role}。
用户的问题是：{question}
请用{language}回答。
`);

// 格式化
const formattedPrompt = await prompt.format({
  role: '技术专家',
  question: '如何使用 TypeScript？',
  language: '中文'
});

// ChatPromptTemplate
const chatPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
你是一个{role}。
你的任务是{task}
`),
  HumanMessagePromptTemplate.fromTemplate('{input}'),
]);
```

### Chain 设计

```typescript
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';

// 简单 Chain
const prompt = PromptTemplate.fromTemplate(`
根据以下信息回答问题：
信息：{context}
问题：{question}
`);

const llm = new OpenAI({ temperature: 0 });
const chain = new LLMChain({ llm, prompt });

const result = await chain.call({
  context: 'TypeScript 是...',
  question: '什么是 TypeScript？'
});

// Sequential Chain
import { SequentialChain } from 'langchain/chains';

const summaryChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate('总结以下内容：{text}')
});

const translateChain = new LLMChain({
  llm,
  prompt: PromptTemplate.fromTemplate('翻译成中文：{text}')
});

const sequentialChain = new SequentialChain({
  chains: [summaryChain, translateChain],
  inputVariables: ['text'],
  outputVariables: ['text'] // translateChain 的输入输出都用 text
});

// Router Chain
import { LLMRouterChain } from 'langchain/chains';

const routerPrompt = PromptTemplate.fromTemplate(`
根据用户的问题，选择最合适的回答者：

可选回答者：
- coding: 编程相关问题
- general: 一般问题
- translation: 翻译问题

问题：{input}

只输出回答者的名称。
`);

const routerChain = new LLMRouterChain({
  llm,
  routerPrompt
});
```

### Memory 实现

```typescript
import { ConversationBufferMemory } from 'langchain/memory';
import { ConversationSummaryMemory } from 'langchain/memory';
import { VectorStoreMemory } from 'langchain/memory';

// Buffer Memory - 保存最近的消息
const bufferMemory = new ConversationBufferMemory({
  memoryKey: 'chat_history',
  returnMessages: true
});

// Summary Memory - 总结对话历史
const summaryMemory = new ConversationSummaryMemory({
  llm,
  memoryKey: 'chat_summary'
});

// Vector Store Memory - 向量存储长期记忆
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const vectorMemory = new VectorStoreMemory({
  vectorStoreRetriever: PineconeStore.asRetriever(),
  memoryKey: 'relevant_history'
});

// 使用
const chain = new LLMChain({
  llm,
  prompt,
  memory: bufferMemory // 或其他 memory
});

await chain.call({ input: '你好' });
await chain.call({ input: '我叫什么？' }); // 会记得之前的对话
```

### RAG 系统

```typescript
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { RetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// 1. 初始化向量存储
const embeddings = new OpenAIEmbeddings();
const vectorStore = await PineconeStore.fromTexts(
  ['文档1的内容', '文档2的内容', ...],
  embeddings,
  { pineconeIndex: 'my-index' }
);

// 2. 创建检索器
const retriever = vectorStore.asRetriever({ k: 3 }); // 检索最相关的 3 个文档

// 3. 创建 RAG Chain
const prompt = PromptTemplate.fromTemplate(`
基于以下上下文信息回答问题：

上下文：
{context}

问题：{input}

如果上下文中没有答案，请说"我无法从提供的上下文中找到答案"。
`);

const chain = RetrievalQAChain.fromLLM(
  new ChatOpenAI({ temperature: 0 }),
  retriever,
  { prompt }
);

// 4. 查询
const result = await chain.call({ query: '如何安装 LangChain？' });
```

### Agent 设计

```typescript
import { initializeAgentExecutor } from 'langchain/agents';
import { SerpAPI, RequestsGetTool } from 'langchain/tools';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// 定义工具
const tools = [
  new SerpAPI(process.env.SERPAPI_API_KEY, {
    name: 'search',
    description: '用于搜索互联网获取最新信息'
  }),
  new RequestsGetTool({
    name: 'fetch_url',
    description: '用于获取网页内容'
  })
];

// 初始化 Agent
const agent = await initializeAgentExecutor(
  tools,
  new ChatOpenAI({ temperature: 0, model: 'gpt-4' }),
  {
    agentType: 'chat-conversational-react-description',
    verbose: true
  }
);

// 执行
const result = await agent.call({
  input: '搜索最新的人工智能新闻'
});
```

### Callback 使用

```typescript
import { LLMChain } from 'langchain/chains';

// 自定义回调
const customCallback = {
  handleLLMNewToken: (token: string) => {
    console.log('新 Token:', token);
  },
  handleLLMEnd: async (output: any) => {
    console.log('LLM 完成:', output);
  },
  handleChainEnd: async (outputs: any) => {
    console.log('Chain 完成:', outputs);
  }
};

const chain = new LLMChain({
  llm,
  prompt,
  callbacks: [customCallback]
});

// 流式输出
const streamingChain = new LLMChain({
  llm: new OpenAI({ streaming: true }),
  prompt,
  callbacks: [{
    handleLLMNewToken: (token) => {
      process.stdout.write(token);
    }
  }]
});
```

## Examples

### Example 1: 问答系统

```typescript
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

// 1. 准备文档
const documents = [
  { pageContent: 'TypeScript 是...', metadata: { source: 'ts-doc' } },
  { pageContent: 'React 是...', metadata: { source: 'react-doc' } }
];

// 2. 创建向量存储
const vectorStore = await HNSWLib.fromDocuments(documents, new OpenAIEmbeddings());

// 3. 创建检索器
const retriever = vectorStore.asRetriever({ k: 2 });

// 4. 创建问答 Chain
const chain = RetrievalQAChain.fromLLM(
  new ChatOpenAI(),
  retriever,
  {
    returnSourceDocuments: true // 返回来源文档
  }
);

// 5. 查询
const result = await chain.call({ query: 'TypeScript 的特点是什么？' });
console.log(result.answer);
console.log(result.sourceDocuments);
```

### Example 2: 聊天机器人

```typescript
import { ConversationChain } from 'langchain/chains';
import { BufferWindowMemory } from 'langchain/memory';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// 创建 Memory - 只保留最近 5 轮对话
const memory = new BufferWindowMemory({
  llm: new ChatOpenAI({ temperature: 0.7 }),
  k: 5,
  returnMessages: true
});

// 创建 Chain
const chain = new ConversationChain({
  llm: new ChatOpenAI({ temperature: 0.7 }),
  memory
});

// 对话
const response1 = await chain.call({ input: '你好' });
const response2 = await chain.call({ input: '你叫什么名字？' });
const response3 = await chain.call({ input: '我刚才说了什么？' });
```

## References

- [everything-claude-code/skills/langchain-architecture/SKILL.md](../everything-claude-code/skills/langchain-architecture/SKILL.md)

## Maintenance

- 来源：基于 LangChain 最佳实践
- 最后更新：2026-01-24
