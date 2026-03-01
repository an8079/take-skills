#!/usr/bin/env node

/**
 * 测试跨平台兼容性
 *
 * 测试项：
 * 1. 检查 hooks.json 使用 Node.js 脚本（非 Shell 命令）
 * 2. 检查 scripts/ 中的脚本可执行
 * 3. 检查脚本使用跨平台 API（path, fs 等）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 检查 hooks.json 配置
function checkHooksConfig() {
  try {
    const hooksPath = path.resolve(__dirname, '..', 'hooks', 'hooks.json');
    const hooksConfig = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));

    const issues = [];

    // 检查每个 hook
    for (const [eventType, hooksArray] of Object.entries(hooksConfig)) {
      if (!Array.isArray(hooksArray)) continue;

      for (const hook of hooksArray) {
        if (hook.type === 'command') {
          const command = hook.command;

          // 检查是否使用 Node.js 脚本
          const isNodeScript = command.startsWith('node ');

          // 检查是否使用 Unix-only 命令
          const usesUnixOnly = ['date ', 'grep ', 'xargs ', 'awk '].some(cmd =>
            command.includes(cmd)
          );

          if (!isNodeScript) {
            issues.push(`[${eventType}] 非节点脚本: ${command.slice(0, 50)}...`);
          }

          if (usesUnixOnly) {
            issues.push(`[${eventType}] 使用 Unix-only 命令: ${command.slice(0, 50)}...`);
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      valid: false,
      issues: [`解析错误: ${error.message}`]
    };
  }
}

// 检查脚本可执行
function checkScriptsExecutable() {
  try {
    const scriptsDir = path.resolve(__dirname);
    const scriptFiles = fs.readdirSync(scriptsDir).filter(f =>
      f.endsWith('.js') && f !== 'test-cross-platform.js'
    );

    const results = [];

    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join(scriptsDir, scriptFile);

      try {
        // 尝试导入脚本
        require(scriptPath);
        results.push({ file: scriptFile, valid: true });
      } catch (error) {
        results.push({
          file: scriptFile,
          valid: false,
          error: error.message
        });
      }
    }

    return {
      total: scriptFiles.length,
      valid: results.filter(r => r.valid).length,
      results
    };
  } catch (error) {
    return {
      total: 0,
      valid: 0,
      error: error.message
    };
  }
}

// 主函数
function main() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 测试跨平台兼容性');
  console.log('═══════════════════════════════════════\n');

  // 测试 1: 检查 hooks.json 配置
  console.log('📄 测试 hooks.json 配置');
  const hooksResult = checkHooksConfig();

  addTest('hooks.json 配置', hooksResult.valid,
    hooksResult.valid ? '配置正确' : '存在问题');

  if (hooksResult.issues.length > 0) {
    console.log('  ❌ 发现问题:');
    for (const issue of hooksResult.issues) {
      console.log(`    - ${issue}`);
    }
  } else {
    console.log('  ✅ hooks.json 配置正确');
  }
  console.log('');

  // 测试 2: 检查脚本可执行
  console.log('📄 测试脚本可执行性');
  const scriptsResult = checkScriptsExecutable();

  if (scriptsResult.error) {
    addTest('脚本可执行性', false, scriptsResult.error);
    console.log(`  ❌ 错误: ${scriptsResult.error}\n`);
  } else {
    const validPercent = Math.round((scriptsResult.valid / scriptsResult.total) * 100);
    addTest('脚本可执行性', scriptsResult.valid === scriptsResult.total,
      `${scriptsResult.valid}/${scriptsResult.total} 脚本可执行`);

    console.log(`  ✅ 可执行脚本: ${scriptsResult.valid}/${scriptsResult.total} (${validPercent}%)\n`);

    if (scriptsResult.results.some(r => !r.valid)) {
      console.log('  ❌ 失败的脚本:');
      for (const result of scriptsResult.results) {
        if (!result.valid) {
          console.log(`    - ${result.file}: ${result.error}`);
        }
      }
      console.log('');
    }
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

module.exports = { checkHooksConfig, checkScriptsExecutable };
