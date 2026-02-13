# ANÁLISE DE/PARA: Motor de Cálculo PINC
## Comparação Sistema Atual vs. Especificação do Especialista

---

## 📊 RESUMO EXECUTIVO

| Aspecto | Sistema Atual | Especificação Especialista | Status |
|---------|---------------|---------------------------|--------|
| **Escala de Respostas** | 1-6 (6 opções) | 1-4 (4 opções) | ❌ DIVERGENTE |
| **Valores Normalizados** | 1, 2, 3, 4, 5, 6 | 0.05, 1, 2, 2.95 | ❌ DIVERGENTE |
| **Fórmula de Inversão** | `7 - valor` | `3 - valor` | ❌ DIVERGENTE |
| **Escala Final** | 0-100 | 0-100 | ✅ COMPATÍVEL |
| **Normalização** | `(valor - 1) / 5 * 100` | `(valor / 3) * 100` | ❌ DIVERGENTE |
| **Cálculo de Facetas** | Média ponderada | Média simples | ❌ DIVERGENTE |
| **Cálculo de Dimensões** | Média simples | Média simples | ✅ COMPATÍVEL |

---

## 🔍 ANÁLISE DETALHADA

### 1️⃣ ESCALA DE RESPOSTAS

#### ❌ SISTEMA ATUAL:
```typescript
// 6 opções (1-6)
Escala: 1, 2, 3, 4, 5, 6
Validação: if (rawVal < 1) rawVal = 1; if (rawVal > 6) rawVal = 6;
```

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
4 opções (1-4):
1 = DISCORDO
2 = DISCORDO PARCIALMENTE
3 = CONCORDO PARCIALMENTE
4 = CONCORDO
```

**IMPACTO:** ❌ CRÍTICO - Escala incompatível com questionário

---

### 2️⃣ VALORES NORMALIZADOS (Antes da Inversão)

#### ❌ SISTEMA ATUAL:
```typescript
// Usa valores brutos 1-6
rawVal = 1, 2, 3, 4, 5, 6
```

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
Valores ajustados para evitar extremos absolutos (0 e 100):

DISCORDO (1) → 0.05
DISCORDO PARCIALMENTE (2) → 1
CONCORDO PARCIALMENTE (3) → 2
CONCORDO (4) → 2.95

Escala: 0.05 a 2.95 (máximo = 3)
```

**IMPACTO:** ❌ CRÍTICO - Valores normalizados diferentes

---

### 3️⃣ FÓRMULA DE INVERSÃO

#### ❌ SISTEMA ATUAL:
```typescript
// Linha 99: backend/src/reports/score-calculation.service.ts
if (mapping && mapping.isReversed) {
    const inverted = 7 - rawVal; // Escala 1-6
    normalizedResponses[qSeq.toString()] = Math.round(((inverted - 1) / 5) * 100);
}
```

**Exemplo:**
- Resposta: 4 (Concordo)
- Invertido: 7 - 4 = 3
- Normalizado: (3 - 1) / 5 * 100 = 40

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
Inversão: 3 - valor

Exemplo:
CONCORDO (2.95) → 3 - 2.95 = 0.05
CONCORDO PARCIALMENTE (2) → 3 - 2 = 1
DISCORDO PARCIALMENTE (1) → 3 - 1 = 2
DISCORDO (0.05) → 3 - 0.05 = 2.95
```

**IMPACTO:** ❌ CRÍTICO - Fórmula de inversão diferente

---

### 4️⃣ NORMALIZAÇÃO PARA ESCALA 0-100

#### ❌ SISTEMA ATUAL:
```typescript
// Linha 104: backend/src/reports/score-calculation.service.ts
normalizedResponses[qSeq.toString()] = Math.round(((rawVal - 1) / 5) * 100);
```

**Fórmula:** `(valor - 1) / 5 * 100`

**Exemplo (sem inversão):**
- Resposta: 6 → (6 - 1) / 5 * 100 = 100
- Resposta: 1 → (1 - 1) / 5 * 100 = 0

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
Fórmula: (valor / 3) * 100

Exemplo (sem inversão):
CONCORDO (2.95) → (2.95 / 3) * 100 = 98.33
DISCORDO (0.05) → (0.05 / 3) * 100 = 1.67

Exemplo (com inversão):
CONCORDO (2.95) → invertido: 0.05 → (0.05 / 3) * 100 = 1.67
DISCORDO (0.05) → invertido: 2.95 → (2.95 / 3) * 100 = 98.33
```

