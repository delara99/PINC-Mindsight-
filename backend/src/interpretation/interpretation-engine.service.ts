import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    InterpretationAnalysis,
    DetectedPattern,
    NeedWithIntensity,
    BigFiveScores,
    PatternCondition,
    GeneratedSection
} from './interpretation.dto';

@Injectable()
export class InterpretationEngineService {
    constructor(private prisma: PrismaService) { }

    /**
     * Analisa resultado Big Five e aplica camada interpretativa
     */
    async analyzeResult(resultId: string): Promise<InterpretationAnalysis> {
        // 1. Buscar resultado e scores
        const result = await this.prisma.assessmentResult.findUnique({
            where: { id: resultId },
            include: {
                assignment: {
                    include: {
                        user: {
                            include: { tenant: true }
                        }
                    }
                }
            }
        });

        if (!result) {
            throw new Error('Resultado não encontrado');
        }

        const tenantId = result.assignment.user.tenantId;
        const scores = this.extractBigFiveScores(result.scores);

        // 2. Buscar padrões configurados
        const patterns = await this.prisma.interpretationPattern.findMany({
            where: {
                OR: [
                    { tenantId: tenantId },
                    { tenantId: null } // Padrões globais
                ],
                active: true
            },
            include: {
                patternNeeds: {
                    include: {
                        need: true
                    }
                }
            },
            orderBy: { priority: 'desc' }
        });

        // 3. Detectar padrões aplicáveis
        const detectedPatterns = this.detectPatterns(scores, patterns);

        // 4. Extrair necessidades
        const needs = this.extractNeeds(detectedPatterns);

        // 5. Salvar necessidades detectadas
        await this.saveDetectedNeeds(resultId, needs);

        // 6. Gerar seções interpretativas
        const clientSections = await this.generateSections(
            resultId,
            scores,
            detectedPatterns,
            needs,
            'CLIENT',
            tenantId
        );

        const specialistSections = await this.generateSections(
            resultId,
            scores,
            detectedPatterns,
            needs,
            'SPECIALIST',
            tenantId
        );

        return {
            resultId,
            detectedPatterns,
            needs,
            interpretations: {
                client: clientSections,
                specialist: specialistSections
            },
            timestamp: new Date(),
            version: '1.0'
        };
    }

    /**
     * Extrai scores Big Five do objeto scores
     */
    private extractBigFiveScores(scoresJson: any): BigFiveScores {
        // O formato pode variar, vamos tentar extrair
        const scores: any = typeof scoresJson === 'string' ? JSON.parse(scoresJson) : scoresJson;

        const getVal = (keys: string[]) => {
            for (const key of keys) {
                const val = scores[key] || scores[key.toUpperCase()] || scores[key.toLowerCase()];
                if (val !== undefined && val !== null) {
                    if (typeof val === 'object' && val.normalizedScore !== undefined) return val.normalizedScore;
                    if (typeof val === 'object' && val.score !== undefined) return val.score;
                    if (typeof val === 'number') return val;
                }
            }
            return 50; // Default fallback
        };

        return {
            E: this.normalizeScore(getVal(['E', 'extroversao', 'extraversion'])),
            A: this.normalizeScore(getVal(['A', 'amabilidade', 'agreeableness'])),
            C: this.normalizeScore(getVal(['C', 'conscienciosidade', 'conscientiousness'])),
            O: this.normalizeScore(getVal(['O', 'abertura', 'abertura a experiencia', 'openness'])),
            N: this.normalizeScore(getVal(['N', 'neuroticismo', 'neuroticism', 'estabilidade emocional']))
        };
    }

    /**
     * Normaliza score para 0-100
     */
    private normalizeScore(value: number): number {
        // Se já está em 0-100, retorna
        if (value >= 0 && value <= 100) return value;

        // Se está em 1-5 (Likert), converte
        if (value >= 1 && value <= 5) {
            return ((value - 1) / 4) * 100;
        }

        return 50; // Default
    }

