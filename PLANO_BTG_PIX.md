# 🏦 PLANO DE IMPLEMENTAÇÃO - PIX VIA BTG EMPRESAS

## 📋 VISÃO GERAL

**API Escolhida:** [PIX Cobrança Dinâmico](https://developers.empresas.btgpactual.com/docs/pix-cobranca)

**Vantagens do BTG Empresas:**
- ✅ Banco nacional consolidado
- ✅ API completa de PIX
- ✅ Webhooks automáticos
- ✅ Geração de QR Code dinâmico
- ✅ Link de pagamento incluído
- ✅ Expiração configurável

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

### 1. RECURSOS BTG DISPONÍVEIS

#### APIs que vamos usar:
1. **PIX Cobrança Dinâmico** - Criar QR Code
2. **Webhooks** - Receber notificações de pagamento
3. **Consulta de cobrança** - Verificar status

#### Fluxo BTG:
```
Cliente escolhe plano
  ↓
Backend cria cobrança PIX (POST /billing/v1/charges)
  ↓
BTG retorna: QR Code + Pix Copia e Cola + ID da cobrança
  ↓
Frontend exibe QR Code
  ↓
Cliente paga via PIX
  ↓
BTG envia webhook → /api/v1/payment/webhook-btg
  ↓
Backend valida e libera créditos
```

---

## 🔐 AUTENTICAÇÃO BTG

### OAuth 2.0 com BTG Id

**Endpoint de autenticação:**
```
POST https://auth.empresas.btgpactual.com/oauth/token
```

**Credenciais necessárias:**
- `client_id`
- `client_secret`
- `scope`: `billing.charge.create billing.charge.read`

**Fluxo de Token:**
1. Solicitar token a cada 1h (ou armazenar e renovar)
2. Incluir token no header: `Authorization: Bearer {token}`

---

## 📝 MODELO DE DADOS (Prisma)

```prisma
model Payment {
  id            String   @id @default(uuid())
  userId        String
  planId        String
  planName      String
  amount        Float
  status        PaymentStatus @default(PENDING)
  
  // Dados BTG
  btgChargeId   String?  @unique // ID da cobrança no BTG
  pixCopyPaste  String?  // Pix Copia e Cola
  qrCode        String?  // Base64 do QR Code
  
  expiresAt     DateTime
  paidAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([btgChargeId])
}

enum PaymentStatus {
  PENDING      // Aguardando pagamento
  PAID         // Pago
  EXPIRED      // Expirou
  CANCELED     // Cancelado
  REFUNDED     // Estornado
}
```

---

## 🔧 IMPLEMENTAÇÃO BACKEND

### 1. Serviço BTG (btg.service.ts)

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BtgService {
  private readonly AUTH_URL = 'https://auth.empresas.btgpactual.com/oauth/token';
  private readonly API_URL = 'https://api.empresas.btgpactual.com';
  private accessToken: string;
  private tokenExpiry: Date;

  async getAccessToken(): Promise<string> {
    // Verificar se token ainda é válido
    if (this.accessToken && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // Solicitar novo token
    const response = await axios.post(this.AUTH_URL, {
      grant_type: 'client_credentials',
      client_id: process.env.BTG_CLIENT_ID,
      client_secret: process.env.BTG_CLIENT_SECRET,
      scope: 'billing.charge.create billing.charge.read'
    });

    this.accessToken = response.data.access_token;
    // Token expira em 1h, renovar 5min antes
    this.tokenExpiry = new Date(Date.now() + (55 * 60 * 1000));
    
    return this.accessToken;
  }

  async createPixCharge(data: {
    amount: number;
    description: string;
    externalReference: string; // seu paymentId
  }) {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.API_URL}/billing/v1/charges`,
      {
        amount: data.amount,
        description: data.description,
        externalReference: data.externalReference,
        expiresIn: 900, // 15 minutos
        paymentMethod: 'PIX'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      chargeId: response.data.id,
      pixCopyPaste: response.data.pixCopyPaste,
      qrCode: response.data.qrCode, // Base64 ou URL
      expiresAt: response.data.expiresAt
    };
  }

  async getChargeStatus(chargeId: string) {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `${this.API_URL}/billing/v1/charges/${chargeId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return {
      status: response.data.status, // PENDING, PAID, EXPIRED, etc.
      paidAt: response.data.paidAt
    };
  }
}
```

### 2. Controller de Pagamentos (payment.controller.ts)

```typescript
@Controller('api/v1/payment')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  
  @Post('create-pix')
  async createPix(@Request() req, @Body() body: { planId: string }) {
    const user = req.user;
    
    // Buscar dados do plano
    const plan = await this.getPlano(body.planId);
    
    // Criar registro de pagamento
    const payment = await this.prisma.payment.create({
      data: {
        userId: user.userId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    // Criar cobrança no BTG
    const btgCharge = await this.btgService.createPixCharge({
      amount: plan.price,
      description: `Plano ${plan.name} - PINC Mindsight`,
      externalReference: payment.id
    });

    // Atualizar payment com dados BTG
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        btgChargeId: btgCharge.chargeId,
        pixCopyPaste: btgCharge.pixCopyPaste,
        qrCode: btgCharge.qrCode,
        expiresAt: new Date(btgCharge.expiresAt)
      }
    });

    return {
      paymentId: payment.id,
      qrCode: btgCharge.qrCode,
      pixCopyPaste: btgCharge.pixCopyPaste,
      expiresAt: btgCharge.expiresAt,
      amount: plan.price
    };
  }

  @Post('webhook-btg')
  async handleWebhook(@Body() webhook: any) {
    // Validar assinatura do webhook
    const isValid = this.validateWebhookSignature(webhook);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const { chargeId, status, paidAt, externalReference } = webhook;

    if (status === 'PAID') {
      // Buscar payment pelo externalReference
      const payment = await this.prisma.payment.findUnique({
        where: { id: externalReference }
      });

      if (!payment) {
        return { message: 'Payment not found' };
      }

      // Atualizar status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(paidAt)
        }
      });

      // Liberar créditos ao usuário
      await this.addCreditsToUser(payment.userId, payment.planName);
    }

    return { received: true };
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Se ainda está pendente, consultar BTG
    if (payment.status === 'PENDING' && payment.btgChargeId) {
      const btgStatus = await this.btgService.getChargeStatus(payment.btgChargeId);
      
      if (btgStatus.status === 'PAID') {
        // Atualizar localmente
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            paidAt: new Date(btgStatus.paidAt)
          }
        });

        // Liberar créditos
        await this.addCreditsToUser(payment.userId, payment.planName);

        return { status: 'PAID', paidAt: btgStatus.paidAt };
      }
    }

    return { status: payment.status, paidAt: payment.paidAt };
  }
}
```

---

## 🎨 FRONTEND - PaymentModal Atualizado

```typescript
const [payment, setPayment] = useState<any>(null);
const [polling, setPolling] = useState(false);

