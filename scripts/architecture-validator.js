#!/usr/bin/env node

/**
 * Architecture Validator - 架构验证器
 *
 * 检查代码是否遵循分层架构规则
 *
 * 用法:
 *   node scripts/architecture-validator.js check [path]   - 检查架构违规
 *   node scripts/architecture-validator.js analyze       - 分析依赖关系
 *   node scripts/architecture-validator.js validate       - 验证目录结构
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
  isDirectory(filePath) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }
};

// 层次定义（从外到内）
const LAYERS = {
  'ui': { level: 6, name: 'UI', dependsOn: ['runtime'] },
  'runtime': { level: 5, name: 'Runtime', dependsOn: ['service'] },
  'service': { level: 4, name: 'Service', dependsOn: ['repository'] },
  'repository': { level: 3, name: 'Repository', dependsOn: ['config', 'types'] },
  'config': { level: 2, name: 'Config', dependsOn: ['types'] },
  'types': { level: 1, name: 'Types', dependsOn: [] }
};

// 文件后缀到层次的映射
const SUFFIX_TO_LAYER = {
  '.page.tsx': 'ui',
  '.component.tsx': 'ui',
  '.routes.ts': 'runtime',
  '.controller.ts': 'runtime',
  '.service.ts': 'service',
  '.repository.ts': 'repository',
  '.config.ts': 'config',
  '.type.ts': 'types',
  '.types.ts': 'types'
};

class ArchitectureValidator {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.violations = [];
    this.dependencies = new Map();
  }

  /**
   * 检测文件属于哪个层次
   */
  detectLayer(filePath) {
    const normalized = pathUtils.normalize(filePath);
    const basename = path.basename(normalized);

    // 检查后缀
    for (const [suffix, layer] of Object.entries(SUFFIX_TO_LAYER)) {
      if (basename.endsWith(suffix)) {
        return layer;
      }
    }

    // 检查目录
    const parts = normalized.split('/');
    const dirIndex = parts.findIndex(p => p === 'src' || p === 'lib');
    if (dirIndex !== -1 && parts[dirIndex + 1]) {
      const dir = parts[dirIndex + 1].toLowerCase();
      if (LAYERS[dir]) {
        return dir;
      }
    }

    return null;
  }

  /**
   * 从 import 语句提取依赖路径
   */
  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * 验证单个文件的依赖
   */
  validateFile(filePath) {
    if (!pathUtils.exists(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const imports = this.extractImports(content);
    const currentLayer = this.detectLayer(filePath);

    if (!currentLayer) return;

    const currentLevel = LAYERS[currentLayer]?.level || 0;

    for (const imp of imports) {
      // 跳过外部依赖
      if (imp.startsWith('.') || imp.startsWith('/')) {
        // 解析相对路径
        const impPath = path.resolve(path.dirname(filePath), imp);
        const normalizedImp = pathUtils.normalize(impPath);

        // 检测目标层次
        let targetLayer = this.detectLayer(normalizedImp);

        // 如果无法从文件名检测，尝试从目录检测
        if (!targetLayer) {
          const parts = normalizedImp.split('/');
          const srcIndex = parts.findIndex(p => p === 'src' || p === 'lib');
          if (srcIndex !== -1 && parts[srcIndex + 1]) {
            const dir = parts[srcIndex + 1].toLowerCase();
            targetLayer = LAYERS[dir] ? dir : null;
          }
        }

        if (targetLayer && currentLayer !== targetLayer) {
          const targetLevel = LAYERS[targetLayer]?.level || 0;

          // 检查是否违反了层次规则（外层不能依赖内层）
          if (currentLevel <= targetLevel) {
            this.violations.push({
              file: pathUtils.relative(this.baseDir, filePath),
              import: imp,
              currentLayer,
              targetLayer,
              severity: 'critical',
              message: `${currentLayer} 层不能依赖 ${targetLayer} 层（或同层）`
            });
          }
        }

        // 记录依赖关系
        if (!this.dependencies.has(currentLayer)) {
          this.dependencies.set(currentLayer, new Set());
        }
        if (targetLayer) {
          this.dependencies.get(currentLayer).add(targetLayer);
        }
      }
    }
  }

  /**
   * 递归扫描目录
   */
  scanDirectory(dirPath, options = {}) {
    const { exclude = ['node_modules', 'dist', 'build', '.git', '__pycache__'] } = options;

    if (!pathUtils.exists(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      // 跳过排除的目录
      if (exclude.includes(item)) continue;

      const fullPath = pathUtils.resolve(dirPath, item);

      if (pathUtils.isDirectory(fullPath)) {
        this.scanDirectory(fullPath, { exclude });
      } else {
        // 只检查特定类型的文件
        if (/\.(ts|tsx|js|jsx)$/.test(item)) {
          this.validateFile(fullPath);
        }
      }
    }
  }

  /**
   * 运行检查
   */
  check(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 架构验证');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📂 扫描目录: ${scanPath}`);
    console.log('');

    this.scanDirectory(scanPath);

    if (this.violations.length === 0) {
      console.log('✅ 未发现架构违规');
    } else {
      console.log(`⚠️  发现 ${this.violations.length} 个违规:`);
      console.log('');

      for (const v of this.violations) {
        const icon = v.severity === 'critical' ? '🔴' : '🟡';
        console.log(`${icon} ${v.file}`);
        console.log(`   违规: ${v.message}`);
        console.log(`   导入: ${v.import}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return this.violations;
  }

  /**
   * 分析依赖关系
   */
  analyze() {
    const scanPath = pathUtils.resolve(this.baseDir, 'src');

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 依赖关系分析');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    this.scanDirectory(scanPath);

    // 输出依赖矩阵
    const layers = Object.keys(LAYERS).sort((a, b) => LAYERS[b].level - LAYERS[a].level);

    console.log('依赖矩阵:');
    console.log('');
    console.log('从 \\ 到 '.padEnd(20) + layers.map(l => l.padEnd(12)).join(''));
    console.log('-'.repeat(20 + layers.length * 12));

    for (const from of layers) {
      const row = [from.padEnd(20)];
      for (const to of layers) {
        const deps = this.dependencies.get(from);
        if (deps && deps.has(to)) {
          row.push('✓'.padEnd(12));
        } else if (from === to) {
          row.push('○'.padEnd(12));
        } else {
          row.push('-'.padEnd(12));
        }
      }
      console.log(row.join(''));
    }

    console.log('');
    console.log('✓ = 有依赖  ○ = 同层  - = 无依赖');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 验证目录结构
   */
  validate() {
    const srcDir = pathUtils.resolve(this.baseDir, 'src');

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📁 目录结构验证');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (!pathUtils.exists(srcDir)) {
      console.log('⚠️  src 目录不存在');
      console.log('');
      return false;
    }

    // 检查必需的层次目录
    const requiredDirs = ['types', 'config', 'repositories', 'services', 'runtime', 'ui'];
    const foundDirs = fs.readdirSync(srcDir).filter(item => {
      const fullPath = pathUtils.resolve(srcDir, item);
      return pathUtils.isDirectory(fullPath);
    });

    let valid = true;

    console.log('期望的层次目录:');
    for (const dir of requiredDirs) {
      const exists = foundDirs.includes(dir);
      const icon = exists ? '✅' : '❌';
      console.log(`  ${icon} ${dir}`);
      if (!exists) valid = false;
    }

    console.log('');
    console.log('实际存在的目录:');
    for (const dir of foundDirs) {
      console.log(`  📁 ${dir}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(valid ? '✅ 目录结构验证通过' : '⚠️  目录结构不完整');
    console.log('');
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetPath = args[1];

  try {
    const validator = new ArchitectureValidator();

    switch (command) {
      case 'check':
        validator.check(targetPath || 'src');
        break;

      case 'analyze':
        validator.analyze();
        break;

      case 'validate':
        validator.validate();
        break;

      default:
        console.log('Architecture Validator - 架构验证器');
        console.log('');
        console.log('用法: node scripts/architecture-validator.js <command> [path]');
        console.log('');
        console.log('命令:');
        console.log('  check [path]   检查架构违规');
        console.log('  analyze        分析依赖关系');
        console.log('  validate       验证目录结构');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = ArchitectureValidator;
