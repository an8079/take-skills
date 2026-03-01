#!/usr/bin/env node

/**
 * Scope Manager - 开发边界管理器
 *
 * 管理项目开发边界，确保增量开发过程中不会破坏未授权模块
 *
 * 用法:
 *   node scripts/scope-manager.js show              - 显示当前边界
 *   node scripts/scope-manager.js add <path>       - 添加允许范围
 *   node scripts/scope-manager.js remove <path>    - 移除允许范围
 *   node scripts/scope-manager.js lock <path>      - 锁定区域
 *   node scripts/scope-manager.js unlock <path>    - 解锁区域
 *   node scripts/scope-manager.js check <path>     - 检查路径是否可编辑
 *   node scripts/scope-manager.js reset            - 重置边界配置
 *   node scripts/scope-manager.js init             - 初始化边界配置
 */

const fs = require('fs');
const path = require('path');

// 跨平台路径处理工具
const pathUtils = {
  /**
   * 规范化路径（Windows/Unix 兼容）
   */
  normalize(filePath) {
    if (!filePath) return '';
    // 统一使用正斜杠，移除多余分隔符
    let normalized = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    // 移除尾部斜杠（除了根路径）
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  },

  /**
   * 检查路径是否在指定目录内
   */
  isInside(childPath, parentPath) {
    const normalizedChild = this.normalize(childPath);
    const normalizedParent = this.normalize(parentPath);

    // 精确匹配
    if (normalizedChild === normalizedParent) return true;

    // 检查前缀（带目录分隔符）
    return normalizedChild.startsWith(normalizedParent + '/');
  },

  /**
   * 获取相对路径
   */
  relative(from, to) {
    const normalizedFrom = this.normalize(from);
    const normalizedTo = this.normalize(to);

    if (normalizedFrom === normalizedTo) return '.';

    // 简单的相对路径计算
    const fromParts = normalizedFrom.split('/').filter(Boolean);
    const toParts = normalizedTo.split('/').filter(Boolean);

    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
      i++;
    }

    const upCount = fromParts.length - i;
    const downParts = toParts.slice(i);

    const result = [];
    for (let j = 0; j < upCount; j++) {
      result.push('..');
    }
    result.push(...downParts);

    return result.join('/');
  },

  /**
   * 转换为绝对路径
   */
  resolve(...parts) {
    return this.normalize(path.resolve(...parts));
  },

  /**
   * 获取路径的目录部分
   */
  dirname(filePath) {
    return this.normalize(path.dirname(filePath));
  },

  /**
   * 检查路径是否存在
   */
  exists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
};

// 边界状态文件
const SCOPE_STATE_FILE = '.claude/scope.yaml';
const PROJECT_ROOT = process.cwd();

