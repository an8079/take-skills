#!/usr/bin/env node

/**
 * Memory Manager - 记忆系统管理器
 *
 * 管理 Memory Bank 的 Token 计数、截断、增量更新、原子写入和版本控制
 *
 * 用法:
 *   node scripts/memory-manager.js check [file]      - 检查 Token 使用情况
 *   node scripts/memory-manager.js update [file]    - 增量更新文件
 *   node scripts/memory-manager.js truncate [file]  - 截断超限文件
 *   node scripts/memory-manager.js backup [file]    - 创建备份
 *   node scripts/memory-manager.js restore [file]   - 恢复备份
 *   node scripts/memory-manager.js list [file]      - 列出历史版本
 *   node scripts/memory-manager.js validate         - 验证所有 Memory Bank 文件
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
  },
  dirname(filePath) {
    return this.normalize(path.dirname(filePath));
  }
};

// Token 限制配置
const CONFIG = {
  MAX_TOKENS: 8000,
  TOKEN_ESTIMATE_RATIO: 0.75, // 字符到 Token 的估算比例
  MAX_VERSIONS: 3,
  MAX_ROUNDS_BEFORE_ARCHIVE: 10,
  MIN_TOKENS_AFTER_TRUNCATE: 4000 // 截断后保留的最小 Token 数
};

// Agent 交接协议必需字段
const REQUIRED_HANDOVER_FIELDS = [
  '任务状态',
  '上下文摘要'
];

class MemoryManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.memoryDir = pathUtils.resolve(this.baseDir, 'memory-bank');
    this.stateDir = pathUtils.resolve(this.baseDir, '.claude');
  }

  /**
   * 估算 Token 数量（简单估算）
   */
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    // 简单估算：每 4 个字符约等于 1 个 Token
    // 乘以 0.75 是为了保守估计
    return Math.ceil(text.length * CONFIG.TOKEN_ESTIMATE_RATIO);
  }

  /**
   * 检查文件 Token 使用情况
   */
  checkTokens(filePath) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);

    if (!pathUtils.exists(fullPath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const tokens = this.estimateTokens(content);
    const lines = content.split('\n').length;

    const result = {
      file: filePath,
      tokens,
      characters: content.length,
      lines,
      isOverLimit: tokens > CONFIG.MAX_TOKENS,
      limit: CONFIG.MAX_TOKENS,
      usagePercent: Math.round((tokens / CONFIG.MAX_TOKENS) * 100)
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Token 使用情况');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📄 文件: ${filePath}`);
    console.log(`📝 Token 估算: ${result.tokens}`);
    console.log(`📏 字符数: ${result.characters}`);
    console.log(`📋 行数: ${result.lines}`);
    console.log(`📊 使用率: ${result.usagePercent}%`);
    console.log(`� Limit: ${CONFIG.MAX_TOKENS}`);

    if (result.isOverLimit) {
      console.log('');
      console.log(`⚠️  超过限制 ${CONFIG.MAX_TOKENS} Token，需要截断`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return result;
  }

  /**
   * 增量更新文件（只更新指定字段）
   */
  updateFile(filePath, updates) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);

    if (!pathUtils.exists(fullPath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return false;
    }

    // 读取当前内容
    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    // 原子写入：先写 .tmp 文件
    const tmpPath = fullPath + '.tmp';

    // 执行更新
    for (const [key, value] of Object.entries(updates)) {
      content = this.updateFieldInContent(content, key, value);
    }

    // 检查 Token 限制
    const tokens = this.estimateTokens(content);
    if (tokens > CONFIG.MAX_TOKENS) {
      console.log(`⚠️  更新后超过 Token 限制，将自动截断`);
      content = this.truncateContent(content);
    }

    // 写入临时文件
    fs.writeFileSync(tmpPath, content, 'utf8');

    // 原子替换
    fs.renameSync(tmpPath, fullPath);

    console.log(`✅ 已更新文件: ${filePath}`);
    return true;
  }

  /**
   * 在内容中更新指定字段
   */
  updateFieldInContent(content, fieldName, newValue) {
    const lines = content.split('\n');
    const result = [];
    let found = false;
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测是否是目标行（格式：| 字段 | 值 |）
      if (line.includes('|') && line.includes(fieldName)) {
        const parts = line.split('|').map(s => s.trim());

        // 找到对应的行
        const fieldIndex = parts.findIndex(p => p === fieldName || p.startsWith(fieldName));
        if (fieldIndex !== -1 && !found) {
          // 替换值
          parts[fieldIndex + 1] = ` ${newValue} `;
          result.push('| ' + parts.filter(p => p !== '').join(' | ') + ' |');
          found = true;
          continue;
        }
      }

      // 检测表格边界
      if (line.match(/^\|[\s\-]+\|/)) {
        inTable = true;
      }

      result.push(line);
    }

    // 如果没找到，追加到文件末尾
    if (!found) {
      result.push(`| ${fieldName} | ${newValue} |`);
    }

    return result.join('\n');
  }

  /**
   * 截断超限内容
   */
  truncateContent(content) {
    const lines = content.split('\n');
    const targetLength = Math.floor(CONFIG.MAX_TOKENS / CONFIG.TOKEN_ESTIMATE_RATIO * 1.5);

    if (content.length <= targetLength) {
      return content;
    }

    // 保留文件头部（前 20 行通常包含元数据）
    const headerLines = Math.min(20, Math.floor(lines.length * 0.2));
    const header = lines.slice(0, headerLines).join('\n');

    // 从尾部向前截取，保留关键部分
    let truncated = content.slice(0, targetLength);
    const lastNewline = truncated.lastIndexOf('\n');

    if (lastNewline > targetLength * 0.7) {
      truncated = truncated.slice(0, lastNewline);
    }

    // 添加截断标记
    const truncatedContent = truncated + '\n\n---\n\n> ⚠️ **内容已截断** - 原文件超过 ' + CONFIG.MAX_TOKENS + ' Token 限制\n> 查看完整历史请使用 `memory-manager.js restore` 命令\n';

    return truncatedContent;
  }

  /**
   * 截断文件
   */
  truncateFile(filePath) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);

    if (!pathUtils.exists(fullPath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return false;
    }

    // 先创建备份
    this.backupFile(filePath);

    // 读取并截断
    let content = fs.readFileSync(fullPath, 'utf8');
    const tokens = this.estimateTokens(content);

    if (tokens <= CONFIG.MAX_TOKENS) {
      console.log(`ℹ️  文件未超过 Token 限制，无需截断`);
      return true;
    }

    const truncated = this.truncateContent(content);

    // 原子写入
    const tmpPath = fullPath + '.tmp';
    fs.writeFileSync(tmpPath, truncated, 'utf8');
    fs.renameSync(tmpPath, fullPath);

    console.log(`✅ 已截断文件: ${filePath}`);
    return true;
  }

  /**
   * 备份文件（带版本控制）
   */
  backupFile(filePath) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);

    if (!pathUtils.exists(fullPath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return false;
    }

    // 创建版本目录
    const versionDir = path.join(pathUtils.dirname(fullPath), '.versions');
    if (!pathUtils.exists(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    // 生成版本文件名
    const baseName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionName = `${baseName}.${timestamp}`;
    const versionPath = path.join(versionDir, versionName);

    // 复制文件
    fs.copyFileSync(fullPath, versionPath);

    // 清理旧版本
    this.cleanOldVersions(versionDir, baseName);

    console.log(`✅ 已备份: ${versionName}`);
    return true;
  }

  /**
   * 清理旧版本
   */
  cleanOldVersions(versionDir, baseName) {
    if (!pathUtils.exists(versionDir)) return;

    const files = fs.readdirSync(versionDir)
      .filter(f => f.startsWith(baseName))
      .map(f => ({
        name: f,
        path: path.join(versionDir, f),
        time: fs.statSync(path.join(versionDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // 删除超过限制的旧版本
    if (files.length > CONFIG.MAX_VERSIONS) {
      for (let i = CONFIG.MAX_VERSIONS; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        console.log(`🗑️  已删除旧版本: ${files[i].name}`);
      }
    }
  }

  /**
   * 恢复备份
   */
  restoreFile(filePath, versionIndex = 0) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);
    const versionDir = path.join(pathUtils.dirname(fullPath), '.versions');
    const baseName = path.basename(filePath);

    if (!pathUtils.exists(versionDir)) {
      console.log(`❌ 没有备份版本: ${filePath}`);
      return false;
    }

    const files = fs.readdirSync(versionDir)
      .filter(f => f.startsWith(baseName))
      .map(f => ({
        name: f,
        path: path.join(versionDir, f),
        time: fs.statSync(path.join(versionDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.log(`❌ 没有备份版本: ${filePath}`);
      return false;
    }

    const versionFile = files[versionIndex] || files[0];
    const content = fs.readFileSync(versionFile.path, 'utf8');

    // 原子写入
    const tmpPath = fullPath + '.tmp';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, fullPath);

    console.log(`✅ 已恢复版本: ${versionFile.name}`);
    return true;
  }

  /**
   * 列出历史版本
   */
  listVersions(filePath) {
    const fullPath = pathUtils.resolve(this.baseDir, filePath);
    const versionDir = path.join(pathUtils.dirname(fullPath), '.versions');
    const baseName = path.basename(filePath);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📜 历史版本');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (!pathUtils.exists(versionDir)) {
      console.log('暂无备份版本');
      console.log('');
      return;
    }

    const files = fs.readdirSync(versionDir)
      .filter(f => f.startsWith(baseName))
      .map(f => ({
        name: f,
        path: path.join(versionDir, f),
        time: fs.statSync(path.join(versionDir, f)).mtime,
        size: fs.statSync(path.join(versionDir, f)).size
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.log('暂无备份版本');
    } else {
      files.forEach((f, i) => {
        const dateStr = f.time.toLocaleString();
        const sizeStr = Math.round(f.size / 1024) + ' KB';
        console.log(`${i}: ${f.name}`);
        console.log(`   日期: ${dateStr} | 大小: ${sizeStr}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 验证 Memory Bank 交接协议
   */
  validateHandover() {
    const projectFile = pathUtils.resolve(this.memoryDir, '项目进展.md');

    if (!pathUtils.exists(projectFile)) {
      console.log(`❌ 项目文件不存在: ${projectFile}`);
      return { valid: false, errors: ['项目文件不存在'] };
    }

    const content = fs.readFileSync(projectFile, 'utf8');
    const errors = [];

    // 检查必需字段是否存在
    for (const field of REQUIRED_HANDOVER_FIELDS) {
      if (!content.includes(field)) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }

    // 检查 Agent 交接协议部分
    if (!content.includes('## 🤖 Agent 交接协议')) {
      errors.push('缺少 Agent 交接协议部分');
    }

    // 检查任务状态格式
    if (!content.includes('| 任务状态 |')) {
      errors.push('缺少任务状态字段');
    }

    const result = {
      valid: errors.length === 0,
      errors,
      file: '项目进展.md'
    };

    if (result.valid) {
      console.log('✅ Memory Bank 交接协议验证通过');
    } else {
      console.log('❌ Memory Bank 交接协议验证失败:');
      errors.forEach(e => console.log(`   - ${e}`));
    }

    return result;
  }

  /**
   * 验证所有 Memory Bank 文件
   */
  validateAll() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 Memory Bank 验证');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const files = [
      '项目进展.md',
      '学习记录.md',
      '技术决策.md',
      '当前任务.md',
      '任务历史.md'
    ];

    let allValid = true;

    for (const file of files) {
      const filePath = pathUtils.resolve(this.memoryDir, file);

      if (!pathUtils.exists(filePath)) {
        console.log(`⚠️  缺少文件: ${file}`);
        allValid = false;
        continue;
      }

      const tokens = this.estimateTokens(fs.readFileSync(filePath, 'utf8'));
      const isOver = tokens > CONFIG.MAX_TOKENS;

      console.log(`${isOver ? '⚠️' : '✅'} ${file}`);
      console.log(`   Token: ${tokens}/${CONFIG.MAX_TOKENS}`);

      if (isOver) {
        allValid = false;
      }
    }

    // 验证交接协议
    console.log('');
    const handoverResult = this.validateHandover();

    console.log('');
    console.log('═══════════════════════════════════════════════════');

    if (allValid && handoverResult.valid) {
      console.log('✅ 所有验证通过');
    } else {
      console.log('⚠️  存在需要修复的问题');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return allValid && handoverResult.valid;
  }

  /**
   * 检查是否需要归档（基于对话轮次）
   */
  checkArchiveNeeded() {
    const projectFile = pathUtils.resolve(this.memoryDir, '项目进展.md');

    if (!pathUtils.exists(projectFile)) {
      return false;
    }

    // 简单实现：检查文件中的"轮次"标记
    // 实际应该跟踪对话轮次
    const content = fs.readFileSync(projectFile, 'utf8');

    // 提取当前 Token 估算
    const tokenMatch = content.match(/当前 Token 估算：[~]?(\d+)/);
    if (tokenMatch) {
      const currentTokens = parseInt(tokenMatch[1], 10);
      return currentTokens > CONFIG.MAX_TOKENS;
    }

    return false;
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];
  const param = args[2];

  try {
    const manager = new MemoryManager();

    switch (command) {
      case 'check':
        if (!filePath) {
          console.log('用法: node memory-manager.js check <file>');
          process.exit(1);
        }
        manager.checkTokens(filePath);
        break;

      case 'update':
        if (!filePath || !param) {
          console.log('用法: node memory-manager.js update <file> <key=value>');
          process.exit(1);
        }
        const [key, value] = param.split('=');
        manager.updateFile(filePath, { [key]: value });
        break;

      case 'truncate':
        if (!filePath) {
          console.log('用法: node memory-manager.js truncate <file>');
          process.exit(1);
        }
        manager.truncateFile(filePath);
        break;

      case 'backup':
        if (!filePath) {
          console.log('用法: node memory-manager.js backup <file>');
          process.exit(1);
        }
        manager.backupFile(filePath);
        break;

      case 'restore':
        const versionIndex = parseInt(param || '0', 10);
        manager.restoreFile(filePath, versionIndex);
        break;

      case 'list':
        if (!filePath) {
          console.log('用法: node memory-manager.js list <file>');
          process.exit(1);
        }
        manager.listVersions(filePath);
        break;

      case 'validate':
        manager.validateAll();
        break;

      case 'validate-handover':
        manager.validateHandover();
        break;

      default:
        console.log('Memory Manager v1.0 - 记忆系统管理');
        console.log('');
        console.log('用法: node scripts/memory-manager.js <command> [args]');
        console.log('');
        console.log('命令:');
        console.log('  check <file>           检查 Token 使用情况');
        console.log('  update <file> <k=v>    增量更新字段');
        console.log('  truncate <file>        截断超限文件');
        console.log('  backup <file>          创建备份');
        console.log('  restore <file> [n]    恢复备份 (n=版本序号)');
        console.log('  list <file>            列出历史版本');
        console.log('  validate               验证所有 Memory Bank 文件');
        console.log('  validate-handover      验证交接协议');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = MemoryManager;
module.exports.pathUtils = pathUtils;
module.exports.CONFIG = CONFIG;
