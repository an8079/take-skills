# Nature 系列期刊具体要求

## Nature 主刊

### 投稿标准

**必须满足所有条件：**
1. **突破性发现**: 改变领域认知的重大发现
2. **广泛影响**: 对多个学科或广泛科学界有意义
3. **技术无懈可击**: 结论有充分实验/计算支持
4. **时效性**: 领域当前热点或开创新方向

### 格式要求

| 部分 | 要求 |
|------|------|
| 标题 | ≤ 10 个词，吸引眼球但准确 |
| 摘要 | ≤ 150 词，无参考文献，无缩写 |
| 正文 | 2,000-3,000 词（不含方法、图例、参考文献） |
| 方法 | 在线发表，详细完整，无字数限制 |
| 图表 | 通常 4-6 个主图 + Extended Data |
| 参考文献 | 约 30-50 篇 |

### 摘要结构（无标签）

```
[背景：1-2句] [问题/知识缺口：1句] [本研究做了什么：1-2句]
[主要发现1：1-2句] [主要发现2：1-2句（如有）]
[意义/影响：1-2句]
```

**示例（150词内）：**
```
Single-cell technologies have revolutionized our understanding of
cellular heterogeneity, yet integrating data across modalities
remains challenging. Here we present [Method Name], a computational
framework that enables seamless integration of single-cell
multi-omics data. Applied to [X] cells from [Y] samples, we
identify [N] previously uncharacterized cell states and reveal
a novel regulatory axis connecting [Factor A] to [Phenotype B].
We validate these findings through [experimental approach],
demonstrating that perturbation of [target] leads to [outcome].
Our approach outperforms existing methods by [metric], and we
provide an open-source implementation with documentation. These
results establish a new paradigm for multi-omics data integration
and provide insights into [biological process] with implications
for [disease/application].
```

### Extended Data 使用

**适合放入 Extended Data 的内容：**
- 方法验证和基准测试
- 补充统计分析
- 额外的验证实验
- 详细的数据质控
- 敏感性分析
- 阴性对照结果

**格式：**
- Extended Data Figure 1-10（最多 10 个）
- Extended Data Table 1-10（最多 10 个）
- 每个必须在正文中引用

---

## Nature Methods

### 特殊要求

**核心关注点：**
1. **方法创新性**: 必须是显著新颖或改进
2. **广泛适用性**: 不限于特定数据集或问题
3. **严格 benchmarking**: 全面、公平的方法比较
4. **易用性**: 代码公开、文档完善

### 格式要求

| 部分 | 要求 |
|------|------|
| 标题 | 包含方法名称 |
| 摘要 | ≤ 150 词 |
| 正文 | ≤ 3,000 词 |
| 方法 | 详细，在线发表 |
| 图表 | 5-7 个主图 |

### Benchmarking 要求

**必须包含：**
```
1. 与现有方法的全面比较（≥3 种方法）
2. 多个数据集上的测试
3. 多个评估指标
4. 计算资源消耗比较
5. 公平比较条件（相同数据划分、参数优化）
6. 统计显著性检验
```

**Benchmarking 表格模板：**

| Method | Dataset 1 AUC | Dataset 2 AUC | Runtime | Memory |
|--------|---------------|---------------|---------|--------|
| Ours | **0.92 ± 0.02** | **0.89 ± 0.03** | 5 min | 4 GB |
| Method A | 0.85 ± 0.03 | 0.82 ± 0.04 | 15 min | 8 GB |
| Method B | 0.88 ± 0.02 | 0.84 ± 0.03 | 10 min | 6 GB |

### 代码/软件要求

**必须：**
- GitHub 仓库（公开）
- 详细 README
- 安装说明
- 示例数据和教程
- 许可证声明

**推荐：**
- Docker/Singularity 容器
- 持续集成测试
- API 文档
- Zenodo DOI

---

## Nature Communications

### 投稿标准

**相比 Nature 主刊：**
- 创新性要求稍低
- 仍需技术严谨
- 领域内重要性即可
- 不强求跨学科影响

### 格式要求

| 部分 | 要求 |
|------|------|
| 摘要 | ≤ 150 词 |
| 正文 | ≤ 5,000 词 |
| 方法 | 在线发表 |
| 图表 | 8-10 个主图 |
| 参考文献 | 无限制 |

### 审稿周期

- 初审：2-4 周
- 同行评审：4-8 周
- 修改后再审：2-4 周
- 总周期：3-6 个月

---

## Nature Biotechnology

### 特殊关注点

1. **技术创新**: 新的生物技术或方法
2. **应用潜力**: 实际应用前景
3. **产业相关性**: 对生物技术产业的影响

### 格式要求

与 Nature 主刊类似，但：
- 正文可达 4,000 词
- 强调技术细节
- 需要讨论商业化潜力

