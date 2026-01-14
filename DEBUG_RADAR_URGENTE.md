# 🔍 DEBUG URGENTE - Radar Chart Sumiu

**Data:** 14/01/2026 18:43  
**Commit:** 3fe19a0  
**Problema:** Radar chart não aparece + traitName vindo como 'undefined'

---

## 🎯 **CORREÇÃO APLICADA:**

### Adicionei logs detalhados para identificar o problema:

```typescript
// Agora o console vai mostrar:
[Report] Processing trait: {
    traitKey: "EXTRAVERSION",
    traitName: "Extroversão",  // ← VERIFICAR ESTE CAMPO
    name: "...",
    facetsCount: 5
}

[Report] ✅ Using trait name: Extroversão
[Report] Adding to chart: Extroversão::comunicação = 5.0
```

---

## 📋 **PASSOS PARA DEBUG:**

### 1️⃣ **Aguardar Deploy (2min)**
```bash
railway logs --tail 50
```

Aguarde ver:
```
✔ Build succeeded
Service is running
```

### 2️⃣ **Abrir Console do Browser**

1. Abra o relatório
2. Pressione `F12`
3. Vá para aba `Console`
4. Procure por logs `[Report]`

### 3️⃣ **Analisar os Logs**

**Caso 1: traitKey e traitName estão OK**
```
[Report] Processing trait: {
    traitKey: "EXTRAVERSION",
    traitName: "Extroversão",  ✅
    facetsCount: 5
}
[Report] ✅ Using trait name: Extroversão
[Report] Adding to chart: Extroversão::comunicação = 5.0
```
**Resultado:** Radar deve aparecer! ✅

---

**Caso 2: traitKey está OK, mas traitName está undefined**
```
[Report] Processing trait: {
    traitKey: "EXTRAVERSION",
    traitName: undefined,  ❌
    facetsCount: 5
}
[Report] ✅ Using trait name: Extroversão  (traduzido pela chave)
[Report] Adding to chart: Extroversão::comunicação = 5.0
```
**Resultado:** Radar deve aparecer! ✅ (tradução pelo fallback)

---

**Caso 3: traitKey E traitName estão undefined**
```
[Report] Processing trait: {
    traitKey: undefined,  ❌
    traitName: undefined,  ❌
    name: undefined,
    facetsCount: 5
}
[Report] ⚠️ Pulando trait com nome inválido
```
**Resultado:** Radar NÃO aparece ❌ (problema no backend)

---

## 🔧 **SE RADAR AINDA NÃO APARECER:**

### Verificar Response do Backend:

1. Abra **DevTools** (`F12`)
2. Vá para aba **Network**
3. Procure por request: `assignments/:id`
4. Clique e vá para **Response**
5. Procure por `calculatedScores.scores`

**Estrutura esperada:**
```json
{
  "calculatedScores": {
    "scores": [
      {
        "key": "EXTRAVERSION",
        "name": "Extroversão",  ← DEVE TER ESTE CAMPO
        "traitKey": "EXTRAVERSION",
        "traitName": "Extroversão",  ← E ESTE
        "score": 75,
        "facets": [
          {
            "facetKey": "comunicacao",
            "facetName": "Comunicação",
            "name": "Comunicação",
            "score": 80
          }
        ]
      }
    ]
  }
}
```

---

## 🐛 **DIAGNÓSTICO POR SINTOMA:**

### Sintoma 1: Console mostra `[Report] ⚠️ Pulando trait...`
**Causa:** Backend retornando undefined para traitKey/traitName  
**Solução:** Verificar `ScoreCalculationService` linha ~134 e ~167

### Sintoma 2: Console mostra `[BigFiveChart] Ignorando entrada inválida`
**Causa:** Frontend montando chartData com undefined  
**Solução:** Já corrigido no commit 3fe19a0 ✅

### Sintoma 3: Nenhum log aparece no console
**Causa:** Cache do browser  
**Solução:** Limpar cache (Ctrl+Shift+R) ou Modo Anônimo

---

## 🚨 **SOLUÇÃO RÁPIDA SE TUDO FALHAR:**

### Reverter filtros temporariamente:

Se precisar do radar AGORA (mesmo com "undefined"):

1. **Comentar validação no BigFiveChart** (linha ~40):
```typescript
// if (isInvalidTrait || isInvalidFacet) {
//     console.warn('...');
//     return;
// }
```

2. **Comentar validação no Reports** (linha ~349):
```typescript
// if (!traitNamePT || traitNamePT === 'undefined') {
//     console.warn('...');
//     return;
// }
```

**ATENÇÃO:** Isso vai fazer o gráfico aparecer mas com legendas "undefined"!

---

## 📊 **PRÓXIMO PASSO:**

1. **Aguarde deploy** (2min)
2. **Limpe cache** (`Ctrl+Shift+R`)
3. **Abra console** (`F12`)
4. **Copie TODOS os logs** `[Report]` e `[BigFiveChart]`
5. **Me envie** para análise

---

**Commit:** 3fe19a0  
**Status:** Aguardando logs de debug  
**ETA:** 2-3 minutos
