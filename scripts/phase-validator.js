#!/usr/bin/env node

/**
 * Phase Validator - 阶段验证器
 *
 * 在执行命令前验证阶段前置条件和 Agent 职责边界
 *
 * 用法: node scripts/phase-validator.js <command>
 */

const PhaseManager = require('./phase-manager');
const MemoryManager = require('./memory-manager');
const path = require('path');
const fs = require('fs');

// 命令到阶段ID的映射
const COMMAND_TO_PHASE = {
  '/interview': 'interview',
  'interview': 'interview',
  '开始访谈': 'interview',
  'interviewer': 'interview',

  '/spec': 'spec',
  'spec': 'spec',
  '写规格': 'spec',
  '生成规格': 'spec',
  '规格设计': 'spec',

  '/plan': 'plan',
  'plan': 'plan',
  '做计划': 'plan',
  '创建计划': 'plan',
  '拆解任务': 'plan',

  '/code': 'code',
  'code': 'code',
  '开始编码': 'code',
  '编码模式': 'code',

  '/test': 'test',
  'test': 'test',
  '做测试': 'test',

  '/review': 'review',
  'review': 'review',
  '代码审查': 'review',
  '/security': 'review',

  '/package': 'package',
  'package': 'package',
  '打包交付': 'package',
  '构建': 'package',
  '/build': 'package',
  '构建': 'package',
  '部署': 'package',

  '/reflect': 'optimize',
  'reflect': 'optimize',
  '反思': 'optimize',
  '优化': 'optimize',
  '迭代优化': 'optimize',

  // 新增命令
  '/import': 'import',
  '/analyze': 'analyze',
  '/scope': 'scope'
};

// Agent 权限矩阵
const AGENT_PERMISSIONS = {
  'architect': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: ['planner', 'researcher'],
    cannotCallAgents: ['coder', 'reviewer', 'tester', 'security-reviewer', 'devops']
  },
  'planner': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash', 'Task'],
    canCallAgents: ['coder'],
    cannotCallAgents: ['reviewer', 'tester', 'security-reviewer', 'devops', 'architect']
  },
  'coder': {
    allowedTools: ['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash'],
    canCallAgents: ['debug-helper'],
    cannotCallAgents: ['reviewer', 'tester', 'security-reviewer', 'devops', 'architect', 'planner']
  },
  'tester': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash', 'Write'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'architect', 'planner', 'devops']
  },
  'reviewer': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'architect', 'planner', 'tester', 'devops']
  },
  'security-reviewer': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'architect', 'planner', 'tester', 'reviewer', 'devops']
  },
  'devops': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash', 'Write'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'architect', 'planner', 'tester', 'reviewer', 'security-reviewer']
  },
  'debug-helper': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: []
  },
  'interviewer': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'reviewer', 'tester', 'devops']
  }
};

// Agent 切换时的必需 Memory Bank 字段
const REQUIRED_HANDOVER_FIELDS = {
  'interview': ['项目名称', '项目描述', '开始时间'],
  'spec': ['规格文档位置', '技术栈', '核心功能'],
  'plan': ['任务统计', '任务列表'],
  'code': ['当前任务', '任务进度'],
  'test': ['测试统计'],
  'review': ['审查结果'],
  'package': ['部署信息']
};

// 从命令输入中提取阶段ID
function extractPhaseId(input) {
  // 直接匹配
  if (COMMAND_TO_PHASE[input]) {
    return COMMAND_TO_PHASE[input];
  }

  // 模糊匹配
  for (const [key, phaseId] of Object.entries(COMMAND_TO_PHASE)) {
    if (input.includes(key)) {
      return phaseId;
    }
  }

  return null;
}

/**
 * 验证 Agent 切换
 */
function validateAgentHandover(fromAgent, toAgent, memoryManager) {
  const errors = [];

  // 检查源 Agent 是否有权限调用目标 Agent
  if (fromAgent && AGENT_PERMISSIONS[fromAgent]) {
    const permissions = AGENT_PERMISSIONS[fromAgent];

    if (permissions.cannotCallAgents.includes(toAgent)) {
      errors.push(`❌ ${fromAgent} 禁止调用 ${toAgent}`);
    }

    if (!permissions.canCallAgents.includes(toAgent) && permissions.cannotCallAgents.length > 0) {
      // 如果没有明确允许但也没有禁止，则允许
      // 如果有禁止列表，检查是否在禁止列表中
    }
  }

  // 检查 Memory Bank 必需字段
  if (toAgent && REQUIRED_HANDOVER_FIELDS[toAgent]) {
    const requiredFields = REQUIRED_HANDOVER_FIELDS[toAgent];
    const projectFile = path.join(process.cwd(), 'memory-bank', '项目进展.md');

    if (fs.existsSync(projectFile)) {
      const content = fs.readFileSync(projectFile, 'utf8');

      for (const field of requiredFields) {
        if (!content.includes(field)) {
          errors.push(`⚠️  缺少 Memory Bank 字段: ${field} (切换到 ${toAgent} 前需要)`);
        }
      }
    }
  }

  return errors;
}

/**
 * 验证 Agent 调用权限
 */
function validateAgentCall(callingAgent, targetAgent) {
  if (!callingAgent || !AGENT_PERMISSIONS[callingAgent]) {
    // 没有权限配置，允许执行
    return { valid: true };
  }

  const permissions = AGENT_PERMISSIONS[callingAgent];

  // 检查是否在禁止列表中
  if (permissions.cannotCallAgents.includes(targetAgent)) {
    return {
      valid: false,
      error: `❌ 权限拒绝: ${callingAgent} 禁止调用 ${targetAgent}`,
      suggestion: `请完成当前 ${callingAgent} 的职责后，通过显式指令切换到 ${targetAgent}`
    };
  }

  return { valid: true };
}