---

## Nature Genetics

### 特殊关注点

1. **遗传发现**: 新的遗传关联或机制
2. **人群规模**: 大规模遗传学研究
3. **功能验证**: 遗传发现的功能验证

### 生物信息学相关要求

**GWAS 研究：**
- 样本量足够（通常 n > 10,000）
- 独立验证队列
- 功能注释（eQTL, chromatin）
- 精细定位分析

**基因组学研究：**
- 完整的方法描述
- 数据共享（dbGaP/EGA）
- 可重复性材料

---

## 通用要求

### 数据可用性声明

**模板：**
```
Data Availability:
The raw sequencing data have been deposited in [GEO/SRA/ENA]
under accession number [GSEXXXXX]. Processed data are available
at [Zenodo DOI/figshare]. [Any restrictions and how to access].
Source data for all figures are provided with this paper.
```

### 代码可用性声明

**模板：**
```
Code Availability:
All custom code used in this study is available at
[GitHub URL] and archived at [Zenodo DOI]. The repository
includes documentation, example data, and tutorials for
reproducing the main analyses.
```

### 作者贡献声明

**模板：**
```
Author Contributions:
A.B. conceived the study. A.B. and C.D. designed the experiments.
E.F. performed the experiments. G.H. developed the computational
methods. A.B., C.D., and G.H. analyzed the data. A.B. wrote the
manuscript with input from all authors. All authors approved the
final version.
```

### 利益冲突声明

**无冲突：**
```
Competing Interests:
The authors declare no competing interests.
```

**有冲突：**
```
Competing Interests:
A.B. is a consultant for [Company]. C.D. holds equity in
[Company]. The remaining authors declare no competing interests.
```

---

## 审稿人视角

### 审稿人评估维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 创新性 | 30% | 对领域的贡献 |
| 技术严谨性 | 30% | 方法学和统计学 |
| 数据支撑 | 20% | 结论是否有充分支持 |
| 表达清晰度 | 10% | 写作和图表质量 |
| 影响力 | 10% | 潜在的影响范围 |

### 常见拒稿原因

**致命问题（直接拒稿）：**
1. 创新性不足（增量改进）
2. 严重的方法学缺陷
3. 结论不被数据支持
4. 类似工作已发表

**可修复问题（大修）：**
1. 需要额外验证
2. 统计分析需改进
3. 表达不清晰
4. 缺少关键对照

### 审稿人期望的回复

**好的修改回复：**
```
Reviewer Comment:
"The sample size is too small for the claimed conclusions."

Author Response:
We thank the reviewer for this important point. We have addressed
this concern in three ways:

1. We increased the sample size from n=50 to n=150 by including
   additional cohorts from [source] (new Figure 2a).

2. We performed power analysis showing that our revised sample
   size provides 80% power to detect effect size d=0.3
   (Supplementary Table 1).

3. We replicated key findings in an independent external cohort
   (n=200) from [institution] (new Figure 3b).

These additions substantially strengthen our conclusions.
See revised manuscript, lines XX-XX and Figures 2-3.
```

**差的修改回复：**
```
Reviewer Comment:
"The sample size is too small for the claimed conclusions."

Author Response:
We respectfully disagree. Our sample size is typical for this
type of study. [No additional analysis provided]
```

---

## 投稿策略建议

### 期刊选择流程

```
┌─────────────────────────────────────┐
│ 评估：是否有突破性发现？             │
│         ↓ Yes              ↓ No     │
│    ┌────────┐        ┌──────────┐   │
│    │Nature  │        │Nature    │   │
│    │Science │        │Comms/    │   │
│    │Cell    │        │专业期刊  │   │
│    └───┬────┘        └──────────┘   │
│        ↓                            │
│ 拒稿后：Nature子刊 → NC → 专业期刊  │
└─────────────────────────────────────┘
```

### 生物信息学论文期刊梯队

**第一梯队（IF > 30）：**
- Nature
- Science
- Cell
- Nature Methods
- Nature Biotechnology

**第二梯队（IF 15-30）：**
- Nature Communications
- Nature Genetics
- Genome Biology
- Nucleic Acids Research

**第三梯队（IF 5-15）：**
- Bioinformatics
- BMC Bioinformatics
- PLOS Computational Biology
- Briefings in Bioinformatics

### 投稿前检查清单

```
□ 选择了合适的期刊
□ 阅读了期刊 author guidelines
□ 格式符合要求（字数、图表数）
□ 摘要无参考文献和缩写
□ 所有图表都在正文中引用
□ 数据/代码可用性声明完整
□ 作者贡献和利益冲突声明完整
□ 伦理声明（如涉及人类/动物研究）
□ Cover letter 准备完成
□ 建议和排除的审稿人名单
```
