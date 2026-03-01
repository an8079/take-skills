---
name: nlp-pipeline
description: "NLP 管道技能：分词、NER 命名实体识别、摘要、情感分析、文本分类、关系抽取。用于知识图谱构建、文档处理、舆情分析等场景。"
tags: [nlp, tokenization, ner, text-classification, summarization, sentiment-analysis, relation-extraction]
---

# NLP 管道技能

## When to Use This Skill

触发此技能当：
- 构建知识图谱的文本处理管道
- 文档信息抽取与分析
- 舆情分析或情感分析
- 文本分类与标签任务
- 需要实体识别或关系抽取
- 文档摘要生成

## Not For / Boundaries

此技能不适用于：
- 简单的文本匹配（用正则或字符串方法即可）
- 纯机器翻译任务（用翻译模型）
- 对话式问答（用对话模型）

## Quick Reference

### NLP 任务类型

| 任务 | 常用模型 | 输出格式 |
|------|-----------|----------|
| 分词 | BERT/WordPiece | Token 列表 |
| NER 命名实体识别 | CRF/BERT/SPACY | 实体列表及类型 |
| 文本分类 | BERT/DeBERTa/XLM | 标签 + 概率 |
| 文本摘要 | BART/T5/Pegasus | 摘要文本 |
| 情感分析 | BERT/RoBERTa | 积极/中性/消极 |
| 关系抽取 | BERT/REBEL | 三元组 (主语, 谓语, 关系) |
| QA 抽取 | BERT/RoBERTa | 问题-答案对 |

## 核心组件

### 1. 分词（Tokenization）

```python
from transformers import AutoTokenizer

# 加载中文分词器
tokenizer = AutoTokenizer.from_pretrained('bert-base-chinese')

# 分词
text = "这是一个示例文本，用于演示分词功能"
tokens = tokenizer(
    text,
    return_tensors='pt',
    truncation=True,
    max_length=512
)

# 获取 Token 列表（不转换为张量）
token_list = tokenizer.tokenize(text)
print(token_list)  # ['这', '是', '一', '个', '示', '例', '文', '本', ...]

# 词还原
decoded = tokenizer.decode(tokens['input_ids'][0])
print(decoded)  # "这是一个示例文本，用于演示分词功能"

# 特殊 Token（CLS、SEP、MASK、UNK）
special_tokens = tokenizer.all_special_tokens
print(special_tokens)  # {'[CLS]', '[SEP]', '[MASK]', '[UNK]'}

# 子词分词
tokens_with_wordspan = tokenizer(
    text,
    return_offsets_mapping=True
)
print(tokens_with_wordspan['word_ids'])  # 每个 Token 对应的词 ID
```

### 2. NER 命名实体识别

```python
from transformers import pipeline
import torch

# 使用预训练 NER 模型
ner_pipeline = pipeline(
    "token-classification",
    model="ckiplab/bert-base-chinese-ner",
    aggregation_strategy="simple",  # 合并连续相同实体
    device="cuda" if torch.cuda.is_available() else "cpu"
)

def extract_entities(text):
    """提取文本中的命名实体"""

    results = ner_pipeline(text)

    # 格式化输出
    entities = []
    current_entity = None
    current_tokens = []

    for result in results:
        entity_type = result['entity']
        token = result['word']

        if entity_type == 'O':  # 非实体
            if current_entity:
                # 保存当前实体
                entities.append({
                    'text': ''.join(current_tokens),
                    'type': current_entity['type'],
                    'start': current_entity['start'],
                    'end': current_entity['end']
                })
                current_entity = None
                current_tokens = []
        else:
            if not current_entity or current_entity['type'] != entity_type:
                # 新实体开始
                if current_entity:
                    entities.append({
                        'text': ''.join(current_tokens),
                        'type': current_entity['type'],
                        'start': current_entity['start'],
                        'end': current_entity['end']
                    })
                current_entity = {
                    'type': entity_type,
                    'start': result['start'],
                    'end': result['end']
                }
                current_tokens = [token]
            else:
                # 同一实体继续
                current_tokens.append(token)

    # 最后一个实体
    if current_entity:
        entities.append({
            'text': ''.join(current_tokens),
            'type': current_entity['type'],
            'start': current_entity['start'],
            'end': current_entity['end']
        })

    return entities

# 示例
text = "马云在杭州创办了阿里巴巴集团"
entities = extract_entities(text)
for entity in entities:
    print(f"{entity['type']}: {entity['text']} (位置: {entity['start']}-{entity['end']})")
```