**IMPACTO:** ❌ CRÍTICO - Fórmula de normalização diferente

---

### 5️⃣ CÁLCULO DE FACETAS (Subtraços)

#### ❌ SISTEMA ATUAL:
```typescript
// Linhas 137-148: backend/src/reports/score-calculation.service.ts
// MÉDIA PONDERADA
facetScores[facetKey].sum += normVal * mapping.weight;
facetScores[facetKey].weightSum += mapping.weight;

// Finalização
f.score = Math.round(f.sum / f.weightSum);
```

**Fórmula:** `Σ(valor * peso) / Σ(peso)`

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
MÉDIA SIMPLES

"O RESULTADO FINAL DO SUBTRAÇO DEVE SER OBTIDO POR MÉDIA SIMPLES 
ENTRE AS DIFERENTES AFIRMATIVAS ATRIBUÍDAS AO SUBTRAÇO."

Fórmula: Σ(valores) / quantidade
```

**IMPACTO:** ⚠️ MODERADO - Pesos podem estar sendo usados, mas especificação pede média simples

---

### 6️⃣ CÁLCULO DE DIMENSÕES (Traços)

#### ✅ SISTEMA ATUAL:
```typescript
// Linhas 162-165: backend/src/reports/score-calculation.service.ts
// MÉDIA SIMPLES
dimensionScores[dim] = Math.round(
    facetsByDimension[dim].reduce((sum, s) => sum + s, 0) / facetsByDimension[dim].length
);
```

#### ✅ ESPECIFICAÇÃO ESPECIALISTA:
```
MÉDIA SIMPLES

"PARA CALCULAR O VALOR OBTIDO PELO TRAÇO MAIOR, BASTA TIRAR A MÉDIA SIMPLES 
SOMANDO-SE AS MÉDIAS DE CADA SUBTRAÇO."
```

**IMPACTO:** ✅ COMPATÍVEL - Implementação correta

---

## 📋 TABELA DE CONVERSÃO COMPLETA

### Mapeamento de Respostas (1-4 → Valores Normalizados)

| Resposta Original | Valor Normalizado | Valor Invertido (3 - valor) | Score Final (0-100) | Score Invertido (0-100) |
|-------------------|-------------------|----------------------------|---------------------|------------------------|
| 1 (DISCORDO) | 0.05 | 2.95 | 1.67 | 98.33 |
| 2 (DISCORDO PARCIALMENTE) | 1 | 2 | 33.33 | 66.67 |
| 3 (CONCORDO PARCIALMENTE) | 2 | 1 | 66.67 | 33.33 |
| 4 (CONCORDO) | 2.95 | 0.05 | 98.33 | 1.67 |

---

## 🔧 MUDANÇAS NECESSÁRIAS

### CRÍTICAS (Obrigatórias):

1. **Mudar escala de 1-6 para 1-4**
   - Arquivo: `score-calculation.service.ts`
   - Linha: 92-93
   - Ação: Alterar validação de range

2. **Implementar mapeamento de valores normalizados**
   - Arquivo: `score-calculation.service.ts`
   - Linha: 89-105
   - Ação: Criar função de mapeamento 1→0.05, 2→1, 3→2, 4→2.95

3. **Corrigir fórmula de inversão**
   - Arquivo: `score-calculation.service.ts`
   - Linha: 99
   - Ação: Mudar de `7 - rawVal` para `3 - normalizedVal`

4. **Corrigir fórmula de normalização**
   - Arquivo: `score-calculation.service.ts`
   - Linha: 101, 104
   - Ação: Mudar de `((valor - 1) / 5) * 100` para `(valor / 3) * 100`

### MODERADAS (Recomendadas):

5. **Remover pesos do cálculo de facetas**
   - Arquivo: `score-calculation.service.ts`
   - Linha: 137-148
   - Ação: Usar média simples em vez de média ponderada
   - Nota: Verificar com especialista se pesos devem ser mantidos

---

## 🧮 EXEMPLO PRÁTICO DE CÁLCULO

### Cenário: Faceta "ouvinte-falante" com 5 questões

**Respostas:**
1. Q1 (sem inversão): CONCORDO (4)
2. Q2 (com inversão): DISCORDO (1)
3. Q3 (sem inversão): CONCORDO PARCIALMENTE (3)
4. Q4 (com inversão): CONCORDO (4)
5. Q5 (sem inversão): DISCORDO PARCIALMENTE (2)

#### ❌ CÁLCULO ATUAL (ERRADO):
```
Q1: 4 → (4-1)/5*100 = 60
Q2: 1 → invertido: 7-1=6 → (6-1)/5*100 = 100
Q3: 3 → (3-1)/5*100 = 40
Q4: 4 → invertido: 7-4=3 → (3-1)/5*100 = 40
Q5: 2 → (2-1)/5*100 = 20

