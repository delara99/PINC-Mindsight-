# 🔄 GUIA: Configurar Ambiente de Desenvolvimento Local

## 🎯 OBJETIVO
Sincronizar banco local (Docker) com schema e dados de produção (Railway).

---

## 📋 PRÉ-REQUISITOS

✅ Docker Desktop rodando
✅ MySQL local (saas_mysql) rodando na porta 3306
✅ Redis local (saas_redis) rodando na porta 6379

---

## 🚀 PASSO A PASSO

### **ETAPA 1: Acessar Railway Web Console**

1. Acesse: https://railway.app
2. Entre no projeto **PINC**
3. Clique no serviço **MySQL**
4. Vá na aba **"Data"**
5. Clique em **"Export Database"** ou **"Create Backup"**

**OU** Use o console SQL direto do Railway:

1. Vá na aba **"Query"**
2. Execute para ter uma ideia dos dados:
```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM assessments;
```

---

### **ETAPA 2: Resetar e Sincronizar Schema Local**

Execute estes comandos na sua máquina:

```bash
# Ir para o diretório do backend
cd "/Users/delara/Desktop/saas - project sued/PINC-Mindsight-/backend"

# Criar arquivo .env.local para desenvolvimento
cp .env .env.local

# Editar DATABASE_URL para apontar para MySQL local
# Altere de mysql.railway.internal para localhost
```

**Edite o `.env.local`:**

```env
DATABASE_URL="mysql://root:senha123@localhost:3306/pincdb"
JWT_SECRET=your-jwt-secret-aqui
PORT=3000
NODE_ENV=development
```

---

### **ETAPA 3: Aplicar Schema no Banco Local**

```bash
# Usar o schema.prisma atual (que já está atualizado)
# e aplicá-lo no banco local
npx prisma db push --skip-generate

# Gerar Prisma Client
npx prisma generate

# (Opcional) Popular dados de exemplo
npm run seed
```

---

### **ETAPA 4: (OPCIONAL) Copiar Dados de Produção**

Se você quiser os **dados reais** de produção no local:

**Opção A: Via Railway CLI (se tiver acesso)**
```bash
# Conectar ao MySQL de produção e fazer dump
railway connect mysql

# Dentro do MySQL, usar mysqldump
mysqldump -u root -p railway > backup-production.sql

# Sair e importar no local
docker exec -i saas_mysql mysql -uroot -psenha123 pincdb < backup-production.sql
```

**Opção B: Manual via Railway Web**
1. No Railway, aba "Data"
2. Exportar cada tabela importante como CSV
3. Importar no banco local usando scripts

---

### **ETAPA 5: Configurar docker-compose Atualizado**

Vou criar o arquivo **docker-compose.dev.yml** completo:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: saas_mysql_dev
    environment:
      MYSQL_ROOT_PASSWORD: senha123
      MYSQL_DATABASE: pincdb
    ports:
      - "3306:3306"
    volumes:
      - mysql_data_dev:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  redis:
    image: redis:alpine
    container_name: saas_redis_dev
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: saas_backend_dev
    environment:
      DATABASE_URL: "mysql://root:senha123@mysql:3306/pincdb"
      JWT_SECRET: "dev-jwt-secret-change-me"
      PORT: 3000
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
    command: npm run start:dev

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: saas_frontend_dev
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    ports:
      - "3001:3000"
    volumes:
      - ./app:/app/app
      - ./src:/app/src
      - ./public:/app/public
    command: npm run dev

volumes:
  mysql_data_dev:
```

---

### **ETAPA 6: Criar Scripts de Desenvolvimento**

Adicione ao **package.json** (raiz do projeto):

```json
{
  "scripts": {
    "dev:docker": "docker-compose -f docker-compose.dev.yml up",
    "dev:docker:build": "docker-compose -f docker-compose.dev.yml up --build",
    "dev:docker:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "npm run dev",
    "db:sync": "cd backend && npx prisma db push && npx prisma generate",
    "db:seed": "cd backend && npm run seed",
    "db:reset": "cd backend && npx prisma migrate reset"
  }
}
```

---

### **ETAPA 7: Workflow de Desenvolvimento**

```bash
# 1. Subir containers
npm run dev:docker

# 2. Em outro terminal, acessar banco
docker exec -it saas_mysql_dev mysql -uroot -psenha123 pincdb

# 3. Testar backend
curl http://localhost:3000/health

# 4. Testar frontend
http://localhost:3001
```

---

## 🔄 WORKFLOW DIÁRIO

### **Começar o dia:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### **Desenvolver:**
- Edite código frontend/backend
- Hot reload automático

### **Testar localmente:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

### **Commitar apenas quando estável:**
```bash
git add .
git commit -m "feat: nova funcionalidade testada"
git push

# Railway e Vercel fazem deploy automático
```

### **Finalizar o dia:**
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 📊 COMPARAÇÃO:

| Item | Produção (Railway/Vercel) | Desenvolvimento (Docker Local) |
|------|---------------------------|--------------------------------|
| **Backend** | Railway | Docker (localhost:3000) |
| **Frontend** | Vercel | Docker (localhost:3001) |
| **Banco** | Railway MySQL | Docker MySQL (localhost:3306) |
| **Deploy** | Automático via Git | Manual (reiniciar container) |
| **Velocidade** | Network latency | Instant (local) |
| **Testes** | Cuidado! | Pode quebrar à vontade |
| **Dados** | Reais de clientes | Teste/desenvolvimento |

---

## ⚠️ IMPORTANTE:

1. **NUNCA** commit o `.env.local` (já está no `.gitignore`)
2. **SEMPRE** testar localmente antes de fazer push
3. **Produção** deve ser estável - só subir código testado
4. Se algo der errado em produção, use o **backup-070126**

---

## 🎯 PRÓXIMOS PASSOS:

1. Configurar `.env.local`
2. Sincronizar schema: `npm run db:sync`
3. (Opcional) Popular dados: `npm run db:seed`
4. Subir containers: `npm run dev:docker`
5. Começar a desenvolver! 🚀

---

**Precisa de ajuda em alguma etapa? Me avise!**
