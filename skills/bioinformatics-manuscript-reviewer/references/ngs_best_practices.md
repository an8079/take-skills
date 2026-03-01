# NGS 数据分析最佳实践

## RNA-seq 分析标准

### 实验设计

| 因素 | 最低要求 | 推荐标准 | Nature 标准 |
|------|----------|----------|-------------|
| 生物学重复 | n ≥ 3 | n ≥ 5 | n ≥ 6 + power analysis |
| 测序深度 | 10M reads | 20-30M reads | 30-50M reads |
| 测序长度 | 50bp SE | 100bp PE | 150bp PE |

### 数据质控

**必须检查的指标：**
```
1. 碱基质量分布（Q30 > 85%）
2. GC 含量分布（应符合物种特征）
3. 接头污染（< 5%）
4. 重复序列比例
5. rRNA 污染（< 10%）
6. 比对率（> 70%）
7. 基因覆盖均匀性
```

**工具推荐：**
- FastQC: 原始数据质控
- MultiQC: 批量质控报告
- RSeQC: 比对后质控
- Picard: 重复标记

### 标准化方法选择

| 方法 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| TPM | 基因表达可视化 | 直观，可比较 | 不适合差异分析 |
| FPKM/RPKM | 历史数据兼容 | 考虑基因长度 | 样本间不可比 |
| TMM | 差异表达分析 | 统计学合理 | 需配合工具使用 |
| DESeq2 normalization | 差异表达分析 | 处理低表达基因 | 计算复杂 |

### 差异表达分析

**推荐工具（2024+）：**
1. DESeq2 - 默认首选，处理低表达基因好
2. edgeR - 适合小样本
3. limma-voom - 大样本量时效率高

**必须报告：**
- 使用的工具和版本
- 过滤条件（如 CPM > 1 in at least n samples）
- 多重检验校正方法（FDR/BH）
- 显著性阈值（adjusted p < 0.05）
- 效应量阈值（|log2FC| > 1）

---

## 单细胞 RNA-seq 分析标准

### 质控标准

| 指标 | 典型阈值 | 说明 |
|------|----------|------|
| nFeature_RNA | 200-5000 | 基因数过低=空液滴，过高=双细胞 |
| nCount_RNA | 500-30000 | 根据细胞类型调整 |
| percent.mt | < 10-20% | 死细胞线粒体比例高 |
| percent.ribo | 根据细胞类型 | 某些细胞类型正常高表达 |

### 批次效应校正

**常用方法：**
```
1. Seurat Integration (CCA/RPCA)
   - 优点：保留生物学差异
   - 缺点：计算量大

2. Harmony
   - 优点：快速，效果好
   - 缺点：可能过度校正

3. scVI
   - 优点：深度学习方法，处理复杂批次
   - 缺点：需要GPU

4. ComBat/limma
   - 优点：简单
   - 缺点：可能去除真实差异
```

### 聚类分辨率选择

**不要任意选择分辨率！必须说明依据：**

1. **Silhouette score**: 评估聚类质量
2. **Clustree**: 可视化不同分辨率下的聚类稳定性
3. **生物学验证**: marker 基因表达是否符合预期

### 细胞类型注释

**推荐方法层级：**
```
1. 自动注释（初筛）
   - SingleR
   - CellTypist
   - scType

2. Marker 基因验证
   - 经典 marker（必须列出）
   - Violin/Dot plot 展示

3. 实验验证（金标准）
   - FACS
   - Immunofluorescence
   - Spatial transcriptomics
```

---

## ChIP-seq / ATAC-seq 分析标准

### 测序深度要求

| 数据类型 | 最低深度 | 推荐深度 | 说明 |
|----------|----------|----------|------|
| ChIP-seq (点峰) | 10M | 20-40M | H3K4me3, TF |
| ChIP-seq (宽峰) | 20M | 40-60M | H3K27me3, H3K36me3 |
| ATAC-seq | 25M | 50-100M | 高信噪比要求 |
| Input/Control | 10-20M | 与 ChIP 匹配 | 必须有 |

### 峰值检测

**推荐工具：**
- MACS2: 默认首选
- SICER: 宽峰（组蛋白修饰）
- HOMER: motif 分析

**必须报告参数：**
```
macs2 callpeak -t chip.bam -c input.bam \
    -f BAM -g hs \
    -n sample_name \
    --outdir peaks \
    -q 0.01 \          # FDR 阈值
    --keep-dup auto    # 重复reads处理
```

### 重复一致性（IDR）

**Nature 级别要求必须报告 IDR：**
```
峰值重复一致性要求：
- 严格阈值: IDR < 0.01
- 宽松阈值: IDR < 0.05

报告内容：
- 总峰值数
- 通过 IDR 的峰值数
- 重复间 Pearson 相关
```

---

## 变异检测分析标准

### 体细胞突变检测

**推荐流程：**
```
1. 比对: BWA-MEM2 / Bowtie2
2. 预处理: GATK Best Practices
3. 突变检测:
   - Mutect2 (GATK) - 配对肿瘤-正常
   - Strelka2 - 高灵敏度
   - VarScan2 - 低覆盖度
4. 注释: VEP / ANNOVAR
5. 过滤: 自定义策略 + 数据库
```

**过滤标准示例：**
```
- 肿瘤 VAF > 5%
- 正常 VAF < 2%
- 总深度 > 10x
- 突变支持 reads > 3
- 排除 common SNPs (gnomAD AF > 0.01)
- 排除 Panel of Normals
```

### 报告要求

1. 工具版本
2. 参考基因组版本
3. 过滤参数完整列表
4. 验证率（Sanger/targeted seq）

---

## 通用质量标准

### 数据可重复性

**必须提供：**
1. **原始数据**: GEO/ENA/SRA 编号
2. **代码**: GitHub + Zenodo DOI
3. **环境**: Dockerfile / conda environment.yml
4. **文档**: README with step-by-step instructions

### 统计报告标准

**每个统计检验必须报告：**
```
- 检验方法名称
- 样本量 (n)
- 检验统计量
- p 值（精确到合理位数）
- 效应量（如适用）
- 多重检验校正方法（如适用）
- 95% 置信区间（如适用）
```

### 图表标准

**图表必须包含：**
```
- 完整的轴标签（含单位）
- 样本量 (n)
- 误差棒类型（SD/SEM/95%CI）
- 统计显著性标注
- 完整的图例
- 足够的分辨率 (300 DPI+)
- 色盲友好的配色
```
