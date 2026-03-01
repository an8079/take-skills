#!/usr/bin/env node

/**
 * Tech Stack Config Generator
 *
 * Generates project configuration files based on selected tech stack.
 * Usage: node generate-config.js --project="<name>" --stack="<stack>"
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const params = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const parts = arg.substring(2).split('=');
    const key = parts[0];
    const value = parts.slice(1).join('=');
    params[key] = value;
  }
});

const projectName = params.project || 'my-project';
const tech = params.stack || 'nextjs';

console.log('═════════════════════════════════════');
console.log(`🔧 Generating Config: ${projectName}`);
console.log(`📦 Tech Stack: ${tech}`);
console.log('═════════════════════════════════════\n');

// Config templates
const configTemplates = {
  nextjs: {
    'package.json': {
      name: projectName,
      version: '1.0.0',
      description: 'Next.js project',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0',
        eslint: '^8.0.0'
      }
    },
    'tsconfig.json': {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'preserve',
        module: 'ESNext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        allowJs: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        incremental: true
      },
      include: ['src'],
      exclude: ['node_modules']
    },
    '.env.example': {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api'
    }
  },
  python: {
    'requirements.txt': [
      'fastapi==0.104.0',
      'uvicorn[standard]==0.24.0',
      'pydantic==2.5.0',
      'sqlalchemy==2.0.0',
      'pytest==7.4.0'
    ].join('\n'),
    'pyproject.toml': `[tool.poetry]
name = "${projectName}"
version = "0.1.0"
description = "FastAPI project"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.0"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
pydantic = "^2.5.0"
sqlalchemy = "^2.0.0"

[tool.poetry.dev-dependencies]
pytest = "^7.4.0"
`,
    '.env.example': {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      SECRET_KEY: 'your-secret-key-here'
    }
  }
};

const templates = configTemplates[tech] || configTemplates.nextjs;

let generatedCount = 0;

for (const [filename, content] of Object.entries(templates)) {
  const outputPath = path.join(process.cwd(), filename);

  try {
    if (typeof content === 'string') {
      fs.writeFileSync(outputPath, content, 'utf-8');
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf-8');
    }

    generatedCount++;
    console.log(`✅ Generated: ${filename}`);
  } catch (error) {
    console.error(`❌ Error generating ${filename}: ${error.message}`);
  }
}

console.log('\n═════════════════════════════════════');
console.log(`✅ Generated ${generatedCount} files`);
console.log('🔗 Next steps:');
console.log('   1. Review generated files');
console.log('   2. Install dependencies');
console.log('   3. Start development');
console.log('═════════════════════════════════════');

process.exit(0);
