#!/usr/bin/env node

/**
 * Code Entropy - 代码熵治理
 *
 * 自动清理重复代码、死代码，检测代码复杂度
 *
 * 用法:
 *   node scripts/code-entropy.js scan [path]      - 扫描代码熵
 *   node scripts/code-entropy.js cleanup          - 清理死代码
 *   node scripts/code-entropy.js duplicates       - 查找重复代码
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
  }
};

class CodeEntropy {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.issues = [];
  }

  /**
   * 扫描代码熵
   */
  scan(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🧹 代码熵扫描');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📂 扫描目录: ${scanPath}`);
    console.log('');

    this.findDeadCode(scanPath);
    this.findDuplicates(scanPath);
    this.calculateComplexity(scanPath);

    if (this.issues.length === 0) {
      console.log('✅ 代码熵扫描完成，未发现问题');
    } else {
      console.log(`⚠️  发现 ${this.issues.length} 个问题:`);
      console.log('');

      for (const issue of this.issues) {
        const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} [${issue.type}] ${issue.file}`);
        console.log(`   ${issue.message}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 查找死代码（未使用的函数/变量）
   */
  findDeadCode(dirPath) {
    const exclude = ['node_modules', 'dist', 'build', '.git', '__pycache__', 'tests', 'test'];

    if (!pathUtils.exists(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (exclude.includes(item)) continue;

      const fullPath = pathUtils.resolve(dirPath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        this.findDeadCode(fullPath);
      } else {
        // 检查文件中的死代码模式
        const content = fs.readFileSync(fullPath, 'utf8');

        // 检查 TODO/FIXME
        const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/g);
        if (todoMatches && todoMatches.length > 3) {
          this.issues.push({
            type: 'TODO/FIXME',
            severity: 'medium',
            file: pathUtils.relative(this.baseDir, fullPath),
            message: `发现 ${todoMatches.length} 个待办标记`
          });
        }

        // 检查空的 catch 块
        if (content.includes('catch') && content.match(/catch\s*\([^)]*\)\s*\{\s*\}/)) {
          this.issues.push({
            type: 'Empty Catch',
            severity: 'medium',
            file: pathUtils.relative(this.baseDir, fullPath),
            message: '发现空的 catch 块'
          });
        }

        // 检查 console.log（生产代码）
        if (content.includes('console.log') && fullPath.endsWith('.js')) {
          this.issues.push({
            type: 'Console Log',
            severity: 'low',
            file: pathUtils.relative(this.baseDir, fullPath),
            message: '生产代码包含 console.log'
          });
        }
      }
    }
  }

  /**
   * 查找重复代码
   */
  findDuplicates(dirPath) {
    const codeBlocks = new Map();

    const scan = (dirPath) => {
      const exclude = ['node_modules', 'dist', 'build', '.git'];

      if (!pathUtils.exists(dirPath)) return;

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        if (exclude.includes(item)) continue;

        const fullPath = pathUtils.resolve(dirPath, item);

        if (fs.statSync(fullPath).isDirectory()) {
          scan(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // 提取函数定义
          const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*function)/g;
          let match;

          while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1] || match[2] || match[3];

            // 计算函数体复杂度
            const funcBody = this.extractFunctionBody(content, match.index);
            if (funcBody && funcBody.length > 10) {
              const hash = this.simpleHash(funcBody);

              if (codeBlocks.has(hash)) {
                const existing = codeBlocks.get(hash);
                this.issues.push({
                  type: 'Duplicate',
                  severity: 'high',
                  file: pathUtils.relative(this.baseDir, fullPath),
                  message: `与 ${existing.file} 重复 (${funcName})`
                });
              } else {
                codeBlocks.set(hash, {
                  file: pathUtils.relative(this.baseDir, fullPath),
                  funcName
                });
              }
            }
          }
        }
      }
    };

    scan(dirPath);
  }

  /**
   * 提取函数体
   */
  extractFunctionBody(content, startIndex) {
    // 简单提取：找到函数开始后的第一个 { 到对应的 }
    const openBrace = content.indexOf('{', startIndex);
    if (openBrace === -1) return null;

    let braceCount = 1;
    let i = openBrace + 1;

    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }

    return content.slice(openBrace, i);
  }

  /**
   * 简单哈希
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * 计算复杂度
   */
  calculateComplexity(dirPath) {
    const exclude = ['node_modules', 'dist', 'build', '.git'];

    if (!pathUtils.exists(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (exclude.includes(item)) continue;

      const fullPath = pathUtils.resolve(dirPath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        this.calculateComplexity(fullPath);
      } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // 计算圈复杂度（简化）
        const cyclomatic = this.calculateCyclomatic(content);

        if (cyclomatic > 10) {
          this.issues.push({
            type: 'High Complexity',
            severity: 'medium',
            file: pathUtils.relative(this.baseDir, fullPath),
            message: `圈复杂度为 ${cyclomatic}，建议拆分`
          });
        }
      }
    }
  }

  /**
   * 计算圈复杂度
   */
  calculateCyclomatic(content) {
    let complexity = 1;

    // 计算分支语句数量
    const branches = content.match(/\b(if|else|for|while|case|catch|&&|\|\|)\b/g);
    if (branches) {
      complexity += branches.length;
    }

    return complexity;
  }

  /**
   * 清理死代码
   */
  cleanup() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🧹 清理死代码');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  自动清理功能需要人工确认');
    console.log('ℹ️  建议手动检查以下位置:');
    console.log('');
    console.log('  1. 未使用的变量/函数');
    console.log('  2. 空的 catch 块');
    console.log('  3. 过 TODO 标记');
    console.log('  4. 重复代码块');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetPath = args[1];

  try {
    const entropy = new CodeEntropy();

    switch (command) {
      case 'scan':
        entropy.scan(targetPath || 'src');
        break;

      case 'cleanup':
        entropy.cleanup();
        break;

      case 'duplicates':
        entropy.findDuplicates(pathUtils.resolve(process.cwd(), 'src'));
        break;

      default:
        console.log('Code Entropy - 代码熵治理');
        console.log('');
        console.log('用法: node scripts/code-entropy.js <command> [path]');
        console.log('');
        console.log('命令:');
        console.log('  scan [path]     扫描代码熵');
        console.log('  cleanup         清理死代码');
        console.log('  duplicates      查找重复代码');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = CodeEntropy;