// Ao abrir modal
useEffect(() => {
  if (isOpen && plan && !is100PercentDiscount) {
    createPixPayment();
  }
}, [isOpen, plan]);

const createPixPayment = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/v1/payment/create-pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ planId: plan.id })
    });

    const data = await response.json();
    setPayment(data);
    
    // Iniciar polling
    startPolling(data.paymentId);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

const startPolling = (paymentId: string) => {
  setPolling(true);
  
  const interval = setInterval(async () => {
    const response = await fetch(`${API_URL}/api/v1/payment/status/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.status === 'PAID') {
      clearInterval(interval);
      setPolling(false);
      // Mostrar sucesso e recarregar
      showSuccessAndReload();
    }
  }, 3000); // Verificar a cada 3 segundos

  // Parar polling após 15 minutos
  setTimeout(() => {
    clearInterval(interval);
    setPolling(false);
  }, 15 * 60 * 1000);
};

// No JSX:
{payment && (
  <>
    <img 
      src={`data:image/png;base64,${payment.qrCode}`} 
      alt="QR Code PIX"
      className="w-64 h-64 mx-auto"
    />
    
    <div className="text-center">
      <p className="text-sm text-gray-600">
        Expira em: {formatExpiry(payment.expiresAt)}
      </p>
      {polling && (
        <p className="text-xs text-primary mt-2">
          🔄 Aguardando pagamento...
        </p>
      )}
    </div>

    <input
      readOnly
      value={payment.pixCopyPaste}
      className="..."
    />
  </>
)}
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Backend (.env)
```env
BTG_CLIENT_ID=seu_client_id_btg
BTG_CLIENT_SECRET=seu_client_secret_btg
BTG_WEBHOOK_SECRET=seu_webhook_secret
BTG_ENVIRONMENT=sandbox  # ou production
```

---

## 🚀 PASSOS DE IMPLEMENTAÇÃO

### FASE 1: SETUP (1h)
1. ✅ Criar conta no BTG Empresas Developer
2. ✅ Obter credenciais OAuth
3. ✅ Configurar webhook URL no painel BTG
4. ✅ Adicionar variáveis de ambiente

### FASE 2: BACKEND (3-4h)
1. ✅ Adicionar modelo Payment ao Prisma
2. ✅ Executar migration
3. ✅ Criar BtgService
4. ✅ Criar PaymentController
5. ✅ Implementar webhook handler
6. ✅ Testar em ambiente sandbox

### FASE 3: FRONTEND (2h)
1. ✅ Atualizar PaymentModal
2. ✅ Adicionar exibição de QR Code real
3. ✅ Implementar polling de status
4. ✅ Adicionar feedback visual

### FASE 4: TESTES E DEPLOY (1h)
1. ✅ Testar fluxo completo em sandbox
2. ✅ Validar webhook
3. ✅ Deploy para produção
4. ✅ Configurar webhook em produção

---

## ⏱️ TEMPO ESTIMADO TOTAL: 7-8 horas

---

## 🎯 PRÓXIMAS AÇÕES

**Quer que eu:**
1. ✅ Implemente TUDO agora?
2. ✅ Crie código completo para você revisar primeiro?
3. ✅ Façamos fase por fase?

**Escolha e começamos!** 🚀
