#!/usr/bin/env node

/**
 * Phase Manager - 阶段状态管理器
 *
 * 用于管理项目开发的 8 个阶段进度跟踪
 *
 * 用法:
 *   node scripts/phase-manager.js status      - 显示当前阶段进度
 *   node scripts/phase-manager.js start <id> - 开始指定阶段
 *   node scripts/phase-manager.js complete <id> - 完成指定阶段
 *   node scripts/phase-manager.js next        - 显示下一步
 *   node scripts/phase-manager.js validate <id> - 验证是否可执行阶段
 */

const fs = require('fs');
const path = require('path');

const PHASE_STATE_FILE = '.phase-state.yaml';
const PROJECT_DIR = process.cwd();

class PhaseManager {
  constructor(baseDir = PROJECT_DIR) {
    this.baseDir = baseDir;
    this.stateFilePath = path.join(baseDir, PHASE_STATE_FILE);
    this.state = this.loadState();
  }

  /**
   * 加载阶段状态文件
   */
  loadState() {
    if (fs.existsSync(this.stateFilePath)) {
      const content = fs.readFileSync(this.stateFilePath, 'utf8');
      return this.parseYAML(content);
    }
    console.log(`⚠️  阶段状态文件不存在，将创建新文件: ${this.stateFilePath}`);
    return this.createInitialState();
  }

  /**
   * 保存阶段状态
   */
  saveState() {
    const yaml = this.toYAML(this.state);
    fs.writeFileSync(this.stateFilePath, yaml, 'utf8');
    this.updateTimestamp();
  }

