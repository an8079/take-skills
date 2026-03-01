#!/usr/bin/env node

/**
 * Project Analyzer - 项目分析器
 *
 * 分析现有项目架构、技术栈和模块关系
 *
 * 用法:
 *   node scripts/project-analyzer.js [path]           # 分析项目
 *   node scripts/project-analyzer.js --quick        # 快速扫描
 *   node scripts/project-analyzer.js --full          # 完整分析
 *   node scripts/project-analyzer.js --security      # 安全分析
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
  },

  readdir(dirPath) {
    try {
      return fs.readdirSync(dirPath);
    } catch {
      return [];
    }
  },

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }
};

// 技术栈检测模式
const TECH_PATTERNS = {
  // 语言/框架
  'Node.js': ['package.json'],
  'Python': ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'],
  'Java': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  'Go': ['go.mod'],
  'Rust': ['Cargo.toml'],
  'C#': ['*.csproj', '*.sln'],
  'Ruby': ['Gemfile'],
  'PHP': ['composer.json'],

  // 前端框架
  'React': ['react', 'create-react-app'],
  'Vue': ['vue', '@vue'],
  'Angular': ['@angular'],
  'Next.js': ['next'],
  'Svelte': ['svelte'],

  // 后端框架
  'Express': ['express'],
  'FastAPI': ['fastapi'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring': ['spring'],
  'NestJS': ['@nestjs'],
  'Rails': ['rails'],
  'Laravel': ['laravel'],

  // 构建工具
  'Webpack': ['webpack'],
  'Vite': ['vite'],
  'Rollup': ['rollup'],
  'Parcel': ['parcel'],
  'Babel': ['@babel'],

  // 包管理器
  'npm': ['package-lock.json'],
  'yarn': ['yarn.lock'],
  'pnpm': ['pnpm-lock.yaml'],
  'pip': ['requirements.txt'],
  'poetry': ['poetry.lock'],

  // 测试框架
  'Jest': ['jest'],
  'Mocha': ['mocha'],
  'pytest': ['pytest'],
  'unittest': ['unittest'],
  'JUnit': ['junit'],
  'Cypress': ['cypress'],
  'Playwright': ['playwright'],

  // 数据库
  'PostgreSQL': ['postgresql', 'postgres'],
  'MySQL': ['mysql'],
  'MongoDB': ['mongodb', 'mongoose'],
  'Redis': ['redis'],
  'SQLite': ['sqlite'],
};

// 文件扩展名到语言的映射
const EXTENSION_TO_LANGUAGE = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.less': 'Less',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.ps1': 'PowerShell',
};

class ProjectAnalyzer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = pathUtils.resolve(projectPath);
    this.cache = new Map();
    this.analysis = {
      path: this.projectPath,
      structure: null,
      techStack: [],
      language: null,
      frameworks: [],
      entryPoints: [],
      modules: [],
      dependencies: {},
      risks: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行完整分析
   */
  async analyze(mode = 'full') {
    console.log(`🔍 开始分析项目: ${this.projectPath}`);
    console.log('');

    // 1. 分析项目结构
    this.analysis.structure = this.analyzeStructure();

    // 2. 检测技术栈
    this.analysis.techStack = this.detectTechStack();

    // 3. 检测主要语言
    this.analysis.language = this.detectPrimaryLanguage();

    // 4. 检测框架
    this.analysis.frameworks = this.detectFrameworks();

    // 5. 查找入口点
    this.analysis.entryPoints = this.findEntryPoints();

    // 6. 分析模块
    if (mode === 'full' || mode === 'security') {
      this.analysis.modules = this.analyzeModules();
    }

    // 7. 读取依赖
    this.analysis.dependencies = this.readDependencies();

    // 8. 安全分析
    if (mode === 'security') {
      this.analysis.risks = this.analyzeSecurity();
    }

    // 输出报告
    this.renderReport();

    return this.analysis;
  }

  /**
   * 快速分析
   */
  quickAnalyze() {
    console.log(`⚡ 快速扫描项目: ${this.projectPath}`);
    console.log('');

    const structure = this.analyzeStructure();
    const techStack = this.detectTechStack();
    const language = this.detectPrimaryLanguage();
    const entryPoints = this.findEntryPoints();

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 项目快速分析');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📦 项目结构: ${structure.rootDirs.length} 个顶层目录`);
    console.log(`🛠 技术栈: ${techStack.join(', ') || '未检测到'}`);
    console.log(`🔧 主要语言: ${language || '未检测到'}`);
    console.log(`🚀 入口点: ${entryPoints.length} 个`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return { structure, techStack, language, entryPoints };
  }

  /**
   * 分析项目结构
   */
  analyzeStructure() {
    const rootDirs = [];
    const rootFiles = [];
    const maxDepth = 3;

    const scan = (dirPath, depth = 0) => {
      if (depth > maxDepth) return;

      const items = pathUtils.readdir(dirPath);

      for (const item of items) {
        // 跳过隐藏目录和特殊目录
        if (item.startsWith('.') || ['node_modules', 'dist', 'build', '__pycache__', 'target', 'vendor'].includes(item)) {
          continue;
        }

        const fullPath = pathUtils.resolve(dirPath, item);

        if (depth === 0) {
          if (pathUtils.isDirectory(fullPath)) {
            rootDirs.push(item);
          } else {
            rootFiles.push(item);
          }
        }
      }
    };

    scan(this.projectPath);

    return {
      rootDirs,
      rootFiles,
      depth: maxDepth
    };
  }

  /**
   * 检测技术栈
   */
  detectTechStack() {
    const detected = [];
    const packageJson = this.readPackageJson();

    // 检测 package.json 依赖
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const [name, pattern] of Object.entries(TECH_PATTERNS)) {
        if (Array.isArray(pattern)) {
          // 检查文件是否存在
          if (pattern.some(p => pathUtils.exists(pathUtils.resolve(this.projectPath, p)))) {
            if (!detected.includes(name)) detected.push(name);
          }
        } else if (deps[name] || deps[name?.replace('/', '')]) {
          if (!detected.includes(name)) detected.push(name);
        }
      }
    } else {
      // 非 Node.js 项目，检测其他配置文件
      for (const [name, patterns] of Object.entries(TECH_PATTERNS)) {
        if (Array.isArray(patterns)) {
          for (const pattern of patterns) {
            if (pathUtils.exists(pathUtils.resolve(this.projectPath, pattern))) {
              if (!detected.includes(name)) detected.push(name);
              break;
            }
          }
        }
      }
    }

    return detected;
  }

  /**
   * 检测主要编程语言
   */
  detectPrimaryLanguage() {
    const extensions = {};
    const maxFiles = 100;

    const scan = (dirPath, count = 0) => {
      if (count > maxFiles) return;

      const items = pathUtils.readdir(dirPath);

      for (const item of items) {
        if (count > maxFiles) break;

        const fullPath = pathUtils.resolve(dirPath, item);

        if (pathUtils.isDirectory(fullPath)) {
          if (!item.startsWith('.') && !['node_modules', 'dist', 'build', '__pycache__', 'target'].includes(item)) {
            scan(fullPath, count);
          }
        } else {
          const ext = path.extname(item).toLowerCase();
          if (EXTENSION_TO_LANGUAGE[ext]) {
            extensions[ext] = (extensions[ext] || 0) + 1;
            count++;
          }
        }
      }
    };

    scan(this.projectPath);

    // 找到最常见的扩展名
    let maxCount = 0;
    let primaryExt = null;

    for (const [ext, count] of Object.entries(extensions)) {
      if (count > maxCount) {
        maxCount = count;
        primaryExt = ext;
      }
    }

    return primaryExt ? EXTENSION_TO_LANGUAGE[primaryExt] : null;
  }

  /**
   * 检测框架
   */
  detectFrameworks() {
    const frameworks = [];
    const packageJson = this.readPackageJson();

    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // 常见框架检测
      const frameworkMap = {
        '@nestjs/core': 'NestJS',
        'express': 'Express',
        'fastapi': 'FastAPI',
        'django': 'Django',
        'flask': 'Flask',
        'spring-boot': 'Spring Boot',
        'react': 'React',
        'vue': 'Vue',
        '@angular/core': 'Angular',
        'next': 'Next.js',
        'svelte': 'Svelte'
      };

      for (const [pkg, framework] of Object.entries(frameworkMap)) {
        if (deps[pkg] && !frameworks.includes(framework)) {
          frameworks.push(framework);
        }
      }
    }

    return frameworks;
  }

  /**
   * 查找入口点
   */
  findEntryPoints() {
    const entryPoints = [];
    const packageJson = this.readPackageJson();

    // package.json 中的入口
    if (packageJson) {
      if (packageJson.main) {
        entryPoints.push({ type: 'main', path: packageJson.main });
      }
      if (packageJson.exports) {
        const exports = packageJson.exports;
        if (typeof exports === 'string') {
          entryPoints.push({ type: 'exports', path: exports });
        } else if (exports['.']) {
          entryPoints.push({ type: 'exports', path: exports['.'] });
        }
      }
      if (packageJson.bin) {
        const bin = packageJson.bin;
        if (typeof bin === 'string') {
          entryPoints.push({ type: 'bin', path: bin });
        } else {
          for (const [name, path] of Object.entries(bin)) {
            entryPoints.push({ type: 'bin', name, path });
          }
        }
      }
    }

    // 常见入口文件
    const commonEntries = [
      'index.js', 'index.ts', 'main.js', 'main.ts',
      'app.js', 'app.ts', 'server.js', 'server.ts',
      'src/index.ts', 'src/index.js', 'src/main.ts',
      'src/app.ts', 'run.py', 'main.py', 'app.py'
    ];

    for (const entry of commonEntries) {
      const fullPath = pathUtils.resolve(this.projectPath, entry);
      if (pathUtils.exists(fullPath) && !entryPoints.some(e => e.path === entry)) {
        entryPoints.push({ type: 'common', path: entry });
      }
    }

    return entryPoints;
  }

  /**
   * 分析模块
   */
  analyzeModules() {
    const modules = [];
    const srcDir = this.findSrcDirectory();

    if (srcDir && pathUtils.exists(pathUtils.resolve(this.projectPath, srcDir))) {
      const items = pathUtils.readdir(pathUtils.resolve(this.projectPath, srcDir));

      for (const item of items) {
        const fullPath = pathUtils.resolve(this.projectPath, srcDir, item);

        if (pathUtils.isDirectory(fullPath)) {
          modules.push({
            name: item,
            type: 'directory',
            path: `${srcDir}/${item}`
          });
        } else {
          const ext = path.extname(item).toLowerCase();
          if (['.ts', '.js', '.py', '.java', '.go'].includes(ext)) {
            modules.push({
              name: item,
              type: 'file',
              path: `${srcDir}/${item}`
            });
          }
        }
      }
    }

    return modules;
  }

  /**
   * 查找源代码目录
   */
  findSrcDirectory() {
    const candidates = ['src', 'lib', 'app', 'source', 'sources'];

    for (const candidate of candidates) {
      const fullPath = pathUtils.resolve(this.projectPath, candidate);
      if (pathUtils.exists(fullPath) && pathUtils.isDirectory(fullPath)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * 读取依赖
   */
  readDependencies() {
    const packageJson = this.readPackageJson();

    if (packageJson) {
      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {}
      };
    }

    return {};
  }

  /**
   * 安全分析
   */
  analyzeSecurity() {
    const risks = [];

    // 1. 检查敏感文件
    const sensitiveFiles = ['.env', '.env.local', '.env.production', 'credentials.json', 'secrets.yaml'];
    for (const file of sensitiveFiles) {
      if (pathUtils.exists(pathUtils.resolve(this.projectPath, file))) {
        risks.push({
          level: 'high',
          type: 'sensitive_file',
          message: `发现敏感文件: ${file}，建议添加到 .gitignore`
        });
      }
    }

    // 2. 检查是否有 gitignore
    if (!pathUtils.exists(pathUtils.resolve(this.projectPath, '.gitignore'))) {
      risks.push({
        level: 'low',
        type: 'missing_gitignore',
        message: '缺少 .gitignore 文件'
      });
    }

    // 3. 检查 package.json 中的安全问题
    const packageJson = this.readPackageJson();
    if (packageJson) {
      // 检查是否有 scripts 中的危险命令
      if (packageJson.scripts) {
        for (const [name, script] of Object.entries(packageJson.scripts)) {
          if (script.includes('rm -rf /') || script.includes('del /f /s /q')) {
            risks.push({
              level: 'high',
              type: 'dangerous_script',
              message: `危险脚本命令: ${name}`
            });
          }
        }
      }
    }

    return risks;
  }

  /**
   * 读取 package.json
   */
  readPackageJson() {
    const packagePath = pathUtils.resolve(this.projectPath, 'package.json');

    if (this.cache.has('packageJson')) {
      return this.cache.get('packageJson');
    }

    const content = pathUtils.readFile(packagePath);

    if (content) {
      try {
        const parsed = JSON.parse(content);
        this.cache.set('packageJson', parsed);
        return parsed;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * 渲染报告
   */
  renderReport() {
    const { structure, techStack, language, frameworks, entryPoints, modules, dependencies, risks } = this.analysis;

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 项目架构分析报告');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // 项目结构
    console.log('📦 项目结构');
    console.log('───');
    if (structure.rootDirs.length > 0) {
      console.log(`├── ${structure.rootDirs.slice(0, 5).join('\n├── ')}`);
      if (structure.rootDirs.length > 5) {
        console.log(`└── ... (${structure.rootDirs.length - 5} 更多)`);
      }
    } else {
      console.log('(空目录)');
    }
    console.log('');

    // 技术栈
    console.log('🛠 技术栈');
    console.log('───');
    if (techStack.length > 0) {
      console.log(techStack.join(', '));
    } else {
      console.log('未检测到');
    }
    console.log('');

    // 主要语言
    console.log('🔧 主要语言');
    console.log('───');
    console.log(language || '未检测到');
    console.log('');

    // 框架
    if (frameworks.length > 0) {
      console.log('⚡ 框架');
      console.log('───');
      console.log(frameworks.join(', '));
      console.log('');
    }

    // 入口点
    if (entryPoints.length > 0) {
      console.log('🚀 入口点');
      console.log('───');
      for (const entry of entryPoints.slice(0, 5)) {
        console.log(`• ${entry.type}: ${entry.path}`);
      }
      console.log('');
    }

    // 模块
    if (modules.length > 0) {
      console.log('📁 模块');
      console.log('───');
      for (const mod of modules.slice(0, 8)) {
        console.log(`• ${mod.name}/`);
      }
      if (modules.length > 8) {
        console.log(`└── ... (${modules.length - 8} 更多)`);
      }
      console.log('');
    }

    // 依赖数量
    if (dependencies.dependencies) {
      const depCount = Object.keys(dependencies.dependencies).length;
      const devDepCount = Object.keys(dependencies.devDependencies || {}).length;
      console.log('📚 依赖');
      console.log('───');
      console.log(`生产依赖: ${depCount}, 开发依赖: ${devDepCount}`);
      console.log('');
    }

    // 风险
    if (risks.length > 0) {
      console.log('⚠️ 风险提示');
      console.log('───');
      for (const risk of risks) {
        const icon = risk.level === 'high' ? '🔴' : risk.level === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${risk.message}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectPath = args[0] && !args[0].startsWith('--')
    ? args[0]
    : process.cwd();

  const mode = args.includes('--quick')
    ? 'quick'
    : args.includes('--security')
      ? 'security'
      : 'full';

  try {
    const analyzer = new ProjectAnalyzer(projectPath);

    if (mode === 'quick') {
      analyzer.quickAnalyze();
    } else {
      analyzer.analyze(mode);
    }
  } catch (error) {
    console.error(`❌ 分析失败: ${error.message}`);
    process.exit(1);
  }
}

module.exports = ProjectAnalyzer;
