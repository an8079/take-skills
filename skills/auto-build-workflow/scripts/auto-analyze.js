#!/usr/bin/env node
/**
 * 自动需求分析脚本
 * 扫描 docs/ 目录，提取需求信息
 */

const fs = require('fs');
const path = require('path');

class RequirementsAnalyzer {
  constructor(docsDir = './docs') {
    this.docsDir = docsDir;
    this.requirements = {
      name: '',
      description: '',
      features: [],
      techStack: [],
      apis: [],
      database: [],
      workflows: [],
      files: []
    };
  }

  analyze() {
    console.log('🔍 扫描 docs/ 目录...\n');

    if (!fs.existsSync(this.docsDir)) {
      console.log('❌ docs/ 目录不存在');
      return null;
    }

    const files = fs.readdirSync(this.docsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(this.docsDir, f),
        content: fs.readFileSync(path.join(this.docsDir, f), 'utf-8')
      }));

    this.requirements.files = files.map(f => f.name);

    console.log(`📄 发现 ${files.length} 个文档:\n`);
    files.forEach(f => console.log(`  - ${f.name}`));
    console.log('');

    // 解析每个文档
    files.forEach(file => {
      this.parseFile(file.name, file.content);
    });

    // 尝试从文件名推断项目名称
    this.inferProjectName();

    console.log('✅ 需求解析完成\n');
    console.log('📋 需求摘要:');
    console.log(`  项目名称: ${this.requirements.name || '未指定'}`);
    console.log(`  项目描述: ${this.requirements.description || '未指定'}`);
    console.log(`  功能列表: ${this.requirements.features.length} 个`);
    console.log(`  技术栈: ${this.requirements.techStack.length} 个`);
    console.log(`  API定义: ${this.requirements.apis.length} 个`);
    console.log(`  数据库表: ${this.requirements.database.length} 个`);

    return this.requirements;
  }

  parseFile(filename, content) {
    console.log(`📝 解析: ${filename}`);

    // 检测文档类型并解析
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('requirement') || lowerName.includes('需求')) {
      this.parseRequirements(content);
    } else if (lowerName.includes('api') || lowerName.includes('接口')) {
      this.parseAPIs(content);
    } else if (lowerName.includes('database') || lowerName.includes('db') || lowerName.includes('数据')) {
      this.parseDatabase(content);
    } else if (lowerName.includes('workflow') || lowerName.includes('流程')) {
      this.parseWorkflows(content);
    } else if (lowerName.includes('tech') || lowerName.includes('技术')) {
      this.parseTechStack(content);
    } else {
      // 通用解析
      this.parseGeneric(content);
    }
  }

  parseRequirements(content) {
    // 提取项目名称
    const nameMatch = content.match(/#{1,3}\s*项目[名称道称][:：]?\s*([^\n]+)/i);
    if (nameMatch && !this.requirements.name) {
      this.requirements.name = nameMatch[1].trim();
    }

    // 提取描述
    const descMatch = content.match(/#{1,3}\s*描述[:：]?\s*([^\n]+)/i);
    if (descMatch) {
      this.requirements.description = descMatch[1].trim();
    }

    // 提取功能列表
    const featureMatches = content.match(/#{2,4}\s*[功能需求?][\s:：]*([^\n]+)/gi);
    if (featureMatches) {
      featureMatches.forEach(m => {
        const feature = m.replace(/#{2,4}\s*[功能需求?][\s:：]*/, '').trim();
        if (feature && !this.requirements.features.includes(feature)) {
          this.requirements.features.push(feature);
        }
      });
    }

    // 提取 bullet points
    const bulletMatches = content.match(/^[-*]\s+([^\n]+)$/gm);
    if (bulletMatches) {
      bulletMatches.forEach(m => {
        const feature = m.replace(/^[-*]\s+/, '').trim();
        if (feature.length > 5 && !this.requirements.features.includes(feature)) {
          this.requirements.features.push(feature);
        }
      });
    }
  }

  parseAPIs(content) {
    // 提取 API 端点
    const endpointMatches = content.match(/(GET|POST|PUT|DELETE|PATCH)\s+([^\s\n]+)/gi);
    if (endpointMatches) {
      endpointMatches.forEach(m => {
        const parts = m.split(/\s+/);
        if (parts.length >= 2) {
          this.requirements.apis.push({
            method: parts[0].toUpperCase(),
            path: parts[1]
          });
        }
      });
    }

    // 提取路径定义
    const pathMatches = content.match(/\/api\/[^\s\n,;]+/gi);
    if (pathMatches) {
      pathMatches.forEach(p => {
        if (!this.requirements.apis.find(a => a.path === p)) {
          this.requirements.apis.push({
            method: 'AUTO',
            path: p
          });
        }
      });
    }
  }

  parseDatabase(content) {
    // 提取表名
    const tableMatches = content.match(/#{2,4}\s*Table[:：]?\s*([^\n]+)/gi);
    if (tableMatches) {
      tableMatches.forEach(m => {
        const table = m.replace(/#{2,4}\s*Table[:：]?\s*/, '').trim();
        if (table) {
          this.requirements.database.push({ name: table, fields: [] });
        }
      });
    }

    // 提取 CREATE TABLE 语句
    const createMatches = content.match(/CREATE\s+TABLE\s+[`"]?(\w+)[`"]?/gi);
    if (createMatches) {
      createMatches.forEach(m => {
        const tableName = m.replace(/CREATE\s+TABLE\s+[`"]?/i, '').replace(/[`"]?/g, '').trim();
        if (tableName && !this.requirements.database.find(t => t.name === tableName)) {
          this.requirements.database.push({ name: tableName, fields: [] });
        }
      });
    }
  }

  parseWorkflows(content) {
    const steps = content.match(/#{2,4}\s*[步骤流程步][\s:：]*([^\n]+)/gi);
    if (steps) {
      steps.forEach(s => {
        const step = s.replace(/#{2,4}\s*[步骤流程步][\s:：]*/, '').trim();
        if (step) {
          this.requirements.workflows.push(step);
        }
      });
    }
  }

  parseTechStack(content) {
    const techKeywords = [
      'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++',
      'React', 'Vue', 'Angular', 'Next.js', 'Nuxt',
      'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'GraphQL', 'REST', 'gRPC', 'WebSocket',
      'TensorFlow', 'PyTorch', 'OpenAI', 'LangChain', 'RAG'
    ];

    techKeywords.forEach(tech => {
      const regex = new RegExp(tech, 'i');
      if (regex.test(content) && !this.requirements.techStack.includes(tech)) {
        this.requirements.techStack.push(tech);
      }
    });
  }

  parseGeneric(content) {
    // 尝试通用的解析方式
    this.parseRequirements(content);
    this.parseTechStack(content);
    this.parseAPIs(content);
    this.parseDatabase(content);
  }

  inferProjectName() {
    if (this.requirements.name) return;

    // 从 features 推断
    if (this.requirements.features.length > 0) {
      const firstFeature = this.requirements.features[0];
      // 尝试提取项目名称
      const match = firstFeature.match(/^[^\s]+/);
      if (match) {
        this.requirements.name = match[0];
      }
    }

    // 从文件名推断
    const files = this.requirements.files;
    if (files.length > 0) {
      const firstFile = files[0].replace('.md', '');
      if (!this.requirements.name && firstFile !== 'README') {
        this.requirements.name = firstFile;
      }
    }
  }

  generateProjectName() {
    if (this.requirements.name) {
      return this.requirements.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    return 'new-project-' + Date.now();
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const docsDir = args[0] || './docs';

  const analyzer = new RequirementsAnalyzer(docsDir);
  const result = analyzer.analyze();

  if (result) {
    // 输出 JSON
    console.log('\n📤 JSON 输出:');
    console.log(JSON.stringify(result, null, 2));
  }

  return result;
}

// 导出
module.exports = { RequirementsAnalyzer, analyze: main };

// 如果直接运行
if (require.main === module) {
  main();
}
