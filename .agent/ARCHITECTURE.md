# Antigravity Kit Architecture

> Comprehensive AI Agent Capability Expansion Toolkit

---

## ⚠️ CRITICAL: CORE INTEGRITY PRINCIPLE
**Lei Suprema do Projeto:**
Toda e qualquer funcionalidade nova (Fit Cultural, Análise de Equipe, PDI, Dashboards) **DEVE** utilizar os métodos do `TalentIntelligenceService` (TalkingTo Core) para processar scores e resultados.
- **PROIBIDO:** Replicar lógica de cálculo de score (Big Five) em outros services.
- **PROIBIDO:** Criar parsers de notas paralelos.
- **OBRIGATÓRIO:** O `TalentIntelligenceService` é a ÚNICA fonte de verdade (Single Source of Truth) para interpretação de dados dos colaboradores.

### 🚫 Princípio de Integridade de Dados (Zero Inferência)
É estritamente **PROIBIDO** utilizar "valores padrão de fallback" (ex: `value || 50`) para preencher dados de colaboradores.
- Se a nota é 0, o cálculo deve usar 0.
- Se a nota é null/undefined, a análise deve falhar ou sinalizar dados incompletos.
- **JAMAIS** assuma que um dado ausente é uma média (50%). A precisão do TalkingTo deve ser absoluta.

---

## 🧠 TALKINGTO ANALYTICS ENGINE (CORE)

O **TalkingTo** é o "cérebro" psicométrico da plataforma. Sua arquitetura é sustentada por três pilares fundamentais que devem ser respeitados rigorosamente:

### 1. Estrutura do Modelo Psicométrico
A base científica da ferramenta, definida no **Motor PINC**.
- **Modelo:** Big Five (Os 5 Grandes Fatores - OCEAN).
- **Dimensões:**
    - **O (Openness):** Abertura à Experiência / Mentalidade.
    - **C (Conscientiousness):** Conscienciosidade / Estrutura de Trabalho.
    - **E (Extraversion):** Extroversão / Energia Social.
    - **A (Agreeableness):** Amabilidade / Estilo Relacional.
    - **N (Neuroticismo):** Estabilidade Emocional (Resiliência).
- **Facetas (Granularidade):** Cada grande fator pode ser quebrado em sub-traços (ex: "Imaginação" dentro de Abertura) para análises profundas.

### 2. Motor de Cálculos (Math Engine & Configs)
Responsável pela precisão matemática. As regras de negócio "vivem" no banco de dados e são geridas pelo `BigFiveConfigService`.

#### A. Estrutura de Classificação (Ranges)
Os scores são classificados dinamicamente com base nos limites definidos na tabela `BigFiveConfig`:
- **Muito Baixo:** 0 a `veryLowMax` (Default: 20)
- **Baixo:** `veryLowMax` a `lowMax` (Default: 40)
- **Médio:** `lowMax` a `averageMax` (Default: 60)
- **Alto:** `averageMax` a `highMax` (Default: 80)
- **Muito Alto:** Acima de `highMax`.

#### B. Fórmulas de Cálculo
1.  **Normalização de Input:**
    - Inputs `1-5` (escala Likert) são convertidos para `0-100`:
    - `Score = ((Valor - 1) / 4) * 100` -> Ex: 3 vira 50.
2.  **Cálculo de Fit (Compatibilidade):**
    - `Diff = |ScoreCandidato - ScoreIdeal|`
    - `FitDimensão = Max(0, 100 - (Diff * 1.5))`
    - `FitGeral = Média(FitDimensões)`

#### C. Integridade e Sincronização
O sistema possui um mecanismo de **Sincronização Automática** (ver `BigFiveConfigService`) que garante que textos criados em ambiente de homologação sejam replicados para produção (configs `b8d1...` e `ae20...`), mantendo consistência total.

### 3. Motor de Regras Semânticas (Semantic Engine)
O tradutor que transforma números em narrativas humanas.

- **Menu de Gestão:** "Gerenciar TalkingTo > Motor PINC"
- **Estrutura de Dados:**
    - `Traits` (5 Fatores)
    - `Facets` (30 Sub-traços, ex: "Gregariedade" em "Extroversão")
    - `InterpretativeTexts` (Textos condicionais por Range e Categoria)

#### Lógica de Cruzamento (Combinatória)
O sistema não analisa apenas dimensões isoladas.
- **Arquétipos:** Define perfis combinando os 2 fatores mais fortes.
    - Ex: Alta Abertura + Alta Conscienciosidade = "Arquiteto Inovador".
- **Recomendações:** Gera dicas de PDI baseadas na intersecção de gaps.

---

---

### 4. Fluxos de Dados (Data Flow)

