#!/usr/bin/env node

/**
 * Phase CLI - 阶段管理命令行工具
 *
 * 提供更友好的阶段管理交互方式
 *
 * 用法: node scripts/phase-cli.js [command] [args]
 */

const PhaseManager = require('./phase-manager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class PhaseCLI {
  constructor() {
    this.manager = new PhaseManager();
  }

  async run() {
    const [command, ...args] = process.argv.slice(2);

    switch (command) {
      case 'status':
      case 's':
        this.showStatus();
        break;

      case 'init':
        this.initProject(args[0]);
        break;

      case 'start':
        this.startPhase(args[0]);
        break;

      case 'complete':
      case 'done':
        this.completePhase(args[0]);
        break;

      case 'skip':
        this.skipPhase(args[0]);
        break;

      case 'next':
      case 'n':
        this.showNext();
        break;

      case 'list':
      case 'l':
        this.listPhases();
        break;

      case 'reset':
        this.reset();
        break;

      case 'jump':
        this.jumpTo(args[0]);
        break;

      case 'help':
      case 'h':
        this.showHelp();
        break;

      default:
        if (!command) {
          this.showStatus();
        } else {
          console.log(`❓ 未知命令: ${command}`);
          console.log('');
          this.showHelp();
        }
    }

    rl.close();
  }

  showStatus() {
    this.manager.renderProgress();
    this.showNextSuggestion();
  }

  showNextSuggestion() {
    const next = this.manager.getNextPhase();
    if (next && next.status === 'pending') {
      console.log('');
      console.log('💡 提示: 执行下一步，使用');
      console.log(`   ${next.command}`);
      console.log('');
    }
  }

  initProject(projectName) {
    if (!projectName) {
      console.log('⚠️  请指定项目名称');
      console.log('');
      console.log('用法: node phase-cli.js init <项目名称>');
      return;
    }

    this.manager.state.project.name = projectName;
    this.manager.saveState();

    console.log(`✅ 项目 "${projectName}" 已初始化`);
    console.log('');
    this.manager.renderProgress();
  }

  startPhase(phaseId) {
    if (!phaseId) {
      this.askPhase('开始哪个阶段?', (id) => {
        if (id) {
          this.startPhase(id);
        }
        rl.close();
      });
      return;
    }

    if (this.manager.startPhase(phaseId)) {
      console.log(`✅ 已开始阶段: ${phaseId}`);
      console.log('');
      this.manager.renderProgress();
      this.showNextSuggestion();
    }
  }

  completePhase(phaseId) {
    if (!phaseId) {
      const current = this.manager.getCurrentPhase();
      if (current && current.id) {
        phaseId = current.id;
      } else {
        console.log('⚠️  没有正在进行的阶段');
        return;
      }
    }

    if (this.manager.completePhase(phaseId)) {
      console.log(`✅ 已完成阶段: ${phaseId}`);
      console.log('');
      this.manager.renderProgress();
      this.showNextSuggestion();
    }
  }

  skipPhase(phaseId) {
    if (!phaseId) {
      console.log('⚠️  请指定要跳过的阶段ID');
      console.log('');
      console.log('用法: node phase-cli.js skip <phase-id>');
      return;
    }

    const phase = this.manager.getPhaseById(phaseId);
    if (!phase) {
      console.log(`❌ 阶段 "${phaseId}" 不存在`);
      return;
    }

    if (phase.status === 'completed') {
      console.log(`⚠️  阶段 "${phase.name}" 已经完成`);
      return;
    }

    phase.status = 'skipped';
    phase.end_time = new Date().toISOString();
    this.manager.saveState();

    console.log(`⏭️  已跳过阶段: ${phase.name}`);
    console.log('');
    this.manager.renderProgress();
    this.showNextSuggestion();
  }

  showNext() {
    const next = this.manager.getNextPhase();
    if (!next) {
      console.log('✨ 所有阶段已完成！');
      return;
    }

    const check = this.manager.canExecutePhase(next.id);
    if (check.can) {
      console.log('📋 下一步:');
      console.log('');
      console.log(`   阶段: ${next.name}`);
      console.log(`   命令: ${next.command}`);
      if (next.description) {
        console.log(`   描述: ${next.description}`);
      }
      console.log('');
    } else {
      console.log(`⚠️  无法执行下一阶段: ${check.reason}`);
    }
  }

  listPhases() {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 项目阶段清单');
    console.log('═══════════════════════════════════════');
    console.log('');

    for (const phase of this.manager.getAllPhases()) {
      const icon = this.manager.getStatusIcon(phase.status);
      const badge = this.manager.getStatusBadge(phase.status);

      console.log(`${icon} ${phase.name} (${phase.id})`);
      console.log(`   ${badge}`);
      console.log(`   命令: ${phase.command}`);
      console.log(`   描述: ${phase.description}`);
      console.log('');

      if (phase.depends && phase.depends.length > 0) {
        console.log(`   依赖: ${phase.depends.join(', ')}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('');
  }

  reset() {
    console.log('⚠️  这将重置所有阶段进度');
    rl.question('确认重置? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        this.manager.state = this.manager.createInitialState();
        this.manager.saveState();
        console.log('✅ 已重置所有阶段进度');
        console.log('');
        this.manager.renderProgress();
      } else {
        console.log('❌ 操作已取消');
      }
      rl.close();
    });
  }

  jumpTo(phaseId) {
    if (!phaseId) {
      console.log('⚠️  请指定要跳转到的阶段ID');
      console.log('');
      console.log('用法: node phase-cli.js jump <phase-id>');
      return;
    }

    const targetPhase = this.manager.getPhaseById(phaseId);
    if (!targetPhase) {
      console.log(`❌ 阶段 "${phaseId}" 不存在`);
      return;
    }

    // 完成目标阶段之前的所有阶段
    for (const phase of this.manager.getAllPhases()) {
      if (phase.id === phaseId) break;
      if (phase.status !== 'completed' && phase.status !== 'skipped') {
        phase.status = 'skipped';
        phase.end_time = new Date().toISOString();
      }
    }

    // 开始目标阶段
    this.startPhase(phaseId);
  }

  showHelp() {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📖 阶段管理 CLI - 帮助');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('用法: node scripts/phase-cli.js <命令> [参数]');
    console.log('');
    console.log('命令:');
    console.log('');
    console.log('  status, s          显示当前阶段进度');
    console.log('  init <name>        初始化项目');
    console.log('  start <id>         开始指定阶段');
    console.log('  complete <id>       完成指定阶段');
    console.log('  done <id>          同 complete');
    console.log('  skip <id>          跳过指定阶段');
    console.log('  next, n            显示下一步');
    console.log('  list, l            列出所有阶段');
    console.log('  reset               重置所有进度');
    console.log('  jump <id>           跳转到指定阶段');
    console.log('  help, h            显示此帮助');
    console.log('');
    console.log('示例:');
    console.log('');
    console.log('  node phase-cli.js status');
    console.log('  node phase-cli.js init "我的项目"');
    console.log('  node phase-cli.js start interview');
    console.log('  node phase-cli.js complete');
    console.log('  node phase-cli.js next');
    console.log('');
  }

  askPhase(question, callback) {
    console.log('');
    console.log('可用阶段:');
    console.log('');

    const phases = this.manager.getAllPhases();
    for (const phase of phases) {
      const icon = this.manager.getStatusIcon(phase.status);
      console.log(`  ${icon} ${phase.id.padEnd(10)} ${phase.name}`);
    }

    console.log('');
    rl.question(question + ' ', (answer) => {
      callback(answer.trim());
    });
  }
}

// 运行 CLI
if (require.main === module) {
  const cli = new PhaseCLI();
  cli.run().catch(error => {
    console.error(`❌ 错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = PhaseCLI;
