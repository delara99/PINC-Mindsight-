# 🚀 Guia de Deploy - cPanel

Este guia mostra como hospedar o sistema SaaS em um servidor com cPanel.

---

## ⚠️ **IMPORTANTE: Limitações do cPanel**

O cPanel **pode ter limitações** para aplicações Node.js modernas. Antes de prosseguir, verifique com sua hospedagem:

1. ✅ Suporte a **Node.js 18+**
2. ✅ Suporte a **aplicações Node.js persistentes** (não apenas CGI)
3. ✅ Acesso a **MySQL 5.7+**
4. ✅ **Memória RAM**: Mínimo 2GB recomendado
5. ✅ Possibilidade de manter **2 processos Node.js** rodando (backend + frontend)

---

## 📋 Opções de Deployment

### **Opção 1: cPanel com Node.js App (Recomendado se disponível)**

Se seu cPanel tem o recurso "Setup Node.js App" (Cloudlinux/cPanel 11.102+):

### **Opção 2: VPS/Servidor Dedicado (Mais Flexível)**

Se você tem acesso root ou SSH completo ao servidor.

### **Opção 3: Plataformas de Hospedagem Especializadas**

Para facilitar, considere plataformas especializadas em Node.js:
- **Vercel** (Frontend grátis)
- **Railway** (Backend e DB grátis para começar)
- **Render** (Grátis para testar)
- **Heroku** (Pago mas simples)

---

## 🔧 Opção 1: Deploy em cPanel com Node.js

### **Passo 1: Preparar Arquivos Localmente**

No seu computador:

```bash
cd /Users/delara/Desktop/saas\ -\ project\ sued

# 1. Build do Backend
cd backend
npm install --production
npm run build
cd ..

# 2. Build do Frontend
cd frontend
npm install
npm run build
cd ..

# 3. Criar pacote para upload
mkdir deploy
cp -r backend/dist deploy/backend-dist
cp -r backend/node_modules deploy/backend-node_modules
cp backend/package.json deploy/
cp backend/.env deploy/backend.env
cp -r frontend/.next deploy/frontend-next
cp -r frontend/public deploy/frontend-public
cp frontend/package.json deploy/frontend-package.json

# 4. Compactar
cd deploy
zip -r saas-deploy.zip .
```

### **Passo 2: Configurar Banco de Dados no cPanel**

1. Acesse **cPanel → MySQL Databases**
2. Crie um novo banco: `saas_production`
3. Crie um usuário: `saas_user` com senha forte
4. Associe o usuário ao banco com **ALL PRIVILEGES**
5. **Anote:** Host (geralmente `localhost`), Database, User, Password

### **Passo 3: Upload dos Arquivos**

1. Acesse **cPanel → File Manager**
2. Navegue para `public_html/` (ou crie uma pasta `apps/saas/`)
3. Upload do `saas-deploy.zip`
4. Extraia o arquivo

### **Passo 4: Configurar Variáveis de Ambiente**

Crie arquivo `.env` dentro da pasta do backend:

```env
# Database
DATABASE_URL="mysql://saas_user:SUA_SENHA@localhost:3306/saas_production"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-mude-isso"

# URLs
FRONTEND_URL="https://seudominio.com"
BACKEND_URL="https://seudominio.com/api"

# Node
NODE_ENV="production"
```

### **Passo 5: Configurar Aplicação Node.js no cPanel**

1. Vá em **cPanel → Setup Node.js App**
2. Clique em **Create Application**
3. Configure:
   - **Node.js version**: 18.x ou superior
   - **Application mode**: Production
   - **Application root**: `apps/saas/backend` (caminho onde está o backend)
   - **Application URL**: `seudominio.com` ou `api.seudominio.com`
   - **Application startup file**: `dist/main.js`
   - **Environment variables**: Adicione as variáveis do .env

4. Clique em **Create**

### **Passo 6: Inicializar Banco de Dados**

Acesse via **SSH** (Terminal):

```bash
cd ~/apps/saas/backend
npx prisma generate
npx prisma db push
```

Se não tem SSH, use o **cPanel → Terminal** ou **phpMyAdmin** para executar as migrations manualmente.

### **Passo 7: Configurar Frontend**

Se o cPanel permitir, repita o processo para o frontend OU:

**Alternativa:** Hospedar frontend no **Vercel** (grátis):
1. Faça push do código do frontend para **GitHub**
2. Conecte no **Vercel**
3. Configure variável: `NEXT_PUBLIC_API_URL=https://seudominio.com/api`

### **Passo 8: Configurar Proxy Reverso (Opcional)**

No **cPanel → Apache Setup** ou `.htaccess`, configure:

```apache
# Redirecionar /api para backend Node.js
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:PORTA_BACKEND/api/$1 [P,L]

# Frontend
RewriteRule ^(.*)$ http://localhost:PORTA_FRONTEND/$1 [P,L]
```

---

## 🌐 Opção 2: Deploy Simplificado (Recomendado)

### **Backend: Railway.app** (Grátis para começar)

1. Crie conta em [Railway.app](https://railway.app)
2. **New Project → Deploy from GitHub**
3. Selecione a pasta `backend`
4. Configure variáveis de ambiente
5. Railway provê URL automática: `https://seu-app.railway.app`

### **Frontend: Vercel** (Grátis)

1. Crie conta em [Vercel.com](https://vercel.com)
2. **Import Project → GitHub**
3. Selecione a pasta `frontend`
4. Configure: `NEXT_PUBLIC_API_URL=https://seu-app.railway.app/api`
5. Deploy automático!

**Vantagens:**
- ✅ Deploy automático
- ✅ SSL grátis
- ✅ Escalável
- ✅ Logs fáceis
- ✅ Backups automáticos

---

## 🔐 Checklist Pós-Deploy

- [ ] Banco de dados criado e populado
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS ativo
- [ ] Teste de login funcionando
- [ ] Credenciais de admin alteradas
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

## 🆘 Troubleshooting

### Backend não inicia
- Verifique logs em cPanel → Node.js App → Logs
- Confirme versão do Node.js (18+)
- Valide DATABASE_URL

### Frontend não conecta ao Backend
- Confirme CORS está habilitado no backend
- Verifique se `NEXT_PUBLIC_API_URL` está correta
- Teste API diretamente: `curl https://seudominio.com/api/v1/auth/login`

### Erro de Banco de Dados
- Confirme usuário MySQL tem permissões
- Rode `npx prisma generate` novamente
- Valide string de conexão

---

## 📞 Precisa de Ajuda?

Se o cPanel não suportar Node.js adequadamente, considere:
1. **Upgrade de hospedagem** para plano com suporte Node.js
2. **VPS** (Vultr, DigitalOcean, AWS Lightsail)
3. **Plataformas especializadas** (Railway, Render, Vercel)

Entre em contato com o suporte da sua hospedagem e pergunte:
- "Vocês suportam aplicações Node.js v18+ persistentes?"
- "Como faço para manter um servidor Express/NestJS rodando?"
