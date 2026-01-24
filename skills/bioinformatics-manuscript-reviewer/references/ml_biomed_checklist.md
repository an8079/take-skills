# 机器学习在生物医学应用检查清单

## 数据泄露检测（Critical）

### 常见数据泄露来源

| 泄露类型 | 描述 | 检测方法 |
|----------|------|----------|
| 时间泄露 | 使用未来信息预测过去 | 检查数据时间戳 |
| 目标泄露 | 特征包含目标信息 | 特征与目标相关性分析 |
| 训练测试污染 | 测试集信息用于训练 | 严格的数据划分流程审查 |
| 特征选择泄露 | 在全数据上选择特征 | 特征选择必须在CV内 |
| 预处理泄露 | 使用全数据统计量标准化 | 标准化参数仅从训练集计算 |

### 数据泄露检查清单

```
□ 数据划分是否在任何预处理之前完成？
□ 特征选择是否在交叉验证循环内部进行？
□ 标准化/归一化是否仅基于训练数据？
□ 是否有来自同一患者的样本分布在训练和测试集？
□ 时间序列数据是否按时间划分（不是随机）？
□ 是否存在特征与标签高度相关（>0.9）的情况？
□ 交叉验证是否正确分组（如按患者分组）？
```

---

## 模型验证层次

### 验证层级金字塔

```
                    ┌─────────────────┐
                    │  前瞻性验证     │  ← 最高（Nature 主刊）
                    │  (Prospective)  │
                    ├─────────────────┤
                    │  多中心外部验证 │  ← Nature 子刊水平
                    │  (Multi-center) │
                    ├─────────────────┤
                    │  单中心外部验证 │  ← Nature Communications
                    │  (External)     │
                    ├─────────────────┤
                    │  时间外部验证   │  ← 可接受
                    │  (Temporal)     │
                    ├─────────────────┤
                    │  嵌套交叉验证   │  ← 最低可接受
                    │  (Nested CV)    │
                    ├─────────────────┤
                    │  简单交叉验证   │  ← 不足
                    │  (Simple CV)    │
                    └─────────────────┘
```

### 各层级详细要求

**嵌套交叉验证（最低要求）：**
```python
# 正确实现
from sklearn.model_selection import GridSearchCV, cross_val_score

# 外层 CV 评估模型泛化能力
# 内层 CV 进行超参数调优
outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

clf = GridSearchCV(estimator=model, param_grid=param_grid, cv=inner_cv)
nested_scores = cross_val_score(clf, X, y, cv=outer_cv, scoring='roc_auc')

# 报告：mean ± std of outer CV scores
```

**外部验证（推荐）：**
- 来自不同机构/时间的独立数据
- 样本量足够（通常 n > 100）
- 与训练数据有代表性差异

**多中心验证（高质量）：**
- 至少 3 个独立中心
- 地理/人口学多样性
- 技术平台可能不同

---

## 性能指标报告

### 分类问题必须报告

| 指标 | 公式 | 何时重要 |
|------|------|----------|
| AUC-ROC | - | 总体判别能力 |
| AUC-PR | - | 类别不平衡时 |
| Accuracy | (TP+TN)/(TP+TN+FP+FN) | 类别平衡时 |
| Precision | TP/(TP+FP) | 假阳性代价高 |
| Recall/Sensitivity | TP/(TP+FN) | 假阴性代价高 |
| Specificity | TN/(TN+FP) | 排除诊断 |
| F1 Score | 2×(P×R)/(P+R) | 综合评价 |
| MCC | - | 不平衡数据 |

### 回归问题必须报告

| 指标 | 说明 |
|------|------|
| R² | 解释方差比例 |
| RMSE | 误差量级 |
| MAE | 平均绝对误差 |
| Pearson r | 线性相关 |
| Spearman ρ | 秩相关 |

### 报告格式标准

```
正确格式：
"Our model achieved an AUC of 0.85 (95% CI: 0.81-0.89) on the
external validation set (n=500), compared to the baseline model
(AUC: 0.72, 95% CI: 0.67-0.77, DeLong test p < 0.001)."

错误格式：
"Our model achieved 85% accuracy." ← 缺少置信区间、样本量、比较
```

---

## 类别不平衡处理

### 识别不平衡

```
轻微不平衡: 1:2 ~ 1:5
中度不平衡: 1:5 ~ 1:20
严重不平衡: > 1:20

医学数据常见严重不平衡！
```

### 处理策略

| 策略 | 方法 | 优缺点 |
|------|------|--------|
| 重采样 | SMOTE, ADASYN, Random Oversampling | 可能过拟合 |
| 欠采样 | Random, Tomek Links | 丢失信息 |
| 类别权重 | class_weight='balanced' | 简单有效 |
| 阈值调整 | 基于成本敏感选择阈值 | 需要领域知识 |
| 集成方法 | BalancedRandomForest | 稳健 |

### 报告要求