    /**
     * Detecta quais padrões se aplicam aos scores
     */
    private detectPatterns(
        scores: BigFiveScores,
        patterns: any[]
    ): DetectedPattern[] {
        const detected: DetectedPattern[] = [];

        for (const pattern of patterns) {
            const conditions = pattern.conditions as PatternCondition;
            const matches = this.matchesPattern(scores, conditions);

            if (matches) {
                const matchScore = this.calculateMatchScore(scores, conditions);

                detected.push({
                    id: pattern.id,
                    code: pattern.code,
                    name: pattern.name,
                    description: pattern.description,
                    matchScore,
                    priority: pattern.priority
                });
            }
        }

        // Ordenar por prioridade e match score
        return detected.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return b.matchScore - a.matchScore;
        });
    }

    /**
     * Verifica se scores atendem condições do padrão
     */
    private matchesPattern(
        scores: BigFiveScores,
        conditions: PatternCondition
    ): boolean {
        for (const [trait, rules] of Object.entries(conditions)) {
            const score = scores[trait as keyof BigFiveScores];
            if (score === undefined) continue;

            if (rules.min !== undefined && score < rules.min) return false;
            if (rules.max !== undefined && score > rules.max) return false;
        }

        return true;
    }

    /**
     * Calcula quão bem o padrão se aplica (0-100)
     */
    private calculateMatchScore(
        scores: BigFiveScores,
        conditions: PatternCondition
    ): number {
        let totalFit = 0;
        let count = 0;

        for (const [trait, rules] of Object.entries(conditions)) {
            const score = scores[trait as keyof BigFiveScores];
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

        return count > 0 ? Math.round(totalFit / count) : 0;
    }

    /**
     * Extrai necessidades dos padrões detectados
     */
    private extractNeeds(detectedPatterns: any[]): NeedWithIntensity[] {
        const needsMap = new Map<string, NeedWithIntensity>();

        for (const pattern of detectedPatterns) {
            for (const patternNeed of pattern.patternNeeds || []) {
                const need = patternNeed.need;
                const existing = needsMap.get(need.id);

                // Intensidade = intensidade base * match score do padrão
                const intensity = Math.round(
                    (patternNeed.intensity * pattern.matchScore) / 100
                );

                if (!existing || intensity > existing.intensity) {
                    needsMap.set(need.id, {
                        needId: need.id,
                        code: need.code,
                        name: need.name,
                        intensity,
                        sourcePattern: pattern.name,
                        clientTitle: need.clientTitle,
                        clientDescription: need.clientDescription,
                        clientImpact: need.clientImpact,
                        specialistTitle: need.specialistTitle,
                        specialistDescription: need.specialistDescription,
                        specialistAnalysis: need.specialistAnalysis,
                        favorableEnvironments: this.parseJsonArray(need.favorableEnvironments),
                        unfavorableEnvironments: this.parseJsonArray(need.unfavorableEnvironments),
                        recommendations: this.parseJsonArray(need.recommendations)
                    });
                }
            }
        }

        return Array.from(needsMap.values())
            .sort((a, b) => b.intensity - a.intensity);
    }

    /**
     * Parse JSON array seguro
     */
    private parseJsonArray(value: string): string[] {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * Salva necessidades detectadas no banco
     */
    private async saveDetectedNeeds(
        resultId: string,
        needs: NeedWithIntensity[]
    ): Promise<void> {
        // Deletar necessidades antigas deste resultado
        await this.prisma.resultNeed.deleteMany({
            where: { resultId }
        });

        // Criar novas
        for (const need of needs) {
            await this.prisma.resultNeed.create({
                data: {
                    resultId,
                    needId: need.needId,
                    intensity: need.intensity,
                    sourcePattern: need.sourcePattern
                }
            });
        }
    }

    /**
     * Gera seções interpretativas
     */
    private async generateSections(
        resultId: string,
        scores: BigFiveScores,
        patterns: DetectedPattern[],
        needs: NeedWithIntensity[],
        audience: 'CLIENT' | 'SPECIALIST',
        tenantId: string
    ): Promise<GeneratedSection[]> {
        // Buscar templates de seções
        const sections = await this.prisma.interpretationSection.findMany({
            where: {
                OR: [
                    { tenantId },
                    { tenantId: null }
                ],
                audience,
                active: true
            },
            orderBy: { displayOrder: 'asc' }
        });

        const generated: GeneratedSection[] = [];

        for (const section of sections) {
            const content = this.fillTemplate(section.template, {
                scores,
                patterns,
                needs
            });

            generated.push({
                code: section.code,
                title: section.title,
                content,
                order: section.displayOrder
            });
        }

        return generated;
    }

    /**
     * Corrige problemas de encoding (UTF-8 interpretado como Latin-1)
     */
    private fixEncoding(text: string): string {
        if (!text) return text;
        try {
            // Detecta padrões comuns de erro de encoding
            if (text.match(/[\u00C0-\u00FF]{2,}/) || text.includes('Ã')) {
                return Buffer.from(text, 'binary').toString('utf-8');
            }
            return text;
        } catch (e) {
            return text;
        }
    }

    /**
     * Avalia condições simples (Ex: E_SCORE > 50)
     */
    private evaluateCondition(condition: string, scores: BigFiveScores): boolean {
        const cond = condition.trim();
        // Suporta: VAR OP VAL (Ex: E_SCORE > 70)
        const parts = cond.match(/^([EACON]_SCORE)\s*(>|<|>=|<=|==|!=)\s*(\d+)$/);

        if (!parts) return false;

        const [, varName, operator, valueStr] = parts;
        const value = parseInt(valueStr, 10);

        // Extrair a letra do traço (E, A, C, O, N)
        const trait = varName.charAt(0) as keyof BigFiveScores;
        const score = scores[trait] || 0;

        switch (operator) {
            case '>': return score > value;
            case '<': return score < value;
            case '>=': return score >= value;
            case '<=': return score <= value;
            case '==': return score === value;
            case '!=': return score !== value;
            default: return false;
        }
    }

    /**
     * Processa condicionais {{#if ...}}...{{else}}...{{/if}}
     * Suporta aninhamento limitado se rodar recursivamente, mas aqui faremos um passo simples.
     */
    private processConditionals(text: string, scores: BigFiveScores): string {
        const regex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

        // Loop para suportar múltiplos blocos. 
        // Nota: Não suporta aninhamento profundo com este regex simples, mas resolve o caso plano.
        return text.replace(regex, (match, condition, ifContent, elseContent) => {
            const isValid = this.evaluateCondition(condition, scores);
            return isValid ? ifContent : (elseContent || '');
        });
    }

    /**
     * Preenche template com dados
     */
    private fillTemplate(
        template: string,
        data: {
            scores: BigFiveScores;
            patterns: DetectedPattern[];
            needs: NeedWithIntensity[];
        }
    ): string {
        let text = this.fixEncoding(template);

        // 1. Processar Condicionais
        text = this.processConditionals(text, data.scores);

        // Substituir variáveis de scores: {{E_SCORE}}, {{A_SCORE}}, etc
        text = text.replace(/\{\{([EACON])_SCORE\}\}/g, (_, trait) => {
            return data.scores[trait as keyof BigFiveScores]?.toFixed(0) || '0';
        });

        // Substituir padrões: {{PATTERN_1}}, {{PATTERN_1_NAME}}, {{PATTERN_1_DESC}}
        text = text.replace(/\{\{PATTERN_(\d+)(?:_(NAME|DESC))?\}\}/g, (_, num, suffix) => {
            const index = parseInt(num) - 1;
            const pattern = data.patterns[index];
            if (!pattern) return '';

            if (suffix === 'DESC') return this.fixEncoding(pattern.description);
            return this.fixEncoding(pattern.name);
        });

        // Substituir necessidades: {{NEED_1}}, {{NEED_1_NAME}}, {{NEED_1_DESC}}, etc
        text = text.replace(/\{\{NEED_(\d+)(?:_(NAME|DESC))?\}\}/g, (_, num, suffix) => {
            const index = parseInt(num) - 1;
            const need = data.needs[index];
            if (!need) return '';

            if (suffix === 'DESC') return this.fixEncoding(need.specialistDescription); // Default description
            return this.fixEncoding(need.name);
        });

        // Substituir lista de necessidades
        text = text.replace(/\{\{NEEDS_LIST\}\}/g, () => {
            return data.needs
                .map((n, i) => `${i + 1}. ${this.fixEncoding(n.name)} (${n.intensity}%)`)
                .join('\n');
        });

        return text;
    }

    /**
     * Gera seções interpretativas a partir de scores brutos (para PDF/Preview)
     * Sem salvar no banco de dados.
     */
    async generateAdvancedSections(scoresInput: any): Promise<GeneratedSection[]> {
        // Converter scores se necessário
        let scores: BigFiveScores;
        if (scoresInput.E !== undefined) {
            scores = scoresInput; // Já está no formato certo
        } else {
            scores = this.extractBigFiveScores(scoresInput); // Converter
        }

        // 1. Buscar padrões ativos (Globais ou de todos tenants por enquanto)
        const patterns = await this.prisma.interpretationPattern.findMany({
            where: { active: true },
            include: {
                patternNeeds: {
                    include: { need: true }
                }
            },
            orderBy: { priority: 'desc' }
        });

        // 2. Detectar
        const detectedPatterns = this.detectPatterns(scores, patterns);

        // 3. Extrair necessidades
        const needs = this.extractNeeds(detectedPatterns);

        // 4. Buscar templates de seções
        const sections = await this.prisma.interpretationSection.findMany({
            where: {
                active: true,
                audience: 'CLIENT' // Default para PDF/Web
            },
            orderBy: { displayOrder: 'asc' }
        });

        // 5. Gerar conteúdo
        const generated: GeneratedSection[] = [];
        for (const section of sections) {
            const content = this.fillTemplate(section.template, {
                scores,
                patterns: detectedPatterns,
                needs
            });

            generated.push({
                code: section.code,
                title: section.title,
                content,
                order: section.displayOrder
            });
        }

        // Se após tudo isso, não tivermos seções mas tivermos padrões detectados,
        // vamos gerar uma seção genérica de "Padrões Detectados" para não ficar vazio.
        if (generated.length === 0 && detectedPatterns.length > 0) {
            generated.push({
                code: 'AUTO_PATTERNS',
                title: 'Padrões Comportamentais Detectados',
                content: '<ul>' + detectedPatterns.map(p => `<li><strong>${p.name}</strong>: ${p.description}</li>`).join('') + '</ul>',
                order: 999
            });
        }

        // Se tiver necessidades, adicionar
        if (generated.length === 0 && needs.length > 0) {
            generated.push({
                code: 'AUTO_NEEDS',
                title: 'Necessidades Psicológicas',
                content: '<ul>' + needs.map(n => `<li><strong>${n.name}</strong> (${n.intensity}%): ${n.clientDescription}</li>`).join('') + '</ul>',
                order: 1000
            });
        }

        return generated;
    }
}
