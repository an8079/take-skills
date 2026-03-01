---
name: project-template
description: >-
  Project template specialist that generates complete project scaffolding
  with pre-configured directory structure, configuration files, and
  best practice templates. Supports multiple technology stacks and
  development patterns.
allowed-tools: Read, Write, Bash, Task
---

# Project Template - 项目模板专家

## Overview

This skill generates complete project scaffolding with pre-configured directory structure, configuration files, and best practice templates. It supports multiple technology stacks and development patterns to accelerate project setup.

## Trigger Conditions

| Scenario | Trigger Pattern | Action |
|----------|-----------------|--------|
| User creates new project | Detect "create project", "init project", "scaffold" keywords | Auto-start scaffolding |
| Template creation phase | Before implementation begins | Prompt user if template needed |
| User asks for templates | Detect "template", "boilerplate", "scaffold" keywords | Provide template options |
| Multiple similar projects | Detect pattern of repeated setups | Suggest creating template |

## Template Categories

### 1. Frontend Templates

```javascript
const FRONTEND_TEMPLATES = {
  'nextjs-app': {
    name: 'Next.js Application',
    description: 'Modern Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui',
    structure: {
      src: {
        app: {
          'page.tsx': 'Main application page',
          'layout.tsx': 'Root layout with providers',
          'globals.css': 'Global styles',
          providers: {
            'theme-provider.tsx': 'Theme configuration',
            'query-provider.tsx': 'React Query setup'
          }
        },
        components: {
          ui: 'shadcn/ui components',
          'button.tsx': 'Button component',
          'card.tsx': 'Card component'
        },
        lib: {
          'utils.ts': 'Utility functions',
          'api.ts': 'API client'
        }
      },
      public: 'Static assets',
      tests: 'Test files'
    },
    config: {
      'package.json': 'Dependencies and scripts',
      'tsconfig.json': 'TypeScript configuration',
      'next.config.js': 'Next.js configuration',
      'tailwind.config.js': 'Tailwind CSS configuration',
      '.env.example': 'Environment variables template',
      '.gitignore': 'Git ignore patterns'
    }
  },
  'react-vite': {
    name: 'React + Vite',
    description: 'Fast React development with Vite, TypeScript, and modern tooling',
    // ...
  },
  'vue-app': {
    name: 'Vue 3 Application',
    description: 'Vue 3 with Vite, Composition API, and Pinia state',
    // ...
  }
};
```

### 2. Backend Templates

```javascript
const BACKEND_TEMPLATES = {
  'fastapi-service': {
    name: 'FastAPI Service',
    description: 'Python FastAPI with async support, Pydantic validation, and SQLAlchemy',
    structure: {
      app: {
        'main.py': 'Application entry point',
        'api': {
          'routes.py': 'API route definitions',
          'models.py': 'Data models',
          'schemas.py': 'Pydantic schemas'
        },
        services: {
          'database.py': 'Database connection',
          'auth.py': 'Authentication service'
        },
        core: {
          'config.py': 'Configuration management',
          'security.py': 'Security utilities'
        }
      },
      tests: 'pytest test files',
      alembic: 'Database migrations'
    },
    config: {
      'requirements.txt': 'Python dependencies',
      'pyproject.toml': 'Poetry configuration',
      '.env.example': 'Environment variables',
      'docker-compose.yml': 'Development setup'
    }
  },
  'nodejs-api': {
    name: 'Node.js API',
    description: 'Express/Fastify API with TypeScript, authentication, and OpenAPI',
    // ...
  }
};
```

### 3. Full-Stack Templates

```javascript
const FULLSTACK_TEMPLATES = {
  'nextjs-postgres': {
    name: 'Next.js + PostgreSQL',
    description: 'Complete full-stack application with Next.js frontend and PostgreSQL backend',
    includes: ['nextjs-app', 'fastapi-service'],
    integration: {
      'api-client.ts': 'Type-safe API client',
      'shared-types.ts': 'Shared TypeScript types',
      'docker-compose.yml': 'Multi-container setup'
    }
  },
  'saas-starter': {
    name: 'SaaS Starter Kit',
    description: 'Production-ready SaaS template with auth, billing, and multi-tenancy',
    features: [
      'User authentication (NextAuth)',
      'Subscription management (Stripe)',
      'Multi-tenant architecture',
      'Admin dashboard',
      'API documentation',
      'Testing setup',
      'CI/CD configuration'
    ]
  }
};
```

### 4. Specialized Templates

| Template | Purpose | Key Features |
|----------|---------|---------------|
| microservice | Microservice architecture | Docker, gRPC, health checks, service discovery |
| static-site | Static website generation | Markdown-based, SEO optimized, fast deployment |
| mobile-app | Mobile application setup | React Native or Flutter, offline support, push notifications |
| ml-service | Machine learning service | Model serving, batch processing, feature flags |

## Workflow

### Phase 1: Template Selection

```
User Request → Pattern Matching → Category Identification → Template Options
```

