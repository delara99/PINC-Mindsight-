# 🧪 GUIA DE TESTE - CAMADA INTERPRETATIVA AVANÇADA

**Data:** 09/01/2026  
**Versão:** 1.0

---

## 🎯 OBJETIVO

Testar a Camada Interpretativa Avançada que foi implementada sobre o Big Five.

---

## ✅ PRÉ-REQUISITOS

1. Backend deployado no Railway
2. Acesso SUPER_ADMIN
3. Token JWT válido
4. Pelo menos 1 resultado de avaliação existente

---

## 📝 PASSO A PASSO

### **PASSO 1: Aplicar Migração**

Endpoint: `POST /admin/migration/apply-interpretation-layer`

**Via cURL:**
```bash
curl -X POST \
  https://pinc-mindsight-production.up.railway.app/admin/migration/apply-interpretation-layer \
  -H "Authorization: Bearer SEU_TOKEN_SUPER_ADMIN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "Camada Interpretativa aplicada com sucesso",
  "stats": {
    "patternsCreated": 4,
    "needsCreated": 3
  },
  "log": [...]
}
```

**O que isso faz:**
- Cria tabelas se não existirem
- Popula 4 padrões iniciais
- Popula 3 necessidades iniciais

---

### **PASSO 2: Popular Seções Interpretativas**

Executar SQL manualmente no Railway:

1. Acesse Railway → MySQL → Query
2. Copie e cole o conteúdo de `backend/prisma/seeds/interpretation-sections.sql`
3. Execute

**Resultado:**
- 4 seções para CLIENTE
- 4 seções para ESPECIALISTA
- Vínculos padrão→necessidade criados

---

### **PASSO 3: Verificar Padrões Criados**

Endpoint: `GET /interpretation/patterns`

```bash
curl https://pinc-mindsight-production.up.railway.app/interpretation/patterns \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "SOCIAL_PROFILE",
      "name": "Perfil Social",
      "conditions": { "E": { "min": 70 }, "A": { "min": 70 } },
      "priority": 100,
      "patternNeeds": [...]
    },
    ...
  ]
}
```

---

### **PASSO 4: Verificar Necessidades Criadas**

Endpoint: `GET /interpretation/needs`

```bash
curl https://pinc-mindsight-production.up.railway.app/interpretation/needs \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "BELONGING",
      "name": "Pertencimento",
      "clientTitle": "Necessidade de Pertencer",
      ...
    },
    ...
  ]
}
```

---

### **PASSO 5: Analisar um Resultado Real**

**5.1. Primeiro, busque um resultado existente:**

```bash
# Listar resultados disponíveis (adapte o endpoint)
curl https://pinc-mindsight-production.up.railway.app/api/v1/assessments/my-results \
  -H "Authorization: Bearer SEU_TOKEN"
```

Anote um `resultId`.

**5.2. Analise o resultado:**

Endpoint: `GET /interpretation/analyze/:resultId`

```bash
curl https://pinc-mindsight-production.up.railway.app/interpretation/analyze/RESULT_ID \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "resultId": "uuid",
    "detectedPatterns": [
      {
        "id": "uuid",
        "code": "SOCIAL_PROFILE",
        "name": "Perfil Social",
        "matchScore": 85,
        "priority": 100
      }
    ],
    "needs": [
      {
        "needId": "uuid",
        "code": "BELONGING",
        "name": "Pertencimento",
        "intensity": 85,
        "sourcePattern": "Perfil Social",
        "clientTitle": "Necessidade de Pertencer",
        ...
      }
    ],
    "interpretations": {
      "client": [
        {
          "code": "HOW_YOU_FUNCTION",
          "title": "Como Você Funciona",
          "content": "Baseado nos seus resultados...",
          "order": 1
        },
        ...
      ],
      "specialist": [...]
    },
    "timestamp": "2026-01-09T...",
    "version": "1.0"
  }
}
```

---

## ✅ O QUE VALIDAR

### **1. Detecção de Padrões:**
- [ ] Sistema detectou pelo menos 1 padrão?
- [ ] Match score está entre 0-100?
- [ ] Padrão detectado faz sentido para os scores?

