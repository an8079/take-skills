---
name: enterprise-api-orchestrator
description: YAML配置驱动企业数据API编排技能，自动生成工具 + 编排多步工作流（工商四要素核验/工商查询/涉诉查询等）
trigger: 企业查询, 工商数据, API编排, 四要素核验, 企业尽调, 批量企业信息, 企业信息查询
===

# enterprise-api-orchestrator

> 企业数据 API 编排技能 — 配置驱动、多工具编排、Redis缓存、企业尽职调查工作流

## 触发场景

- 用户说"查一下这家公司"、"企业四要素核验"、"批量查询企业工商信息"
- 用户说"查企业涉诉"、"企业股东查询"、"企业资质查询"
- 用户提供企业名称/统一社会信用代码，需要多维度数据组合
- 需要将多个API工具串联成企业尽调报告

---

## 核心能力

### 1. 配置驱动工具生成

给定 YAML 配置文件，自动识别可用工具：

```yaml
# 工具配置示例 (api_config.yaml)
tools:
  - name: verify_enterprise_four_factors
    endpoint: https://api.juhe.cn/enterprise/verify
    params: [company_name, legal_person, id_card, account_no]

  - name: get_enterprise_brief
    endpoint: https://api.juhe.cn/enterprise/brief
    params: [company_name]
```

**读取并解析配置：**
```bash
# 查找项目中的 api_config.yaml
find . -name "api_config.yaml" -o -name "api_config.yml" | head -3

# 或查看 ragent/tools/api_tools/config/ 目录
ls /workspace/ragent/tools/api_tools/config/
```

### 2. 单工具调用

根据用户需求匹配合适的工具，直接调用：

| 工具 | 适用场景 |
|------|---------|
| `verify_enterprise_four_factors` | 营业执照+法人+身份证+账号四要素核验 |
| `get_enterprise_brief` | 企业基本信息（名称/法人/注册资本/成立日期） |
| `get_enterprise_business_info` | 工商信息全量（注册地址/经营范围/状态） |
| `get_enterprise_branches` | 分支机构查询（分公司/子公司） |
| `get_enterprise_employees` | 主要人员（董事长/总经理/监事） |
| `get_enterprise_shareholders` | 股东信息（持股比例/出资额） |
| `get_enterprise_investment` | 对外投资（子公司/参股公司） |
| `get_enterprise_annual_report` | 工商年报（营收/资产/社保） |
| `query_legal_case` | 涉诉信息（立案/开庭/判决） |
| `get_enterprise_qualification` | 工程资质（建筑业/专业承包资质） |
| `get_enterprise_high_tech` | 高新技术企业认定状态 |
| `query_micro_enterprise` | 小微企业认定 |
| `get_enterprise_tax_arrears` | 欠税信息 |

### 3. 多工具编排工作流

**企业尽职调查（DD）工作流：**

```
1. verify_enterprise_four_factors  → 确认四要素真实
2. get_enterprise_brief             → 获取基本信息
3. get_enterprise_shareholders     → 核查股权结构
4. get_enterprise_investment       → 核查对外投资
5. query_legal_case                 → 核查法律风险
6. get_enterprise_tax_arrears      → 核查税务风险
→ 汇总输出《企业尽调报告》
```

**批量查询工作流：**

```
输入: [公司A, 公司B, 公司C]
对每个公司并行执行:
  - get_enterprise_brief
  - query_legal_case
  - get_enterprise_high_tech
→ 汇总输出《批量企业报告》
```

---

## 工作流模式

### 快速查询（单工具）

当用户需求明确对应单一工具时，直接调用：

1. 解析用户输入 → 提取参数（公司名/法人名/身份证号等）
2. 匹配最合适的工具
3. 调用工具，返回结构化结果
4. 格式化输出（中文/表格/摘要）

### 完整尽调（多工具编排）

当用户需求复杂或模糊时，启动多工具编排：

```
step 1: 意图识别 + 参数提取
  tool: 自然语言理解
  params: { user_input: "帮我查一下这家公司靠不靠谱" }
  description: 从用户输入中识别公司名称和查询意图

step 2: 基础信息获取
  tool: exec / python
  params: { command: "python -c 'from src.tools import get_enterprise_brief; print(get_enterprise_brief(company_name))'" }
  description: 调用 get_enterprise_brief 获取基本信息

step 3: 风险筛查
  tool: exec / python
  params: { parallel: ["query_legal_case", "get_enterprise_tax_arrears"] }
  description: 并行调用涉诉+欠税API

step 4: 结果汇总
  tool: llm-task
  params: { prompt: "将以下企业数据汇总成尽调报告..." }
  description: LLM汇总所有结果，生成结构化报告
```

---

## 调用工具

### exec（Python直接调用）

在 `/workspace/ragent/tools/api_tools/` 目录下运行：

```bash
cd /workspace/ragent/tools/api_tools
export JUHE_API_KEY=your_api_key
python -c "
from src.tools import get_enterprise_brief, query_legal_case
import json

# 示例调用
result = get_enterprise_brief(company_name='示例公司')
print(json.dumps(result, ensure_ascii=False, indent=2))
"
```

### wecom_mcp（若配置了企业微信MCP）

使用 wecom_mcp 调用已部署的企业数据接口。

---

## 响应格式

### 查询成功

```
✅ 企业基础信息
━━━━━━━━━━━━━━━━━
公司名称: [name]
法定代表人: [legal_person]
注册资本: [registered_capital]
成立日期: [establishment_date]
经营状态: [business_status]
统一社会信用代码: [credit_code]

⚠️ 风险提示
━━━━━━━━━━━━━━━━━
欠税记录: [tax_arrears]
涉诉案件: [N] 件
...
```

### 查询失败

```
❌ 查询失败
━━━━━━━━━━━━━━━━━
原因: [API错误信息]
建议: [重试/检查API Key/更换查询参数]
```

---

## 环境要求

- Python 3.10+
- 依赖包: `pip install -r /workspace/ragent/tools/api_tools/requirements.txt`
- API Key: 聚合数据平台 API Key（配置在 `.env` 或环境变量 `JUHE_API_KEY`）
- Redis（可选）: 用于缓存加速

---

## 缓存策略

工具内置 Redis 缓存，相同查询在 TTL 内直接返回缓存结果：

- 企业基本信息缓存: 24小时
- 涉诉/欠税数据缓存: 1小时
- 四要素核验缓存: 不缓存（实时性要求高）

---

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| API Key 无效 | 提示配置 API Key，参考 `.env.example` |
| 请求超限（429） | 自动退避 + 重试，最多重试3次 |
| 网络超时 | 重试，最多重试3次 |
| 字段映射错误 | 日志记录 + 返回原始响应 |

---

## 扩展方向

- 接入更多数据源（天眼查API、启信宝API）
- 支持企业关系图谱生成（股权+任职+投资关系）
- 支持报告导出（Markdown/PDF）
