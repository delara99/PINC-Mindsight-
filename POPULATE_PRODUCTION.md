# 🔧 INSTRUÇÕES PARA POPULAR TEXTOS NA PRODUÇÃO

## Opção 1: Via Railway CLI (Recomendado)

1. **Acesse o banco de produção via Railway:**
   ```bash
   cd backend
   railway login
   railway link
   ```

2. **Execute o script de população:**
   ```bash
   railway run npx ts-node prisma/populate-texts-production.ts
   ```

## Opção 2: Via Variável de Ambiente Manual

1. **Copie a DATABASE_URL de produção do Railway**
   - Acesse: https://railway.app
   - Vá no projeto PINC-Mindsight
   - Copie a variável `DATABASE_URL`

2. **Execute o script com a URL de produção:**
   ```bash
   cd backend
   DATABASE_URL="mysql://seu_usuario:senha@host:porta/database" npx ts-node prisma/populate-texts-production.ts
   ```

## Opção 3: Executar Seed Completo

Se as configs ainda não existem, execute o seed completo:

```bash
cd backend
railway run npx prisma db seed
```

## Verificar Resultado

Após executar, acesse:
https://pinc-mindsight.vercel.app/dashboard/diagnostic

E clique em "Executar Diagnóstico" - deve mostrar centenas de textos!

---

## ⚠️ Importante

- O script só cria textos que não existem (não duplica)
- É seguro executar múltiplas vezes
- Requer pelo menos 1 BigFiveConfig ativa no banco
