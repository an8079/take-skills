#!/usr/bin/env node

/**
 * Cross-Platform Installer - 跨平台安装脚本
 *
 * 自动检测平台并执行正确的复制命令
 *
 * 用法:
 *   node scripts/install.js
 *   node scripts/install.js --dry-run
 *   node scripts/install.js --target ~/.claude-code
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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
  mkdirSync(dirPath, options = {}) {
    try {
      fs.mkdirSync(dirPath, options);
      return true;
    } catch {
      return false;
    }
  }
};

// 检测操作系统
function getPlatform() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}

// 检测是否有 bash
function hasBash() {
  try {
    execSync('bash -c "echo test"', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 检测是否有 PowerShell
function hasPowerShell() {
  try {
    execSync('powershell -c "Write-Host test"', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Windows: 使用 PowerShell 复制
function copyWithPowerShell(source, dest) {
  const cmd = `Copy-Item -Path "${source}" -Destination "${dest}" -Recurse -Force`;
  execSync(`powershell -c "${cmd}"`, { stdio: 'inherit' });
}

// Unix: 使用 cp 复制
function copyWithCp(source, dest) {
  execSync(`cp -r "${source}" "${dest}"`, { stdio: 'inherit' });
}

// 跨平台复制函数
function copy(source, dest) {
  const platform = getPlatform();

  // 确保目标目录存在
  const destDir = path.dirname(dest);
  if (!pathUtils.exists(destDir)) {
    pathUtils.mkdirSync(destDir, { recursive: true });
  }

  if (platform === 'windows') {
    // Windows: 使用 PowerShell 或 fs.cpSync
    if (hasPowerShell()) {
      copyWithPowerShell(source, dest);
    } else {
      // 回退到 Node.js 内置
      copyWithNode(source, dest);
    }
  } else {
    // Unix: 使用 cp 或 Node.js
    if (hasBash()) {
      copyWithCp(source, dest);
    } else {
      copyWithNode(source, dest);
    }
  }
}

// Node.js 内置复制（跨平台）
function copyWithNode(source, dest) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
      const srcPath = path.join(source, file);
      const destPath = path.join(dest, file);
      copyWithNode(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(source, dest);
  }
}

// 递归复制目录
function copyDirectory(sourceDir, destDir, options = {}) {
  const { dryRun = false, verbose = true } = options;

  if (!pathUtils.exists(sourceDir)) {
    console.error(`❌ 源目录不存在: ${sourceDir}`);
    return false;
  }

  if (!pathUtils.exists(destDir)) {
    if (!dryRun) {
      pathUtils.mkdirSync(destDir, { recursive: true });
    }
    if (verbose) console.log(`📁 创建目录: ${destDir}`);
  }

  const files = fs.readdirSync(sourceDir);

  for (const file of files) {
    // 跳过隐藏文件（除了 .json）
    if (file.startsWith('.') && !file.startsWith('.json')) {
      continue;
    }

    const srcPath = pathUtils.resolve(sourceDir, file);
    const destPath = pathUtils.resolve(destDir, file);

    if (dryRun) {
      console.log(`🔍 [DRY RUN] 复制: ${srcPath} -> ${destPath}`);
    } else {
      if (verbose) console.log(`📦 复制: ${file}`);
      copyWithNode(srcPath, destPath);
    }
  }

  return true;
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  // 解析参数
  let targetDir = null;
  let dryRun = false;
  let verbose = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run' || arg === '-n') {
      dryRun = true;
    } else if (arg === '--target' || arg === '-t') {
      targetDir = args[++i];
    } else if (arg === '--quiet' || arg === '-q') {
      verbose = false;
    } else if (!arg.startsWith('-')) {
      targetDir = arg;
    }
  }

  const platform = getPlatform();
  const projectRoot = process.cwd();

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔧 CLAUDE-STUDIO 安装程序');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`🖥️  平台: ${platform}`);
  console.log(`📁 项目: ${projectRoot}`);

  // 确定目标目录
  if (!targetDir) {
    // 默认目标
    if (platform === 'windows') {
      targetDir = path.join(process.env.USERPROFILE || '', '.claude-code');
    } else {
      targetDir = path.join(process.env.HOME || '', '.claude-code');
    }
  }

  console.log(`📍 目标: ${targetDir}`);
  console.log('');

  if (dryRun) {
    console.log('⚠️  [DRY RUN 模式] 不会实际执行任何操作');
    console.log('');
  }

  // 创建目录
  const dirsToCreate = [
    path.join(targetDir, 'agents'),
    path.join(targetDir, 'commands'),
    path.join(targetDir, 'contexts'),
    path.join(targetDir, 'hooks')
  ];

  if (!dryRun) {
    for (const dir of dirsToCreate) {
      if (!pathUtils.exists(dir)) {
        pathUtils.mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
      }
    }
  }

  // 复制文件
  console.log('');
  console.log('📦 开始复制文件...');
  console.log('');

  const copyJobs = [
    { src: 'agents', dest: path.join(targetDir, 'agents') },
    { src: 'commands', dest: path.join(targetDir, 'commands') },
    { src: 'contexts', dest: path.join(targetDir, 'contexts') },
    { src: 'hooks', dest: path.join(targetDir, 'hooks') }
  ];

  for (const job of copyJobs) {
    const srcPath = pathUtils.resolve(projectRoot, job.src);

    if (pathUtils.exists(srcPath)) {
      console.log(`📂 ${job.src}/ -> ${job.dest}/`);
      copyDirectory(srcPath, job.dest, { dryRun, verbose });
    } else {
      console.log(`⚠️  跳过: ${srcPath} 不存在`);
    }
  }

  // 复制配置文件
  console.log('');
  console.log('📄 复制配置文件...');
  console.log('');

  const configFiles = [
    { src: '.claude/settings.local.json', dest: path.join(targetDir, 'settings.local.json') }
  ];

  for (const job of configFiles) {
    const srcPath = pathUtils.resolve(projectRoot, job.src);

    if (pathUtils.exists(srcPath)) {
      if (!dryRun) {
        fs.copyFileSync(srcPath, job.dest);
      }
      console.log(`📋 ${job.src} -> ${job.dest}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');

  if (dryRun) {
    console.log('✅ 预览完成 (dry-run)');
  } else {
    console.log('✅ 安装完成！');
  }

  console.log('');
  console.log('📝 下一步:');
  console.log('');
  console.log(`   1. 确保 Claude Code 可以访问 ${targetDir}`);
  console.log('   2. 重启 Claude Code');
  console.log('   3. 运行 /help 查看可用命令');
  console.log('');
}

// 导出模块
module.exports = {
  getPlatform,
  copy,
  copyDirectory,
  copyWithNode,
  hasBash,
  hasPowerShell
};

// 运行主函数
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`❌ 安装失败: ${error.message}`);
    process.exit(1);
  }
}
