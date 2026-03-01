#!/usr/bin/env node

/**
 * 会话日志记录脚本
 * 记录会话开始和结束时间
 *
 * 使用方式：
 *   node scripts/session-logger.js --event=start
 *   node scripts/session-logger.js --event=stop
 */

const fs = require('fs');
const path = require('path');

// 获取项目根目录
function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

// 获取日志文件路径
function getLogFilePath() {
  return path.join(getProjectRoot(), '.claude-code', 'session.log');
}

// 获取当前时间
function getTimestamp() {
  return new Date().toISOString();
}

// 记录事件
function logEvent(event) {
  const timestamp = getTimestamp();
  const logLine = `${timestamp} [${event.toUpperCase()}] Session event\n`;

  // 确保日志目录存在
  const logDir = path.dirname(getLogFilePath());
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 追加日志
  fs.appendFileSync(getLogFilePath(), logLine, 'utf-8');

  console.log(`[Hook] Session ${event} at ${timestamp}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const params = {};

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = value;
    }
  }

  const event = params.event;

  if (!event || (event !== 'start' && event !== 'stop')) {
    console.error('Usage: node scripts/session-logger.js --event=<start|stop>');
    process.exit(1);
  }

  try {
    logEvent(event);
  } catch (error) {
    console.error(`Error logging event: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { logEvent, getTimestamp };