class ScopeManager {
  constructor(baseDir = PROJECT_ROOT) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.stateFilePath = path.join(this.baseDir, SCOPE_STATE_FILE);
    this.state = this.loadState();
  }

  /**
   * 加载边界状态
   */
  loadState() {
    if (pathUtils.exists(this.stateFilePath)) {
      try {
        const content = fs.readFileSync(this.stateFilePath, 'utf8');
        return this.parseYAML(content);
      } catch (error) {
        console.error(`⚠️  读取边界配置失败: ${error.message}`);
        return this.createInitialState();
      }
    }
    return this.createInitialState();
  }

  /**
   * 保存边界状态
   */
  saveState() {
    const yaml = this.toYAML(this.state);
    const dir = path.dirname(this.stateFilePath);

    // 确保目录存在
    if (!pathUtils.exists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.stateFilePath, yaml, 'utf8');
  }

  /**
   * 创建初始状态
   */
  createInitialState() {
    return {
      version: '1.0',
      mode: 'open',  // open | partial | locked
      scope: {
        allowed: [],
        locked: [],
        warning: []
      },
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        project: path.basename(this.baseDir)
      }
    };
  }

  /**
   * 初始化边界配置
   */
  initScope(projectType = 'new') {
    const state = this.createInitialState();

    switch (projectType) {
      case 'new':
        // 新项目：全部开放
        state.mode = 'open';
        break;

      case 'existing':
        // 现有项目：部分边界模式
        state.mode = 'partial';
        // 默认允许 src 目录
        state.scope.allowed = ['src'];
        // 锁定 node_modules, .git 等
        state.scope.locked = ['node_modules', '.git', 'dist', 'build'];
        break;

      case 'readonly':
        // 只读模式
        state.mode = 'locked';
        break;
    }

    this.state = state;
    this.saveState();
    console.log(`✅ 已初始化边界配置 (模式: ${state.mode})`);
  }

  /**
   * 显示当前边界
   */
  showScope() {
    const { scope, mode } = this.state;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔒 开发边界');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📋 模式: ${this.getModeLabel(mode)}`);
    console.log('');

    if (scope.allowed.length > 0) {
      console.log('✅ 允许修改:');
      for (const p of scope.allowed) {
        console.log(`   - ${p}`);
      }
      console.log('');
    } else {
      console.log('✅ 允许修改: (无)');
      console.log('');
    }

    if (scope.locked.length > 0) {
      console.log('🚫 锁定区域:');
      for (const p of scope.locked) {
        console.log(`   - ${p}`);
      }
      console.log('');
    } else {
      console.log('🚫 锁定区域: (无)');
      console.log('');
    }

    if (scope.warning.length > 0) {
      console.log('⚠️ 警告区域:');
      for (const p of scope.warning) {
        console.log(`   - ${p}`);
      }
      console.log('');
    } else {
      console.log('⚠️ 警告区域: (无)');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 获取模式标签
   */
  getModeLabel(mode) {
    const labels = {
      'open': '全开放 (全部可编辑)',
      'partial': '部分边界 (指定范围可编辑)',
      'locked': '只读模式 (全部锁定)'
    };
    return labels[mode] || mode;
  }

  /**
   * 添加允许范围
   */
  addAllowed(targetPath) {
    const normalized = this.normalizeTargetPath(targetPath);

    // 检查是否已在锁定区域
    if (this.isInList(normalized, this.state.scope.locked)) {
      console.log(`❌ 路径 "${targetPath}" 已在锁定区域中，请先解锁`);
      return false;
    }

    // 添加到允许列表
    if (!this.isInList(normalized, this.state.scope.allowed)) {
      this.state.scope.allowed.push(normalized);
      this.updateMode();
      this.saveState();
      console.log(`✅ 已添加允许范围: ${targetPath}`);
    } else {
      console.log(`ℹ️  路径已在允许列表中: ${targetPath}`);
    }

    // 从警告列表中移除（如果存在）
    this.removeFromList(normalized, this.state.scope.warning);

    return true;
  }

  /**
   * 移除允许范围
   */
  removeAllowed(targetPath) {
    const normalized = this.normalizeTargetPath(targetPath);
    const removed = this.removeFromList(normalized, this.state.scope.allowed);

    if (removed) {
      this.updateMode();
      this.saveState();
      console.log(`✅ 已移除允许范围: ${targetPath}`);
    } else {
      console.log(`ℹ️  路径不在允许列表中: ${targetPath}`);
    }

    return true;
  }

  /**
   * 锁定区域
   */
  lock(targetPath) {
    const normalized = this.normalizeTargetPath(targetPath);

    // 从允许列表中移除
    this.removeFromList(normalized, this.state.scope.allowed);

    // 添加到锁定列表
    if (!this.isInList(normalized, this.state.scope.locked)) {
      this.state.scope.locked.push(normalized);
      this.updateMode();
      this.saveState();
      console.log(`🔒 已锁定区域: ${targetPath}`);
    } else {
      console.log(`ℹ️  路径已在锁定列表中: ${targetPath}`);
    }

    // 从警告列表中移除
    this.removeFromList(normalized, this.state.scope.warning);

    return true;
  }

  /**
   * 解锁区域
   */
  unlock(targetPath) {
    const normalized = this.normalizeTargetPath(targetPath);
    const unlocked = this.removeFromList(normalized, this.state.scope.locked);

    if (unlocked) {
      // 自动添加到允许列表
      if (!this.isInList(normalized, this.state.scope.allowed)) {
        this.state.scope.allowed.push(normalized);
      }
      this.updateMode();
      this.saveState();
      console.log(`🔓 已解锁区域: ${targetPath}`);
    } else {
      console.log(`ℹ️  路径不在锁定列表中: ${targetPath}`);
    }

    return true;
  }

  /**
   * 检查路径是否可编辑
   */
  checkPath(targetPath) {
    const normalized = this.normalizeTargetPath(targetPath);

    // 全开放模式
    if (this.state.mode === 'open') {
      return { allowed: true, reason: '全开放模式', level: 'allowed' };
    }

    // 只读模式
    if (this.state.mode === 'locked') {
      return { allowed: false, reason: '只读模式', level: 'locked' };
    }

    // 部分边界模式
    // 检查是否在允许列表
    for (const allowed of this.state.scope.allowed) {
      if (pathUtils.isInside(normalized, allowed) || pathUtils.isInside(allowed, normalized)) {
        return { allowed: true, reason: `在允许范围内: ${allowed}`, level: 'allowed' };
      }
    }

    // 检查是否在锁定列表
    for (const locked of this.state.scope.locked) {
      if (pathUtils.isInside(normalized, locked) || pathUtils.isInside(locked, normalized)) {
        return { allowed: false, reason: `在锁定区域内: ${locked}`, level: 'locked' };
      }
    }

    // 检查是否在警告列表
    for (const warning of this.state.scope.warning) {
      if (pathUtils.isInside(normalized, warning) || pathUtils.isInside(warning, normalized)) {
        return { allowed: 'confirm', reason: `在警告区域内: ${warning}`, level: 'warning' };
      }
    }

    // 默认：不允许（需要明确授权）
    return {
      allowed: false,
      reason: '未在允许范围内，请使用 /scope add 添加',
      level: 'unauthorized'
    };
  }

  /**
   * 重置边界配置
   */
  resetScope() {
    this.state = this.createInitialState();
    this.saveState();
    console.log('✅ 已重置边界配置');
  }

  /**
   * 更新模式
   */
  updateMode() {
    const { allowed, locked, warning } = this.state.scope;

    if (allowed.length === 0 && locked.length === 0 && warning.length === 0) {
      this.state.mode = 'open';
    } else if (allowed.length > 0 && locked.length === 0) {
      this.state.mode = 'partial';
    } else if (allowed.length === 0 && locked.length > 0) {
      this.state.mode = 'locked';
    } else {
      this.state.mode = 'partial';
    }

    this.state.metadata.updated = new Date().toISOString();
  }

  /**
   * 规范化目标路径
   */
  normalizeTargetPath(targetPath) {
    if (!targetPath) return '';

    // 处理相对路径
    let normalized = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(this.baseDir, targetPath);

    return pathUtils.normalize(path.relative(this.baseDir, normalized));
  }

  /**
   * 检查路径是否在列表中
   */
  isInList(targetPath, list) {
    const normalized = pathUtils.normalize(targetPath);
    return list.some(item => {
      const itemNormalized = pathUtils.normalize(item);
      return normalized === itemNormalized ||
             normalized.startsWith(itemNormalized + '/') ||
             itemNormalized.startsWith(normalized + '/');
    });
  }

  /**
   * 从列表中移除
   */
  removeFromList(targetPath, list) {
    const normalized = pathUtils.normalize(targetPath);
    const index = list.findIndex(item => pathUtils.normalize(item) === normalized);

    if (index !== -1) {
      list.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 简化的 YAML 解析器
   */
  parseYAML(yaml) {
    const lines = yaml.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: -1, isArray: false }];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = (line.match(/^\s*/)[0] || '').length / 2;

      // 处理数组项
      if (trimmed.startsWith('-')) {
        const value = trimmed.slice(1).trim();

        // 弹出到数组上下文
        while (stack.length > 1 && !stack[stack.length - 1].isArray && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }

        const current = stack[stack.length - 1];

        if (value.includes(':')) {
          // 对象数组
          const colonIndex = value.indexOf(':');
          const key = value.slice(0, colonIndex).trim();
          const val = value.slice(colonIndex + 1).trim();
          const newObj = {};
          newObj[key] = this.parseValue(val);
          current.obj.push(newObj);
          stack.push({ obj: newObj, indent, isArray: false });
        } else if (value) {
          current.obj.push(this.parseValue(value));
        }
        continue;
      }

      // 处理键值对
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();

        // 弹出到正确的缩进级别
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }

        const current = stack[stack.length - 1];

        if (!value) {
          // 对象
          const newObj = {};
          current.obj[key] = newObj;
          stack.push({ obj: newObj, indent, isArray: false });
        } else {
          current.obj[key] = this.parseValue(value);
        }
      }
    }

    return result;
  }

  /**
   * 解析 YAML 值
   */
  parseValue(value) {
    if (value === 'null' || value === '') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

    // 字符串
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    return value;
  }

  /**
   * 简化的 YAML 序列化器
   */
  toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let result = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          result += `${spaces}-\n${this.toYAML(item, indent + 1)}`;
        } else {
          result += `${spaces}- ${this.stringifyValue(item)}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          result += `${spaces}${key}: null\n`;
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            result += `${spaces}${key}: []\n`;
          } else {
            result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
          }
        } else if (typeof value === 'object') {
          result += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
        } else {
          result += `${spaces}${key}: ${this.stringifyValue(value)}\n`;
        }
      }
    }

    return result;
  }

  /**
   * 序列化值
   */
  stringifyValue(value) {
    if (typeof value === 'string') {
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value}"`;
      }
      return value;
    }
    return String(value);
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetPath = args[1];

  try {
    const manager = new ScopeManager();

    switch (command) {
      case 'show':
        manager.showScope();
        break;

      case 'add':
        if (!targetPath) {
          console.log('用法: node scope-manager.js add <path>');
          process.exit(1);
        }
        manager.addAllowed(targetPath);
        break;

      case 'remove':
        if (!targetPath) {
          console.log('用法: node scope-manager.js remove <path>');
          process.exit(1);
        }
        manager.removeAllowed(targetPath);
        break;

      case 'lock':
        if (!targetPath) {
          console.log('用法: node scope-manager.js lock <path>');
          process.exit(1);
        }
        manager.lock(targetPath);
        break;

      case 'unlock':
        if (!targetPath) {
          console.log('用法: node scope-manager.js unlock <path>');
          process.exit(1);
        }
        manager.unlock(targetPath);
        break;

      case 'check':
        if (!targetPath) {
          console.log('用法: node scope-manager.js check <path>');
          process.exit(1);
        }
        const result = manager.checkPath(targetPath);
        console.log('');
        if (result.allowed === true) {
          console.log(`✅ 允许编辑: ${result.reason}`);
        } else if (result.allowed === 'confirm') {
          console.log(`⚠️  需要确认: ${result.reason}`);
        } else {
          console.log(`🚫 禁止编辑: ${result.reason}`);
        }
        process.exit(result.allowed === true ? 0 : 1);
        break;

      case 'reset':
        manager.resetScope();
        break;

      case 'init':
        const projectType = args[1] || 'new';
        manager.initScope(projectType);
        break;

      default:
        console.log('Scope Manager v1.0 - 开发边界管理');
        console.log('');
        console.log('用法: node scripts/scope-manager.js <command> [args]');
        console.log('');
        console.log('命令:');
        console.log('  show              显示当前边界');
        console.log('  add <path>       添加允许范围');
        console.log('  remove <path>    移除允许范围');
        console.log('  lock <path>      锁定区域');
        console.log('  unlock <path>    解锁区域');
        console.log('  check <path>     检查路径是否可编辑');
        console.log('  reset            重置边界配置');
        console.log('  init [type]      初始化边界配置 (new|existing|readonly)');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = ScopeManager;
module.exports.pathUtils = pathUtils;
