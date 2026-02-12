# PROBLEMA: Backend Não Está Respondendo (Failed to Fetch)

## 🔴 DIAGNÓSTICO

**Erro:** `Failed to fetch` ao tentar acessar o admin
**Causa:** Backend do Railway não está respondendo
**Status:** `Application not found` (Railway fallback ativo)

## 🔍 VERIFICAÇÃO

```bash
curl https://pinc-mindsight-production.up.railway.app/api/v1/auth/status
# Retorna: {"status":"error","code":404,"message":"Application not found"}
```

**Headers importantes:**
- `x-railway-fallback: true` ← Backend não está rodando
- `HTTP/2 404` ← Página de erro do Railway

## ✅ CÓDIGO ESTÁ CORRETO

- ✅ Build local funciona: `npm run build` → Sucesso
- ✅ TypeScript compila sem erros de produção
- ✅ Commits estão corretos

## 🚨 PROBLEMA: DEPLOY DO RAILWAY

O Railway provavelmente:
1. **Travou no build** - Timeout ou erro de memória
2. **Falhou no deploy** - Erro não relacionado ao código
3. **Está reiniciando** - Pode estar em processo de deploy

## 🔧 SOLUÇÕES

### SOLUÇÃO 1: Verificar Logs do Railway (RECOMENDADO)

1. Acesse: https://railway.app
2. Entre no projeto `PINC-Mindsight`
3. Clique no serviço `backend`
4. Vá em **Deployments**
5. Veja o último deploy e clique em **View Logs**

**Procure por:**
- ❌ Erros de build: `error TS...`, `npm ERR!`
- ❌ Erros de memória: `JavaScript heap out of memory`
- ❌ Erros de timeout: `Build timed out`
- ❌ Erros de conexão: `Can't reach database`

### SOLUÇÃO 2: Forçar Redeploy

Se o deploy travou, force um novo:

1. No Railway, vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**

OU

1. Faça um commit vazio para triggerar novo deploy:
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

### SOLUÇÃO 3: Reverter para Versão Anterior

Se o problema persistir, reverta para o último commit que funcionava:

```bash
# Ver commits recentes
git log --oneline -10

# Reverter para commit anterior (exemplo)
git revert 79db9f1 --no-edit
git push
```

**Commits recentes:**
- `5f599fc` - Frontend: split facets
- `79db9f1` - Backend: add separated poles ← **PODE SER ESTE**
- `3940079` - Fix: remove facet mapping
- `3bce8c3` - Fix: specialist report
- `7d0be1e` - Fix: return saved scores

### SOLUÇÃO 4: Verificar Variáveis de Ambiente

No Railway, verifique se todas as variáveis estão configuradas:

**Essenciais:**
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### SOLUÇÃO 5: Verificar Limites do Railway

O Railway pode ter atingido limites:
- **Memória:** 512MB-8GB (depende do plano)
- **Build time:** 10-30 minutos
- **Deploy size:** Limite de espaço

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Acessar Railway e ver logs do último deploy
- [ ] Verificar se deploy está "In Progress" ou "Failed"
- [ ] Verificar mensagens de erro nos logs
- [ ] Verificar uso de memória/CPU
- [ ] Verificar variáveis de ambiente
- [ ] Tentar redeploy manual
- [ ] Se necessário, reverter commit problemático

## 🎯 PRÓXIMOS PASSOS

1. **PRIMEIRO:** Acesse o Railway e veja os logs
2. **Me envie:** Screenshot dos logs ou mensagem de erro
3. **Então:** Podemos decidir se é para:
   - Redeploy
   - Reverter commit
   - Ajustar configuração
   - Aumentar recursos

## 📝 INFORMAÇÕES ÚTEIS

**URL do Backend:** https://pinc-mindsight-production.up.railway.app
**Último commit funcionando:** Provavelmente `3bce8c3` ou anterior
**Commit suspeito:** `79db9f1` (modificou score-calculation.service.ts)

**Nota:** O código está correto localmente, então o problema é específico do ambiente Railway.
