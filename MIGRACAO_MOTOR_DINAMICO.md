# 🎯 RELATÓRIO: Migração para Motor de Cálculo Dinâmico

**Data:** 13/02/2026  
**Objetivo:** Tornar o sistema 100% dinâmico, com admin controlando todas as fórmulas

---

## ✅ ETAPA 1: CONCLUÍDA - Fórmulas no Banco de Dados

### 📊 Fórmulas Criadas:

| Nome | Tipo | Descrição |
|------|------|-----------|
| `VALUE_MAPPING_1_4_SPECIALIST` | TRANSFORMATION | Mapeamento 1→0.05, 2→1, 3→2, 4→2.95 |
| `REVERSE_SCORING_1_4_SPECIALIST` | TRANSFORMATION | Inversão: 3 - valor |
| `NORMALIZATION_1_4_TO_0_100_SPECIALIST` | NORMALIZATION | Normalização: (valor / 3) * 100 |
| `FACET_SIMPLE_AVERAGE_SPECIALIST` | AGGREGATION | Média simples (sem pesos) |

### ✅ Status:
- [x] Fórmulas criadas no banco
- [x] Admin pode visualizar na interface
- [x] Admin pode editar/ativar/desativar
- [x] Fórmulas antigas mantidas (compatibilidade)
- [x] Script de migração criado

---

## 🔧 ETAPA 2: EM ANDAMENTO - Atualizar Código

### 📋 O Que Precisa Ser Feito:

1. **Adicionar métodos helper no `score-calculation.service.ts`:**
   - ✅ `getFormula(name)` - Busca fórmula do banco (com cache)
   - ✅ `applyValueMapping()` - Aplica mapeamento de valores
   - ✅ `applyReverse()` - Aplica inversão
   - ✅ `applyNormalization()` - Aplica normalização

2. **Substituir código hardcoded:**
   - [ ] Remover mapeamento hardcoded `{1: 0.05, 2: 1, 3: 2, 4: 2.95}`
   - [ ] Remover inversão hardcoded `3 - valor`
   - [ ] Remover normalização hardcoded `(valor / 3) * 100`
   - [ ] Usar métodos helper que buscam do banco

3. **Testar:**
   - [ ] Criar novo teste
   - [ ] Verificar que scores são calculados corretamente
   - [ ] Confirmar que admin pode editar fórmulas

---

## 📝 CÓDIGO ATUAL vs CÓDIGO DESEJADO

### ❌ CÓDIGO ATUAL (Hardcoded):

```typescript
// Hardcoded - Admin NÃO vê isso!
const valueMap: Record<number, number> = {
    1: 0.05,
    2: 1,
    3: 2,
    4: 2.95
};

let normalizedValue = valueMap[rawVal] || 0.05;

if (mapping && mapping.isReversed) {
    normalizedValue = 3 - normalizedValue;
}

normalizedResponses[qSeq.toString()] = Math.round((normalizedValue / 3) * 100);
```

### ✅ CÓDIGO DESEJADO (Dinâmico):

```typescript
// Dinâmico - Admin controla tudo!
const valueMappingFormula = await this.getFormula('VALUE_MAPPING_1_4_SPECIALIST');
const reverseFormula = await this.getFormula('REVERSE_SCORING_1_4_SPECIALIST');
const normalizationFormula = await this.getFormula('NORMALIZATION_1_4_TO_0_100_SPECIALIST');

let normalizedValue = this.applyValueMapping(rawVal, valueMappingFormula);

if (mapping && mapping.isReversed) {
    normalizedValue = this.applyReverse(normalizedValue, reverseFormula);
}

normalizedResponses[qSeq.toString()] = Math.round(
    this.applyNormalization(normalizedValue, normalizationFormula)
);
```

---

## 🎯 PRÓXIMOS PASSOS:

1. **Finalizar ETAPA 2:**
   - Substituir código hardcoded por código dinâmico
   - Testar localmente
   - Fazer commit

2. **Deploy:**
   - Backend (Railway)
   - Frontend (Vercel)

3. **Validação:**
   - Criar novo teste
   - Verificar scores
   - Confirmar que admin pode editar fórmulas

---

## 📊 BENEFÍCIOS:

### ✅ Para o Admin:
- **Transparência Total:** Vê todas as fórmulas usadas
- **Controle Total:** Pode editar, ativar, desativar
- **Flexibilidade:** Pode criar novas fórmulas sem código
- **Histórico:** Mantém fórmulas antigas e novas

### ✅ Para o Sistema:
- **Dinâmico:** Nada amarrado em código
- **Escalável:** Fácil adicionar novas fórmulas
- **Manutenível:** Mudanças sem deploy
- **Auditável:** Tudo registrado no banco

---

## 🔍 VALIDAÇÃO:

### Como Testar que Está Funcionando:

1. **Acessar interface admin:**
   - `/admin/calculation-engine/formulas`
   - Verificar que fórmulas aparecem

2. **Editar uma fórmula:**
   - Mudar valor (ex: 1→0.10 em vez de 0.05)
   - Salvar
   - Criar novo teste
   - Verificar que score mudou

3. **Desativar uma fórmula:**
   - Desativar `VALUE_MAPPING_1_4_SPECIALIST`
   - Sistema deve usar fallback ou erro
   - Reativar

---

## 📁 ARQUIVOS MODIFICADOS:

### Scripts Criados:
- `backend/scripts/add-specialist-formulas.ts` - Adiciona fórmulas ao banco
- `backend/scripts/recreate-test-with-new-formula.ts` - Recria teste do Cristiano
- `backend/scripts/save-report-to-database.ts` - Salva relatório no banco

### Código Modificado:
- `backend/src/reports/score-calculation.service.ts` - Métodos helper adicionados (ETAPA 2 em andamento)

### Frontend:
- `app/dashboard/take-assessment/[id]/page.tsx` - Questionário 1-4
- `app/trial/components/TrialQuiz.tsx` - Questionário 1-4
- `app/business/employee/inventory/[id]/page.tsx` - Questionário 1-4

---

## 🚨 IMPORTANTE:

**Sistema está em transição:**
- ✅ Fórmulas no banco (ETAPA 1)
- 🔧 Código ainda usa hardcode (ETAPA 2 em andamento)
- ⏳ Precisa finalizar ETAPA 2 para sistema ficar 100% dinâmico

**Compatibilidade mantida:**
- Testes antigos (1-6) continuam funcionando
- Novos testes (1-4) usam nova fórmula
- Nenhum dado perdido

---

**Status:** 🟡 EM ANDAMENTO (50% concluído)  
**Próximo passo:** Finalizar ETAPA 2 (substituir hardcode)