#### A. Fluxo B2C (O Colaborador)
`Respostas` → **Motor de Cálculos** → `Scores (0-100)` → **Motor Semântico** → `Relatório de Perfil (Arquétipo)`

#### B. Fluxo B2B (A Empresa)
`Vaga (Perfil Ideal)` + `Candidato (Scores Reais)` → **Motor de Cálculos (Fit)** → `Gráfico de Compatibilidade`

### 5. Princípio de Dinamismo Absoluto (101% Dinâmico)
O sistema foi arquitetado para que **NENHUMA** regra de negócio psicométrica fique refém de deploy ou código "chumbado".
- **Autonomia Total do Admin:** Através do painel **"Gerenciar TalkingTo > Motor PINC"**, o administrador pode alterar em tempo real:
    - **Ranges de Classificação:** (Ex: decidir que "Alto" começa em 75 e não 80).
    - **Pesos:** (Ex: Aumentar o impacto de "Disciplina" dentro de Conscienciosidade).
    - **Textos e Narrativas:** (Ajuste fino de copy sem TI).
- **Código como Executor:** O backend (`TalentIntelligenceService`) é apenas um **interpretador agnóstico**. Ele não "sabe" o que é alto ou baixo; ele pergunta ao banco de dados "qual é a regra vigente agora?" e aplica.

---

## 📋 Overview

Antigravity Kit is a modular system consisting of:

- **20 Specialist Agents** - Role-based AI personas
- **36 Skills** - Domain-specific knowledge modules
- **11 Workflows** - Slash command procedures

---

## 🏗️ Directory Structure

```plaintext
.agent/
├── ARCHITECTURE.md          # This file
├── agents/                  # 20 Specialist Agents
├── skills/                  # 36 Skills
├── workflows/               # 11 Slash Commands
├── rules/                   # Global Rules
└── scripts/                 # Master Validation Scripts
```

---

## 🤖 Agents (20)

Specialist AI personas for different domains.

| Agent | Focus | Skills Used |
| ----- | ----- | ----------- |
| `orchestrator` | Multi-agent coordination | parallel-agents, behavioral-modes |
| `project-planner` | Discovery, task planning | brainstorming, plan-writing, architecture |
| `frontend-specialist` | Web UI/UX | frontend-design, react-patterns, tailwind-patterns |
| `backend-specialist` | API, business logic | api-patterns, nodejs-best-practices, database-design |
| `database-architect` | Schema, SQL | database-design, prisma-expert |
| `mobile-developer` | iOS, Android, RN | mobile-design |
| `game-developer` | Game logic, mechanics | game-development |
| `devops-engineer` | CI/CD, Docker | deployment-procedures, docker-expert |
| `security-auditor` | Security compliance | vulnerability-scanner, red-team-tactics |
| `penetration-tester` | Offensive security | red-team-tactics |
| `test-engineer` | Testing strategies | testing-patterns, tdd-workflow, webapp-testing |
| `debugger` | Root cause analysis | systematic-debugging |
| `performance-optimizer` | Speed, Web Vitals | performance-profiling |
| `seo-specialist` | Ranking, visibility | seo-fundamentals, geo-fundamentals |
| `documentation-writer` | Manuals, docs | documentation-templates |
| `product-manager` | Requirements, user stories | plan-writing, brainstorming |
| `product-owner` | Strategy, backlog, MVP | plan-writing, brainstorming |
| `qa-automation-engineer` | E2E testing, CI pipelines | webapp-testing, testing-patterns |
| `code-archaeologist` | Legacy code, refactoring | clean-code, code-review-checklist |
| `explorer-agent` | Codebase analysis | - |

---

## 🧩 Skills (36)

Modular knowledge domains that agents can load on-demand. based on task context.

### Frontend & UI

| Skill | Description |
| ----- | ----------- |
| `react-patterns` | React hooks, state, performance |
| `nextjs-best-practices` | App Router, Server Components |
| `tailwind-patterns` | Tailwind CSS v4 utilities |
| `frontend-design` | UI/UX patterns, design systems |
| `ui-ux-pro-max` | 50 styles, 21 palettes, 50 fonts |

### Backend & API

| Skill | Description |
| ----- | ----------- |
| `api-patterns` | REST, GraphQL, tRPC |
| `nestjs-expert` | NestJS modules, DI, decorators |
| `nodejs-best-practices` | Node.js async, modules |
| `python-patterns` | Python standards, FastAPI |

### Database

| Skill | Description |
| ----- | ----------- |
| `database-design` | Schema design, optimization |
| `prisma-expert` | Prisma ORM, migrations |

### TypeScript/JavaScript

| Skill | Description |
| ----- | ----------- |
| `typescript-expert` | Type-level programming, performance |

### Cloud & Infrastructure

