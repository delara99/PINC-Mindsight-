# FUNCIONAMENTO COMPLETO DO SISTEMA PINC - FLUXO ATUAL

## 📋 VISÃO GERAL

O sistema PINC funciona em **4 ETAPAS PRINCIPAIS**:
1. **Resposta** - Cliente responde questionário
2. **Cálculo** - Motor processa e salva resultados
3. **Armazenamento** - Dados ficam permanentes no banco
4. **Exibição** - Relatórios leem do banco (SEM recalcular)

---

## 🔄 FLUXO DETALHADO

### ETAPA 1: CLIENTE RESPONDE O QUESTIONÁRIO

**Onde:** `/dashboard/assessments/[id]`

**O que acontece:**

1. Cliente acessa o link do teste
2. Vê 120 questões (Big Five padrão)
3. Responde em escala Likert (1-5)
4. Cada resposta é salva em `AssessmentResponse`:
   ```json
   {
     "assignmentId": "abc-123",
     "questionId": "q-001",
     "answer": 4
   }
   ```

**Arquivo:** `app/dashboard/assessments/[id]/page.tsx`

---

### ETAPA 2: SUBMISSÃO E CÁLCULO

**Quando:** Cliente clica em "Finalizar Teste"

**O que acontece:**

#### 2.1. Frontend envia para Backend
```typescript
POST /api/v1/assessments/assignments/{id}/submit
```

#### 2.2. Backend processa (AssessmentController)
**Arquivo:** `backend/src/assessment/assessment.controller.ts`

```typescript
@Post(':id/submit')
async submitAssessment(@Param('id') id: string) {
    // 1. Marca assignment como COMPLETED
    // 2. Chama o Motor de Cálculo
    // 3. Salva resultado no banco
    // 4. Retorna sucesso
}
```

---

### ETAPA 3: MOTOR DE CÁLCULO (ScoreCalculationService)

**Arquivo:** `backend/src/reports/score-calculation.service.ts`

**O que faz:**

#### 3.1. Busca Mapeamentos Ativos
```typescript
// Busca CalculationQuestionMapping (configuração de como calcular)
const mappings = await prisma.calculationQuestionMapping.findMany({
    where: { isActive: true }
});
```

**Estrutura do Mapeamento:**
```json
{
  "questionId": "q-001",
  "dimension": "OPENNESS",
  "facet": "IDEIAS",
  "isReversed": false,
  "weight": 1.0
}
```

#### 3.2. Processa Respostas
```typescript
// Para cada resposta do usuário:
mappings.forEach(mapping => {
    let score = userResponse.answer; // 1-5
    
    // Se questão reversa, inverte
    if (mapping.isReversed) {
        score = 6 - score; // 5→1, 4→2, etc
    }
    
    // Agrupa por dimensão e faceta
    dimensionScores[mapping.dimension].sum += score;
    dimensionScores[mapping.dimension].count += 1;
    
    facetScores[mapping.facet].sum += score;
    facetScores[mapping.facet].count += 1;
});
```

#### 3.3. Calcula Médias e Normaliza
```typescript
// Para cada dimensão:
const avgScore = sum / count; // Ex: 3.2 (escala 1-5)
const normalizedScore = ((avgScore - 1) / 4) * 100; // 0-100

// Exemplo:
// avgScore = 3.2
// normalizedScore = ((3.2 - 1) / 4) * 100 = 55
```

#### 3.4. Estrutura Final dos Scores
```json
{
  "OPENNESS": {
    "traitKey": "OPENNESS",
    "traitName": "Abertura à Experiência",
    "score": 55,
    "normalizedScore": 55,
    "level": "AVERAGE",
    "facets": [
      {
        "facetKey": "IDEIAS",
        "facetName": "IDEIAS",
        "score": 65,
        "rawScore": 260
      },
      {
        "facetKey": "VALORES",
        "facetName": "VALORES",
        "score": 50,
        "rawScore": 200
      }
    ]
  },
  "NEUROTICISM": { ... },
  "EXTRAVERSION": { ... },
  "AGREEABLENESS": { ... },
  "CONSCIENTIOUSNESS": { ... }
}
```

---

### ETAPA 4: ARMAZENAMENTO NO BANCO

**Tabela:** `AssessmentResult`

```typescript
await prisma.assessmentResult.create({
    data: {
        assignmentId: "abc-123",
        scores: calculatedScores, // JSON completo acima
        completedAt: new Date()
    }
});
```

**IMPORTANTE:** Esses scores são a **VERDADE OFICIAL**. Uma vez salvos, nunca mudam, mesmo que a configuração de mapeamentos mude no futuro.

---

### ETAPA 5: MOTOR PINC DE INTERPRETAÇÃO (TalkingToService)

**Arquivo:** `backend/src/talking-to/talking-to.service.ts`

**O que faz:**

#### 5.1. Lê Scores Salvos (NÃO recalcula!)
```typescript
const rawScores = assignment.result?.scores; // Lê do banco
```

#### 5.2. Mapeia para Nomenclatura PINC
```typescript
// Big Five → PINC
const mapping = {
    "OPENNESS": "Concreto-Abstrato",
    "CONSCIENTIOUSNESS": "Adaptável-Estruturado",
    "EXTRAVERSION": "Introversão-Extroversão",
    "AGREEABLENESS": "Lógico-Sentimental",
    "NEUROTICISM": "Emoção-Razão"
};
```

