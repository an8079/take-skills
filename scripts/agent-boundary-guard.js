#!/usr/bin/env node

/**
 * Agent Boundary Guard - Agent 越界防护
 *
 * 技术防护：阻止 Agent 自行越界调用其他 Agent
 *
 * 用法:
 *   node scripts/agent-boundary-guard.js check <agent> <target>
 *   node scripts/agent-boundary-guard.js validate <input>
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

// Agent 权限矩阵（强制执行）
const AGENT_PERMISSIONS = {
  'interviewer': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'reviewer', 'architect', 'planner', 'tester', 'devops']
  },
  'architect': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: ['planner', 'researcher'],
    cannotCallAgents: ['coder', 'reviewer', 'tester', 'devops']
  },
  'coder': {
    allowedTools: ['Read', 'Edit', 'Write', 'Grep', 'Glob', 'Bash'],
    canCallAgents: ['debug-helper'],
    cannotCallAgents: ['reviewer', 'tester', 'security-reviewer', 'devops', 'architect', 'planner', 'interviewer']
  },
  'reviewer': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: ['coder', 'architect', 'planner', 'tester', 'devops', 'interviewer']
  },
  'debug-helper': {
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    canCallAgents: [],
    cannotCallAgents: []
  }
};

// 从当前会话推断当前 Agent
function detectCurrentAgent() {
  const sessionFile = pathUtils.resolve(process.cwd(), '.claude', 'session.json');

  if (pathUtils.exists(sessionFile)) {
    try {
      const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      return session.currentAgent || null;
    } catch {
      // 忽略
    }
  }

  // 从环境变量获取
  return process.env.CLAUDE_AGENT || null;
}

// 验证 Agent 调用权限
function validateCall(callingAgent, targetAgent) {
  if (!callingAgent) {
    return { valid: true, reason: '无法确定当前 Agent，允许执行' };
  }

  const permissions = AGENT_PERMISSIONS[callingAgent];

  if (!permissions) {
    return { valid: true, reason: `未知的 Agent: ${callingAgent}` };
  }

  // 检查是否在禁止列表中
  if (permissions.cannotCallAgents.includes(targetAgent)) {
    return {
      valid: false,
      reason: `🚫 权限拒绝: ${callingAgent} 禁止调用 ${targetAgent}`,
      suggestion: `请通过输出"请调用 ${targetAgent} 继续"来请求切换 Agent，不要自行调用 Task tool`
    };
  }

  // 检查是否在允许列表中（如果有允许列表）
  if (permissions.canCallAgents.length > 0) {
    if (!permissions.canCallAgents.includes(targetAgent)) {
      return {
        valid: false,
        reason: `🚫 权限拒绝: ${callingAgent} 只能调用 [${permissions.canCallAgents.join(', ')}]`,
        suggestion: `${targetAgent} 不在允许列表中`
      };
    }
  }

  return { valid: true, reason: '允许调用' };
}

// 从输入中提取目标 Agent
function extractTargetAgent(input) {
  if (!input) return null;

  // 匹配模式
  const patterns = [
    /call\s+(\w+)/i,
    /invoke\s+(\w+)/i,
    /调用\s+(\w+)/i,
    /Task.*?(\w+)/i,
    /subagent.*?(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

// 检查输入是否包含 Agent 调用
function containsAgentCall(input) {
  if (!input) return false;

  const keywords = ['call', 'invoke', '调用', 'Task tool', 'subagent'];

  return keywords.some(kw => input.toLowerCase().includes(kw.toLowerCase()));
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check': {
      const callingAgent = args[1] || detectCurrentAgent();
      const targetAgent = args[2];

      if (!targetAgent) {
        console.log('用法: agent-boundary-guard.js check <calling> <target>');
        process.exit(1);
      }

      const result = validateCall(callingAgent, targetAgent);

      console.log('');
      if (result.valid) {
        console.log(`✅ ${result.reason}`);
        process.exit(0);
      } else {
        console.log(result.reason);
        console.log('');
        console.log(`💡 ${result.suggestion}`);
        process.exit(1);
      }
    }

    case 'validate': {
      const input = args.slice(1).join(' ');

      if (!containsAgentCall(input)) {
        process.exit(0); // 不是 Agent 调用，允许
      }

      const targetAgent = extractTargetAgent(input);
      const callingAgent = detectCurrentAgent();

      if (!targetAgent) {
        process.exit(0); // 无法识别，允许
      }

      const result = validateCall(callingAgent, targetAgent);

      console.log('');
      if (!result.valid) {
        console.log('═══════════════════════════════════════════════════');
        console.log('🚫 Agent 越界检测');
        console.log('═══════════════════════════════════════════════════');
        console.log('');
        console.log(result.reason);
        console.log('');
        console.log(`💡 ${result.suggestion}`);
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('');
        process.exit(1);
      }

      process.exit(0);
    }

    case 'status': {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔒 Agent 权限矩阵');
      console.log('═══════════════════════════════════════════════════');
      console.log('');

      for (const [agent, perms] of Object.entries(AGENT_PERMISSIONS)) {
        console.log(`📋 ${agent}:`);
        console.log(`   可调用: [${perms.canCallAgents.join(', ')}]`);
        console.log(`   禁止:  [${perms.cannotCallAgents.join(', ')}]`);
        console.log('');
      }

      console.log('═══════════════════════════════════════════════════');
      console.log('');
      break;
    }

    default:
      console.log('Agent Boundary Guard - Agent 越界防护');
      console.log('');
      console.log('用法: node scripts/agent-boundary-guard.js <command>');
      console.log('');
      console.log('命令:');
      console.log('  check <calling> <target>  验证调用权限');
      console.log('  validate <input>        验证输入是否越界');
      console.log('  status                   显示权限矩阵');
      console.log('');
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

module.exports = {
  AGENT_PERMISSIONS,
  validateCall,
  extractTargetAgent,
  containsAgentCall
};
