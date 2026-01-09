# 🟣 PINC - CAMADA INTERPRETATIVA AVANÇADA
## Implementação TalkingTo-Like sobre Big Five

**Data:** 08/01/2026  
**Versão:** 1.0  
**Status:** Planejamento

---

## 🎯 DECISÃO ESTRATÉGICA

✅ **MANTER:** Big Five atual (perguntas Likert, cálculo, histórico, UX)  
✅ **ADICIONAR:** Camada interpretativa avançada SOBRE resultados existentes  
❌ **NÃO ALTERAR:** Nada do sistema atual (zero regressão)

---

## 📋 ESCOPO DO MÓDULO

### **1. DETECÇÃO DE PADRÕES**
Motor que analisa scores Big Five (0-100) e detecta:
- Traços extremos (muito alto/baixo)
- Contrastes (traço A alto + traço B baixo)
- Equilíbrio (todos médios)
- Padrões específicos configuráveis

### **2. COMBINAÇÕES**
Sistema configurável de combinações, exemplo:
- `(E > 70 AND A > 70)` → "Perfil Social"
- `(C > 80 AND O < 40)` → "Perfil Estruturado"

### **3. NECESSIDADES PSICOLÓGICAS**
Derivadas de combinações, exemplo:
- Combinação "Perfil Social" → Necessidade "Pertencimento"

### **4. RELATÓRIOS INCREMENTAIS**
Novas seções SEM remover existentes:
- "Como Você Funciona"
- "Necessidades Predominantes"
- "Ambientes Favoráveis/Desfavoráveis"
- "Recomendações Práticas"

### **5. ADMIN CONFIGURÁVEL**
Tudo parametrizável:
- Cadastrar combinações
- Definir necessidades
- Editar textos
- Ajustar thresholds

---

## 🗄️ ESTRUTURA DE DADOS (PRISMA)

### **Schema Additions:**

```prisma
// ============================================
// CAMADA INTERPRETATIVA AVANÇADA
// ============================================

// 1. PADRÕES DETECTÁVEIS
model InterpretationPattern {
  id          String   @id @default(uuid())
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  
  name        String   // "Perfil Social", "Estruturado", etc
  description String   @db.Text
  
  // Condições de detecção (JSON)
  conditions  Json     // { "E": { "min": 70 }, "A": { "min": 70 } }
  
  // Ordem de prioridade
  priority    Int      @default(0)
  
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  needs       PatternNeed[]
  
  @@map("interpretation_patterns")
}

// 2. NECESSIDADES PSICOLÓGICAS
model PsychologicalNeed {
  id          String   @id @default(uuid())
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  
  name        String   // "Pertencimento", "Autonomia", "Estrutura"
  code        String   @unique // "BELONGING", "AUTONOMY", "STRUCTURE"
  
  // Textos para Cliente
  clientTitle       String
  clientDescription String @db.Text
  clientImpact      String @db.Text // Como isso afeta o dia a dia
  
  // Textos para Especialista
  specialistTitle       String
  specialistDescription String @db.Text
  specialistAnalysis    String @db.Text // Análise técnica
  
  // Ambientes
  favorableEnvironments   String @db.Text // JSON array
  unfavorableEnvironments String @db.Text // JSON array
  
  // Recomendações
  recommendations String @db.Text // JSON array
  
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  patterns    PatternNeed[]
  results     ResultNeed[]
  
  @@map("psychological_needs")
}

// 3. RELAÇÃO: Padrão → Necessidade
model PatternNeed {
  id         String   @id @default(uuid())
  
  patternId  String
  pattern    InterpretationPattern @relation(fields: [patternId], references: [id], onDelete: Cascade)
  
  needId     String
  need       PsychologicalNeed @relation(fields: [needId], references: [id])
  
  // Intensidade da necessidade quando padrão detectado
  intensity  Int      @default(100) // 0-100
  
  createdAt  DateTime @default(now())
  
  @@unique([patternId, needId])
  @@map("pattern_needs")
}

// 4. NECESSIDADES DETECTADAS EM RESULTADO
model ResultNeed {
  id         String   @id @default(uuid())
  
  resultId   String
  result     AssessmentResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
  
  needId     String
  need       PsychologicalNeed @relation(fields: [needId], references: [id])
  
  intensity  Int      // 0-100 (intensidade detectada)
  source     String   // Qual padrão gerou isso
  
  createdAt  DateTime @default(now())
  
  @@unique([resultId, needId])
  @@map("result_needs")
}

// 5. SEÇÕES INTERPRETATIVAS CUSTOMIZADAS
model InterpretationSection {
  id          String   @id @default(uuid())
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  
  code        String   // "HOW_YOU_FUNCTION", "NEEDS", "FAVORABLE_ENV"
  title       String
  
  // Template do texto (suporta variáveis)
  template    String   @db.Text
  
  // Para cliente ou especialista
  audience    String   // "CLIENT" ou "SPECIALIST"
  
  // Ordem de exibição
  order       Int      @default(0)
  
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([code, audience, tenantId])
  @@map("interpretation_sections")
}

// 6. ATUALIZAR AssessmentResult
model AssessmentResult {
  // ... campos existentes ...
  
  // NOVO: Necessidades detectadas
  detectedNeeds ResultNeed[]
  
  // NOVO: Padrões aplicados (JSON)
  appliedPatterns Json? // Array de IDs e nomes dos padrões
  
  // NOVO: Metadados da interpretação
  interpretationMetadata Json? // Thresholds usados, versão, etc
}
```

