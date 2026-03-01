#!/usr/bin/env node

/**
 * Self-Iterate - 自主迭代循环
 *
 * 跨平台的迭代执行脚本，用于自动化重复任务
 *
 * 用法:
 *   node scripts/self-iterate/iterate.js --task "任务描述" --until "条件" --max N
 *   node scripts/self-iterate/iterate.js --status
 *   node scripts/self-iterate/iterate.js --stop
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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
  },
  dirname(filePath) {
    return pathUtils.normalize(path.dirname(filePath));
  }
};

// 状态文件
const STATE_FILE = '.claude/iterate-state.json';

class IterateRunner {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.stateFile = path.join(this.baseDir, STATE_FILE);
    this.state = this.loadState();
  }

  /**
   * 加载状态
   */
  loadState() {
    if (pathUtils.exists(this.stateFile)) {
      try {
        const content = fs.readFileSync(this.stateFile, 'utf8');
        return JSON.parse(content);
      } catch {
        return this.createInitialState();
      }
    }
    return this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  createInitialState() {
    return {
      running: false,
      task: null,
      maxIterations: 10,
      currentIteration: 0,
      untilCondition: null,
      startedAt: null,
      lastOutput: null,
      lastStatus: null,
      history: []
    };
  }

  /**
   * 保存状态
   */
  saveState() {
    const dir = pathUtils.dirname(this.stateFile);
    if (!pathUtils.exists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 原子写入：先写临时文件
    const tmpFile = this.stateFile + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf8');

    // 重命名
    fs.renameSync(tmpFile, this.stateFile);
  }

  /**
   * 开始迭代
   */
  start(task, options = {}) {
    const { maxIterations = 10, untilCondition = null } = options;

    this.state = {
      running: true,
      task,
      maxIterations,
      currentIteration: 0,
      untilCondition,
      startedAt: new Date().toISOString(),
      lastOutput: null,
      lastStatus: null,
      history: []
    };

    this.saveState();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 开始自主迭代');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📋 任务: ${task}`);
    console.log(`🎯 条件: ${untilCondition || '最大迭代次数'}`);
    console.log(`🔢 最大迭代: ${maxIterations}`);
    console.log('');
  }

  /**
   * 记录迭代
   */
  recordIteration(output, status) {
    this.state.currentIteration++;
    this.state.lastOutput = output;
    this.state.lastStatus = status;

    this.state.history.push({
      iteration: this.state.currentIteration,
      output: output.substring(0, 500), // 截断过长输出
      status,
      timestamp: new Date().toISOString()
    });

    this.saveState();
  }

  /**
   * 检查完成条件
   */
  checkCondition(output) {
    const condition = this.state.untilCondition;

    if (!condition) {
      return false;
    }

    // 关键字匹配
    if (condition.includes('输出包含')) {
      const keyword = condition.replace('输出包含', '').trim();
      return output.includes(keyword);
    }

    if (condition.includes('SUCCESS') || condition.includes('成功')) {
      return output.includes('SUCCESS') || output.includes('成功') || output.includes('✅');
    }

    if (condition.includes('测试通过')) {
      return output.includes('PASSED') || output.includes('测试通过');
    }

    if (condition.includes('文件存在')) {
      const filePath = condition.replace('文件存在', '').trim();
      return pathUtils.exists(pathUtils.resolve(this.baseDir, filePath));
    }

    return false;
  }

  /**
   * 停止迭代
   */
  stop() {
    this.state.running = false;
    this.saveState();

    console.log('');
    console.log('🛑 迭代已停止');
    console.log('');
  }

  /**
   * 显示状态
   */
  showStatus() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 迭代状态');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (!this.state.running && this.state.currentIteration === 0) {
      console.log('ℹ️  没有正在进行的迭代');
      console.log('');
      return;
    }

    console.log(`📋 任务: ${this.state.task}`);
    console.log(`🔢 当前迭代: ${this.state.currentIteration}/${this.state.maxIterations}`);
    console.log(`📊 状态: ${this.state.running ? '运行中' : '已停止'}`);
    console.log(`🎯 条件: ${this.state.untilCondition || '无'}`);

    if (this.state.startedAt) {
      console.log(`🕐 开始时间: ${this.state.startedAt}`);
    }

    if (this.state.lastStatus) {
      console.log(`📝 上次状态: ${this.state.lastStatus}`);
    }

    console.log('');
    console.log('历史记录:');
    console.log('');

    for (const entry of this.state.history.slice(-5)) {
      console.log(`  ${entry.iteration}: ${entry.status} (${entry.timestamp})`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 检查是否可以继续
   */
  canContinue() {
    if (!this.state.running) {
      return { can: false, reason: '迭代已停止' };
    }

    if (this.state.currentIteration >= this.state.maxIterations) {
      return { can: false, reason: '达到最大迭代次数' };
    }

    return { can: true };
  }

  /**
   * 清理状态
   */
  reset() {
    this.state = this.createInitialState();
    this.saveState();
    console.log('✅ 迭代状态已重置');
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    task: null,
    maxIterations: 10,
    untilCondition: null,
    command: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--task' || arg === '-t') {
      params.task = args[++i];
    } else if (arg === '--max' || arg === '-m') {
      params.maxIterations = parseInt(args[++i], 10) || 10;
    } else if (arg === '--until' || arg === '-u') {
      params.untilCondition = args[++i];
    } else if (arg === '--command' || arg === '-c') {
      params.command = args[++i];
    } else if (arg === '--status' || arg === '-s') {
      params.command = 'status';
    } else if (arg === '--stop') {
      params.command = 'stop';
    } else if (arg === '--reset') {
      params.command = 'reset';
    }
  }

  return params;
}

// 主函数
function main() {
  const params = parseArgs();
  const runner = new IterateRunner();

  switch (params.command) {
    case 'status':
      runner.showStatus();
      break;

    case 'stop':
      runner.stop();
      break;

    case 'reset':
      runner.reset();
      break;

    case 'start':
    case null:
      // 开始新的迭代
      if (!params.task) {
        console.log('用法: node iterate.js --task "任务" [--until "条件"] [--max N]');
        console.log('');
        console.log('示例:');
        console.log('  node iterate.js --task "修复bug" --until "测试通过" --max 5');
        console.log('  node iterate.js --status');
        console.log('  node iterate.js --stop');
        process.exit(1);
      }

      runner.start(params.task, {
        maxIterations: params.maxIterations,
        untilCondition: params.untilCondition
      });
      runner.showStatus();
      break;

    default:
      console.log('未知命令');
  }
}

// 运行
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = IterateRunner;
module.exports.pathUtils = pathUtils;
