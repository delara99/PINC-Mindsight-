# Arquitetura do Módulo Business (B2B) - PINC

## 1. Visão Geral
O módulo Business utiliza a infraestrutura multi-tenant já existente no core da PINC (`Tenant`, `User`, `Role`), isolando o acesso através de novas rotas e uma interface dedicada para RHs e Gestores.

## 2. Modelagem de Dados (Reutilização Estrita)
Não haverá alteração estrutural no banco de dados (`prisma/schema.prisma`). Utilizaremos os modelos existentes da seguinte forma:

### Tenants (Empresas)
* **Model**: `Tenant`
* **Identificação**: Pelo campo `plan = BUSINESS`
* **Função**: Agrupa todos os usuários (RH e Colaboradores) de uma empresa.

### Usuários (Atores)
1. **RH Master (Gestor)**
   * **Model**: `User`
   * **Role**: `TENANT_ADMIN`
   * **Tenant**: `tenantId` preenchido
   * **Acesso**: Painel de Controle, Gestão de Usuários, Visualização de Relatórios.

2. **Colaborador / Candidato**
   * **Model**: `User`
   * **Role**: `MEMBER`
   * **Tenant**: `tenantId` preenchido
   * **Acesso**: Apenas responder aos assessments atribuídos e visualizar (opcionalmente) o próprio relatório.

3. **Super Admin (PINC)**
   * **Model**: `User`
   * **Role**: `SUPER_ADMIN`
   * **Acesso**: Criação de `Tenant` e do primeiro usuário `TENANT_ADMIN`.

## 3. Segurança e Isolamento
* **Guard**: `JwtAuthGuard` (existente)
* **Decorators Customizados**:
    * `@Roles('TENANT_ADMIN')`: Para rotas de gestão do dashboard B2B.
* **Isolamento de Dados**: Todas as queries do `BusinessService` **DEVEM** filtrar obrigatoriamente pelo `tenantId` do usuário logado (`req.user.tenantId`). Isso impede vazamento de dados entre empresas.

## 4. Fluxos de Acesso
### A. Login Business
* **URL**: `/business/login`
* **Lógica**: Reutiliza `AuthService.login`. O frontend redireciona para `/business/dashboard` se o `role` for `TENANT_ADMIN` ou `/dashboard` (view simplificada) se for `MEMBER` corporativo.

### B. Dashboard RH
* **URL**: `/business/dashboard`
* **Features**:
    * **Stats**: Contagem de `AssessmentAssignment` filtrada por `tenantId`.
    * **Users**: CRUD de usuários com `role = MEMBER` e `tenantId = currentUser.tenantId`.
    * **Invites**: Geração de tokens/links para cadastro simplificado (usando `Invitation` model existente).

## 5. Estrutura de Pastas (Novo Módulo)

### Backend
```
backend/src/
└── business/
    ├── business.module.ts
    ├── business.controller.ts  -> Endpoints B2B isolados
    └── business.service.ts     -> Lógica de negócio B2B
```

### Frontend
```
app/
└── business/
    ├── page.tsx               -> Landing Page B2B (Public)
    ├── login/                 -> Login Dedicado
    └── dashboard/             -> Painel RH (Protected)
        ├── page.tsx           -> Visão Geral
        ├── candidates/        -> Gestão de Pessoas
        └── reports/           -> Relatórios Unificados
```

## 6. Diretrizes de Implementação
1. **Zero Impacto B2C**: O código B2B reside em arquivos isolados.
2. **Reuso de Motores**: Os cálculos de perfil reutilizam `ScoreCalculationService` e `TalkingToService` sem modificação, apenas chamados via injeção de dependência.
3. **UI Enterprise**: Design system focado em produtividade (tabelas densas, filtros, exportação).
