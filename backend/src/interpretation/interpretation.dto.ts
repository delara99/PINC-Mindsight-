// DTOs para Camada Interpretativa Avançada

/**
 * Condição de detecção de padrão
 * Ex: { "E": { "min": 70, "max": 100 } }
 */
export interface PatternCondition {
    [traitKey: string]: {
        min?: number;
        max?: number;
    };
}

/**
 * Padrão detectado em um resultado
 */
export interface DetectedPattern {
    id: string;
    code: string;
    name: string;
    description: string;
    matchScore: number; // 0-100: quão bem o padrão se aplica
    priority: number;
}

/**
 * Necessidade com intensidade calculada
 */
export interface NeedWithIntensity {
    needId: string;
    code: string;
    name: string;
    intensity: number; // 0-100
    sourcePattern: string; // Qual padrão gerou

    // Textos para cliente
    clientTitle: string;
    clientDescription: string;
    clientImpact: string;

    // Textos para especialista
    specialistTitle: string;
    specialistDescription: string;
    specialistAnalysis: string;

    // Ambientes e recomendações
    favorableEnvironments: string[];
    unfavorableEnvironments: string[];
    recommendations: string[];
}

/**
 * Resultado da análise interpretativa
 */
export interface InterpretationAnalysis {
    resultId: string;

    // Padrões detectados (ordenados por relevância)
    detectedPatterns: DetectedPattern[];

    // Necessidades identificadas (ordenadas por intensidade)
    needs: NeedWithIntensity[];

    // Seções interpretativas geradas
    interpretations: {
        client: GeneratedSection[];
        specialist: GeneratedSection[];
    };

    // Metadados
    timestamp: Date;
    version: string; // Ex: "1.0"
}

/**
 * Seção interpretativa gerada
 */
export interface GeneratedSection {
    code: string;
    title: string;
    content: string;
    order: number;
}

/**
 * Mapa de scores Big Five
 */
export interface BigFiveScores {
    E: number;  // Extroversão
    A: number;  // Amabilidade
    C: number;  // Conscienciosidade
    O: number;  // Abertura
    N: number;  // Neuroticismo
}

/**
 * DTO para criar/atualizar padrão
 */
export interface CreatePatternDto {
    code: string;
    name: string;
    description: string;
    conditions: PatternCondition;
    priority?: number;
    tenantId?: string;
}

/**
 * DTO para criar/atualizar necessidade
 */
export interface CreateNeedDto {
    code: string;
    name: string;

    clientTitle: string;
    clientDescription: string;
    clientImpact: string;

    specialistTitle: string;
    specialistDescription: string;
    specialistAnalysis: string;

    favorableEnvironments: string[];
    unfavorableEnvironments: string[];
    recommendations: string[];

    tenantId?: string;
}

/**
 * DTO para vincular padrão a necessidade
 */
export interface LinkPatternNeedDto {
    patternId: string;
    needId: string;
    intensity: number; // 0-100
}

/**
 * DTO para criar seção interpretativa
 */
export interface CreateSectionDto {
    code: string;
    title: string;
    template: string;
    audience: 'CLIENT' | 'SPECIALIST';
    displayOrder?: number;
    tenantId?: string;
}