---

## 🔧 LÓGICA DE DETECÇÃO

### **Service: `interpretation-engine.service.ts`**

```typescript
@Injectable()
export class InterpretationEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analisa resultado Big Five e aplica camada interpretativa
   */
  async analyzeResult(resultId: string): Promise<InterpretationAnalysis> {
    // 1. Buscar resultado Big Five
    const result = await this.prisma.assessmentResult.findUnique({
      where: { id: resultId },
      include: {
        scores: true,
        assignment: {
          include: {
            assessment: true,
            user: {
              include: { tenant: true }
            }
          }
        }
      }
    });

    const tenantId = result.assignment.user.tenantId;

    // 2. Buscar padrões configurados para o tenant
    const patterns = await this.prisma.interpretationPattern.findMany({
      where: {
        OR: [
          { tenantId: tenantId },
          { tenantId: null } // Padrões globais
        ],
        active: true
      },
      include: {
        needs: {
          include: { need: true }
        }
      },
      orderBy: { priority: 'desc' }
    });

    // 3. Converter scores para mapa
    const scoresMap = this.buildScoresMap(result.scores);

    // 4. Detectar padrões aplicáveis
    const detectedPatterns = this.detectPatterns(scoresMap, patterns);

    // 5. Extrair necessidades
    const needs = this.extractNeeds(detectedPatterns);

    // 6. Salvar necessidades detectadas
    await this.saveDetectedNeeds(resultId, needs);

    // 7. Gerar textos interpretativos
    const interpretations = await this.generateInterpretations(
      resultId,
      scoresMap,
      detectedPatterns,
      needs
    );

    return {
      patterns: detectedPatterns,
      needs: needs,
      interpretations: interpretations
    };
  }

  /**
   * Detecta quais padrões se aplicam aos scores
   */
  private detectPatterns(
    scores: Map<string, number>,
    patterns: InterpretationPattern[]
  ): DetectedPattern[] {
    const detected: DetectedPattern[] = [];

    for (const pattern of patterns) {
      if (this.matchesPattern(scores, pattern.conditions)) {
        detected.push({
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          matchScore: this.calculateMatchScore(scores, pattern.conditions)
        });
      }
    }

    return detected.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Verifica se scores atendem condições do padrão
   */
  private matchesPattern(
    scores: Map<string, number>,
    conditions: any
  ): boolean {
    // Exemplo de conditions:
    // {
    //   "E": { "min": 70, "max": 100 },
    //   "A": { "min": 70 },
    //   "C": { "max": 40 }
    // }

    for (const [trait, rules] of Object.entries(conditions)) {
      const score = scores.get(trait);
      if (score === undefined) return false;

      if (rules.min !== undefined && score < rules.min) return false;
      if (rules.max !== undefined && score > rules.max) return false;
    }

    return true;
  }

  /**
   * Calcula quão bem o padrão se aplica (0-100)
   */
  private calculateMatchScore(
    scores: Map<string, number>,
    conditions: any
  ): number {
    let totalFit = 0;
    let count = 0;

    for (const [trait, rules] of Object.entries(conditions)) {
      const score = scores.get(trait);
      if (score === undefined) continue;

      // Quanto mais próximo do centro da faixa, maior o fit
      const minValue = rules.min ?? 0;
      const maxValue = rules.max ?? 100;
      const center = (minValue + maxValue) / 2;
      const distance = Math.abs(score - center);
      const range = (maxValue - minValue) / 2;
      const fit = Math.max(0, 100 - (distance / range) * 100);

      totalFit += fit;
      count++;
    }

    return count > 0 ? totalFit / count : 0;
  }

  /**
   * Extrai necessidades dos padrões detectados
   */
  private extractNeeds(patterns: DetectedPattern[]): NeedWithIntensity[] {
    const needsMap = new Map<string, NeedWithIntensity>();

    for (const pattern of patterns) {
      for (const patternNeed of pattern.needs) {
        const existing = needsMap.get(patternNeed.needId);
        const intensity = Math.round(
          (patternNeed.intensity * pattern.matchScore) / 100
        );

        if (!existing || intensity > existing.intensity) {
          needsMap.set(patternNeed.needId, {
            needId: patternNeed.needId,
            need: patternNeed.need,
            intensity: intensity,
            source: pattern.name
          });
        }
      }
    }

    return Array.from(needsMap.values())
      .sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Gera textos interpretativos personalizados
   */
  private async generateInterpretations(
    resultId: string,
    scores: Map<string, number>,
    patterns: DetectedPattern[],
    needs: NeedWithIntensity[]
  ): Promise<GeneratedInterpretation[]> {
    // Buscar templates de seções
    const sections = await this.prisma.interpretationSection.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });

    const interpretations: GeneratedInterpretation[] = [];

    for (const section of sections) {
      const text = this.fillTemplate(section.template, {
        scores,
        patterns,
        needs
      });

      interpretations.push({
        code: section.code,
        title: section.title,
        content: text,
        audience: section.audience
      });
    }

    return interpretations;
  }

  /**
   * Preenche template com dados
   */
  private fillTemplate(
    template: string,
    data: {
      scores: Map<string, number>;
      patterns: DetectedPattern[];
      needs: NeedWithIntensity[];
    }
  ): string {
    let text = template;

    // Substituir variáveis como {{E_SCORE}}, {{PATTERN_1}}, etc
    text = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key.endsWith('_SCORE')) {
        const trait = key.replace('_SCORE', '');
        return data.scores.get(trait)?.toString() || '0';
      }

      if (key.startsWith('PATTERN_')) {
        const index = parseInt(key.replace('PATTERN_', '')) - 1;
        return data.patterns[index]?.name || '';
      }

      if (key.startsWith('NEED_')) {
        const index = parseInt(key.replace('NEED_', '')) - 1;
        return data.needs[index]?.need.name || '';
      }

      return match;
    });

    return text;
  }
}
```

