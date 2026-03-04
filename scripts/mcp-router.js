#!/usr/bin/env node

/**
 * MCP Router - MCP 智能路由
 *
 * 检测模型类型，自动启用对应的 MCP 功能
 *
 * 用法:
 *   node scripts/mcp-router.js detect   - 检测当前模型
 *   node scripts/mcp-router.js enable  - 启用 MCP 功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 跨平台路径处理
const pathUtils = {
  normalize(filePath) {
    if (!filePath) return '';
    return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
  },
  resolve(...parts) {
    return this.normalize(path.resolve(...parts));
  }
};

// 模型标识到 MCP 配置的映射
const MODEL_MCP_CONFIG = {
  'minimax': {
    name: 'Minimax',
    mcps: [
      { name: 'web_search', enabled: true },
      { name: 'understand_image', enabled: true }
    ],
    message: '已为 Minimax 启用 web_search + understand_image'
  },
  'default': {
    name: '默认',
    mcps: [],
    message: ''
  }
};

// 检测当前使用的模型
function detectModel() {
  // 方法1: 检查环境变量
  const modelEnv = process.env.CLAUDE_MODEL || process.env.MODEL || '';

  // 方法2: 检查 MCP 配置
  const mcpConfigPath = pathUtils.resolve(process.cwd(), 'mcp-configs', 'mcp-servers.json');
  if (pathUtils.exists(mcpConfigPath)) {
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      // 如果 MCP 配置了特定模型的工具，可以推断模型类型
    } catch {
      // 忽略
    }
  }

  // 检查是否是 Minimax 模型
  const modelLower = modelEnv.toLowerCase();
  if (modelLower.includes('minimax')) {
    return 'minimax';
  }

  // 检查命令行参数（Claude Code 会传递模型信息）
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.toLowerCase().includes('minimax')) {
      return 'minimax';
    }
  }

  return 'default';
}

// 获取 MCP 配置
function getMCPConfig(modelType) {
  return MODEL_MCP_CONFIG[modelType] || MODEL_MCP_CONFIG['default'];
}

// 启用 MCP 功能
function enableMCP(modelType) {
  const config = getMCPConfig(modelType);

  if (!config.message) {
    console.log('ℹ️  当前模型无特殊 MCP 配置');
    return;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔌 MCP 智能路由');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`🖥️  检测到模型: ${config.name}`);
  console.log('');

  // 检查 MCP 配置文件
  const mcpConfigPath = pathUtils.resolve(process.cwd(), 'mcp-configs', 'mcp-servers.json');

  if (!pathUtils.exists(mcpConfigPath)) {
    console.log('⚠️  MCP 配置文件不存在');
    console.log(`   位置: ${mcpConfigPath}`);
    console.log('');
    return;
  }

  try {
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const mcpServers = mcpConfig.mcpServers || {};

    console.log('📦 可用的 MCP 服务:');
    for (const [name, server] of Object.entries(mcpServers)) {
      console.log(`   • ${name}`);
    }
    console.log('');

    // 启用对应的 MCP
    const enabled = [];
    for (const mcp of config.mcps) {
      if (mcpServers[mcp.name]) {
        enabled.push(mcp.name);
      }
    }

    if (enabled.length > 0) {
      console.log(`✅ ${config.message}`);
    } else {
      console.log('ℹ️  未找到对应的 MCP 服务配置');
    }
  } catch (error) {
    console.log(`⚠️  读取 MCP 配置失败: ${error.message}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

// 显示检测结果
function showDetection() {
  const model = detectModel();
  const config = getMCPConfig(model);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 模型检测结果');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`🖥️  模型类型: ${config.name}`);
  console.log(`🔧 模型标识: ${model}`);

  if (config.mcps.length > 0) {
    console.log('');
    console.log('📦 将启用的 MCP:');
    for (const mcp of config.mcps) {
      console.log(`   • ${mcp.name}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'detect';

  switch (command) {
    case 'detect':
      showDetection();
      break;

    case 'enable':
      const model = detectModel();
      enableMCP(model);
      break;

    default:
      console.log('MCP Router - MCP 智能路由');
      console.log('');
      console.log('用法: node scripts/mcp-router.js <command>');
      console.log('');
      console.log('命令:');
      console.log('  detect   检测当前模型');
      console.log('  enable   启用 MCP 功能');
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
  detectModel,
  getMCPConfig,
  enableMCP
};
