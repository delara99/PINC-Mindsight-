# Forçar Deploy no Vercel

## OPÇÃO 1: Via Vercel Dashboard

1. Acesse: https://vercel.com
2. Login na sua conta
3. Selecione o projeto `pinc-mindsight`
4. Vá em `Deployments`
5. Clique nos 3 pontinhos `...` do último deploy
6. Clique em `Redeploy`
7. **IMPORTANTE:** Marque "Use existing Build Cache" = **OFF** (desmarcar)

## OPÇÃO 2: Via Commit Vazio (automático)

Já fiz isso, mas o Vercel pode estar demorando. Aguarde 5-10 minutos.

## OPÇÃO 3: Verificar Status

1. Vá em https://vercel.com/delara99/pinc-mindsight (ou similar)
2. Veja se há um deploy "Building" ou "Ready"
3. O deploy mais recente deve ter o commit: "fix: map Portuguese trait names to English keys"

## ⏱️ TEMPO ESTIMADO

Vercel geralmente leva 2-5 minutos, mas pode chegar a 10 minutos.

## 🔍 TESTAR SE DEPLOYOU

Execute:
```bash
curl https://pinc-mindsight.vercel.app
```

Se retornar HTML, o site está no ar. Mas isso não garante que é a versão nova.

Para garantir, limpe o cache do navegador:
1. Abra DevTools (F12)
2. Clique com botão direito no botão de reload
3. Selecione "Empty Cache and Hard Reload"
