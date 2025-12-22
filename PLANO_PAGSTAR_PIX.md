# 🎯 PLANO DE IMPLEMENTAÇÃO - PAGAMENTO PIX VIA PAGSTAR

## 📋 VISÃO GERAL

Sistema atual:
- ✅ Modal de pagamento com QR Code fake
- ✅ Chave PIX estática (CNPJ)
- ✅ Notificação manual ao admin
- ✅ Sistema de cupons funcionando

Objetivo:
- 🎯 Integrar Pagstar para gerar QR Codes dinâmicos
- 🎯 Receber webhooks de confirmação automática
- 🎯 Liberar créditos automaticamente após pagamento

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

### 1. BACKEND (NestJS)

#### 1.1 Criar Serviço Pagstar
**Arquivo:** `backend/src/payment/pagstar.service.ts`
```typescript
- Autenticação (OAuth2)
- Criar QR Code PIX
- Consultar status do pagamento
- Processar webhook
```

#### 1.2 Criar Controller de Pagamentos
**Arquivo:** `backend/src/payment/payment.controller.ts`
```typescript
- POST /api/v1/payment/create-pix
- POST /api/v1/payment/webhook (recebe confirmação)
- GET /api/v1/payment/status/:id
```

#### 1.3 Modelo de Dados
**Adicionar à schema do Prisma:**
```prisma
model Payment {
  id            String   @id @default(uuid())
  userId        String
  planId        String
  amount        Float
  status        PaymentStatus
  pagstarTxId   String?  // ID da transação no Pagstar
  qrCodeData    String?  // QR Code Pix Copia e Cola
  expiresAt     DateTime
  paidAt        DateTime?
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}

enum PaymentStatus {
  PENDING
  PAID
  EXPIRED
  CANCELED
}
```

---

### 2. FRONTEND (Next.js)

#### 2.1 Atualizar PaymentModal
**Arquivo:** `app/dashboard/components/PaymentModal.tsx`

**Mudanças:**
- ✅ Chamar endpoint `/create-pix` ao abrir modal
- ✅ Exibir QR Code real retornado pelo Pagstar
- ✅ Mostrar timer de expiração (15 minutos)
- ✅ Polling para verificar status do pagamento
- ✅ Confirmação automática quando pago

#### 2.2 Telas que já usam PaymentModal
Já existem e funcionarão automaticamente:
1. `/dashboard/plans` (página de planos)
2. `/dashboard/my-assessments` (quando saldo acabar)

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Backend (.env)
```env
PAGSTAR_CLIENT_ID=seu_client_id
PAGSTAR_CLIENT_SECRET=seu_client_secret
PAGSTAR_API_URL=https://app.pagstar.com
PAGSTAR_WEBHOOK_SECRET=seu_webhook_secret
```

---

## 📝 PASSOS DE IMPLEMENTAÇÃO

### FASE 1: SETUP INICIAL (30min)
1. ✅ Criar conta no Pagstar
2. ✅ Obter credenciais (Client ID + Secret)
3. ✅ Adicionar variáveis de ambiente
4. ✅ Instalar dependências: `npm install axios`

### FASE 2: BACKEND (2-3h)
1. ✅ Criar módulo Payment
2. ✅ Implementar PagstarService
3. ✅ Adicionar modelo Payment ao Prisma
4. ✅ Criar endpoints de criação de PIX
5. ✅ Implementar webhook para confirmação
6. ✅ Testar com Postman/Insomnia

### FASE 3: FRONTEND (1-2h)
1. ✅ Atualizar PaymentModal para chamar API real
2. ✅ Exibir QR Code dinâmico
3. ✅ Implementar polling de status
4. ✅ Adicionar feedback visual de conclusão

### FASE 4: TESTES (1h)
1. ✅ Teste completo do fluxo
2. ✅ Validar webhook em ambiente de desenvolvimento
3. ✅ Configurar webhook no painel do Pagstar

---

## 🔄 FLUXO COMPLETO

```
1. Cliente clica em "Assinar Plano"
   ↓
2. Frontend chama POST /payment/create-pix
   ↓
3. Backend chama Pagstar API
   ↓
4. Pagstar retorna QR Code + ID da transação
   ↓
5. Frontend exibe QR Code real
   ↓
6. Cliente paga via PIX
   ↓
7. Pagstar envia webhook → POST /payment/webhook
   ↓
8. Backend valida webhook
   ↓
9. Backend atualiza status do pagamento
   ↓
10. Backend adiciona créditos ao usuário
   ↓
11. Frontend detecta mudança (polling) e mostra confirmação
```

---

## 📊 ENDPOINTS NECESSÁRIOS

### Backend

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/payment/create-pix` | Cria transação PIX |
| POST | `/api/v1/payment/webhook` | Recebe confirmação do Pagstar |
| GET | `/api/v1/payment/status/:id` | Consulta status do pagamento |
| GET | `/api/v1/payment/history` | Histórico de pagamentos do usuário |

---

## 🎨 UI/UX MELHORIAS

### No PaymentModal:
1. ✅ QR Code real (não mais fake)
2. ✅ Timer de expiração visível
3. ✅ Status em tempo real (aguardando → processando → confirmado)
4. ✅ Animação de sucesso ao confirmar
5. ✅ Botão "Atualizar Status" manual
6. ✅ Link para "Compartilhar QR Code"

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Webhook Security**: Validar assinatura do webhook
2. **Timeout**: QR Code expira em 15min
3. **Idempotência**: Evitar processar mesmo pagamento 2x
4. **Logs**: Registrar todas as transações
5. **Erro Handling**: Tratar falhas na API Pagstar

---

## 🚀 PRÓXIMOS PASSOS

Quer que eu:
1. ✅ Implemente a FASE 2 (Backend) agora?
2. ✅ Crie primeiro um ambiente de testes?
3. ✅ Forneça código completo para você revisar?

**Escolha uma opção e começamos!**