| Skill | Description |
| ----- | ----------- |
| `docker-expert` | Containerization, Compose |
| `deployment-procedures` | CI/CD, deploy workflows |
| `server-management` | Infrastructure management |

### Testing & Quality

| Skill | Description |
| ----- | ----------- |
| `testing-patterns` | Jest, Vitest, strategies |
| `webapp-testing` | E2E, Playwright |
| `tdd-workflow` | Test-driven development |
| `code-review-checklist` | Code review standards |
| `lint-and-validate` | Linting, validation |

### Security

| Skill | Description |
| ----- | ----------- |
| `vulnerability-scanner` | Security auditing, OWASP |
| `red-team-tactics` | Offensive security |

### Architecture & Planning

| Skill | Description |
| ----- | ----------- |
| `app-builder` | Full-stack app scaffolding |
| `architecture` | System design patterns |
| `plan-writing` | Task planning, breakdown |
| `brainstorming` | Socratic questioning |

### Mobile

| Skill | Description |
| ----- | ----------- |
| `mobile-design` | Mobile UI/UX patterns |

### Game Development

| Skill | Description |
| ----- | ----------- |
| `game-development` | Game logic, mechanics |

### SEO & Growth

| Skill | Description |
| ----- | ----------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals` | GenAI optimization |

### Shell/CLI

| Skill | Description |
| ----- | ----------- |
| `bash-linux` | Linux commands, scripting |
| `powershell-windows` | Windows PowerShell |

### Other

| Skill | Description |
| ----- | ----------- |
| `clean-code` | Coding standards (Global) |
| `behavioral-modes` | Agent personas |
| `parallel-agents` | Multi-agent patterns |
| `mcp-builder` | Model Context Protocol |
| `documentation-templates` | Doc formats |
| `i18n-localization` | Internationalization |
| `performance-profiling` | Web Vitals, optimization |
| `systematic-debugging` | Troubleshooting |

---

## 🔄 Workflows (11)

Slash command procedures. Invoke with `/command`.

| Command | Description |
| ------- | ----------- |
| `/brainstorm` | Socratic discovery |
| `/create` | Create new features |
| `/debug` | Debug issues |
| `/deploy` | Deploy application |
| `/enhance` | Improve existing code |
| `/orchestrate` | Multi-agent coordination |
| `/plan` | Task breakdown |
| `/preview` | Preview changes |
| `/status` | Check project status |
| `/test` | Run tests |
| `/ui-ux-pro-max` | Design with 50 styles |

---

## 🎯 Skill Loading Protocol

```plaintext
User Request → Skill Description Match → Load SKILL.md
                                            ↓
                                    Read references/
                                            ↓
                                    Read scripts/
```

### Skill Structure

```plaintext
skill-name/
├── SKILL.md           # (Required) Metadata & instructions
├── scripts/           # (Optional) Python/Bash scripts
├── references/        # (Optional) Templates, docs
└── assets/            # (Optional) Images, logos
```

### Enhanced Skills (with scripts/references)

| Skill | Files | Coverage |
| ----- | ----- | -------- |
| `typescript-expert` | 5 | Utility types, tsconfig, cheatsheet |
| `ui-ux-pro-max` | 27 | 50 styles, 21 palettes, 50 fonts |
| `app-builder` | 20 | Full-stack scaffolding |

---

## � Scripts (2)

Master validation scripts that orchestrate skill-level scripts.

### Master Scripts

| Script | Purpose | When to Use |
| ------ | ------- | ----------- |
| `checklist.py` | Priority-based validation (Core checks) | Development, pre-commit |
| `verify_all.py` | Comprehensive verification (All checks) | Pre-deployment, releases |

### Usage

```bash
# Quick validation during development
python .agent/scripts/checklist.py .

# Full verification before deployment
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

### What They Check

**checklist.py** (Core checks):

- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

**verify_all.py** (Full suite):

- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

For details, see [scripts/README.md](scripts/README.md)

---

## 📊 Statistics

| Metric | Value |
| ------ | ----- |
| **Total Agents** | 20 |
| **Total Skills** | 36 |
| **Total Workflows** | 11 |
| **Total Scripts** | 2 (master) + 18 (skill-level) |
| **Coverage** | ~90% web/mobile development |

---

## 🔗 Quick Reference

| Need | Agent | Skills |
| ---- | ----- | ------ |
| Web App | `frontend-specialist` | react-patterns, nextjs-best-practices |
| API | `backend-specialist` | api-patterns, nodejs-best-practices |
| Mobile | `mobile-developer` | mobile-design |
| Database | `database-architect` | database-design, prisma-expert |
| Security | `security-auditor` | vulnerability-scanner |
| Testing | `test-engineer` | testing-patterns, webapp-testing |
| Debug | `debugger` | systematic-debugging |
| Plan | `project-planner` | brainstorming, plan-writing |
