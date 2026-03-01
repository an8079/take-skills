#!/usr/bin/env node

/**
 * 测试记忆系统版本控制
 *
 * 测试项：
 * 1. 检查版本控制头部存在
 * 2. 检查 Token 限制声明
 * 3. 检查自动归档机制声明
 * 4. 检查 Agent 交接协议声明
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

// 检查文件是否存在版本控制头部
function checkVersionHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 10);

    // 检查版本控制头部
    const hasVersion = lines.some(line =>
      line.includes('版本控制：') ||
      line.includes('version control') ||
      line.includes('v1.0')
    );

    // 检查 Token 限制
    const hasTokenLimit = lines.some(line =>
      line.includes('Token 限制：') ||
      line.includes('token limit') ||
      line.includes('8000')
    );

    // // 检查自动归档机制
    const hasArchive = lines.some(line =>
      line.includes('归档策略：') ||
      line.includes('archive strategy') ||
      line.includes('自动归档')
    );

    // 检查 Agent 交接协议
    const hasHandoff = content.includes('Agent 交接协议') ||
                        content.includes('Agent Handoff Protocol');

    return {
      hasVersion,
      hasTokenLimit,
      hasArchive,
      hasHandoff
    };
  } catch (error) {
    return {
      error: error.message,
      hasVersion: false,
      hasTokenLimit: false,
      hasArchive: false,
      hasHandoff: false
    };
  }
}

// 主函数
function main() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 测试记忆系统版本控制');
  console.log('═══════════════════════════════════════\n');

  const memoryBankDir = path.resolve(__dirname, '..', 'memory-bank');
  const memoryFiles = [
    '项目进展.md',
    '学习记录.md',
    '技术决策.md',
    '当前任务.md',
    '任务历史.md'
  ];

  // 测试每个记忆文件
  for (const filename of memoryFiles) {
    const filePath = path.join(memoryBankDir, filename);
    console.log(`📄 测试文件: ${filename}`);

    const result = checkVersionHeader(filePath);

    if (result.error) {
      addTest(`${filename} - 文件读取`, false, result.error);
      console.log(`  ❌ 错误: ${result.error}\n`);
      continue;
    }

    addTest(`${filename} - 版本控制头部`, result.hasVersion,
      result.hasVersion ? '包含版本控制头部' : '缺少版本控制头部');
    console.log(`  ${result.hasVersion ? '✅' : '❌'} 版本控制头部`);

    addTest(`${filename} - Token 限制`, result.hasTokenLimit,
      result.hasTokenLimit ? '包含 Token 限制声明' : '缺少 Token 限制声明');
    console.log(`  ${result.hasTokenLimit ? '✅' : '❌'} Token 限制 (8000)`);

    addTest(`${filename} - 自动归档机制`, result.hasArchive,
      result.hasArchive ? '包含自动归档机制声明' : '缺少自动归档机制声明');
    console.log(`  ${result.hasArchive ? '✅' : '❌'} 自动归档机制`);

    addTest(`${filename} - Agent 交接协议`, result.hasHandoff,
      result.hasHandoff ? '包含 Agent 交接协议' : '缺少 Agent 交接协议');
    console.log(`  ${result.hasHandoff ? '✅' : '❌'} Agent 交接协议\n`);
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

module.exports = { checkVersionHeader };