---

## 🎨 INTERFACE ADMIN

### **Menu Existente: "Métricas de Avaliação"**

Adicionar submenus:

1. **"Padrões Interpretativos"**
   - Listar padrões
   - Criar/Editar padrão
   - configurar condições (UI visual)
   - Definir prioridade

2. **"Necessidades Psicológicas"**
   - Listar necessidades
   - Criar/Editar necessidade
   - Textos para cliente/especialista
   - Ambientes favoráveis/desfavoráveis

3. **"Seções do Relatório"**
   - Listar seções interpretativas
   - Editar templates
   - Ativar/desativar seções
   - Definir ordem

4. **"Thresholds"**
   - Configurar limites globais
   - Ex: "Alto" = > 70, "Médio" = 40-70, etc

---

## 📊 RELATÓRIO - NOVAS SEÇÕES

### **Seção 1: Como Você Funciona**
```
Baseado nos seus resultados, você tende a:
- [Descrição funcional baseada em padrões detectados]
- [Exemplos práticos]
```

### **Seção 2: Necessidades Predominantes**
```
Para funcionar no seu melhor, você precisa de:
1. [Necessidade top 1] (Intensidade: ███████░░ 85%)
   • O que isso significa
   • Como isso aparece no dia a dia
   
2. [Necessidade 2] (Intensidade: ██████░░░ 72%)
   ...
```

### **Seção 3: Ambientes que te Favorecem**
```
✅ Você prospera em:
- [Ambiente 1 da necessidade top]
- [Ambiente 2]

❌ Você enfrenta desafios em:
- [Ambiente que conflita]
```

### **Seção 4: Recomendações Práticas**
```
Com base no seu perfil:
1. [Recomendação específica para padrão 1]
2. [Recomendação para necessidade top]
3. [Ação prática]
```

---

## ✅ GARANTIAS DE NÃO-REGRESSÃO

### **1. Testes Unitários**
```typescript
describe('InterpretationEngine', () => {
  it('não altera scores originais', async () => {
    const before = await getScores(resultId);
    await interpretationService.analyze(resultId);
    const after = await getScores(resultId);
    expect(before).toEqual(after);
  });

  it('relatório original continua igual', async () => {
    const oldReport = await generateOldReport(resultId);
    await interpretationService.analyze(resultId);
    const newReport = await generateOldReport(resultId);
    expect(oldReport).toEqual(newReport);
  });
});
```

### **2. Feature Flag**
```typescript
// Em config
ENABLE_ADVANCED_INTERPRETATION=false // true para ativar
```

### **3. Versionamento**
```typescript
// No banco
interpretationVersion: "v1.0"
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### **SPRINT 1 (1 semana) - Estrutura**
- [ ] Criar schema Prisma
- [ ] Migração do banco
- [ ] Models e DTOs
- [ ] Testes de schema

### **SPRINT 2 (1 semana) - Motor de Detecção**
- [ ] `InterpretationEngineService`
- [ ] Lógica de detecção de padrões
- [ ] Extração de necessidades
- [ ] Testes unitários

### **SPRINT 3 (1 semana) - Admin**
- [ ] CRUD de Padrões
- [ ] CRUD de Necessidades
- [ ] CRUD de Seções
- [ ] UI de configuração

### **SPRINT 4 (1 semana) - Relatórios**
- [ ] Geração de novas seções
- [ ] Templates com variáveis
- [ ] Dois formatos (cliente/especialista)
- [ ] Testes visuais

### **SPRINT 5 (1 semana) - Validação**
- [ ] Testes E2E
- [ ] Validar não-regressão
- [ ] Ajustes finais
- [ ] Documentação

**TOTAL:** 5 semanas (1,25 mês)

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Aprovar este plano
2. ✅ Criar padrões iniciais (exemplos)
3. ✅ Definir necessidades base
4. ✅ Começar implementação

---

**Pronto para começar?** 🎯