#### 5.3. Busca Textos Interpretativos
```typescript
// Busca textos customizados do banco (TalkingToMessage)
const messages = await prisma.talkingToMessage.findMany({
    where: {
        group: dimensionName,
        scoreRange: { contains: score } // Ex: "41-60" para score 55
    }
});
```

#### 5.4. Gera Análise Completa
```typescript
return {
    dimensions: [
        {
            name: "Concreto-Abstrato",
            score: 55,
            level: "MÉDIO",
            interpretation: "Você equilibra praticidade com criatividade...",
            facets: [...]
        }
    ],
    summary: "Seu perfil indica...",
    recommendations: [...]
};
```

---

## 📊 EXIBIÇÃO DOS RELATÓRIOS

### RELATÓRIO DO ESPECIALISTA

**Onde:** `/dashboard/reports/[id]`
**Arquivo:** `app/dashboard/reports/[id]/page.tsx`

**Fluxo:**

1. **Frontend chama API:**
   ```typescript
   GET /api/v1/assessments/assignments/{id}
   ```

2. **Backend retorna (AssessmentController):**
   ```typescript
   // LÊ DO BANCO (não recalcula!)
   const calculatedScores = assignment.result?.scores 
       ? { scores: assignment.result.scores } 
       : null;
   
   return { ...assignment, calculatedScores };
   ```

3. **Frontend exibe:**
   ```typescript
   // ANTES (ERRADO): Recalculava média das facetas
   // let finalScore = sumScores / adaptedFacets.length;
   
   // AGORA (CORRETO): Usa score do backend
   let finalScore = trait.normalizedScore || trait.score;
   ```

### RELATÓRIO DO CLIENTE (TalkingTO)

**Onde:** `/dashboard/devolutiva`
**Arquivo:** `src/components/reports/TalkingToReport.tsx`

**Fluxo:**

1. **Frontend chama API:**
   ```typescript
   GET /api/v1/talking-to/report/{assignmentId}
   ```

2. **Backend retorna (TalkingToController):**
   ```typescript
   // LÊ DO BANCO (não recalcula!)
   let rawScores = assignment.result?.scores;
   
   // Aplica interpretação PINC
   const analysis = await talkingToService.analyzeProfile(rawScores);
   
   return analysis;
   ```

3. **Frontend exibe:**
   ```typescript
   // ANTES (ERRADO): Recalculava média das facetas
   // finalScore = sumScores / validFacetCount;
   
   // AGORA (CORRETO): Usa score do backend
   let finalScore = trait.normalizedScore || trait.score;
   ```

---

## 🔒 GARANTIAS DO SISTEMA ATUAL

### ✅ Integridade de Dados

1. **Cálculo acontece UMA VEZ** - No momento da submissão
2. **Resultado é SALVO** - No banco de dados (AssessmentResult)
3. **Relatórios LEEM** - Nunca recalculam

### ✅ Consistência

- **Especialista e Cliente** mostram os mesmos números
- **Dados históricos** preservados (mesmo se configuração mudar)
- **Auditoria possível** - Sempre sabemos o que foi calculado

### ✅ Separação de Responsabilidades

| Componente | Responsabilidade |
|------------|------------------|
| **ScoreCalculationService** | Calcular scores UMA VEZ |
| **AssessmentResult (DB)** | Armazenar verdade oficial |
| **TalkingToService** | Interpretar e traduzir para PINC |
| **Controllers** | Ler do banco e retornar |
| **Frontend** | Exibir (NUNCA calcular) |

---

## 🎯 EXEMPLO PRÁTICO

**Cliente responde teste:**
- Questão 1 (OPENNESS/IDEIAS): 5
- Questão 2 (OPENNESS/IDEIAS, reversa): 2 → vira 4
- Questão 3 (OPENNESS/VALORES): 3
- ... (120 questões)

**Motor calcula:**
```
OPENNESS/IDEIAS: (5 + 4 + ...) / 10 questões = 3.8
Normalizado: ((3.8 - 1) / 4) * 100 = 70

OPENNESS/VALORES: (3 + ...) / 8 questões = 2.5
Normalizado: ((2.5 - 1) / 4) * 100 = 37.5

OPENNESS (dimensão): média de todas facetas = 55
```

**Salva no banco:**
```json
{
  "OPENNESS": {
    "score": 55,
    "facets": [
      { "facetKey": "IDEIAS", "score": 70 },
      { "facetKey": "VALORES", "score": 37.5 }
    ]
  }
}
```

**Relatórios exibem:**
- Especialista: **55** (lê do banco)
- Cliente: **55** (lê do banco, traduz para "Concreto-Abstrato")

**NUNCA MAIS RECALCULAM!**

---

## 📝 ARQUIVOS PRINCIPAIS

| Arquivo | Função |
|---------|--------|
| `backend/src/assessment/assessment.controller.ts` | Submissão e retorno de dados |
| `backend/src/reports/score-calculation.service.ts` | Motor de cálculo |
| `backend/src/talking-to/talking-to.service.ts` | Motor de interpretação PINC |
| `backend/src/talking-to/talking-to.controller.ts` | API do relatório cliente |
| `app/dashboard/reports/[id]/page.tsx` | Frontend especialista |
| `src/components/reports/TalkingToReport.tsx` | Frontend cliente |
| `backend/prisma/schema.prisma` | Estrutura do banco |

---

## 🚨 REGRA DE OURO

**RELATÓRIOS = LEITURA**
**CÁLCULO = APENAS NA SUBMISSÃO**

Se você ver código de cálculo (soma, média, etc) em um relatório, é um BUG!
