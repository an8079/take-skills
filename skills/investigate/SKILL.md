---
name: investigate
description: 系统性调试与根因分析技能。四阶段调查法：调查→分析→假设→实施。核心原则：没有根因分析不修复。使用于调试 bug、排查错误、分析异常行为。
tags: [debugging, investigation, root-cause, troubleshooting, debugging]
---

# Investigate - 系统性调试与根因分析

## 核心理念

**铁律：没有根因分析不修复。**

快速修复（打补丁）vs 正确修复（根因分析）：
- 快速修复：5 分钟，立即见效，但同样的问题会再次出现
- 根因分析：1 小时，但问题永远消失

## 四阶段调查法

```
阶段 1: 调查 ─── 收集所有证据
    ↓
阶段 2: 分析 ─── 识别模式和异常
    ↓
阶段 3: 假设 ─── 形成可测试的假设
    ↓
阶段 4: 实施 ─── 验证假设并修复
```

## 阶段 1: 调查（Collect Evidence）

### 收集错误信息
```bash
# 收集错误日志
grep -A 20 "ERROR\|Exception\|Traceback" logs/*.log

# 收集相关时间戳
grep "2026-03-27.*ERROR" logs/app.log

# 收集请求追踪
grep -B 5 -A 10 "request_id_abc123" logs/*.log
```

### 确定时间线
```
T0: 问题首次出现时间
T1: 最后一次正常工作时间
T2: 问题消失时间（如果有）
T3: 当前调查时间
```

### 收集上下文
1. **环境信息**
   - OS 版本、依赖版本
   - 配置变更历史
   - 部署记录

2. **用户行为**
   - 什么操作触发了问题？
   - 问题出现的频率？
   - 是否特定用户/数据/时间？

3. **系统状态**
   - 错误发生时的 CPU/内存/网络
   - 数据库连接池状态
   - 外部服务可用性

### 调查检查清单
```
[ ] 完整的错误堆栈
[ ] 相关日志片段
[ ] 问题发生的时间范围
[ ] 问题影响范围（用户数/请求数）
[ ] 最近的环境变更
[ ] 相关配置值
[ ] 外部依赖状态
```

## 阶段 2: 分析（Analyze Patterns）

### 模式识别
```typescript
// 常见错误模式
const ERROR_PATTERNS = {
  RACE_CONDITION: "间歇性失败 + 时序敏感",
  RESOURCE_LEAK: "随时间累积的问题 + 重启后消失",
  DATA_CORRUPTION: "特定数据触发 + 其他数据正常",
  NETWORK_BLIP: "外部服务超时 + 重试后成功",
  MEMORY_OVERFLOW: "大输入触发 + 小输入正常"
};
```

### 差异分析
```bash
# 对比正常和异常状态
diff <(kubectl get pods -o yaml) <(kubectl get pods -o yaml --all-namespaces)

# 对比配置差异
diff config/prod.yaml config/staging.yaml

# 对比代码版本
git log --oneline --since="1 day ago"
git diff main --stat | head -20
```

### 常见根因分类
```
根因类型        │ 典型特征                    │ 调查方向
────────────────┼────────────────────────────┼──────────────────
配置错误        │ 新部署后出现                │ 环境变量、配置文件
资源不足        │ 高负载时出现                │ CPU、内存、连接池
依赖故障        │ 外部服务超时                │ 第三方 API、日志
数据问题        │ 特定记录触发                │ 输入验证、数据迁移
并发问题        │ 间歇性、难以复现            │ 锁、日志时序
逻辑错误        │ 特定条件下计算错误          │ 边界条件、分支覆盖
```

## 阶段 3: 假设（Hypothesize）

### 形成假设框架
```
观察: [具体观察到的现象]
如果: [假设的原因] 是真的
那么: [可验证的预测]
验证: [如何测试这个假设]
```

### 示例
```
观察: API 响应时间从 200ms 增加到 2000ms
如果: 数据库查询缺少索引
那么: 解释计划应显示全表扫描
验证: 运行 EXPLAIN ANALYZE 查询
```