```
必须报告：
1. 训练集/测试集的类别分布
2. 使用的处理策略（如有）
3. 使用的评估指标（AUC-PR 优于 AUC-ROC）
4. 校准曲线（calibration curve）
```

---

## 可解释性要求

### Nature 级别期刊期望

**必须提供：**
1. 特征重要性排序
2. 重要特征的生物学解释
3. 案例分析（典型正确/错误预测）

**推荐提供：**
1. SHAP 值分析
2. Attention 可视化（如适用）
3. 与已知生物学通路的关联

### 可解释性方法

| 方法 | 适用模型 | 输出 |
|------|----------|------|
| Feature Importance | Tree-based | 全局特征重要性 |
| Permutation Importance | Any | 全局特征重要性 |
| SHAP | Any | 全局+局部解释 |
| LIME | Any | 局部解释 |
| Attention weights | Transformer | 输入重要性 |
| Grad-CAM | CNN | 图像区域重要性 |
| Integrated Gradients | DNN | 特征贡献 |

### SHAP 分析报告模板

```python
# 标准 SHAP 分析
import shap

explainer = shap.TreeExplainer(model)  # 或其他 explainer
shap_values = explainer.shap_values(X_test)

# 必须包含的图表：
# 1. Summary plot (beeswarm)
shap.summary_plot(shap_values, X_test)

# 2. 重要特征的 dependence plot
shap.dependence_plot("feature_name", shap_values, X_test)

# 3. 个案分析
shap.force_plot(explainer.expected_value, shap_values[0], X_test.iloc[0])
```

---

## 代码和数据共享要求

### 代码共享标准

```
必须包含：
├── README.md          # 详细使用说明
├── requirements.txt   # Python 依赖
├── environment.yml    # Conda 环境
├── Dockerfile         # 完整环境（推荐）
├── data/
│   └── sample_data/   # 示例数据
├── src/
│   ├── preprocessing.py
│   ├── model.py
│   ├── train.py
│   └── evaluate.py
├── notebooks/
│   └── demo.ipynb     # 演示笔记本
└── scripts/
    └── reproduce.sh   # 一键复现脚本
```

### README 必须内容

```markdown
# Project Name

## Requirements
- Python 3.8+
- 依赖列表

## Installation
```bash
pip install -r requirements.txt
# 或
conda env create -f environment.yml
```

## Data
- 数据下载链接
- 数据格式说明
- 预处理步骤

## Usage
```bash
python train.py --config config.yaml
python evaluate.py --model model.pkl --data test.csv
```

## Reproduce Results
```bash
bash scripts/reproduce.sh
```

## Citation
```

### 数据共享

**原始数据：**
- 上传到 GEO/SRA/ENA
- 提供访问编号

**处理后数据：**
- 提供下载链接
- 说明处理步骤
- 格式文档

---

## 常见审稿问题与回复

### 问题1：数据泄露担忧

**审稿意见：**
"Concerned about potential data leakage in the model training."

**回复模板：**
```
Thank you for raising this important concern. We have carefully
designed our pipeline to prevent data leakage:

1. Data splitting: Train/validation/test split (60/20/20) was
   performed BEFORE any preprocessing or feature selection.

2. Feature selection: All feature selection was performed within
   the inner loop of nested cross-validation.

3. Normalization: z-score normalization parameters were computed
   solely from the training fold and applied to validation/test.

4. Patient-level splitting: Samples from the same patient were
   never split across training and test sets.

We have added a detailed description in Methods (lines XX-XX)
and provided our complete pipeline code in the GitHub repository.
```

### 问题2：外部验证不足

**审稿意见：**
"The model was only validated on internal data. External validation
is necessary."

**回复模板：**
```
We appreciate this constructive feedback. In the revised manuscript,
we have:

1. Added external validation using the [Dataset Name] cohort
   (n=XXX) from [Institution/Source].

2. Our model achieved AUC of X.XX (95% CI: X.XX-X.XX) on this
   independent dataset, compared to X.XX on the internal test set.

3. We observed [consistent/slightly reduced] performance, which
   we attribute to [reasons].

The external validation results are now presented in Figure X
and Table X. We have also updated Methods section (lines XX-XX)
with details of this validation.
```

### 问题3：可解释性不足

**审稿意见：**
"The biological interpretability of the model is limited."

**回复模板：**
```
Thank you for this valuable suggestion. We have enhanced the
interpretability analysis:

1. Added SHAP analysis (new Figure X) showing global feature
   importance and individual prediction explanations.

2. The top 10 features include [gene names], which are known to
   be involved in [biological process] based on [references].

3. Pathway enrichment analysis of the top features revealed
   significant enrichment in [pathways] (adjusted p < 0.05).

4. We provide detailed case studies of [N] patients showing
   how the model predictions align with clinical features.

These additions strengthen the biological relevance of our
findings and provide insights into the model's decision-making
process.
```
