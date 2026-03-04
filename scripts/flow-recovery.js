#!/usr/bin/env node

/**
 * Flow Recovery - 流程恢复机制
 *
 * 检测流程中断并提供恢复方案
 *
 * 用法:
 *   node scripts/flow-recovery.js check      - 检查当前状态
 *   node scripts/flow-recovery.js diagnose  - 诊断问题
 *   node scripts/flow-recovery.js recover    - 尝试恢复
 */

const fs = require('fs');
const path = require('path');

// 跨平台路径处理
const pathUtils = {
  normalize(filePath) {
    if (!filePath) return '';
    return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
  },
  resolve(...parts) {
    return this.normalize(path.resolve(...parts));
  },
  exists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
};

// 阶段依赖关系
const PHASE_DEPENDENCIES = {
  'interview': [],
  'spec': ['interview'],
  'plan': ['spec'],
  'code': ['plan'],
  'test': ['code'],
  'review': ['test'],
  'package': ['review']
};

class FlowRecovery {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.stateFile = path.join(this.baseDir, '.phase-state.yaml');
    this.scopeFile = path.join(this.baseDir, '.claude/scope.yaml');
  }

  /**
   * 检查当前状态
   */
  check() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 流程状态检查');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const issues = this.diagnose();

    if (issues.length === 0) {
      console.log('✅ 流程状态正常');
    } else {
      console.log(`⚠️  发现 ${issues.length} 个问题:`);
      console.log('');

      for (const issue of issues) {
        const icon = issue.severity === 'high' ? '🔴' : '🟡';
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   💡 建议: ${issue.suggestion}`);
        }
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return issues;
  }

  /**
   * 诊断问题
   */
  diagnose() {
    const issues = [];

    // 1. 检查阶段状态文件
    if (!pathUtils.exists(this.stateFile)) {
      issues.push({
        type: 'missing_state_file',
        severity: 'high',
        message: '阶段状态文件不存在',
        suggestion: '运行 phase-manager init 初始化项目'
      });
    } else {
      // 2. 检查阶段依赖
      const depIssues = this.checkPhaseDependencies();
      issues.push(...depIssues);

      // 3. 检查未完成的任务
      const taskIssues = this.checkUnfinishedTasks();
      issues.push(...taskIssues);

      // 4. 检查 Memory Bank
      const memoryIssues = this.checkMemoryBank();
      issues.push(...memoryIssues);
    }

    // 5. 检查开发边界
    if (!pathUtils.exists(this.scopeFile)) {
      issues.push({
        type: 'missing_scope',
        severity: 'low',
        message: '开发边界配置不存在',
        suggestion: '运行 scope-manager init 初始化边界'
      });
    }

    return issues;
  }

  /**
   * 检查阶段依赖
   */
  checkPhaseDependencies() {
    const issues = [];

    try {
      const content = fs.readFileSync(this.stateFile, 'utf8');
      const state = this.parseYAML(content);

      const phases = state.phases || [];
      const currentPhase = state.current_phase;

      // 检查当前阶段是否有未完成的依赖
      if (currentPhase && currentPhase.id) {
        const deps = PHASE_DEPENDENCIES[currentPhase.id] || [];

        for (const depId of deps) {
          const depPhase = phases.find(p => p.id === depId);
          if (depPhase && depPhase.status !== 'completed') {
            issues.push({
              type: 'incomplete_dependency',
              severity: 'high',
              message: `当前阶段 "${currentPhase.id}" 依赖 "${depId}" 未完成`,
              suggestion: `完成 ${depPhase.name} 后再继续`
            });
          }
        }
      }

      // 检查是否有阶段状态不一致
      for (const phase of phases) {
        if (phase.status === 'in_progress') {
          // 检查是否真的在进行中（可能是中断的）
          if (currentPhase && currentPhase.id !== phase.id) {
            issues.push({
              type: 'orphaned_phase',
              severity: 'medium',
              message: `阶段 "${phase.name}" 标记为进行中但不是当前阶段`,
              suggestion: `运行 phase-manager complete ${phase.id} 完成该阶段`
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        type: 'parse_error',
        severity: 'high',
        message: `无法解析阶段状态文件: ${error.message}`,
        suggestion: '检查 YAML 格式是否正确'
      });
    }

    return issues;
  }

  /**
   * 检查未完成的任务
   */
  checkUnfinishedTasks() {
    const issues = [];
    const memoryFile = path.join(this.baseDir, 'memory-bank/项目进展.md');

    if (pathUtils.exists(memoryFile)) {
      try {
        const content = fs.readFileSync(memoryFile, 'utf8');

        // 检查是否有长时间未完成的任务
        const taskMatch = content.match(/T-(\d+)\s+\|.*?\|\s+([^|]+)\s*\|/g);
        if (taskMatch) {
          for (const task of taskMatch) {
            if (task.includes('进行中') || task.includes('in_progress')) {
              // 检查是否有阻塞标记
              if (content.includes('阻塞') || content.includes('blocked')) {
                issues.push({
                  type: 'blocked_task',
                  severity: 'medium',
                  message: '存在被阻塞的任务',
                  suggestion: '解决阻塞问题后继续'
                });
                break;
              }
            }
          }
        }
      } catch {
        // 忽略
      }
    }

    return issues;
  }

  /**
   * 检查 Memory Bank
   */
  checkMemoryBank() {
    const issues = [];
    const memoryDir = path.join(this.baseDir, 'memory-bank');

    if (!pathUtils.exists(memoryDir)) {
      issues.push({
        type: 'missing_memory_bank',
        severity: 'high',
        message: 'Memory Bank 目录不存在',
        suggestion: '创建 memory-bank 目录和相关文件'
      });
      return issues;
    }

    // 检查必需的 Memory 文件
    const requiredFiles = ['项目进展.md', '技术决策.md', '学习记录.md'];
    for (const file of requiredFiles) {
      const filePath = path.join(memoryDir, file);
      if (!pathUtils.exists(filePath)) {
        issues.push({
          type: 'missing_memory_file',
          severity: 'medium',
          message: `Memory Bank 文件不存在: ${file}`,
          suggestion: `创建 ${file}`
        });
      }
    }

    return issues;
  }

  /**
   * 尝试恢复
   */
  recover() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 流程恢复');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const issues = this.diagnose();

    if (issues.length === 0) {
      console.log('✅ 无需恢复');
      return;
    }

    console.log(`发现 ${issues.length} 个问题，开始恢复...`);
    console.log('');

    // 自动修复的问题
    const autoFixable = issues.filter(i => this.canAutoFix(i.type));

    if (autoFixable.length > 0) {
      console.log('可自动修复的问题:');
      for (const issue of autoFixable) {
        console.log(`  - ${issue.type}`);
      }
      console.log('');
    }

    // 需要手动修复的问题
    const manualFix = issues.filter(i => !this.canAutoFix(i.type));

    if (manualFix.length > 0) {
      console.log('需要手动修复的问题:');
      for (const issue of manualFix) {
        console.log(`  - ${issue.type}: ${issue.suggestion}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 判断是否可以自动修复
   */
  canAutoFix(issueType) {
    const autoFixable = [
      'missing_scope',
      'missing_memory_file'
    ];
    return autoFixable.includes(issueType);
  }

  /**
   * 简单 YAML 解析
   */
  parseYAML(yaml) {
    const lines = yaml.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: -1 }];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = (line.match(/^\s*/)[0] || '').length / 2;

      if (trimmed.startsWith('-')) {
        const value = trimmed.slice(1).trim();

        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }

        const current = stack[stack.length - 1];

        if (value.includes(':')) {
          const colonIndex = value.indexOf(':');
          const key = value.slice(0, colonIndex).trim();
          const val = value.slice(colonIndex + 1).trim();

          const newObj = {};
          newObj[key] = this.parseValue(val);
          current.obj.push(newObj);
          stack.push({ obj: newObj, indent });
        } else {
          current.obj.push(this.parseValue(value));
        }
      } else {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex !== -1) {
          const key = trimmed.slice(0, colonIndex).trim();
          const value = trimmed.slice(colonIndex + 1).trim();

          while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
            stack.pop();
          }

          const current = stack[stack.length - 1];

          if (!value) {
            const newObj = {};
            current.obj[key] = newObj;
            stack.push({ obj: newObj, indent });
          } else {
            current.obj[key] = this.parseValue(value);
          }
        }
      }
    }

    return result;
  }

  parseValue(value) {
    if (value === 'null' || !value) return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    return value;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const recovery = new FlowRecovery();

    switch (command) {
      case 'check':
        recovery.check();
        break;

      case 'diagnose':
        const issues = recovery.diagnose();
        console.log(`发现 ${issues.length} 个问题`);
        break;

      case 'recover':
        recovery.recover();
        break;

      default:
        console.log('Flow Recovery - 流程恢复');
        console.log('');
        console.log('用法: node scripts/flow-recovery.js <command>');
        console.log('');
        console.log('命令:');
        console.log('  check     检查当前状态');
        console.log('  diagnose  诊断问题');
        console.log('  recover   尝试恢复');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = FlowRecovery;
