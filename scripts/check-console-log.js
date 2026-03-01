#!/usr/bin/env node

/**
 * 检查生产代码中的 console.log
 * 跨平台兼容的替代方案
 *
 * 使用方式：
 *   node scripts/check-console-log.js "path/to/file.ts"
 */

const fs = require('fs');
const path = require('path');

// 检查文件是否包含 console.log
function checkConsoleLog(filePath) {
  try {
    // 规范化路径（跨平台）
    const normalizedPath = path.normalize(filePath);

    // 检查文件是否存在
    if (!fs.existsSync(normalizedPath)) {
      return { exists: false, hasConsoleLog: false, error: 'File not found' };
    }

    // 读取文件内容
    const content = fs.readFileSync(normalizedPath, 'utf-8');

    // 检查是否在生产代码中
    const isProductionCode = !normalizedPath.includes('test') &&
                              !normalizedPath.includes('spec') &&
                              !normalizedPath.includes('mock');

    if (!isProductionCode) {
      return { exists: true, hasConsoleLog: false, skipped: true };
    }

    // 检查是否包含 console.log (使用正则，跨平台)
    const consoleLogRegex = /console\.(log|debug|info|warn|error)/g;
    const matches = content.match(consoleLogRegex);

    const hasConsoleLog = matches && matches.length > 0;

    if (hasConsoleLog) {
      // 输出警告到 stderr
      console.error(`[Hook] Remove console.log from production code: ${filePath}`);
    }

    return {
      exists: true,
      hasConsoleLog,
      matches: matches || [],
      skipped: false
    };
  } catch (error) {
    return { exists: false, hasConsoleLog: false, error: error.message };
  }
}

// 主函数
function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node scripts/check-console-log.js <file-path>');
    process.exit(1);
  }

  const result = checkConsoleLog(filePath);

  if (result.error) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // 返回状态码（用于其他脚本检查）
  process.exit(result.hasConsoleLog ? 1 : 0);
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { checkConsoleLog };