Média: (60+100+40+40+20)/5 = 52
```

#### ✅ CÁLCULO CORRETO (ESPECIFICAÇÃO):
```
Q1: 4 → 2.95 → (2.95/3)*100 = 98.33
Q2: 1 → 0.05 → invertido: 3-0.05=2.95 → (2.95/3)*100 = 98.33
Q3: 3 → 2 → (2/3)*100 = 66.67
Q4: 4 → 2.95 → invertido: 3-2.95=0.05 → (0.05/3)*100 = 1.67
Q5: 2 → 1 → (1/3)*100 = 33.33

Média: (98.33+98.33+66.67+1.67+33.33)/5 = 59.67 ≈ 60
```

**Diferença:** Resultados próximos neste exemplo, mas a lógica é fundamentalmente diferente.

---

## ⚠️ IMPACTOS DA MUDANÇA

### Dados Históricos:
- ❌ **Todos os testes anteriores foram calculados com a fórmula antiga**
- ❌ **Scores não serão comparáveis antes/depois da mudança**
- ⚠️ **Recomendação:** Marcar data de migração e informar usuários

### Questionário:
- ❌ **Questionário atual usa escala 1-6**
- ❌ **Precisa ser alterado para escala 1-4**
- ⚠️ **Verificar:** Frontend e textos das alternativas

### Banco de Dados:
- ✅ **Estrutura suporta qualquer valor (campo `answer` é INT)**
- ✅ **Não precisa migração de schema**
- ⚠️ **Mas:** Respostas antigas (1-6) não serão compatíveis com nova lógica

---

## 🎯 RECOMENDAÇÃO FINAL

### Opção 1: Migração Completa (RECOMENDADO)
1. Implementar nova lógica de cálculo
2. Atualizar questionário para 4 opções
3. Marcar data de corte
4. Manter testes antigos "congelados" (não recalcular)
5. Novos testes usam nova lógica

### Opção 2: Recalcular Tudo (ARRISCADO)
1. Implementar nova lógica
2. Recalcular TODOS os testes históricos
3. Perda de rastreabilidade
4. Scores mudarão retroativamente

---

## 📝 PRÓXIMOS PASSOS

1. **Confirmar com especialista:**
   - Pesos devem ser removidos ou mantidos?
   - Testes antigos devem ser recalculados ou congelados?

2. **Atualizar questionário:**
   - Mudar de 6 para 4 opções
   - Atualizar textos das alternativas

3. **Implementar nova lógica:**
   - Criar função de mapeamento de valores
   - Atualizar fórmulas de inversão e normalização
   - Ajustar cálculo de facetas (média simples)

4. **Testar:**
   - Validar com casos de teste do especialista
   - Comparar resultados esperados vs. obtidos

---

**AGUARDANDO DECISÃO DO USUÁRIO PARA PROSSEGUIR COM IMPLEMENTAÇÃO**
