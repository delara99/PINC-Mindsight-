# 🟣 FALE COM A PINC - Plano de Implementação

## 📋 VISÃO GERAL

Assistente virtual de IA para ajudar clientes a entenderem seus relatórios de assessment Big Five.

---

## 🎯 OBJETIVOS

1. ✅ Explicar resultados de forma clara e empática
2. ✅ Responder perguntas sobre traços, scores e interpretações
3. ✅ Gerar resumos automáticos do relatório
4. ✅ Tornar a experiência mais interativa e moderna
5. ✅ NÃO alterar nenhuma funcionalidade existente

---

## 🏗️ ARQUITETURA

### FRONTEND (Next.js/React)

**Componentes a criar:**

1. **`PincAIChat.tsx`** - Componente principal do chat
   - Interface de chat moderna
   - Input de mensagens
   - Histórico de conversa
   - Botão de resumo automático

2. **`PincAIFloatingButton.tsx`** - Botão flutuante
   - Ícone animado
   - Abre/fecha o chat
   - Badge de notificação (opcional)

3. **Hook `usePincAI.ts`**
   - Lógica de chat
   - Chamadas à API
   - Estado da conversa

**Onde adicionar:**
- Página: `app/dashboard/assessments/results/[id]/page.tsx`
- Apenas quando role do usuário = CLIENT
- Apenas quando assessment está completo

---

### BACKEND (NestJS)

**Novos arquivos:**

1. **`backend/src/pinc-ai/pinc-ai.module.ts`**
2. **`backend/src/pinc-ai/pinc-ai.service.ts`**
3. **`backend/src/pinc-ai/pinc-ai.controller.ts`**

**Endpoints:**

```typescript
POST /api/v1/pinc-ai/chat
- Body: { assignmentId, message, conversationHistory }
- Headers: Authorization Bearer token
- Response: { reply, sources }

POST /api/v1/pinc-ai/summarize
- Body: { assignmentId }
- Headers: Authorization Bearer token
- Response: { summary }
```

**Integração com IA:**

Usar OpenAI GPT-4o-mini (custo-benefício ideal):
- Rápido
- Barato (~$0.15 / 1M tokens)
- Excelente para conversação

**Prompt System:**

```
Você é a assistente PINC, especialista em Big Five.

DADOS DO CLIENTE:
[Traços, scores, faixas, textos interpretativos]

REGRAS:
1. Base suas respostas APENAS nos dados fornecidos
2. Seja clara, empática e profissional
3. Use linguagem acessível, sem jargões
4. NÃO invente diagnósticos
5. Sempre avise: "Esta análise é informativa"
6. Se não souber, diga que precisa de mais informações no relatório

ESTILO:
- Tom: Acolhedor, profissional, didático
- Linguagem: Simples e direta
- Formato: Respostas estruturadas quando apropriado
```

---

## 🔐 SEGURANÇA

1. ✅ Validar que usuário tem acesso ao assignment
2. ✅ Apenas clientes com assessment completo
3. ✅ Rate limiting (máx 20 msgs/min)
4. ✅ Sanitizar inputs
5. ✅ Não expor dados sensíveis de outros usuários

---

## 💰 CUSTOS ESTIMADOS

**OpenAI GPT-4o-mini:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**Estimativa por conversa:**
- ~1.000 tokens (relatório + contexto)
- ~200 tokens (resposta média)
- ~10 mensagens por sessão

**Custo médio por usuário:**
~$0.002 (0,2 centavos de dólar) por conversa completa

**Com 1.000 usuários/mês:**
~$2/mês (irrisório)

---

