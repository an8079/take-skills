#!/usr/bin/env node

/**
 * 跨平台日志记录脚本
 * 替代 Unix-only 的 echo 和 date 命令
 *
 * 使用方式：
 *   node scripts/cross-platform-logger.js --event=start
 *   node scripts/cross-platform-logger.js --event=pre-edit --file="path/to/file.ts"
 */

const fs = require('fs');
const path = require('path');

// 获取当前时间（ISO 8601 格式，UTC）
function getTimestamp() {
  return new Date().toISOString();
}

// 日志级别
const LOG_LEVELS = {
  INFO: '[INFO]',
  HOOK: '[Hook]',
  ERROR: '[ERROR]',
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = value;
    }
  }

  return params;
}

// 主函数
function main() {
  const params = parseArgs();
  const event = params.event;
  const timestamp = getTimestamp();

  try {
    switch (event) {
      case 'start':
        console.log(`${LOG_LEVELS.HOOK} Session started at ${timestamp}`);
        break;

      case 'stop':
        console.log(`${LOG_LEVELS.HOOK} Session ended at ${timestamp}`);
        break;

      case 'pre-edit':
        console.log(`${LOG_LEVELS.HOOK} About to edit file: ${params.file}`);
        break;

      case 'post-edit':
        console.log(`${LOG_LEVELS.HOOK} Edited file: ${params.file}`);
        break;

      case 'post-bash':
        console.log(`${LOG_LEVELS.HOOK} Command executed: ${params.command}`);
        break;

      case 'error':
        console.error(`${LOG_LEVELS.ERROR} ${params.message || 'Unknown error'}`);
        process.exit(1);
        break;

      default:
        console.error(`${LOG_LEVELS.ERROR} Unknown event: ${event}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`${LOG_LEVELS.ERROR} ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { getTimestamp, parseArgs };
