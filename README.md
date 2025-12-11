# 🚀 SaaS - Plataforma de Avaliação de Competências

## Como Iniciar o Sistema

### 📋 Pré-requisitos
- Node.js 18+ instalado
- MySQL rodando na porta 3306
- Banco de dados `saas_db` criado

---

## ⚡ Início Rápido (Recomendado)

### Opção 1: Script Automático (Ambos os Servidores)

```bash
./start.sh
```

Este script inicia **backend** e **frontend** simultaneamente e exibe os logs em tempo real.

**Para encerrar:** Pressione `Ctrl + C`

---

## 🔧 Início Manual

### Backend (Porta 3000)

```bash
cd backend
npm run start:dev
```

### Frontend (Porta 3001)

Em outro terminal:

```bash
cd frontend
npm run dev
```

---

## 📝 Scripts Disponíveis

### Backend (`/backend`)
- `npm run start:dev` - Inicia em modo desenvolvimento (hot reload)
- `npm run build` - Compila o projeto
- `npm run start` - Inicia em modo produção

### Frontend (`/frontend`)
- `npm run dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila para produção
- `npm run start` - Inicia servidor de produção

---

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api

---

## ❗ Solução de Problemas

### Erro: "Porta já em uso"

**Backend (3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

**Frontend (3001):**
```bash
lsof -ti:3001 | xargs kill -9
```

### Erro: "Cannot find module"

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Erro de Banco de Dados

```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## 🔑 Acessos Padrão

**TODOS os usuários agora têm a mesma senha:** `123`

### Usuários Disponíveis:
- **Admin:** `admin@sistema.com` - Senha: `123`
- **Cliente 1:** `cliente@empresa.com` - Senha: `123`
- **Cliente 2:** `wagner@empresa.com` - Senha: `123`
- **Qualquer outro usuário** - Senha: `123`

---

## 📁 Estrutura do Projeto

```
saas - project sued/
├── backend/          # API NestJS
├── frontend/         # UI Next.js
├── start.sh          # Script de início automático
└── README.md         # Este arquivo
```

---

## 💡 Dicas

1. **Sempre inicie o backend ANTES do frontend**
2. Use `./start.sh` para facilitar
3. Mantenha ambos os terminais abertos durante o desenvolvimento
4. Logs são salvos em `backend.log` e `frontend.log`

---

## 🆘 Suporte

Em caso de problemas:
1. Verifique se o MySQL está rodando
2. Confirme as variáveis de ambiente em `.env`
3. Reinstale as dependências: `npm install`
4. Reinicie os servidores
