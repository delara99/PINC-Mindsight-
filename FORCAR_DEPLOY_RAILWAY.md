# Como Forçar Deploy no Railway

## PROBLEMA:
O código foi commitado no GitHub mas o Railway não está deployando automaticamente.

## SOLUÇÃO - OPÇÃO 1: Via Railway Dashboard

1. **Acesse:** https://railway.app
2. **Login** com sua conta
3. **Selecione** o projeto `PINC-Mindsight`
4. **Clique** no serviço `backend`
5. **Vá em** `Deployments` (aba lateral)
6. **Clique** em `Deploy` (botão no canto superior direito)
7. **Ou** clique nos 3 pontinhos `...` no último deploy e selecione `Redeploy`

## SOLUÇÃO - OPÇÃO 2: Verificar Logs

1. Acesse o projeto no Railway
2. Clique no serviço `backend`
3. Vá em `Logs`
4. Veja se há algum erro de build ou deploy

## SOLUÇÃO - OPÇÃO 3: Webhook / Auto-Deploy

Se o webhook está quebrado:

1. Vá em `Settings` do serviço backend
2. Procure por `GitHub Webhook` ou `Auto Deploy`
3. Verifique se está ativado
4. Se necessário, reconecte o GitHub

---

## ⏱️ AGUARDE 3-5 MINUTOS APÓS FORÇAR O DEPLOY

Depois execute:

```bash
curl "https://pinc-mindsight-production.up.railway.app/api/v1/debug-reports/assignment/fc371f19-e891-4d2b-b7e0-1d1d8dbf5240"
```

Se retornar dados (não erro), o deploy funcionou!

---

## 🔍 TESTE RÁPIDO: Verificar Versão

Execute este comando para ver a última alteração deployada:

```bash
curl https://pinc-mindsight-production.up.railway.app/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

Se retornar erro diferente de antes, o deploy aconteceu.