/**
 * 验证阶段切换的前置条件
 */
function validatePhaseTransition(targetPhaseId, phaseManager) {
  const phase = phaseManager.getPhaseById(targetPhaseId);

  if (!phase) {
    return { valid: true }; // 未知阶段，允许执行
  }

  // 检查依赖阶段是否完成
  const check = phaseManager.canExecutePhase(targetPhaseId);

  if (!check.can) {
    return {
      valid: false,
      error: `❌ 阶段验证失败: ${check.reason}`,
      missingDeps: check.missingDeps,
      suggestion: check.reason
    };
  }

  return { valid: true };
}

/**
 * 验证必需的交付物
 */
function validateDeliverables(targetPhaseId) {
  const deliverables = {
    'spec': ['docs/spec.md'],
    'plan': ['memory-bank/项目进展.md'],
    'code': ['src/'],
    'test': ['tests/'],
    'review': ['memory-bank/项目进展.md'],
    'package': ['package.json', 'README.md']
  };

  const required = deliverables[targetPhaseId];
  if (!required) {
    return { valid: true };
  }

  const missing = [];

  for (const deliverable of required) {
    const fullPath = path.join(process.cwd(), deliverable);
    if (!fs.existsSync(fullPath)) {
      missing.push(deliverable);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `❌ 缺少必需交付物: ${missing.join(', ')}`,
      suggestion: `请先完成上一阶段的交付物`
    };
  }

  return { valid: true };
}

/**
 * 显示验证失败的详细建议
 */
function showValidationSuggestions(phase, missingDeps, manager) {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('⚠️  阶段前置条件不满足');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log(`目标阶段: ${phase.name} (${phase.command})`);
  console.log('');

  if (missingDeps && missingDeps.length > 0) {
    console.log('未完成的依赖阶段:');
    console.log('');

    for (const dep of missingDeps) {
      const icon = manager.getStatusIcon(dep.status);
      console.log(`  ${icon} ${dep.name} (${dep.command})`);
      if (dep.status === 'pending' && dep.description) {
        console.log(`     ${dep.description}`);
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('💡 建议:');
  console.log('');

  const firstMissing = missingDeps?.[0];
  if (firstMissing) {
    console.log(`请先执行: ${firstMissing.command}`);
  } else {
    console.log('请查看当前阶段状态');
  }
  console.log('');
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const fullInput = args.join(' ');

  if (!command) {
    console.log('⚠️  阶段验证器需要命令参数');
    process.exit(1);
  }

  // 不需要验证的命令
  const skipCommands = [
    '/help', 'help', '/clear', 'clear', '/think', 'think',
    '/commit', 'commit', '/model', 'model',
    'status', 'next', 'validate', 'current',
    'node', 'npm', 'npx', 'python', 'pip'
  ];

  if (skipCommands.includes(command)) {
    process.exit(0);
  }

  // 检查是否是 Agent 调用
  if (command === 'Task' || fullInput.includes('Task tool') || fullInput.includes('调用')) {
    // 从输入中提取 Agent 名称
    const agentMatch = fullInput.match(/(?:调用|call|invoke)\s+(\w+)/i);
    if (agentMatch) {
      const targetAgent = agentMatch[1].toLowerCase();
      const validation = validateAgentCall('coder', targetAgent); // 默认从 coder 尝试调用

      if (!validation.valid) {
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('🚫 Agent 权限验证失败');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log(validation.error);
        console.log('');
        console.log(`💡 ${validation.suggestion}`);
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('');
        process.exit(1);
      }
    }
  }

  // 初始化管理器
  const phaseManager = new PhaseManager(path.dirname(process.cwd()));
  const memoryManager = new MemoryManager(path.dirname(process.cwd()));

  // 提取阶段ID
  const phaseId = extractPhaseId(fullInput);

  if (!phaseId) {
    // 不是阶段命令，允许执行
    process.exit(0);
  }

  // 验证阶段切换
  const phaseValidation = validatePhaseTransition(phaseId, phaseManager);

  if (!phaseValidation.valid) {
    const phase = phaseManager.getPhaseById(phaseId);
    showValidationSuggestions(phase, phaseValidation.missingDeps, phaseManager);
    console.log(`❌ 验证失败: ${phaseValidation.error}`);
    console.log('');
    console.log(`💡 ${phaseValidation.suggestion}`);
    process.exit(1);
  }

  // 验证交付物
  const deliverableValidation = validateDeliverables(phaseId);

  if (!deliverableValidation.valid) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('⚠️  缺少必需交付物');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log(deliverableValidation.error);
    console.log('');
    console.log(`💡 ${deliverableValidation.suggestion}`);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('');
    process.exit(1);
  }

  // 验证通过，自动开始阶段
  const phase = phaseManager.getPhaseById(phaseId);

  if (phase && phase.status === 'pending') {
    phaseManager.startPhase(phaseId);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ 开始阶段: ${phase.name}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    if (phase.description) {
      console.log(`📋 ${phase.description}`);
      console.log('');
    }
  }

  process.exit(0);
}

// 运行
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`❌ 验证器错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = {
  extractPhaseId,
  COMMAND_TO_PHASE,
  AGENT_PERMISSIONS,
  validateAgentCall,
  validateAgentHandover,
  validatePhaseTransition,
  validateDeliverables
};
