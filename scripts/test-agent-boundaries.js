#!/usr/bin/env node

/**
 * 测试 Agent 边界硬化
 *
 * 测试项：
 * 1. 检查每个 Agent 包含角色边界声明
 * 2. 检查每个 Agent 包含职责范围声明
 * 3. 检查每个 Agent 包含禁止行为声明
 * 4. 检查每个 Agent 包含协作协议声明
 * 5. 检查每个 Agent 包含职责冲突检测声明
 * 6. 检查每个 Agent 包含角色锁机制声明
 */

const fs = require('fs');
const path = require('path');

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 添加测试结果
function addTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// 检查 Agent 文件边界声明
function checkAgentBoundaries(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查必需的声明
    const checks = {
      hasRoleBoundary: content.includes('## 🔒 角色边界声明（强制执行）') ||
                         content.includes('## 🔒 Role Boundary Declaration'),
      hasResponsibilityScope: content.includes('### 职责范围') ||
                               content.includes('### Responsibility Scope'),
      hasForbiddenBehavior: content.includes('### 禁止行为') ||
                               content.includes('### Forbidden Behavior'),
      hasCollaborationProtocol: content.includes('### 协作协议') ||
                                    content.includes('### Collaboration Protocol'),
      hasConflictDetection: content.includes('### 职责冲突检测') ||
                                content.includes('### Responsibility Conflict Detection'),
      hasRoleLock: content.includes('### 角色锁机制') ||
                      content.includes('### Role Lock Mechanism')
    };

    // 检查所有必需声明
    const hasAll = Object.values(checks).every(v => v);

    return {
      hasAll,
      checks
    };
  } catch (error) {
    return {
      hasAll: false,
      error: error.message
    };
  }
}

// 主函数
function main() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 测试 Agent 边界硬化');
  console.log('═══════════════════════════════════════\n');

  const agentsDir = path.resolve(__dirname, '..', 'agents');
  const agentFiles = [
    'architect.md',
    'coder.md',
    'reviewer.md',
    'tester.md',
    'security-reviewer.md',
    'devops.md',
    'debug-helper.md',
    'auto-builder.md',
    'interviewer.md',
    'planner.md',
    'optimizer.md'
  ];

  for (const agentFile of agentFiles) {
    const agentPath = path.join(agentsDir, agentFile);
    const agentName = agentFile.replace('.md', '');
    console.log(`🤖 测试 Agent: ${agentName}`);

    const result = checkAgentBoundaries(agentPath);

    if (result.error) {
      addTest(`${agentFile} - 边界声明`, false, result.error);
      console.log(`  ❌ 错误: ${result.error}\n`);
      continue;
    }

    addTest(`${agentFile} - 角色边界声明`, result.checks.hasRoleBoundary,
      result.checks.hasRoleBoundary ? '包含角色边界声明' : '缺少角色边界声明');
    console.log(`  ${result.checks.hasRoleBoundary ? '✅' : '❌'} 角色边界声明`);

    addTest(`${agentFile} - 职责范围声明`, result.checks.hasResponsibilityScope,
      result.checks.hasResponsibilityScope ? '包含职责范围声明' : '缺少职责范围声明');
    console.log(`  ${result.checks.hasResponsibilityScope ? '✅' : '❌'} 职责范围`);

    addTest(`${agentFile} - 禁止行为声明`, result.checks.hasForbiddenBehavior,
      result.checks.hasForbiddenBehavior ? '包含禁止行为声明' : '缺少禁止行为声明');
    console.log(`  ${result.checks.hasForbiddenBehavior ? '✅' : '❌'} 禁止行为`);

    addTest(`${agentFile} - 协作协议声明`, result.checks.hasCollaborationProtocol,
      result.checks.hasCollaborationProtocol ? '包含协作协议声明' : '缺少协作协议声明');
    console.log(`  ${result.checks.hasCollaborationProtocol ? '✅' : '❌'} 协作协议`);

    addTest(`${agentFile} - 职责冲突检测`, result.checks.hasConflictDetection,
      result.checks.hasConflictDetection ? '包含职责冲突检测' : '缺少职责冲突检测');
    console.log(`  ${result.checks.hasConflictDetection ? '✅' : '❌'} 职责冲突检测`);

    addTest(`${agentFile} - 角色锁机制`, result.checks.hasRoleLock,
      result.checks.hasRoleLock ? '包含角色锁机制' : '缺少角色锁机制');
    console.log(`  ${result.checks.hasRoleLock ? '✅' : '❌'} 角色锁机制`);

    if (result.hasAll) {
      console.log('  ✅ 所有必需声明完整');
    } else {
      console.log('  ❌ 缺少必需声明');
    }
    console.log('');
  }

  // 输出总结
  console.log('═══════════════════════════════════════');
  console.log('📊 测试总结');
  console.log('═══════════════════════════════════════\n');

  console.log(`总测试数: ${testResults.tests.length}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}\n`);

  if (testResults.failed > 0) {
    console.log('失败的测试:');
    for (const test of testResults.tests) {
      if (!test.passed) {
        console.log(`  - ${test.name}: ${test.message}`);
      }
    }
    console.log('\n❌ 测试未通过');
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过');
    process.exit(0);
  }
}

// 执行主函数
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`❌ 测试执行错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { checkAgentBoundaries };
