#!/usr/bin/env node

/**
 * Security Scanner - 安全扫描器
 *
 * 检测硬编码密钥、SQL注入、命令注入等安全漏洞
 *
 * 用法:
 *   node scripts/security-scanner.js scan [path]      - 扫描安全漏洞
 *   node scripts/security-scanner.js keys [path]    - 扫描密钥泄露
 *   node scripts/security-scanner.js sql [path]     - 扫描SQL注入
 *   node scripts/security-scanner.js cmd [path]      - 扫描命令注入
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

// 安全漏洞模式
const SECURITY_PATTERNS = {
  // 密钥泄露模式
  keys: [
    { pattern: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi, type: 'API Key' },
    { pattern: /secret[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi, type: 'Secret Key' },
    { pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi, type: 'Password' },
    { pattern: /access[_-]?token\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi, type: 'Access Token' },
    { pattern: /refresh[_-]?token\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi, type: 'Refresh Token' },
    { pattern: /private[_-]?key\s*[=:]\s*['"]/gi, type: 'Private Key' },
    { pattern: /aws[_-]?access[_-]?key[_-]?id\s*[=:]\s*['"][A-Z0-9]{20}['"]/gi, type: 'AWS Key' },
    { pattern: /sk-[a-zA-Z0-9]{20,}/g, type: 'OpenAI Key' },
    { pattern: /xox[baprs]-[0-9a-zA-Z]{10,}/g, type: 'Slack Token' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, type: 'GitHub Token' }
  ],

  // SQL注入模式
  sql: [
    { pattern: /select\s+.*?\s+from\s+.*?[\+\s]+.*?request/i, type: 'SQL Concatenation' },
    { pattern: /execute\s*\(\s*['"].*?\+.*?['"]/gi, type: 'SQL Dynamic Execution' },
    { pattern: /query\s*\(\s*['"].*?\+.*?['"]/gi, type: 'SQL Dynamic Query' },
    { pattern: /\$\{.*?(select|insert|update|delete|drop|create)/gi, type: 'SQL Template Injection' },
    { pattern: /fromSql\s*\(\s*['"].*?\+.*?['"]/gi, type: 'SQL String Concatenation' }
  ],

  // 命令注入模式
  cmd: [
    { pattern: /exec\s*\(\s*['"].*?\+.*?['"]/gi, type: 'Command Execution' },
    { pattern: /system\s*\(\s*['"].*?\+.*?['"]/gi, type: 'System Command' },
    { pattern: /spawn\s*\(\s*['"].*?\+.*?['"]/gi, type: 'Process Spawn' },
    { pattern: /child_process.*?exec\s*\(/gi, type: 'Child Process Exec' },
    { pattern: /shell\s*\(\s*['"].*?\+.*?['"]/gi, type: 'Shell Execution' }
  ],

  // XSS模式
  xss: [
    { pattern: /innerHTML\s*=\s*.*?(request|response|body|params|query)/gi, type: 'XSS: innerHTML' },
    { pattern: /dangerouslySetInnerHTML/gi, type: 'XSS: dangerouslySetInnerHTML' },
    { pattern: /document\.write\s*\(/gi, type: 'XSS: document.write' },
    { pattern: /eval\s*\(\s*.*?(request|response|body)/gi, type: 'XSS: eval' }
  ]
};

class SecurityScanner {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.violations = [];
  }

  /**
   * 扫描文件
   */
  scanFile(filePath) {
    if (!pathUtils.exists(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    const relativePath = pathUtils.relative(this.baseDir, filePath);

    // 检查所有模式
    for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
      for (const { pattern, type } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            violations.push({
              category,
              type,
              file: relativePath,
              match: match.substring(0, 50) + '...',
              severity: this.getSeverity(category)
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * 获取严重程度
   */
  getSeverity(category) {
    const severityMap = {
      'keys': 'critical',
      'sql': 'high',
      'cmd': 'high',
      'xss': 'medium'
    };
    return severityMap[category] || 'low';
  }

  /**
   * 扫描目录
   */
  scanDirectory(dirPath, options = {}) {
    const { exclude = ['node_modules', 'dist', 'build', '.git', '__pycache__', 'tests', 'test'] } = options;

    if (!pathUtils.exists(dirPath)) {
      console.log(`目录不存在: ${dirPath}`);
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (exclude.includes(item)) continue;

      const fullPath = pathUtils.resolve(dirPath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        this.scanDirectory(fullPath, { exclude });
      } else {
        // 只检查代码文件
        if (/\.(ts|tsx|js|jsx|py|java|go|rs)$/.test(item)) {
          const violations = this.scanFile(fullPath);
          this.violations.push(...violations);
        }
      }
    }
  }

  /**
   * 运行扫描
   */
  scan(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔒 安全扫描');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📂 扫描目录: ${scanPath}`);
    console.log('');

    this.scanDirectory(scanPath);

    if (this.violations.length === 0) {
      console.log('✅ 未发现安全漏洞');
    } else {
      // 按严重程度分组
      const critical = this.violations.filter(v => v.severity === 'critical');
      const high = this.violations.filter(v => v.severity === 'high');
      const medium = this.violations.filter(v => v.severity === 'medium');

      if (critical.length > 0) {
        console.log(`🔴 严重漏洞: ${critical.length}`);
        for (const v of critical.slice(0, 5)) {
          console.log(`   ${v.type}: ${v.file}`);
        }
        if (critical.length > 5) console.log(`   ... 还有 ${critical.length - 5} 个`);
        console.log('');
      }

      if (high.length > 0) {
        console.log(`🟠 高危漏洞: ${high.length}`);
        for (const v of high.slice(0, 5)) {
          console.log(`   ${v.type}: ${v.file}`);
        }
        if (high.length > 5) console.log(`   ... 还有 ${high.length - 5} 个`);
        console.log('');
      }

      if (medium.length > 0) {
        console.log(`🟡 中危漏洞: ${medium.length}`);
        for (const v of medium.slice(0, 5)) {
          console.log(`   ${v.type}: ${v.file}`);
        }
        if (medium.length > 5) console.log(`   ... 还有 ${medium.length - 5} 个`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return this.violations;
  }

  /**
   * 扫描密钥泄露
   */
  scanKeys(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);
    this.violations = [];

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔑 密钥泄露扫描');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    this.scanDirectory(scanPath);

    const keyViolations = this.violations.filter(v => v.category === 'keys');

    if (keyViolations.length === 0) {
      console.log('✅ 未发现密钥泄露');
    } else {
      console.log(`⚠️  发现 ${keyViolations.length} 处密钥泄露:`);
      console.log('');

      for (const v of keyViolations) {
        const icon = v.severity === 'critical' ? '🔴' : '🟠';
        console.log(`${icon} ${v.type}: ${v.file}`);
        console.log(`   ${v.match}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 扫描SQL注入
   */
  scanSQL(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);
    this.violations = [];

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🗄️ SQL注入扫描');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    this.scanDirectory(scanPath);

    const sqlViolations = this.violations.filter(v => v.category === 'sql');

    if (sqlViolations.length === 0) {
      console.log('✅ 未发现SQL注入漏洞');
    } else {
      console.log(`⚠️  发现 ${sqlViolations.length} 处SQL注入风险:`);
      console.log('');

      for (const v of sqlViolations) {
        console.log(`🟠 ${v.type}: ${v.file}`);
        console.log(`   ${v.match}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 扫描命令注入
   */
  scanCmd(targetPath = 'src') {
    const scanPath = pathUtils.resolve(this.baseDir, targetPath);
    this.violations = [];

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('💻 命令注入扫描');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    this.scanDirectory(scanPath);

    const cmdViolations = this.violations.filter(v => v.category === 'cmd');

    if (cmdViolations.length === 0) {
      console.log('✅ 未发现命令注入漏洞');
    } else {
      console.log(`⚠️  发现 ${cmdViolations.length} 处命令注入风险:`);
      console.log('');

      for (const v of cmdViolations) {
        console.log(`🟠 ${v.type}: ${v.file}`);
        console.log(`   ${v.match}`);
        console.log('');
      }
    }

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
    const scanner = new SecurityScanner();

    switch (command) {
      case 'scan':
        scanner.scan(targetPath || 'src');
        break;

      case 'keys':
        scanner.scanKeys(targetPath || 'src');
        break;

      case 'sql':
        scanner.scanSQL(targetPath || 'src');
        break;

      case 'cmd':
        scanner.scanCmd(targetPath || 'src');
        break;

      default:
        console.log('Security Scanner - 安全扫描器');
        console.log('');
        console.log('用法: node scripts/security-scanner.js <command> [path]');
        console.log('');
        console.log('命令:');
        console.log('  scan [path]   完整安全扫描');
        console.log('  keys [path]  扫描密钥泄露');
        console.log('  sql [path]   扫描SQL注入');
        console.log('  cmd [path]   扫描命令注入');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = SecurityScanner;
