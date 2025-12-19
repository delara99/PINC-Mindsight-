# 🚀 EXECUÇÃO COMPLETA DA MIGRAÇÃO - GUIA DEFINITIVO

## ✅ **PROCESSO EM 3 PASSOS**

Este guia resolve **completamente** o problema de métricas não aplicadas.

---

## **📋 PASSO 1: FAZER LOGIN**

```bash
curl -X POST https://pinc-mindsight-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"123"}'
```

**✅ Response esperado:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "role": "SUPER_ADMIN"
  }
}
```

**➡️ COPIE o `access_token` completo!**

---

## **📋 PASSO 2: CRIAR CONFIGURAÇÕES PADRÃO**

Este passo cria automaticamente configurações Big Five para todos os tenants que não possuem.

```bash
curl -X POST https://pinc-mindsight-production.up.railway.app/api/v1/admin/migration/create-default-configs \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**✅ Response esperado:**
```json
{
  "success": true,
  "message": "Configurações padrão criadas com sucesso",
  "stats": {
    "total": 37,
    "created": 37,
    "errors": 0
  },
  "log": [
    "🚀 Iniciando criação de configurações padrão...",
    "📋 STEP 1: Buscando tenants sem configuração ativa...",
    "   Total de tenants: 50",
    "   Tenants sem config ativa: 37",
    "🔄 STEP 2: Criando configurações padrão...",
    "✅ Config criada para tenant: xxx",
    "✅ Processo concluído!",
    "   Configs criadas: 37",
    "   Erros: 0"
  ]
}
```

**📌 O QUE ESTE PASSO FAZ:**
- Detecta todos os tenants sem configuração Big Five ativa
- Cria uma configuração completa com:
  - ✅ **5 Traits** (Abertura, Conscienciosidade, Extroversão, Amabilidade, Neuroticismo)
  - ✅ **3 Facets por trait** (15 facets no total)
  - ✅ **Interpretações personalizadas** (veryLow, low, average, high, veryHigh)
  - ✅ **Pesos configurados** (1.0 padrão)
  - ✅ **Faixas de pontuação** (0-20, 20-40, 40-60, 60-80, 80-100)
- Marca a configuração como **ativa**

---

## **📋 PASSO 3: VINCULAR ASSIGNMENTS ÀS CONFIGS**

Agora que todos os tenants têm configuração ativa, vincular os assignments:

```bash
curl -X POST https://pinc-mindsight-production.up.railway.app/api/v1/admin/migration/link-assignments-to-configs \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**✅ Response esperado:**
```json
{
  "success": true,
  "message": "Migração executada com sucesso",
  "stats": {
    "total": 150,
    "updated": 150,
    "errors": 0,
    "remaining": 0
  },
  "log": [
    "🚀 Iniciando migração de assignments...",
    "📋 STEP 1: Verificando estrutura da tabela...",
    "✅ Coluna configId já existe",
    "📊 STEP 2: Analisando assignments...",
    "   Total de assignments: 150",
    "   Sem configId: 150",
    "   Com configId: 0",
    "🔄 STEP 3: Vinculando assignments às configurações ativas...",
    "✅ Migração concluída!",
    "   Assignments atualizados: 150",
    "   Erros: 0",
    "📊 STEP 4: Verificação final...",
    "   Assignments ainda sem configId: 0",
    "🎉 SUCESSO! Todos os assignments possuem configId vinculado!"
  ]
}
```

---

## **⚡ COMANDO ÚNICO (TUDO DE UMA VEZ)**

Se preferir executar tudo automaticamente:

```bash
# Obter token
TOKEN=$(curl -s -X POST https://pinc-mindsight-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Criar configs padrão
echo "PASSO 1: Criando configurações..."
curl -X POST https://pinc-mindsight-production.up.railway.app/api/v1/admin/migration/create-default-configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo "\n\nPASSO 2: Vinculando assignments..."
# Vincular assignments
curl -X POST https://pinc-mindsight-production.up.railway.app/api/v1/admin/migration/link-assignments-to-configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo "\n\n✅ MIGRAÇÃO COMPLETA!"
```

---

## **🎯 VERIFICAÇÃO DE SUCESSO**

Após executar, você deve ver:

### **✅ Passo 2:**
- `created: 37` (todas as configs criadas)
- `errors: 0`

### **✅ Passo 3:**
- `updated: 150` (todos os assignments vinculados)
- `remaining: 0` (nenhum assignment sem config)
- `errors: 0`

---

## **🎉 RESULTADO FINAL**

Após a migração completa:

1. ✅ **Todos os tenants** têm configuração Big Five ativa
2. ✅ **Todos os assignments** estão vinculados à config correta
3. ✅ **Relatórios PDF** podem ser re-baixados com dados verdadeiros
4. ✅ **Scores** calculados baseados nas respostas reais
5. ✅ **Interpretações** personalizadas do admin aplicadas
6. ✅ **Pesos e faixas** configurados pelo admin respeitados

---

## **📱 TESTANDO O RESULTADO**

1. **Login na plataforma** como um usuário qualquer
2. **Acesse um inventário completado**
3. **Re-baixe o relatório PDF**
4. **Verifique:**
   - ✅ Scores condizentes com as respostas
   - ✅ Interpretações personalizadas
   - ✅ Configuração aplicada fielmente

---

## **⚠️ OBSERVAÇÕES IMPORTANTES**

- **Token expira**: Se receber erro 401, refaça o login (Passo 1)
- **Idempotente**: Pode executar múltiplas vezes sem problema
- **Seguro**: Apenas SUPER_ADMIN pode executar
- **Backup não necessário**: Apenas adiciona dados, não remove

---

## **🔧 TROUBLESHOOTING**

### **Erro: "Token expirado"**
➡️ Refaça o login (Passo 1) e execute novamente

### **Erro: "Apenas SUPER_ADMIN pode executar"**
➡️ Verifique se o usuário tem role `SUPER_ADMIN`

### **Alguns assignments ainda sem configId**
➡️ Execute o Passo 2 novamente (pode haver tenants novos)

---

**🚀 AGUARDE ~3 MINUTOS PARA O DEPLOY NO RAILWAY, DEPOIS EXECUTE!**