## 📦 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Backend (.env)
OPENAI_API_KEY=sk-...
PINC_AI_MODEL=gpt-4o-mini
PINC_AI_MAX_TOKENS=500
PINC_AI_TEMPERATURE=0.7
```

---

## 🎨 UX/UI - COMPONENTES VISUAIS

### 1. Botão Flutuante
```
Posição: Canto inferior direito
Ícone: 🤖 ou logo PINC
Cor: Gradient roxo (#7C3AED → #A855F7)
Animação: Pulso sutil
Texto: "Fale com a PINC"
```

### 2. Painel do Chat
```
Tipo: Drawer lateral (direita)
Largura: 400px desktop, 100vw mobile
Header:
  - "🟣 Fale com a PINC"
  - Subtítulo: "Sua assistente de autoconhecimento"
  - Botão fechar (X)

Corpo:
  - Mensagens do usuário (direita, azul)
  - Mensagens da PINC (esquerda, roxo claro)
  - Avatar da PINC (logo ou emoji)

Footer:
  - Input de mensagem
  - Botão "📊 Resumir meu relatório"
  - Aviso pequeno: "IA informativa, não substitui profissional"
```

### 3. Mensagem Inicial (Welcome)
```
Quando abrir pela primeira vez:

"Olá! 👋 Sou a PINC, sua assistente de autoconhecimento.

Acabei de analisar seu relatório e estou aqui para:
✨ Explicar seus resultados
💡 Responder suas dúvidas
📊 Resumir tudo em poucos cliques

Pergunte qualquer coisa sobre seu perfil!"
```

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### FASE 1: Backend (2-3h)
1. ✅ Criar módulo PincAI
2. ✅ Integrar OpenAI
3. ✅ Criar endpoints de chat e resumo
4. ✅ Validação de acesso
5. ✅ Rate limiting

### FASE 2: Frontend (2-3h)
1. ✅ Componente PincAIChat
2. ✅ Botão flutuante
3. ✅ Hook usePincAI
4. ✅ Integração na página de resultados
5. ✅ Design responsivo

### FASE 3: Testes (1h)
1. ✅ Testar conversas
2. ✅ Testar resumo automático
3. ✅ Validar respostas
4. ✅ Ajustar prompts

### FASE 4: Refinamento (1h)
1. ✅ Feedback do usuário
2. ✅ Ajustes de UX
3. ✅ Otimização de custos

---

## 📊 MÉTRICAS DE SUCESSO

1. **Engajamento:**
   - % de usuários que abrem o chat
   - Média de mensagens por sessão
   - Taxa de uso do botão "Resumir"

2. **Satisfação:**
   - Feedback qualitativo
   - Tempo de permanência na página

3. **Custo:**
   - Gasto mensal com OpenAI
   - Custo por usuário ativo

---

## 🔮 FUTURAS MELHORIAS

1. ✅ **Versão Premium**: Limites para plano START, ilimitado para PRO/BUSINESS
2. ✅ **Histórico**: Salvar conversas para consulta futura
3. ✅ **Insights Proativos**: PINC sugerir reflexões automaticamente
4. ✅ **Integração WhatsApp**: Levar a PINC para fora da plataforma
5. ✅ **Multilíngua**: Suporte a outros idiomas

---

## ⚠️ AVISOS IMPORTANTES

1. **Não alterar:**
   - Cálculo de scores
   - Textos interpretativos existentes
   - Estrutura de relatórios
   - Qualquer funcionalidade atual

2. **Sempre incluir:**
   - Aviso de que é ferramenta informativa
   - Recomendação de acompanhamento profissional

3. **Limitações claras:**
   - IA não faz diagnósticos
   - Baseada apenas no relatório fornecido
   - Complemento, não substituto

---

## 🎯 PRONTO PARA IMPLEMENTAR?

Escolha:

1. ✅ **IMPLEMENTAR TUDO AGORA** (6-8h de trabalho)
2. ✅ **FAZER FASE POR FASE** (testar cada etapa)
3. ✅ **APENAS BACKEND PRIMEIRO** (testar API antes do UI)
4. ✅ **VER CÓDIGO COMPLETO** (revisar antes de aplicar)

**Me diga qual opção prefere!** 🚀
