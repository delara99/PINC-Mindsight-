# 🚀 Deploy Rápido - Railway + Vercel (RECOMENDADO)

Este é o método **MAIS SIMPLES E RÁPIDO** para colocar seu sistema no ar.

---

## ✨ Por que Railway + Vercel?

- ✅ **100% Grátis para começar**
- ✅ **Deploy em 10 minutos**
- ✅ **SSL/HTTPS automático**
- ✅ **Não precisa configurar servidor**
- ✅ **Backups automáticos**
- ✅ **Escalável quando precisar**

---

## 📦 Passo 1: Preparar o Código

### 1.1 Criar Repositório no GitHub

1. Crie conta em [GitHub.com](https://github.com) (se não tiver)
2. Crie um **novo repositório privado**: `saas-competencias`
3. No seu Mac, no terminal:

```bash
cd /Users/delara/Desktop/saas\ -\ project\ sued

# Inicializar Git (se ainda não tem)
git init
git add .
git commit -m "Initial commit"

# Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/saas-competencias.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Passo 2: Deploy do Banco de Dados (Railway)

1. **Acesse:** [Railway.app](https://railway.app)
2. **Clique em:** "Start a New Project"
3. **Selecione:** "Provision MySQL"
4. **Aguarde** criar (1-2 minutos)
5. **Clique na database** → Aba "Connect"
6. **Copie** a `DATABASE_URL` (exemplo: `mysql://root:senha@containers...`)

---

## 🔧 Passo 3: Deploy do Backend (Railway)

1. No Railway, clique **"+ New"** → **"GitHub Repo"**
2. **Conecte sua conta GitHub** (autorize)
3. **Selecione** o repositório `saas-competencias`
4. **Configure Root Directory:** `/backend`
5. Na aba **"Variables"**, adicione:

```
DATABASE_URL=mysql://... (cole a URL do passo anterior)
JWT_SECRET=minha-chave-super-secura-123456789
NODE_ENV=production
PORT=3000
```

6. Na aba **"Settings"** → **"Deploy"**:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`

7. Clique em **"Deploy"**

8. Aguarde o deploy (2-3 minutos)

9. **Copie a URL** que Railway gerou (ex: `https://seu-backend-production.up.railway.app`)

### 3.1 Inicializar Banco de Dados

1. No Railway, clique no seu **Backend**
2. Aba **"Deployments"** → Clique no último deploy
3. Clique em **"View Logs"**
4. No canto, clique em **"⋮"** → **"Shell"**
5. Digite:

```bash
npx prisma generate
npx prisma db push
```

---

## 🎨 Passo 4: Deploy do Frontend (Vercel)

1. **Acesse:** [Vercel.com](https://vercel.com)
2. **Clique em:** "Add New" → "Project"
3. **Conecte GitHub** e selecione `saas-competencias`
4. **Configure:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   
5. Na seção **"Environment Variables"**, adicione:

```
NEXT_PUBLIC_API_URL=https://seu-backend-production.up.railway.app/api/v1
```

6. Clique em **"Deploy"**

7. Aguarde (2-3 minutos)

8. **Pronto!** Vercel te dá uma URL: `https://seu-app.vercel.app`

---

## ✅ Passo 5: Teste Final

1. Acesse `https://seu-app.vercel.app`
2. Faça login com:
   - Email: `admin@sistema.com`
   - Senha: `123`

3. **Funcionou?** 🎉 **Sistema no ar!**

---

## 🔐 Passo 6: Configurar Domínio Próprio (Opcional)

### No Vercel (Frontend):
1. **Settings** → **Domains**
2. Adicione: `www.seudominio.com`
3. Siga instruções para apontar DNS

### No Railway (Backend):
1. **Settings** → **Domains**  
2. Adicione: `api.seudominio.com`
3. Configure DNS conforme instruções

---

## 💰 Custos

### **Tier Grátis:**
- Railway: **500 horas/mês grátis** ($0)
- Vercel: **Ilimitado para hobbies** ($0)
- **Total:** $0/mês

### **Se crescer:**
- Railway Pro: $5/mês (mais recursos)
- Vercel Pro: $20/mês (só se precisar)

---

## 🆘 Problemas Comuns

### "502 Bad Gateway" no frontend
- Backend ainda não terminou deploy
- Aguarde 2-3 minutos
- Verifique logs do Railway

### "Failed to fetch"
- `NEXT_PUBLIC_API_URL` incorreta no Vercel
- Vá em Settings → Environment Variables
- Atualize com URL correta do Railway

### "Error connecting to database"
- `DATABASE_URL` errada no Railway
- Copie novamente do MySQL do Railway
- Adicione nas variáveis do backend

---

## 📱 Compartilhar com Clientes

Após o deploy:

1. **URL de Produção:** `https://seu-app.vercel.app`
2. Crie contas para clientes no sistema
3. Envie credenciais via email
4. **Personalize domínio** para parecer mais profissional

---

## 🔄 Atualizar

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

**Railway e Vercel fazem deploy automático!** 🚀

---

## ✨ Pronto!

Seu sistema está **ONLINE** e acessível de qualquer lugar do mundo! 🌍