  /**
   * 更新时间戳
   */
  updateTimestamp() {
    const now = new Date().toISOString();
    if (!this.state.project.last_update) {
      this.state.project.start_time = now;
    }
    this.state.project.last_update = now;
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase() {
    if (!this.state.current_phase.id) {
      // 如果没有当前阶段，返回第一个 pending 阶段
      return this.state.phases.find(p => p.status === 'pending') || null;
    }
    return this.state.current_phase;
  }

  /**
   * 获取所有阶段
   */
  getAllPhases() {
    return this.state.phases;
  }

  /**
   * 根据ID获取阶段
   */
  getPhaseById(id) {
    return this.state.phases.find(p => p.id === id);
  }

  /**
   * 获取下一个阶段
   */
  getNextPhase() {
    const currentId = this.state.current_phase.id;
    if (!currentId) {
      return this.state.phases.find(p => p.status === 'pending') || null;
    }
    const currentIndex = this.state.phases.findIndex(p => p.id === currentId);
    return this.state.phases[currentIndex + 1] || null;
  }

  /**
   * 检查阶段是否可执行
   */
  canExecutePhase(phaseId) {
    const phase = this.getPhaseById(phaseId);
    if (!phase) {
      return { can: false, reason: `阶段 "${phaseId}" 不存在` };
    }

    if (phase.status === 'completed') {
      return { can: false, reason: `阶段 "${phase.name}" 已完成` };
    }

    if (phase.status === 'in_progress') {
      return { can: true, reason: `阶段 "${phase.name}" 正在进行中` };
    }

    // 检查依赖是否完成
    if (phase.depends && phase.depends.length > 0) {
      const notCompleted = [];
      for (const depId of phase.depends) {
        const depPhase = this.getPhaseById(depId);
        if (depPhase && depPhase.status !== 'completed') {
          notCompleted.push(depPhase);
        }
      }
      if (notCompleted.length > 0) {
        return {
          can: false,
          reason: `依赖阶段未完成: ${notCompleted.map(p => p.name).join(', ')}`,
          missingDeps: notCompleted
        };
      }
    }

    return { can: true, reason: '可以执行' };
  }

  /**
   * 检查是否可以切换到指定阶段（canExecutePhase 的别名）
   * 用于 Agent 切换阶段时的验证
   */
  canTransitionTo(phaseId) {
    return this.canExecutePhase(phaseId);
  }

  /**
   * 检查当前阶段是否已完成
   */
  isCurrentPhaseCompleted() {
    const current = this.getCurrentPhase();
    return current && current.status === 'completed';
  }

  /**
   * 获取阶段状态
   */
  getPhaseStatus(phaseId) {
    const phase = this.getPhaseById(phaseId);
    return phase ? phase.status : null;
  }

  /**
   * 开始指定阶段
   */
  startPhase(phaseId) {
    const check = this.canExecutePhase(phaseId);
    if (!check.can) {
      console.log(`❌ 无法开始阶段: ${check.reason}`);
      return false;
    }

    // 如果有正在进行的阶段，先完成它
    if (this.state.current_phase.status === 'in_progress') {
      this.completePhase(this.state.current_phase.id);
    }

    const phase = this.getPhaseById(phaseId);
    phase.status = 'in_progress';
    phase.start_time = new Date().toISOString();

    this.state.current_phase = {
      id: phase.id,
      name: phase.name,
      status: 'in_progress',
      start_time: phase.start_time,
      end_time: null,
      notes: []
    };

    this.saveState();
    return true;
  }

  /**
   * 完成指定阶段
   */
  completePhase(phaseId) {
    const phase = this.getPhaseById(phaseId);
    if (!phase) {
      console.log(`❌ 阶段 "${phaseId}" 不存在`);
      return false;
    }

    if (phase.status === 'completed') {
      console.log(`⚠️  阶段 "${phase.name}" 已经完成`);
      return false;
    }

    phase.status = 'completed';
    phase.end_time = new Date().toISOString();

    // 更新当前阶段
    if (this.state.current_phase.id === phaseId) {
      this.state.current_phase.status = 'completed';
      this.state.current_phase.end_time = phase.end_time;

      // 移动到下一个阶段
      const next = this.getNextPhase();
      if (next && next.status === 'pending') {
        this.state.current_phase = {
          id: next.id,
          name: next.name,
          status: 'pending',
          start_time: null,
          end_time: null,
          notes: []
        };
      }
    }

    this.saveState();
    return true;
  }

  /**
   * 获取整体进度
   */
  getPhaseProgress() {
    const total = this.state.phases.length;
    const completed = this.state.phases.filter(p => p.status === 'completed').length;
    const inProgress = this.state.phases.find(p => p.status === 'in_progress');
    const percentage = Math.round((completed / total) * 100);

    return { total, completed, inProgress, percentage };
  }

  /**
   * 渲染进度显示
   */
  renderProgress() {
    const { total, completed, inProgress, percentage } = this.getPhaseProgress();
    const current = this.getCurrentPhase();

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`🎯 项目：${this.state.project.name || '未命名'}  |  进度：${completed}/${total} (${percentage}%)`);
    console.log('═══════════════════════════════════════');

    if (current) {
      console.log('');
      console.log(`📋 当前阶段：${current.name}  [${this.getStatusIcon(current.status)}]`);
      console.log('');
    if (current.description) {
      console.log(`   ${current.description}`);
    }
    if (current.command) {
      console.log(`   命令: ${current.command}`);
    }
      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('阶段进度：');
    console.log('');

    for (const phase of this.state.phases) {
      const icon = this.getStatusIcon(phase.status);
      const badge = this.getStatusBadge(phase.status);
      const marker = (inProgress && phase.id === inProgress.id) ? '→ ' : '  ';

      console.log(`${marker}${icon} ${phase.name.padEnd(12)} ${badge}`);

      // 显示依赖关系
      if (phase.depends && phase.depends.length > 0) {
        const deps = phase.depends.map(d => this.getPhaseById(d)?.name || d).join(', ');
        console.log(`   依赖: ${deps}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('');
  }

  /**
   * 获取状态图标

   */
  getStatusIcon(status) {
    const icons = {
      'pending': '⬜',
      'in_progress': '🔄',
      'completed': '✅',
      'skipped': '⏭️'
    };
    return icons[status] || '❓';
  }

  /**
   * 获取状态标签
   */
  getStatusBadge(status) {
    const badges = {
      'pending': '[待开始]',
      'in_progress': '[进行中]',
      'completed': '[已完成]',
      'skipped': '[已跳过]'
    };
    return badges[status] || '[未知]';
  }

  /**
   * 初始化新项目状态
   */
  createInitialState() {
    const initialState = {
      project: {
        name: "新项目",
        start_time: null,
        end_time: null,
        last_update: null
      },
      current_phase: {
        id: null,
        name: null,
        status: "pending",
        start_time: null,
        end_time: null,
        notes: []
      },
      phases: [
        {
          id: "interview",
          name: "需求访谈",
          command: "/interview",
          description: "深入理解项目需求和用户期望",
          depends: [],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "spec",
          name: "规格设计",
          command: "/spec",
          description: "设计系统架构，制定技术选型",
          depends: ["interview"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "plan",
          name: "实现计划",
          command: "/plan",
          description: "拆解任务清单，识别依赖关系",
          depends: ["spec"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "code",
          name: "编码实现",
          command: "/code",
          description: "按计划实现功能",
          depends: ["plan"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "test",
          name: "测试验证",
          command: "/test",
          description: "生成并执行测试",
          depends: ["code"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "review",
          name: "代码审查",
          command: "/review",
          description: "代码质量检查和安全审计",
          depends: ["test"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "package",
          name: "打包交付",
          command: "/package",
          description: "构建项目，生成交付包",
          depends: ["review"],
          status: "pending",
          start_time: null,
          end_time: null
        },
        {
          id: "optimize",
          name: "迭代优化",
          command: "/reflect",
          description: "分析项目，提取可复用模式",
          depends: ["package"],
          status: "pending",
          start_time: null,
          end_time: null
        }
      ],
      version: "1.0"
    };

    this.updateTimestamp();
    return initialState;
  }

  /**
   * 简化的 YAML 解析器
   */
  parseYAML(yaml) {
    // 这是一个简化的解析器，用于读取项目生成的 YAML
    // 实际生产环境应使用 js-yaml 等专业库

    // 先预解析：将缩进转换为层级
    const lines = yaml.split('\n');
    const parsed = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // 跳过注释和空行
      if (!trimmed || trimmed.startsWith('#')) continue;

      // 计算缩进层级
      const indent = (line.match(/^\s*/)[0] || '').length / 2;

      parsed.push({
        indent,
        trimmed,
        line
      });
    }

    const result = {};
    const stack = [{ obj: result, key: null, isArray: false, indent: -1 }];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      const nextItem = parsed[i + 1];

      // 处理数组项 (- 开头)
      if (item.trimmed.startsWith('-')) {
        const value = item.trimmed.slice(1).trim();

        // 找到当前数组上下文
        while (stack.length > 1 && !stack[stack.length - 1].isArray) {
          stack.pop();
        }

        const arrayContext = stack[stack.length - 1];

        if (value.includes(':')) {
          // 数组中的对象
          const colonIndex = value.indexOf(':');
          const key = value.slice(0, colonIndex).trim();
          const val = value.slice(colonIndex + 1).trim();

          const newObject = {};
          arrayContext.obj.push(newObject);
          stack.push({ obj: newObject, key, isArray: false, indent: item.indent });

          if (val !== '') {
            newObject[key] = this.parseValue(val);
          }
        } else if (value === '' || value === '[]') {
          // 需要检查下一行确定类型
          const nextIndent = nextItem?.indent ?? item.indent + 1;
          const isArray = value === '[]' || (nextItem && nextItem.trimmed.startsWith('-'));

          if (isArray) {
            const newArray = [];
            arrayContext.obj.push(newArray);
            stack.push({ obj: newArray, key: null, isArray: true, indent: item.indent });
          } else {
            const newObject = {};
            arrayContext.obj.push(newObject);
            stack.push({ obj: newObject, key: null, isArray: false, indent: item.indent });
          }
        } else {
          // 简单值
          arrayContext.obj.push(this.parseValue(value));
        }
        continue;
      }

      // 处理键值对
      const colonIndex = item.trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = item.trimmed.slice(0, colonIndex).trim();
        const value = item.trimmed.slice(colonIndex + 1).trim();

        // 处理缩进变化
        while (stack.length > 1 && item.indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }

        const current = stack[stack.length - 1];

        if (value === '' || value === '[]') {
          // 这是一个对象或数组
          const nextTrimmed = nextItem?.trimmed ?? '';
          const isArray = value === '[]' || nextTrimmed.startsWith('-');

          const newValue = isArray ? [] : {};
          current.obj[key] = newValue;
          stack.push({ obj: newValue, key, isArray, indent: item.indent });
        } else {
          // 这是一个值
          current.obj[key] = this.parseValue(value);
        }
      }
    }

    return result;
  }

  /**
   * 解析 YAML 值
   */
  parseValue(value) {
    // null
    if (value === 'null') return null;

    // 布尔值
    if (value === 'true') return true;
    if (value === 'false') return false;

    // 数字
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

    // 字符串（去掉引号）
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 字符串数组
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      if (!inner.trim()) return [];
      return inner.split(',').map(v => this.parseValue(v.trim()));
    }

    return value;
  }

  /**
   * 简化的 YAML 序列化器
   */
  toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let result = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          result += `${spaces}-\n${this.toYAML(item, indent + 1)}`;
        } else {
          result += `${spaces}- ${this.stringifyValue(item)}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          continue;
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            result += `${spaces}${key}: []\n`;
          } else {
            result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
          }
        } else if (typeof value === 'object') {
          result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
        } else {
          result += `${spaces}${key}: ${this.stringifyValue(value)}\n`;
        }
      }
    }

    return result;
  }