### 优先级排序
```
P0 (立刻验证): 导致服务不可用的假设
P1 (今天验证): 显著影响性能的假设  
P2 (本周验证): 边缘情况或低频问题
```

### 假设文档
```markdown
## 假设清单

### H1: 数据库索引缺失
- 置信度: 85%
- 验证方法: EXPLAIN ANALYZE
- 影响: 严重
- 验证状态: [ ]

### H2: 连接池耗尽
- 置信度: 40%
- 验证方法: 检查连接池 metrics
- 影响: 中等
- 验证状态: [ ]
```

## 阶段 4: 实施（Implement & Verify）

### 验证假设
```bash
# 数据库索引验证
psql -c "EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123"

# 连接池验证
curl http://localhost:9090/metrics | grep db_connections

# 压力测试验证
k6 run --vus 100 --duration 30s load-test.js
```

### 修复后验证清单
```
[ ] 修复在测试环境验证
[ ] 修复逻辑正确且完整
[ ] 没有引入新的问题
[ ] 监控已更新以检测回归
[ ] 文档已更新（如需要）
[ ] 相关团队已通知
```

### 复盘问题
```markdown
## 复盘文档

问题: [问题描述]
根因: [真正的根本原因]
修复: [实施的修复]
预防: [防止再次发生的措施]
教训: [团队学到的经验]
```

## 调查模板

### 紧急问题处理
```
🚨 紧急调查启动

问题摘要:
- 影响: [哪些功能/用户受影响]
- 严重度: [P0/P1/P2]
- 首次出现: [时间]
- 当前状态: [仍在发生/已解决]

时间线:
- HH:MM - [事件]
- HH:MM - [响应]
- HH:MM - [定位]
- HH:MM - [修复]

根因分析:
- [完成的分析]

修复方案:
- [具体修复步骤]

验证:
- [ ] 修复已部署
- [ ] 监控正常
- [ ] 告警已消除
```

### 根因分析报告
```
## RCA: [问题名称]
Date: YYYY-MM-DD
Severity: P0/P1/P2
Duration: X hours

### Summary
[问题的一句话说描述]

### Impact
- 受影响用户: X
- 业务影响: [具体描述]

### Timeline
| 时间 | 事件 |
|-----|------|
| HH:MM | [事件] |

### Root Cause
[详细分析]

### Contributing Factors
[导致问题恶化的因素]

### Resolution
[如何修复的]

### Action Items
| 任务 | Owner | 截止日期 |
|-----|-------|---------|
| [任务] | [人] | [日期] |

### Lessons Learned
[团队学到的教训]
```

## 常见调试技巧

### 日志追踪
```bash
# 追踪单个请求的完整流程
grep "request_id=abc123" logs/*.log | sort -t: -k2

# 追踪跨服务请求
grep -r "correlation_id=xyz" .

# 时间窗口分析
awk '/2026-03-27 14:/ && /ERROR/' logs/app.log
```

### 性能问题排查
```bash
# CPU 分析
perf record -g -p <pid>
perf report

# 内存分析
valgrind --leak-check=full ./your-program

# 网络追踪
tcpdump -i any -w capture.pcap port 5432
```

### 并发问题复现
```bash
# 重放请求
./replay-tool.py --input requests.json --concurrent 100

# 注入延迟测试
tc qdisc add dev eth0 netem delay 100ms
```

## 调试工具推荐

| 工具 | 用途 |
|-----|-----|
| `jq` | JSON 日志分析 |
| `grep/sed/awk` | 文本日志处理 |
| `streql` | 追踪相关性 ID |
| `sentry` | 错误追踪 |
| `jaeger` | 分布式追踪 |
| `prometheus` | 指标监控 |
| `lighthouse` | 前端性能 |
| `strace` | 系统调用追踪 |

## 总结

1. **不修复未调查的问题** - 打补丁只是临时解决方案
2. **收集证据优先** - 没有数据支撑的假设没有价值
3. **系统性思考** - 表面现象背后的深层原因
4. **验证每个假设** - 排除法缩小范围
5. **文档化经验** - 让团队从每次调查中学习
