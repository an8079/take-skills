#!/usr/bin/env node

/**
 * Skills 完整性测试
 *
 * 测试每个 Skill 是否符合 Codex 的标准：
 * 1. SKILL.md 存在且有 YAML frontmatter
 * 2. 包含必需的字段：name, description, allowed-tools
 * 3. 可选但推荐：assets/ 目录，scripts/ 目录，references/ 目录
 */

const fs = require('fs');
const path = require('path');

// 测试结果
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  skills: []
};

// 添加 Skill 测试结果
function addSkillResult(skillName, result) {
  testResults.skills.push({ name: skillName, ...result });
  testResults.total++;

  if (result.status === 'pass') {
    testResults.passed++;
  } else if (result.status === 'fail') {
    testResults.failed++;
  } else if (result.status === 'warn') {
    testResults.warnings++;
  }
}

// 解析 YAML frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatterText = match[1];
  const frontmatter = {};

  // 简单解析键值对
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

// 检查单个 Skill
function checkSkill(skillPath) {
  const skillName = path.basename(skillPath);
  const skillMdPath = path.join(skillPath, 'SKILL.md');

  const issues = [];
  const warnings = [];

  // 检查 SKILL.md 存在
  if (!fs.existsSync(skillMdPath)) {
    issues.push('缺少 SKILL.md 文件');
    return {
      status: 'fail',
      hasSKILLmd: false,
      issues,
      warnings
    };
  }

  // 读取 SKILL.md
  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // 检查 frontmatter
  if (!frontmatter) {
    issues.push('缺少 YAML frontmatter');
  } else {
    if (!frontmatter.name) {
      issues.push('frontmatter 缺少 name 字段');
    }

    if (!frontmatter.description) {
      issues.push('frontmatter 缺少 description 字段');
    }

    if (!frontmatter['allowed-tools']) {
      warnings.push('frontmatter 缺少 allowed-tools 字段');
    }

    // 检查 name 是否匹配目录名
    if (frontmatter.name && frontmatter.name !== skillName) {
      warnings.push(`frontmatter name (${frontmatter.name}) 与目录名 (${skillName}) 不匹配`);
    }
  }

  // 检查 assets/ 目录
  const assetsPath = path.join(skillPath, 'assets');
  if (!fs.existsSync(assetsPath)) {
    warnings.push('缺少 assets/ 目录（推荐）');
  } else {
    const assetsFiles = fs.readdirSync(assetsPath);
    if (assetsFiles.length === 0) {
      warnings.push('assets/ 目录为空（推荐添加配置文件）');
    }
  }

  // 检查 scripts/ 目录
  const scriptsPath = path.join(skillPath, 'scripts');
  if (!fs.existsSync(scriptsPath)) {
    warnings.push('缺少 scripts/ 目录（推荐）');
  } else {
    const scriptFiles = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.js') || f.endsWith('.py'));
    if (scriptFiles.length === 0) {
      warnings.push('scripts/ 目录没有可执行脚本（推荐添加）');
    }
  }

  // 检查 references/ 或 examples/ 目录
  const refsPath = path.join(skillPath, 'references');
  const examplesPath = path.join(skillPath, 'examples');
  if (!fs.existsSync(refsPath) && !fs.existsSync(examplesPath)) {
    warnings.push('缺少 references/ 或 examples/ 目录（推荐）');
  }

  // 确定状态
  let status = 'pass';
  if (issues.length > 0) {
    status = 'fail';
  } else if (warnings.length > 0) {
    status = 'warn';
  }

  return {
    status,
    hasSKILLmd: true,
    frontmatter: frontmatter || {},
    hasAssets: fs.existsSync(assetsPath),
    hasScripts: fs.existsSync(scriptsPath),
    hasReferences: fs.existsSync(refsPath) || fs.existsSync(examplesPath),
    issues,
    warnings
  };
}

// 主函数
function main() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 Skills 完整性测试');
  console.log('═══════════════════════════════════════\n');

  const skillsDir = path.resolve(__dirname, '..', 'skills');
  const skillDirs = fs.readdirSync(skillsDir).filter(d => {
    const skillPath = path.join(skillsDir, d);
    return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'SKILL.md'));
  });

  for (const skillDir of skillDirs) {
    const skillPath = path.join(skillsDir, skillDir);
    const result = checkSkill(skillPath);
    addSkillResult(skillDir, result);

    console.log(`📦 ${skillDir}`);
    console.log(`   状态: ${result.status === 'pass' ? '✅ 完整' : result.status === 'warn' ? '⚠️  警告' : '❌ 失败'}`);

    if (result.issues.length > 0) {
      console.log('   问题:');
      for (const issue of result.issues) {
        console.log(`     - ${issue}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('   警告:');
      for (const warning of result.warnings) {
        console.log(`     - ${warning}`);
      }
    }

    console.log('');
  }

  // 输出总结
  console.log('═══════════════════════════════════════');
  console.log('📊 测试总结');
  console.log('═══════════════════════════════════════\n');

  console.log(`总 Skills 数: ${testResults.total}`);
  console.log(`✅ 完整: ${testResults.passed}`);
  console.log(`⚠️  警告: ${testResults.warnings}`);
  console.log(`❌ 失败: ${testResults.failed}\n`);

  if (testResults.failed > 0) {
    console.log('失败的 Skills:');
    for (const skill of testResults.skills) {
      if (skill.status === 'fail') {
        console.log(`  - ${skill.name}`);
      }
    }
    console.log('');
  }

  if (testResults.warnings > 0) {
    console.log('有警告的 Skills:');
    for (const skill of testResults.skills) {
      if (skill.status === 'warn') {
        console.log(`  - ${skill.name} (${skill.warnings.length} 个警告)`);
      }
    }
    console.log('');
  }

  // 统计结构
  const withAssets = testResults.skills.filter(s => s.hasAssets).length;
  const withScripts = testResults.skills.filter(s => s.hasScripts).length;
  const withReferences = testResults.skills.filter(s => s.hasReferences).length;

  console.log('目录统计:');
  console.log(`  有 assets/: ${withAssets}/${testResults.total}`);
  console.log(`  有 scripts/: ${withScripts}/${testResults.total}`);
  console.log(`  有 references/ 或 examples/: ${withReferences}/${testResults.total}\n`);

  if (testResults.failed > 0) {
    console.log('❌ 测试未通过，有 Skills 存在关键问题');
    process.exit(1);
  } else if (testResults.warnings > 0) {
    console.log('⚠️  测试通过，但有 Skills 需要改进');
    process.exit(0);
  } else {
    console.log('✅ 所有测试通过');
    process.exit(0);
  }
}

// 执行主函数
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`❌ 测试执行错误: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { checkSkill, parseFrontmatter };
