# ✅ AMBIENTE LOCAL CONFIGURADO!

## 🎉 STATUS: PRONTO PARA USAR

---

## 📊 DADOS LOCAIS CRIADOS:

### **Credenciais:**
- **Admin:** `admin@empresa.com` / senha: `123`
- **Cliente:** `cliente@empresa.com` / senha: `123`

### **Banco de Dados:**
- **Host:** localhost:3306
- **Database:** saas_db
- **User:** root
- **Password:** rootpassword

---

## 🚀 COMO USAR (3 OPÇÕES):

### **Opção 1: Rodar Backend e Frontend Separados** (Recomendado)

```bash
# Terminal 1 - Backend
cd "/Users/delara/Desktop/saas - project sued/PINC-Mindsight-/backend"
npm run start:dev

# Terminal 2 - Frontend  
cd "/Users/delara/Desktop/saas - project sued/PINC-Mindsight-"
npm run dev
```

**Acessar:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api

---

### **Opção 2: Apenas Backend (para testar APIs)**

```bash
cd backend
npm run start:dev
```

**Testar:**
```bash
curl http://localhost:3000/health
```

---

### **Opção 3: Docker Compose Completo** (futuro)

```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 🔄 WORKFLOW RECOMENDADO:

### **1. Começar o Dia:**
```bash
# Verificar se MySQL está rodando
docker ps

# Se não estiver, iniciar
docker start saas_mysql saas_redis

# Subir backend
cd backend && npm run start:dev
```

### **2. Desenvolver:**
- Edite os arquivos ✏️
- Hot reload automático 🔥
- Testes instantâneos ⚡

### **3. Testar Localmente:**
- Login: http://localhost:3000
- Use as credenciais: `admin@empresa.com` / `123`

### **4. Quando tudo estiver OK:**
```bash
git add .
git commit -m "feat: nova funcionalidade testada ✅"
git push
```

**Railway + Vercel farão deploy automático! 🚀**

---

## ⚙️ COMANDOS ÚTEIS:

### **Banco de Dados:**
```bash
# Ver dados no MySQL
docker exec -it saas_mysql mysql -uroot -prootpassword saas_db

# Dentro do MySQL
SHOW TABLES;
SELECT * FROM users;
exit;

# Resetar banco (cuidado!)
cd backend && npm run db:reset

# Popular dados novamente
cd backend && npm run seed
```

### **Backend:**
```bash
# Rodar em desenvolvimento
npm run start:dev

# Build de produção
npm run build

# Rodar build
npm run start:prod
```

### **Prisma:**
```bash
# Sincronizar schema
npm run db:sync

# Abrir Prisma Studio (interface visual)
npx prisma studio
```

---

## 🆚 PRODUÇÃO vs DESENVOLVIMENTO:

| Item | **PRODUÇÃO** | **LOCAL** |
|------|--------------|-----------|
| **Frontend** | Vercel | localhost:3000 |
| **Backend** | Railway | localhost:3000/api |
| **DB** | Railway MySQL | Docker MySQL |
| **Deploy** | Git Push → Auto | Manual |
| **Testes** | ⚠️ Cuidado! | ✅ Livre |
| **Hot Reload** | ❌ Não | ✅ Sim |
| **Velocidade** | Network | Instant |

---

## 💡 DICAS:

1. **NUNCA** commit `.env.local` (já está no .gitignore)
2. **SEMPRE** teste local antes de fazer push
3. Use **Prisma Studio** para ver/editar dados: `npx prisma studio`
4. Mantenha Docker rodando para não perder dados
5. Se algo quebrar, use backup: `./restore-backup-070126.sh`

---

## 🎯 PRÓXIMOS PASSOS:

Agora você pode:

1. ✅ Rodar backend local: `cd backend && npm run start:dev`
2. ✅ Acessar: http://localhost:3000
3. ✅ Login: `admin@empresa.com` / `123`
4. ✅ Desenvolver rapidamente sem fazer deploy!

---

**Ambiente pronto! Bora desenvolver! 🚀**