### **2. Extração de Necessidades:**
- [ ] Necessidades foram identificadas?
- [ ] Intensidade está entre 0-100?
- [ ] Source pattern está correto?

### **3. Geração de Seções:**
- [ ] Seções de cliente foram geradas?
- [ ] Seções de especialista foram geradas?
- [ ] Variáveis ({{E_SCORE}}, {{PATTERN_1}}) foram substituídas?

### **4. Banco de Dados:**
- [ ] Tabela `result_needs` foi populada?
- [ ] Vínculos `pattern_needs` existem?

---

## 🐛 TROUBLESHOOTING

### **Erro: "Tabela não existe"**
**Solução:** Execute `npx prisma db push` no backend

### **Erro: "Nenhum padrão detectado"**
**Solução:** Verifique se os scores atendem às condições dos padrões

### **Variáveis não substituídas**
**Solução:** Verificar se templates usam sintaxe correta: `{{E_SCORE}}`

### **Necessidades vazias**
**Solução:** Verificar se padrões estão vinculados a necessidades

---

## 📊 CENÁRIOS DE TESTE

### **Cenário 1: Perfil Social**
**Scores:** E=80, A=75, C=60, O=55, N=40  
**Esperado:** Padrão "SOCIAL_PROFILE", Necessidade "BELONGING"

### **Cenário 2: Perfil Estruturado**
**Scores:** E=35, A=50, C=85, O=30, N=45  
**Esperado:** Padrão "STRUCTURED_PROFILE", Necessidade "STRUCTURE"

### **Cenário 3: Perfil Explorador**
**Scores:** E=75, A=60, C=50, O=80, N=35  
**Esperado:** Padrão "EXPLORER_PROFILE", Necessidade "AUTONOMY"

### **Cenário 4: Perfil Analítico**
**Scores:** E=30, A=55, C=75, O=60, N=50  
**Esperado:** Padrão "ANALYTICAL_PROFILE", Necessidades "STRUCTURE" + "AUTONOMY"

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTE

Se tudo funcionar:

1. ✅ Integrar com geração de relatórios
2. ✅ Criar UI Admin para gerenciar padrões/necessidades
3. ✅ Adicionar mais padrões e necessidades
4. ✅ Refinar templates das seções

---

## 📝 EXEMPLO COMPLETO

**Request:**
```bash
curl -X GET \
  https://pinc-mindsight-production.up.railway.app/interpretation/analyze/abc-123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resultId": "abc-123",
    "detectedPatterns": [
      {
        "id": "pattern-1",
        "code": "SOCIAL_PROFILE",
        "name": "Perfil Social",
        "description": "Alta extroversão combinada com alta amabilidade",
        "matchScore": 87,
        "priority": 100
      }
    ],
    "needs": [
      {
        "needId": "need-1",
        "code": "BELONGING",
        "name": "Pertencimento",
        "intensity": 87,
        "sourcePattern": "Perfil Social",
        "clientTitle": "Necessidade de Pertencer",
        "clientDescription": "Você precisa sentir que faz parte de um grupo ou comunidade.",
        "clientImpact": "Isso afeta sua motivação e bem-estar no trabalho e nas relações.",
        "favorableEnvironments": [
          "Trabalho em equipe",
          "Cultura colaborativa",
          "Eventos sociais"
        ],
        "unfavorableEnvironments": [
          "Trabalho isolado",
          "Competição agressiva"
        ],
        "recommendations": [
          "Busque projetos em equipe",
          "Participe de grupos de interesse"
        ]
      }
    ],
    "interpretations": {
      "client": [
        {
          "code": "HOW_YOU_FUNCTION",
          "title": "Como Você Funciona",
          "content": "Baseado nos seus resultados, você apresenta um perfil Perfil Social...",
          "order": 1
        }
      ],
      "specialist": [
        {
          "code": "TECHNICAL_PATTERN_ANALYSIS",
          "title": "Análise Técnica do Padrão Detectado",
          "content": "Padrão Primário: Perfil Social\n\nScores Big Five...",
          "order": 1
        }
      ]
    },
    "timestamp": "2026-01-09T11:55:00Z",
    "version": "1.0"
  }
}
```

---

**✅ Teste concluído com sucesso se todos os checkboxes acima estiverem marcados!**