**Selection logic:**
1. Analyze user description for keywords
2. Match to template categories
3. Provide multiple options with descriptions
4. Wait for user confirmation

### Phase 2: Configuration

```
Template → User Customization → Final Config
```

**Configuration items:**
- Project name
- Author/organization
- License choice
- Package manager (npm/yarn/pnpm, poetry/pip)
- Testing framework preference
- Linting/formatting preferences
- CI/CD platform choice

### Phase 3: Scaffolding

```
Config → Directory Creation → File Generation → Dependency Installation
```

**Scaffolding steps:**
1. Create root directory
2. Generate directory structure
3. Write configuration file templates
4. Create placeholder files with documentation
5. Initialize version control
6. Install dependencies (optional)

### Phase 4: Post-Setup

```
Scaffold Complete → Validation → Documentation → Next Steps
```

**Post-setup actions:**
- Validate generated structure
- Generate README.md with quick start guide
- Create initial commit
- Display next steps and commands

## Output Format

### Template Presentation

```markdown
# Available Project Templates

Select a template for your project:

### 🌟 Recommended for Web Applications

#### nextjs-app
**Description:** Modern Next.js 14 application with TypeScript and Tailwind CSS

**Features:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS + shadcn/ui components
- React Query for data fetching
- NextAuth.js for authentication
- ESLint + Prettier configured

**Technologies:**
- Frontend: Next.js, React 18, TypeScript
- UI: Tailwind CSS, shadcn/ui
- State: Zustand
- Data: React Query

**Use:** Use template "nextjs-app"

---

#### vue-app
**Description:** Vue 3 application with Composition API and Pinia

**Features:**
- Vue 3 with Composition API
- Pinia for state management
- Vite for fast development
- Element Plus UI components

**Technologies:**
- Frontend: Vue 3, TypeScript
- Build: Vite
- UI: Element Plus
- State: Pinia

**Use:** Use template "vue-app"

---

### 🔧 Recommended for Backend Services

#### fastapi-service
**Description:** Python FastAPI service with async support

**Features:**
- FastAPI with async/await
- Pydantic for request validation
- SQLAlchemy for database ORM
- JWT authentication
- OpenAPI auto-documentation
- pytest testing setup

**Technologies:**
- Backend: FastAPI, Python 3.11+
- Database: PostgreSQL, SQLAlchemy
- Auth: JWT, bcrypt
- API: OpenAPI/Swagger

**Use:** Use template "fastapi-service"
```

### Scaffold Completion Report

```markdown
═════════════════════════════════════
✅ Project Template Generated Successfully
═════════════════════════════════════

**Project Name:** [name]
**Template Used:** [template-name]
**Generated At:** [timestamp]

**Structure Created:**
📁 src/
  ├── api/          # API endpoints
  ├── components/     # UI components
  ├── lib/          # Utilities
  └── styles/        # Styles

📄 config/
  ├── package.json    # Dependencies
  ├── tsconfig.json  # TypeScript config
  └── .env.example  # Env variables

🧪 tests/
  ├── unit/         #   Unit tests
  └── integration/   # Integration tests

**Next Steps:**
1. cd [project-name]
2. npm install (or pnpm install)
3. npm run dev
4. Open http://localhost:3000

**Documentation:**
- README.md contains quick start guide
- Architecture decisions documented in docs/
- API documentation available at /api/docs

═════════════════════════════════════
```

## Integration with Other Skills

| Skill | Integration Point |
|-------|------------------|
| tech-stack-detection | Provide templates for recommended stacks |
| competitive-analysis | Generate template based on competitor analysis |
| codex-reviewer | Apply best practices from review |
| devops-delivery | Include deployment configurations |

## Customization

### Adding Custom Templates

Create new templates by adding to `assets/custom-templates.json`:

```json
{
  "my-custom-template": {
    "name": "My Custom Template",
    "description": "Custom template for specific use case",
    "structure": { /* directory structure */ },
    "config": { /* configuration files */ },
    "scripts": { /* setup scripts */ }
  }
}
```

### Template Variables

Templates support variable substitution:

| Variable | Source | Example |
|----------|---------|----------|
| {{PROJECT_NAME}} | User input | my-awesome-project |
| {{AUTHOR}} | Git config or input | John Doe |
| {{YEAR}} | Current date | 2026 |
| {{LICENSE}} | License choice | MIT |

## Best Practices

1. **Include Documentation** - Every template should have comprehensive README
2. **Configure Tooling** - Pre-configure ESLint, Prettier, formatters
3. **Security Defaults** - Include .env.example, secure headers
4. **Testing Ready** - Include test setup and example tests
5. **CI/CD Ready** - Include basic GitHub Actions or similar
6. **Modern Patterns** - Use current best practices, not deprecated patterns
7. **Type Safe** - Prefer TypeScript or typed alternatives
8. **Accessible** - Include accessibility configurations

---

*Remember: Good templates save development time and enforce consistency across projects.*
