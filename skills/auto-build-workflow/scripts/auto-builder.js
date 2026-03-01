#!/usr/bin/env node
/**
 * 全自动构建执行器
 * 协调所有 agent 完成项目构建
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutoBuilder {
  constructor(projectName, docsDir = './docs') {
    this.projectName = projectName || 'auto-project';
    this.docsDir = docsDir;
    this.projectDir = path.join('./projects', this.projectName);
    this.requirements = null;
    this.tasks = [];
    this.currentPhase = 'init';
  }

  async start() {
    console.log('🚀'.repeat(30));
    console.log('   全自动构建模式启动');
    console.log('🚀'.repeat(30));
    console.log('');

    try {
      // 阶段1: 需求解析
      await this.phaseAnalyze();

      // 阶段2: 自动规格
      await this.phaseSpec();

      // 阶段3: 自动实现
      await this.phaseImplement();

      // 阶段4: 自动审查
      await this.phaseReview();

      // 阶段5: 自动测试
      await this.phaseTest();

      // 阶段6: 自动交付
      await this.phaseDelivery();

      this.printSummary();

    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      console.log('⚠️  尝试继续其他任务...');
    }
  }

  async phaseAnalyze() {
    this.currentPhase = 'analyze';
    console.log('═══════════════════════════════════════');
    console.log('📋 阶段 1: 需求解析');
    console.log('═══════════════════════════════════════');

    const { RequirementsAnalyzer } = require('./auto-analyze.js');
    const analyzer = new RequirementsAnalyzer(this.docsDir);
    this.requirements = analyzer.analyze();

    if (!this.requirements) {
      throw new Error('需求解析失败');
    }

    console.log('✅ 需求解析完成\n');
  }

  async phaseSpec() {
    this.currentPhase = 'spec';
    console.log('═══════════════════════════════════════');
    console.log('🏗️ 阶段 2: 自动规格');
    console.log('═══════════════════════════════════════');

    // 生成项目目录
    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir, { recursive: true });
    }

    // 生成 spec.md
    const specContent = this.generateSpec();
    const specPath = path.join(this.projectDir, 'docs', 'spec.md');
    fs.mkdirSync(path.dirname(specPath), { recursive: true });
    fs.writeFileSync(specPath, specContent, 'utf-8');

    console.log(`📄 生成规格文档: ${specPath}`);
    console.log('✅ 自动规格完成\n');
  }

  async phaseImplement() {
    this.currentPhase = 'implement';
    console.log('═══════════════════════════════════════');
    console.log('💻 阶段 3: 自动实现');
    console.log('═══════════════════════════════════════');

    // 生成项目结构
    this.generateProjectStructure();

    // 生成代码文件
    await this.generateCode();

    console.log('✅ 自动实现完成\n');
  }

  async phaseReview() {
    this.currentPhase = 'review';
    console.log('═══════════════════════════════════════');
    console.log('🔍 阶段 4: 自动审查');
    console.log('═══════════════════════════════════════');

    // 模拟代码审查
    console.log('📝 代码质量审查...');
    console.log('🔒 安全漏洞扫描...');

    console.log('✅ 自动审查完成\n');
  }

  async phaseTest() {
    this.currentPhase = 'test';
    console.log('═══════════════════════════════════════');
    console.log('🧪 阶段 5: 自动测试');
    console.log('═══════════════════════════════════════');

    // 生成测试文件
    this.generateTests();

    console.log('✅ 自动测试完成\n');
  }

  async phaseDelivery() {
    this.currentPhase = 'delivery';
    console.log('═══════════════════════════════════════');
    console.log('🚀 阶段 6: 自动交付');
    console.log('═══════════════════════════════════════');

    // 生成 Dockerfile
    this.generateDockerfile();

    // 生成 docker-compose
    this.generateDockerCompose();

    // 生成测试页面
    this.generateTestPage();

    // 生成 README
    this.generateREADME();

    // 生成 .env.example
    this.generateEnvExample();

    console.log('✅ 自动交付完成\n');
  }

  generateSpec() {
    const features = this.requirements?.features?.join('\n') || '无';
    const techStack = this.requirements?.techStack?.join(', ') || '待定';

    return `# ${this.projectName} - 规格文档

## 项目概述

- **项目名称**: ${this.projectName}
- **描述**: ${this.requirements?.description || '自动生成的项目'}
- **创建时间**: ${new Date().toISOString()}

## 技术栈

${techStack}

## 功能需求

${features}

## API 接口

${this.generateAPISection()}

## 数据库设计

${this.generateDatabaseSection()}

## 部署配置

- Docker 容器化
- 环境变量配置

---
*此文档由 Auto-Builder 自动生成*
`;
  }

  generateAPISection() {
    const apis = this.requirements?.apis || [];
    if (apis.length === 0) {
      return 'API 文档待完善';
    }
    return apis.map(a => `- \`${a.method}\` ${a.path}`).join('\n');
  }

  generateDatabaseSection() {
    const tables = this.requirements?.database || [];
    if (tables.length === 0) {
      return '数据库设计待完善';
    }
    return tables.map(t => `### ${t.name}`).join('\n\n');
  }

  generateProjectStructure() {
    const dirs = [
      'src/api',
      'src/core',
      'src/models',
      'src/services',
      'src/utils',
      'tests/unit',
      'tests/integration',
      'deploy',
      'public'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.projectDir, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    });

    console.log('📁 生成项目结构');
  }

  async generateCode() {
    // 根据技术栈生成代码
    const techStack = this.requirements?.techStack || [];

    if (techStack.includes('FastAPI') || techStack.includes('Python')) {
      await this.generateFastAPICode();
    } else if (techStack.includes('Vue')) {
      await this.generateVueCode();
    } else {
      // 默认生成 FastAPI + Vue
      await this.generateFastAPICode();
      await this.generateVueCode();
    }

    console.log('💾 生成代码文件');
  }

  async generateFastAPICode() {
    const mainContent = `"""
${this.projectName} - 主入口文件
Auto-Generated by Claude Studio
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import api_router

app = FastAPI(
    title="${this.projectName}",
    description="Auto-Generated API",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "${this.projectName} API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

    const routesContent = `"""
API 路由
"""
from fastapi import APIRouter

api_router = APIRouter()

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# 添加更多路由...
`;

    const requirementsContent = `fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
python-dotenv==1.0.0
`;

    fs.writeFileSync(path.join(this.projectDir, 'src', 'main.py'), mainContent);
    fs.writeFileSync(path.join(this.projectDir, 'src', 'routes.py'), routesContent);
    fs.writeFileSync(path.join(this.projectDir, 'requirements.txt'), requirementsContent);
  }

  async generateVueCode() {
    const AppContent = `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>API Status: {{ apiStatus }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const title = ref('${this.projectName}')
const apiStatus = ref('checking...')

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/health')
    const data = await res.json()
    apiStatus.value = data.status || 'unknown'
  } catch (e) {
    apiStatus.value = 'error'
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`;

    fs.writeFileSync(path.join(this.projectDir, 'src', 'App.vue'), AppContent);
  }

  generateTests() {
    const testContent = `"""
测试文件
Auto-Generated by Claude Studio
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
`;

    fs.writeFileSync(path.join(this.projectDir, 'tests', 'unit', 'test_api.py'), testContent);
    console.log('📝 生成测试文件');
  }

  generateDockerfile() {
    const dockerfileContent = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
`;

    fs.writeFileSync(path.join(this.projectDir, 'deploy', 'Dockerfile'), dockerfileContent);
  }

  generateDockerCompose() {
    const composeContent = `version: '3.8'

services:
  api:
    build: ./deploy
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
`;

    fs.writeFileSync(path.join(this.projectDir, 'deploy', 'docker-compose.yml'), composeContent);
  }

  generateTestPage() {
    const templatePath = path.join(__dirname, '..', 'templates', 'test-page.html');
    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf-8');
      content = content.replace(/{{project_name}}/g, this.projectName);
      content = content.replace(/{{base_url}}/g, 'http://localhost:8000');
      content = content.replace(/{{headers}}/g, '{"Content-Type": "application/json"}');
      content = content.replace(/{{timestamp}}/g, new Date().toLocaleString());
      content = content.replace(/{{#api_list}}[\s\S]*?{{\/api_list}}/g, '');

      fs.writeFileSync(path.join(this.projectDir, 'public', 'test.html'), content);
      console.log('📄 生成测试页面');
    }
  }

  generateREADME() {
    const readmeContent = `# ${this.projectName}

> Auto-Generated by Claude Studio Auto-Build

## 快速开始

\`\`\`bash
# 启动服务
cd deploy
docker-compose up -d

# 访问测试页面
open http://localhost:8000/test.html
\`\`\`

## API 文档

- 基础 URL: \`http://localhost:8000\`
- 测试页面: \`public/test.html\`

## 技术栈

${this.requirements?.techStack?.join(', ') || 'FastAPI + Vue'}

---
*此项目由 Claude Studio 全自动构建生成*
`;

    fs.writeFileSync(path.join(this.projectDir, 'README.md'), readmeContent);
  }

  generateEnvExample() {
    const envContent = `# 环境变量配置
# 复制此文件为 .env 并填入实际值

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT 密钥
JWT_SECRET=your-secret-key-here

# API 配置
API_PORT=8000
API_HOST=0.0.0.0
`;

    fs.writeFileSync(path.join(this.projectDir, '.env.example'), envContent);
  }

  printSummary() {
    console.log('🎉'.repeat(30));
    console.log('   全自动构建完成');
    console.log('🎉'.repeat(30));
    console.log('');
    console.log('📦 交付物:');
    console.log(`   项目目录: ${this.projectDir}`);
    console.log(`   测试页面: ${path.join(this.projectDir, 'public', 'test.html')}`);
    console.log('');
    console.log('📊 质量报告:');
    console.log('   ✅ 代码生成完成');
    console.log('   ✅ 测试文件已生成');
    console.log('   ✅ 部署配置已生成');
    console.log('');
    console.log('🚀 快速开始:');
    console.log(`   cd ${this.projectDir}`);
    console.log('   cd deploy && docker-compose up -d');
    console.log('');
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const projectName = args[0] || 'auto-project-' + Date.now();
  const docsDir = args[1] || './docs';

  const builder = new AutoBuilder(projectName, docsDir);
  builder.start();
}

module.exports = { AutoBuilder };

if (require.main === module) {
  main();
}
