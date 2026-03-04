#!/usr/bin/env node

/**
 * Skill Evaluator - Skills 质量评估
 *
 * 评估 Skills 的质量和完整性
 *
 * 用法:
 *   node scripts/skill-evaluator.js list         - 列出所有 Skills
 *   node scripts/skill-evaluator.js evaluate     - 评估所有 Skills
 *   node scripts/skill-evaluator.js score <skill> - 评估指定 Skill
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

// 评估标准
const EVALUATION_CRITERIA = {
  // 结构完整性 (30分)
  structure: {
    weight: 30,
    checks: [
      { name: 'has_skill_file', score: 10, desc: 'SKILL.md 文件存在' },
      { name: 'has_examples', score: 10, desc: '包含示例' },
      { name: 'has_references', score: 5, desc: '包含参考文档' },
      { name: 'has_scripts', score: 5, desc: '包含脚本' }
    ]
  },

  // 内容质量 (40分)
  content: {
    weight: 40,
    checks: [
      { name: 'has_description', score: 10, desc: '有描述' },
      { name: 'has_usage', score: 10, desc: '有使用说明' },
      { name: 'has_examples', score: 10, desc: '有示例' },
      { name: 'has_requirements', score: 5, desc: '有前置要求' },
      { name: 'has_limitations', score: 5, desc: '有局限性说明' }
    ]
  },

  // 代码质量 (30分)
  code: {
    weight: 30,
    checks: [
      { name: 'valid_syntax', score: 10, desc: '语法正确' },
      { name: 'has_error_handling', score: 10, desc: '有错误处理' },
      { name: 'cross_platform', score: 10, desc: '跨平台兼容' }
    ]
  }
};

class SkillEvaluator {
  constructor(baseDir = process.cwd()) {
    this.baseDir = pathUtils.resolve(baseDir);
    this.skillsDir = pathUtils.resolve(this.baseDir, 'skills');
  }

  /**
   * 获取所有 Skills
   */
  listSkills() {
    if (!pathUtils.exists(this.skillsDir)) {
      console.log('Skills 目录不存在');
      return [];
    }

    const dirs = fs.readdirSync(this.skillsDir)
      .filter(item => {
        const fullPath = pathUtils.resolve(this.skillsDir, item);
        return fs.statSync(fullPath).isDirectory();
      });

    return dirs;
  }

  /**
   * 列出所有 Skills
   */
  list() {
    const skills = this.listSkills();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📚 Skills 列表');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (skills.length === 0) {
      console.log('未找到任何 Skills');
    } else {
      console.log(`共 ${skills.length} 个 Skills:\n`);
      for (const skill of skills.sort()) {
        const score = this.quickScore(skill);
        const grade = this.getGrade(score);
        console.log(`  ${grade} ${skill}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 快速评分
   */
  quickScore(skillName) {
    const skillDir = pathUtils.resolve(this.skillsDir, skillName);

    if (!pathUtils.exists(skillDir)) return 0;

    let score = 0;

    // 检查 SKILL.md
    if (pathUtils.exists(pathUtils.resolve(skillDir, 'SKILL.md'))) {
      score += 25;
    }

    // 检查 examples
    if (pathUtils.exists(pathUtils.resolve(skillDir, 'examples'))) {
      score += 15;
    }

    // 检查 references
    if (pathUtils.exists(pathUtils.resolve(skillDir, 'references'))) {
      score += 10;
    }

    // 检查 scripts
    if (pathUtils.exists(pathUtils.resolve(skillDir, 'scripts'))) {
      score += 10;
    }

    // 检查 README
    if (pathUtils.exists(pathUtils.resolve(skillDir, 'README.md'))) {
      score += 10;
    }

    return Math.min(score, 70);
  }

  /**
   * 评估单个 Skill
   */
  evaluateSkill(skillName) {
    const skillDir = pathUtils.resolve(this.skillsDir, skillName);

    if (!pathUtils.exists(skillDir)) {
      console.log(`Skill 不存在: ${skillName}`);
      return null;
    }

    const result = {
      name: skillName,
      score: 0,
      maxScore: 100,
      grade: 'F',
      issues: [],
      details: {}
    };

    // 1. 结构完整性评估
    const structureScore = this.evaluateStructure(skillDir);
    result.details.structure = structureScore;
    result.score += structureScore.total;

    // 2. 内容质量评估
    const contentScore = this.evaluateContent(skillDir);
    result.details.content = contentScore;
    result.score += contentScore.total;

    // 3. 代码质量评估
    const codeScore = this.evaluateCode(skillDir);
    result.details.code = codeScore;
    result.score += codeScore.total;

    // 4. 计算等级
    result.grade = this.getGrade(result.score);

    return result;
  }

  /**
   * 评估结构
   */
  evaluateStructure(skillDir) {
    const score = { total: 0, max: 30, checks: [] };

    // 检查 SKILL.md
    const hasSkill = pathUtils.exists(pathUtils.resolve(skillDir, 'SKILL.md'));
    score.checks.push({ name: 'has_skill_file', pass: hasSkill, score: hasSkill ? 10 : 0 });
    if (hasSkill) score.total += 10;

    // 检查 examples
    const hasExamples = pathUtils.exists(pathUtils.resolve(skillDir, 'examples'));
    score.checks.push({ name: 'has_examples', pass: hasExamples, score: hasExamples ? 10 : 0 });
    if (hasExamples) score.total += 10;

    // 检查 references
    const hasRefs = pathUtils.exists(pathUtils.resolve(skillDir, 'references'));
    score.checks.push({ name: 'has_references', pass: hasRefs, score: hasRefs ? 5 : 0 });
    if (hasRefs) score.total += 5;

    // 检查 scripts
    const hasScripts = pathUtils.exists(pathUtils.resolve(skillDir, 'scripts'));
    score.checks.push({ name: 'has_scripts', pass: hasScripts, score: hasScripts ? 5 : 0 });
    if (hasScripts) score.total += 5;

    return score;
  }

  /**
   * 评估内容
   */
  evaluateContent(skillDir) {
    const score = { total: 0, max: 40, checks: [] };

    const skillFile = pathUtils.resolve(skillDir, 'SKILL.md');
    if (!pathUtils.exists(skillFile)) {
      score.checks.push({ name: 'has_skill_file', pass: false, score: 0 });
      return score;
    }

    const content = fs.readFileSync(skillFile, 'utf8');

    // 检查描述
    const hasDesc = content.includes('description') || content.includes('用途');
    score.checks.push({ name: 'has_description', pass: hasDesc, score: hasDesc ? 10 : 0 });
    if (hasDesc) score.total += 10;

    // 检查使用说明
    const hasUsage = content.includes('用法') || content.includes('usage') || content.includes('使用');
    score.checks.push({ name: 'has_usage', pass: hasUsage, score: hasUsage ? 10 : 0 });
    if (hasUsage) score.total += 10;

    // 检查示例
    const hasExamples = content.includes('```') || content.includes('示例');
    score.checks.push({ name: 'has_examples', pass: hasExamples, score: hasExamples ? 10 : 0 });
    if (hasExamples) score.total += 10;

    // 检查前置要求
    const hasReqs = content.includes('前提') || content.includes('要求') || content.includes('requires');
    score.checks.push({ name: 'has_requirements', pass: hasReqs, score: hasReqs ? 5 : 0 });
    if (hasReqs) score.total += 5;

    // 检查局限性
    const hasLimits = content.includes('局限') || content.includes('注意') || content.includes('limit');
    score.checks.push({ name: 'has_limitations', pass: hasLimits, score: hasLimits ? 5 : 0 });
    if (hasLimits) score.total += 5;

    return score;
  }

  /**
   * 评估代码
   */
  evaluateCode(skillDir) {
    const score = { total: 0, max: 30, checks: [] };

    // 检查 scripts 目录
    const scriptsDir = pathUtils.resolve(skillDir, 'scripts');
    if (!pathUtils.exists(scriptsDir)) {
      score.checks.push({ name: 'has_scripts', pass: false, score: 0 });
      return score;
    }

    const files = fs.readdirSync(scriptsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    if (jsFiles.length === 0) {
      score.checks.push({ name: 'valid_syntax', pass: false, score: 0 });
      score.checks.push({ name: 'has_error_handling', pass: false, score: 0 });
      score.checks.push({ name: 'cross_platform', pass: false, score: 0 });
      return score;
    }

    // 检查语法
    let hasValidSyntax = true;
    let hasErrorHandling = false;
    let crossPlatform = true;

    for (const file of jsFiles) {
      const filePath = pathUtils.resolve(scriptsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // 简单语法检查
      try {
        new Function(content);
      } catch {
        hasValidSyntax = false;
      }

      // 检查错误处理
      if (content.includes('try') && content.includes('catch')) {
        hasErrorHandling = true;
      }

      // 检查跨平台
      if (content.includes('#!/bin/bash') || content.includes('/usr/bin/env bash')) {
        crossPlatform = false;
      }
    }

    score.checks.push({ name: 'valid_syntax', pass: hasValidSyntax, score: hasValidSyntax ? 10 : 0 });
    score.checks.push({ name: 'has_error_handling', pass: hasErrorHandling, score: hasErrorHandling ? 10 : 0 });
    score.checks.push({ name: 'cross_platform', pass: crossPlatform, score: crossPlatform ? 10 : 0 });

    if (hasValidSyntax) score.total += 10;
    if (hasErrorHandling) score.total += 10;
    if (crossPlatform) score.total += 10;

    return score;
  }

  /**
   * 获取等级
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * 评估所有 Skills
   */
  evaluate() {
    const skills = this.listSkills();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Skills 质量评估');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    const results = [];

    for (const skill of skills) {
      const result = this.evaluateSkill(skill);
      if (result) {
        results.push(result);
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    // 输出结果
    console.log('评估结果:\n');

    let totalScore = 0;
    for (const result of results) {
      const icon = result.grade === 'A' ? '🟢' : result.grade === 'B' ? '🔵' : result.grade === 'C' ? '🟡' : result.grade === 'D' ? '🟠' : '🔴';
      console.log(`${icon} ${result.name.padEnd(30)} ${result.score.toString().padStart(3)}/100 [${result.grade}]`);
      totalScore += result.score;
    }

    const avgScore = Math.round(totalScore / results.length);

    console.log('');
    console.log('-'.repeat(50));
    console.log(`平均分: ${avgScore}/100 [${this.getGrade(avgScore)}]`);
    console.log('');

    // 列出需要改进的
    const lowScore = results.filter(r => r.score < 60);
    if (lowScore.length > 0) {
      console.log('⚠️  需要改进的 Skills:');
      for (const skill of lowScore) {
        console.log(`   - ${skill.name} (${skill.score}/100)`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }

  /**
   * 评估指定 Skill
   */
  score(skillName) {
    const result = this.evaluateSkill(skillName);

    if (!result) return;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Skill 评估: ${skillName}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    console.log(`总分: ${result.score}/100 [${result.grade}]`);
    console.log('');

    console.log('详细评分:');
    console.log('');

    for (const [category, details] of Object.entries(result.details)) {
      console.log(`  ${category.toUpperCase()}: ${details.total || 0}/${details.max}`);

      for (const check of details.checks) {
        const icon = check.pass ? '✅' : '❌';
        console.log(`    ${icon} ${check.name}: ${check.score}分`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const skillName = args[1];

  try {
    const evaluator = new SkillEvaluator();

    switch (command) {
      case 'list':
        evaluator.list();
        break;

      case 'evaluate':
        evaluator.evaluate();
        break;

      case 'score':
        if (!skillName) {
          console.log('用法: skill-evaluator.js score <skill-name>');
          process.exit(1);
        }
        evaluator.score(skillName);
        break;

      default:
        console.log('Skill Evaluator - Skills 质量评估');
        console.log('');
        console.log('用法: node scripts/skill-evaluator.js <command> [args]');
        console.log('');
        console.log('命令:');
        console.log('  list              列出所有 Skills');
        console.log('  evaluate          评估所有 Skills');
        console.log('  score <skill>    评估指定 Skill');
        console.log('');
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

module.exports = SkillEvaluator;