### 3. 文本分类

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from datasets import load_dataset

# 加载分类模型
model_name = "hfl/chinese-bert-wwm-ext"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# 标签定义（根据具体任务调整）
LABELS = ['正面', '负面', '中性']  # 情感分类
# LABELS = ['体育', '财经', '科技', '娱乐']  # 新闻分类
# LABELS = ['广告', '垃圾', '正常']  # 内容过滤

def classify_text(text):
    """文本分类"""

    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
    with torch.no_grad():
        outputs = model(**inputs)

    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_class_id = predictions.argmax().item()

    return {
        'text': text,
        'predicted_label': LABELS[predicted_class_id],
        'confidence': predictions[0][predicted_class_id].item(),
        'all_scores': {
            label: score.item()
            for label, score in zip(LABELS, predictions[0])
        }
    }

# 批量分类
def batch_classify(texts, batch_size=16):
    """批量文本分类"""

    all_results = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        inputs = tokenizer(
            batch_texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=256
        )

        with torch.no_grad():
            outputs = model(**inputs)

        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_ids = predictions.argmax(dim=1)

        for j, text in enumerate(batch_texts):
            predicted_id = predicted_ids[j].item()
            all_results.append({
                'text': text,
                'label': LABELS[predicted_id],
                'confidence': outputs.logits[j][predicted_id].item()
            })

    return all_results
```

### 4. 文本摘要

```python
from transformers import pipeline

# 使用预训练摘要模型
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device="cuda"  # 使用 GPU 加速
)

def summarize_text(text, max_length=150, min_length=30):
    """生成文本摘要"""

    summary = summarizer(
        text,
        max_length=max_length,
        min_length=min_length,
        do_sample=False  # 确定性输出
    )

    return summary[0]['summary_text']

# 长文档摘要（分段处理）
def summarize_long_document(text, chunk_size=1024, overlap=100):
    """处理超长文档"""

    # 分段
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        chunks.append(chunk)

    # 每段生成摘要
    summaries = []
    for chunk in chunks:
        summary = summarize_text(chunk, max_length=100)
        summaries.append(summary)

    # 合并最终摘要
    final_summary = ' '.join(summaries)
    return final_summary
```

### 5. 情感分析

```python
from transformers import pipeline

# 情感分析管道
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    return_all_scores=True  # 返回所有情绪分数
)

def analyze_sentiment(text):
    """分析文本情感"""

    result = sentiment_pipeline(text)[0]

    # RoBERTa 模型输出：label + scores
    # label: LABEL_0 (负面), LABEL_1 (中性), LABEL_2 (正面)
    # scores: [negative, neutral, positive] 概率值

    sentiment_map = {
        'LABEL_0': '负面',
        'LABEL_1': '中性',
        'LABEL_2': '正面'
    }

    return {
        'text': text,
        'sentiment': sentiment_map[result['label']],
        'confidence': max(result['scores']),  # 最高置信度
        'scores': {
            'negative': result['scores'][0],
            'neutral': result['scores'][1],
            'positive': result['scores'][2]
        }
    }

# 批量情感分析
def batch_sentiment_analysis(texts):
    """批量情感分析"""

    results = sentiment_pipeline(texts)

    analyzed = []
    for text, result in zip(texts, results):
        sentiment_map = {
            'LABEL_0': '负面',
            'LABEL_1': '中性',
            'LABEL_2': '正面'
        }

        analyzed.append({
            'text': text,
            'sentiment': sentiment_map[result['label']],
            'confidence': max(result['scores'])
        })

    return analyzed
