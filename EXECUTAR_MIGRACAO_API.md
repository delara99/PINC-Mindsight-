# 🚀 EXECUTAR MIGRAÇÃO VIA API

## ✅ **MÉTODO MAIS SIMPLES - VIA CHAMADA HTTP**

A migração pode ser executada diretamente fazendo uma chamada POST para a API em produção.

---

## 📋 **PASSO A PASSO:**

### **1️⃣ Fazer Login como SUPER_ADMIN**

Acesse: `https://seu-dominio.com/auth/login`

Ou obtenha o token via API:
```bash
curl -X POST https://seu-dominio/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "sua-senha"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **2️⃣ Executar a Migração**

#### **Via cURL:**
```bash
curl -X POST https://seu-dominio/api/admin/migration/link-assignments-to-configs \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

#### **Via Postman/Insomnia:**
```
Method: POST
URL: https://seu-dominio/api/admin/migration/link-assignments-to-configs
Headers:
  Authorization: Bearer SEU_TOKEN_AQUI
  Content-Type: application/json
```

#### **Via Navegador (Console do DevTools):**
```javascript
fetch('https://seu-dominio/api/admin/migration/link-assignments-to-configs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_AQUI',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## ✅ **RESPONSE ESPERADO:**

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
  "errorDetails": [],
  "log": [
    "🚀 Iniciando migração de assignments...",
    "",
    "📋 STEP 1: Verificando estrutura da tabela...",
    "✅ Coluna configId já existe",
    "",
    "📊 STEP 2: Analisando assignments...",
    "   Total de assignments: 150",
    "   Sem configId: 150",
    "   Com configId: 0",
    "",
    "🔄 STEP 3: Vinculando assignments às configurações ativas...",
    "",
    "✅ Migração concluída!",
    "   Assignments atualizados: 150",
    "   Erros: 0",
    "",
    "📊 STEP 4: Verificação final...",
    "   Assignments ainda sem configId: 0",
    "",
    "🎉 SUCESSO! Todos os assignments possuem configId vinculado!",
    ""
  ]
}
```

---

## 🔒 **SEGURANÇA:**

- ✅ **Apenas SUPER_ADMIN** pode executar
- ✅ Requer autenticação JWT válida
- ✅ Endpoint protegido por Guard

Se tentar com usuário não-admin:
```json
{
  "success": false,
  "message": "Apenas SUPER_ADMIN pode executar migrações"
}
```

---

## 📊 **ENTENDENDO O RESPONSE:**

| Campo | Descrição |
|-------|-----------|
| `success` | `true` se executou sem erros fatais |
| `message` | Mensagem resumida do resultado |
| `stats.total` | Total de assignments no banco |
| `stats.updated` | Quantos foram atualizados nesta execução |
| `stats.errors` | Quantos falharam |
| `stats.remaining` | Quantos ainda estão sem configId |
| `errorDetails` | Array com detalhes de cada erro |
| `log` | Log completo passo-a-passo |

---

## ⚠️ **TROUBLESHOOTING:**

### **Erro: "Tenant não possui configuração ativa"**

**Causa**: Existem tenants sem configuração Big Five ativa.

**Solução**:
1. Login como admin desse tenant
2. Ir em **Métricas de Avaliação**
3. Criar uma configuração
4. Marcar como **Ativa**
5. Executar migração novamente

### **Erro 401 Unauthorized**

**Causa**: Token inválido ou expirado.

**Solução**: Fazer login novamente e obter novo token.

### **Erro 403 Forbidden**

**Causa**: Usuário não é SUPER_ADMIN.

**Solução**: Usar conta de SUPER_ADMIN.

---

## 🔄 **EXECUTAR MÚLTIPLAS VEZES:**

✅ **É SEGURO** executar múltiplas vezes!

O endpoint verifica:
- Se a coluna configId já existe (não recria)
- Se assignments já têm configId (não atualiza)
- Apenas processa assignments sem configId

**Idempotente**: Mesmo resultado independente de quantas vezes executar.

---

## ✅ **APÓS A MIGRAÇÃO:**

1. ✅ Todos os assignments terão `configId`
2. ✅ Relatórios poderão ser re-baixados com dados corretos
3. ✅ Scores baseados nas métricas do admin
4. ✅ Interpretações personalizadas aplicadas

**Os clientes podem re-baixar seus PDFs e terão a versão correta!** 🎉