  /**
   * 将值转换为 YAML 格式字符串
   */
  stringifyValue(value) {
    if (typeof value === 'string') {
      // 如果包含特殊字符，加引号
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value}"`;
      }
      return value;
    }
    return String(value);
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const phaseId = args[1];

  try {
    const manager = new PhaseManager();

    switch (command) {
      case 'status':
        manager.renderProgress();
        break;

      case 'start':
        if (!phaseId) {
          console.log('用法: node phase-manager.js start <phase-id>');
          console.log('可用阶段: interview, spec, plan, code, test, review, package, optimize');
          process.exit(1);
        }
        if (manager.startPhase(phaseId)) {
          console.log(`✅ 已开始阶段: ${phaseId}`);
          manager.renderProgress();
        }
        break;

      case 'complete':
        if (!phaseId) {
          console.log('用法: node phase-manager.js complete <phase-id>');
          process.exit(1);
        }
        if (manager.completePhase(phaseId)) {
          console.log(`✅ 已完成阶段: ${phaseId}`);
          manager.renderProgress();
        }
        break;

      case 'next':
        const next = manager.getNextPhase();
        if (next) {
          console.log(`📋 下一步: ${next.name}`);
          console.log(`   命令: ${next.command}`);
          console.log(`   描述: ${next.description}`);
        } else {
          console.log('✨ 所有阶段已完成！');
        }
        break;

      case 'validate':
        if (!phaseId) {
          console.log('用法: node phase-manager.js validate <phase-id>');
          process.exit(1);
        }
        const check = manager.canExecutePhase(phaseId);
        if (check.can) {
          console.log(`✅ 可以执行: ${check.reason}`);
        } else {
          console.log(`❌ 不能执行: ${check.reason}`);
          if (check.missingDeps) {
            console.log('');
            console.log('需要先完成的阶段:');
            for (const dep of check.missingDeps) {
              console.log(`  - ${dep.name} (${dep.command.command || '/' + dep.id})`);
            }
          }
          process.exit(1);
        }
        break;

      case 'current':
        const current = manager.getCurrentPhase();
        if (current) {
          console.log(current.id || 'none');
        } else {
          console.log('none');
        }
        break;

      default:
        console.log('阶段管理器 v1.0');
        console.log('');
        console.log('用法: node phase-manager.js <command> [args]');
        console.log('');
        console.log('命令:');
        console.log('  status           显示当前阶段进度');
        console.log('  start <id>       开始指定阶段');
        console.log('  complete <id>    完成指定阶段');
        console.log('  next             显示下一步');
        console.log('  validate <id>     验证是否可执行阶段');
        console.log('  current          输出当前阶段ID');
        console.log('');
        console.log('可用阶段: interview, spec, plan, code, test, review, package, optimize');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = PhaseManager;