```

### 6. 关系抽取

```python
from transformers import pipeline

# 关系抽取管道
re_pipeline = pipeline(
    "token-classification",
    model="Babel/rebel-large",
    aggregation_strategy="simple",
    device="cuda"
)

def extract_relations(text):
    """抽取文本中的关系三元组"""

    results = re_pipeline(text)

    # 三元组格式：(主语, 谓语, 关系类型)
    triples = []

    current_entities = []
    for result in results:
        entity = result.get('entity', {}).get('word')

        if result['entity_group'] == 0:  # 主语
            current_entities.append({
                'text': entity,
                'role': 'SUBJ'
            })
        elif result['entity_group'] == 1:  # 宾语
            if current_entities:
                subj = current_entities[0]
                rel_type = result.get('relation')
                triples.append({
                    'subject': subj['text'],
                    'object': entity,
                    'relation': rel_type
                })
                current_entities = []
        elif result['entity_group'] == 2:  # 关系类型标记
            if current_entities:
                triples[-1]['relation_type'] = entity
            current_entities = []

    return triples

# 示例
text = "马云在杭州创办了阿里巴巴集团"
triples = extract_relations(text)
for triple in triples:
    print(f"{triple['subject']} --{triple['relation']}--> {triple['object']}")
# 输出: 马云 -->位于--> 杭州
#       马云 -->创办--> 阿里巴巴集团
```

## NLP 管道架构

### 完整文本处理管道

```python
from typing import List, Dict, Any
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

class NLPPipeline:
    """完整的 NLP 处理管道"""

    def __init__(self, device='cpu'):
        self.device = device

        # 初始化各组件
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-chinese')
        self.ner_pipeline = pipeline(
            "token-classification",
            model="ckiplab/bert-base-chinese-ner",
            device=device
        )
        self.sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment",
            device=device
        )

    def process(self, text: str, tasks: List[str]) -> Dict[str, Any]:
        """
        处理文本，返回各任务结果

        Args:
            text: 输入文本
            tasks: 需要执行的 NLP 任务列表
                  ['tokenize', 'ner', 'classify', 'sentiment', 'summarize']
        """
        results = {}

        for task in tasks:
            if task == 'tokenize':
                results['tokenize'] = self._tokenize(text)
            elif task == 'ner':
                results['ner'] = self._extract_entities(text)
            elif task == 'classify':
                results['classify'] = self._classify(text)
            elif task == 'sentiment':
                results['sentiment'] = self._analyze_sentiment(text)
            elif task == 'summarize':
                results['summarize'] = self._summarize(text)

        return results

    def _tokenize(self, text):
        """分词"""
        tokens = self.tokenizer.tokenize(text)
        return {
            'tokens': tokens,
            'count': len(tokens)
        }

    def _extract_entities(self, text):
        """实体抽取"""
        ner_results = self.ner_pipeline(text)
        entities = []
        for result in ner_results:
            if result['entity'] != 'O':
                entities.append({
                    'text': result['word'],
                    'type': result['entity'],
                    'score': result['score']
                })
        return entities

    def _classify(self, text):
        """文本分类"""
        # 这里需要根据具体任务加载模型
        inputs = self.tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            outputs = self.classifier(**inputs)
        # 实现分类逻辑...
        return {"predicted_label": "...", "confidence": 0.95}

    def _analyze_sentiment(self, text):
        """情感分析"""
        result = self.sentiment_pipeline(text)[0]
        sentiment_map = {
            'LABEL_0': '负面',
            'LABEL_1': '中性',
            'LABEL_2': '正面'
        }
        return {
            'sentiment': sentiment_map[result['label']],
            'scores': {
                'negative': result['scores'][0],
                'neutral': result['scores'][1],
                'positive': result['scores'][2]
            }
        }

    def _summarize(self, text):
        """文本摘要"""
        summary_pipeline = pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            device=self.device
        )
        result = summary_pipeline(text, max_length=150)
        return result[0]['summary_text']
