# 🚀 EXECUTAR fix-teste8.ts NO RAILWAY

## MÉTODO 1: Via Railway CLI (RECOMENDADO)

### Passo 1: Instalar Railway CLI
```bash
npm install -g @railway/cli
```

### Passo 2: Fazer login
```bash
railway login
```

### Passo 3: Vincular ao projeto
```bash
cd /Users/delara/Desktop/saas\ -\ project\ sued/PINC-Mindsight-/backend
railway link
# Selecione: PINC-Mindsight-
# Selecione: production
```

### Passo 4: Executar o script
```bash
railway run npx ts-node scripts/fix-teste8.ts
```

---

## MÉTODO 2: Via Terminal Temporário no Railway

### Passo 1: Criar container temporário
1. Acesse https://railway.app
2. Vá em PINC-Mindsight → backend
3. Clique em "Settings"
4. Role até "Temporary Shell"
5. Clique em "Open Shell"

### Passo 2: No terminal que abrir, execute:
```bash
npx ts-node scripts/fix-teste8.ts
```

---

## MÉTODO 3: Adicionar como Script NPM e Executar

### Passo 1: Adicionar ao package.json
Edite `backend/package.json` e adicione em `scripts`:
```json
{
  "scripts": {
    "fix-teste8": "ts-node scripts/fix-teste8.ts"
  }
}
```

### Passo 2: Commit e push
```bash
git add backend/package.json
git commit -m "feat: Add fix-teste8 script"
git push origin main
```

### Passo 3: No Railway Shell (Settings → Temporary Shell)
```bash
npm run fix-teste8
```

---

## MÉTODO 4: Executar Localmente Apontando para Railway DB

### Passo 1: Pegar DATABASE_URL do Railway
1. Railway → backend → Variables
2. Copie o valor de `DATABASE_URL`

### Passo 2: Executar localmente
```bash
cd backend
DATABASE_URL="mysql://root:..." npx ts-node scripts/fix-teste8.ts
```

⚠️ **CUIDADO:** Isso vai modificar o banco de produção!

---

## O QUE O SCRIPT FAZ

✅ Encontra o usuário teste8@empresa.com  
✅ Busca a config Big Five ativa do tenant  
✅ Vincula todos assignments COMPLETED à config ativa  
✅ Verifica se há scores calculados  
✅ Exibe status final  

## EXEMPLO DE OUTPUT

```
🔧 INICIANDO CORREÇÃO DO TESTE8...

✅ Usuário encontrado: teste8@empresa.com (ID: abc123)
   Tenant: c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246

✅ Config ativa encontrada: b8d11272-fb89-4284-b51d-991486e05a45
   Traços: 5
   Facetas: 30

📋 2 assignments encontrados:

Assignment: xyz789
  Assessment: (Wagner) Inventário de Personalidade Big Five
  Status: COMPLETED
  Config atual: ❌ NENHUMA
  Scores: ✅ 5 facetas
  🔧 CORRIGINDO...
  ✅ Config vinculada: b8d11272-fb89-4284-b51d-991486e05a45

════════════════════════════════════════
✅ CORREÇÃO FINALIZADA!
   ✓ Corrigidos: 1
   - Pulados: 1
════════════════════════════════════════

📊 STATUS FINAL:
  xyz789: Config=✅ | Scores=✅

🔌 Desconectando do banco...
```

---

## APÓS EXECUTAR

1. ✅ Volte ao navegador
2. ✅ Faça logout e login novamente
3. ✅ Tente a comparação entre teste7 e teste8
4. ✅ Deve funcionar! 🎉

---

**RECOMENDAÇÃO:** Use o **MÉTODO 1 (Railway CLI)** - é o mais simples e seguro!

```bash
npm install -g @railway/cli
railway login
cd backend
railway link
railway run npx ts-node scripts/fix-teste8.ts
```

**Data:** 2025-12-20 15:28  
**Arquivo:** `backend/scripts/fix-teste8.ts`
