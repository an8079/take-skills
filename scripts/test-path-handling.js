#!/usr/bin/env node

/**
 * Cross-Platform Path Test - 跨平台路径测试
 *
 * 测试路径处理在 Windows/Unix 上的兼容性
 *
 * 用法: node scripts/test-path-handling.js
 */

const path = require('path');

// 导入我们的路径工具
const { pathUtils } = require('./scope-manager.js');

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('🧪 跨平台路径处理测试');
console.log('═══════════════════════════════════════════════════');
console.log('');

// 测试用例
const testCases = [
  // Windows 路径
  { input: 'C:\\Users\\test\\project\\src\\index.js', platform: 'windows' },
  { input: 'C:\\Users\\test\\project\\src', platform: 'windows' },
  { input: '.\\src\\index.js', platform: 'windows' },
  { input: 'src\\components\\Button.tsx', platform: 'windows' },

  // Unix 路径
  { input: '/home/user/project/src/index.js', platform: 'unix' },
  { input: '/home/user/project/src', platform: 'unix' },
  { input: './src/index.js', platform: 'unix' },
  { input: 'src/components/Button.tsx', platform: 'unix' },

  // 混合路径
  { input: 'src/components/Button.tsx', platform: 'mixed' },
  { input: 'src\\components\\Button.tsx', platform: 'mixed' }
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const { input, platform } = testCase;

  console.log(`测试 [${platform}]: ${input}`);

  // 测试 normalize
  const normalized = pathUtils.normalize(input);
  console.log(`  normalize -> ${normalized}`);

  // 验证：不应包含反斜杠
  if (normalized.includes('\\')) {
    console.log('  ❌ 失败: 规范化后仍包含反斜杠');
    failed++;
  } else {
    console.log('  ✅ 通过: 已正确规范化');
    passed++;
  }

  // 测试 resolve
  const resolved = pathUtils.resolve(input);
  console.log(`  resolve -> ${resolved}`);

  // 验证：resolve 后应该是绝对路径
  if (!resolved.startsWith('/') && !resolved.match(/^[A-Za-z]:/)) {
    console.log('  ⚠️  警告: resolve 未返回绝对路径');
  } else {
    console.log('  ✅ 通过: 正确转换为绝对路径');
  }

  console.log('');
}

// 测试 isInside
console.log('═══════════════════════════════════════════════════');
console.log('🔗 路径包含测试');
console.log('═══════════════════════════════════════════════════');
console.log('');

const isInsideTests = [
  { child: '/home/user/project/src/index.js', parent: '/home/user/project/src', expected: true },
  { child: '/home/user/project/src/components/Button.tsx', parent: '/home/user/project/src', expected: true },
  { child: '/home/user/project/src', parent: '/home/user/project/src/components', expected: false },
  { child: '/home/user/project/src/index.js', parent: '/home/user/other', expected: false },
  // Windows 风格
  { child: 'C:\\Users\\test\\project\\src\\index.js', parent: 'C:/Users/test/project/src', expected: true },
  { child: 'src/components/Button.tsx', parent: 'src/components', expected: true }
];

for (const test of isInsideTests) {
  const result = pathUtils.isInside(test.child, test.parent);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} isInside("${test.child}", "${test.parent}")`);
  console.log(`   期望: ${test.expected}, 实际: ${result}`);
  console.log('');

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
}

// 测试相对路径
console.log('═══════════════════════════════════════════════════');
console.log('📍 相对路径测试');
console.log('═══════════════════════════════════════════════════');
console.log('');

const relativeTests = [
  { from: '/home/user/project/src', to: '/home/user/project/src/index.js', expected: 'index.js' },
  { from: '/home/user/project', to: '/home/user/project/src/components', expected: 'src/components' },
  { from: 'C:/Users/test/project/src', to: 'C:/Users/test/project/src/index.js', expected: 'index.js' }
];

for (const test of relativeTests) {
  const result = pathUtils.relative(test.from, test.to);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} relative("${test.from}", "${test.to}")`);
  console.log(`   期望: ${test.expected}, 实际: ${result}`);
  console.log('');

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
}

// 总结
console.log('═══════════════════════════════════════════════════');
console.log('📊 测试结果');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log('');

if (failed > 0) {
  console.log('⚠️  存在失败的测试用例');
  process.exit(1);
} else {
  console.log('✅ 所有测试通过！');
  process.exit(0);
}