```

## Examples

### Example 1: 知识图谱构建

**场景：** 从文档中提取实体和关系，构建知识图谱

**实现：**
```python
# 文档处理
documents = [
    "苹果公司成立于 1976 年，由史蒂夫·乔布斯创办。",
    "蒂姆·库克于 2011 年成为苹果公司 CEO。",
    "苹果总部位于加利福尼亚州库比蒂诺。",
]

pipeline = NLPPipeline(device='cuda')

for doc in documents:
    print(f"\n处理文档: {doc[:30]}...")

    # 完整处理
    results = pipeline.process(
        doc,
        tasks=['ner', 'extract_relations', 'summarize']
    )

    print(f"实体: {results['ner']}")
    print(f"关系: {results['extract_relations']}")
    print(f"摘要: {results['summarize']}")
```

**预期输出：**
```
实体: [{'text': '苹果公司', 'type': 'ORG'}, {'text': '1976年', 'type': 'DATE'}, {'text': '史蒂夫·乔布斯', 'type': 'PERSON'}]
关系: {'subject': '史蒂夫·乔布斯', 'object': '苹果公司', 'relation': 'founder'}
摘要: 苹果公司由史蒂夫·乔布斯创立，总部位于库比蒂诺...
```

### Example 2: 舆情分析

**场景：** 分析社交媒体评论的情感倾向

**实现：**
```python
comments = [
    "这个产品质量太差了，浪费钱！",
    "客服态度很好，解决问题很及时。",
    "一般般，不好不坏。",
    "非常喜欢，会推荐给朋友！"
]

pipeline = NLPPipeline(device='cuda')
results = pipeline.process_batch(
    comments,
    tasks=['sentiment']
)

# 统计情感分布
sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
for r in results:
    sentiment_counts[r['sentiment']] += 1

print(f"正面评论: {sentiment_counts['positive']}")
print(f"中性评论: {sentiment_counts['neutral']}")
print(f"负面评论: {sentiment_counts['negative']}")
print(f"负面率: {sentiment_counts['negative'] / len(comments):.2%}")
```

### Example 3: 文档智能摘要

**场景：** 快速处理长篇文档，生成结构化摘要

**实现：**
```python
def process_document(doc_path):
    """智能文档处理流程"""

    # 1. 读取文档
    with open(doc_path, 'r', encoding='utf-8') as f:
        document = f.read()

    # 2. 按段落分割
    paragraphs = document.split('\n\n')

    # 3. 每段落提取关键信息
    pipeline = NLPPipeline(device='cpu')

    structured_summary = []
    for i, para in enumerate(paragraphs):
        if not para.strip():
            continue

        results = pipeline.process(
            para,
            tasks=['ner', 'classify', 'sentiment']
        )

        structured_summary.append({
            'paragraph_id': i,
            'content': para,
            'entities': results['ner'],
            'category': results['classify']['predicted_label'],
            'sentiment': results['sentiment']['sentiment'],
            'key_points': results['ner'][:3]  # 取前 3 个实体作为关键点
        })

    return structured_summary
```

## References

- [Hugging Face NLP Course](https://huggingface.co/learn/nlp-course/chapter1/1)
- [Chinese NER Models](https://github.com/ckiplab/bert-base-chinese-ner)
- [Text Summarization Guide](https://huggingface.co/docs/transformers/tasks/summarization)
- [Sentiment Analysis](https://huggingface.co/docs/transformers/tasks/sentiment-analysis)

## Maintenance

- 来源：基于 Hugging Face Transformers 文档和最佳实践
- 最后更新：2026-01-24
- 已知限制：
  - 需要根据具体任务选择合适的预训练模型
  - NER 结果可能需要领域适配
  - 长文本需要分段处理
