
export const QUESTION_TAXONOMY = {
    // 1. EXTROVERSÃO
    'EXTROVERSAO': {
        label: 'EXTROVERSÃO',
        dichotomies: [
            {
                label: 'Introversão-Extroversão',
                options: [
                    { value: 'INTROVERTIDO', label: 'INTROVERTIDO' },
                    { value: 'EXTROVERTIDO', label: 'EXTROVERTIDO' }
                ],
                subtraits: [
                    {
                        pair: 'ouvinte-falante',
                        concept: 'comunicação',
                        options: ['ouvinte', 'falante']
                    },
                    {
                        pair: 'seletivo-sociável',
                        concept: 'interação social',
                        options: ['seletivo', 'sociável']
                    },
                    {
                        pair: 'contido-afirmativo',
                        concept: 'autoridade',
                        options: ['contido', 'afirmativo']
                    },
                    {
                        pair: 'reflexivo-ativo',
                        concept: 'orientação para ação',
                        options: ['reflexivo', 'ativo']
                    }
                ]
            }
        ]
    },

    // 2. AMABILIDADE (Assuming Lógico-Sentimental falls here or elsewhere, likely "Thinking-Feeling" usually mapped differently but let's follow user's image if possible or infer)
    // Looking at Image 1: 
    // TRACE: EXTROVERSÃO -> Dicotomia: Introversão-Extroversão
    // Let's look at the LIST text again.

    /*
    TRAÇO DE PERSONALIDADE: 
    1. EXTROVERSÃO
    2. AMABILIDADE
    3. ESTRUTURA (CONSCIENCIOSIDADE)
    4. ABERTURA
    5. ESTABILIDADE EMOCIONAL (NEUROTICISMO)

    DICOTOMIAS -> TRAÇO DA QUESTÃO
    1. Introversão-Extroversão -> INTROVERTIDO / EXTROVERTIDO
    2. Lógico-Sentimental -> LÓGICO / SENTIMENTAL
    3. Adaptável-Estruturado -> ADAPTÁVEL / ESTRUTURADO
    4. Concreto-Abstrato -> CONCRETO / ABSTRATO
    5. Emoção-Razão -> EMOCIONAL / RACIONAL

    MAPPING (Hypothesis based on standard Big 5 + names):
    - Introversão-Extroversão -> EXTROVERSÃO
    - Lógico-Sentimental -> AMABILIDADE? (Thinking vs Feeling is T/F in MBTI, in Big5 Agreeableness is simpler). 
      Wait, "Competitivo-Colaborativo" is typical Agreeableness.
      "Crítico-Tolerante".
      "Independente-Conectado".
    
    Let's map Subtraits to Dicotomies based on user list order or logic.
    User list Subtraços-Dicotômicos:
    - ouvinte-falante
    - seletivo-sociável
    - contido-afirmativo
    - reflexivo-ativo
    (These match Extroversion)

    - crítico-tolerante
    - independente-conectado
    - competitivo-colaborativo
    (These match Lógico-Sentimental / Agreeableness?)
    
    - aventureiro-planejado
    - espontâneo-disciplinado
    - flexível-persistente
    (These match Adaptável-Estruturado / Conscientiousness?)

    - realista-imaginativo
    - prático-conceitual
    - conservador-aberto
    (These match Concreto-Abstrato / Openness?)

    - inquieto-despreocupado
    - inseguro-autoconfiante
    - irritável-paciente
    - reativo-controlado
    (These match Emoção-Razão / Neuroticism?)

    Let's build the JSON with this structure.
    */

    // MAPPING
    'AMABILIDADE': {
        label: 'AMABILIDADE',
        dichotomies: [
            {
                label: 'Lógico-Sentimental',
                options: [
                    { value: 'LÓGICO', label: 'LÓGICO' },
                    { value: 'SENTIMENTAL', label: 'SENTIMENTAL' }
                ],
                subtraits: [
                    {
                        pair: 'crítico-tolerante',
                        concept: 'lógica', // ??? Maybe 'tolerance'? User put 'lógica' in CONCEITO list?
                        // User list: comunicação, interação social, autoridade, orientação para ação, LÓGICA, INDEPENDÊNCIA PESSOAL, COMPETITIVIDADE.
                        // Matches 5, 6, 7.
                        options: ['crítico', 'tolerante']
                    },
                    {
                        pair: 'independente-conectado',
                        concept: 'independência pessoal',
                        options: ['independente', 'conectado']
                    },
                    {
                        pair: 'competitivo-colaborativo',
                        concept: 'competitividade',
                        options: ['competitivo', 'colaborativo']
                    }
                ]
            }
        ]
    },

    'CONSCIENCIOSIDADE': { // ESTRUTURA
        label: 'ESTRUTURA',
        dichotomies: [
            {
                label: 'Adaptável-Estruturado',
                options: [
                    { value: 'ADAPTÁVEL', label: 'ADAPTÁVEL' },
                    { value: 'ESTRUTURADO', label: 'ESTRUTURADO' }
                ],
                subtraits: [
                    {
                        pair: 'aventureiro-planejado', // Check concept: 'estilo de planejamento'
                        concept: 'estilo de planejamento',
                        options: ['aventureiro', 'planejado']
                    },
                    {
                        pair: 'espontâneo-disciplinado', // Concept: 'disciplina'
                        concept: 'disciplina',
                        options: ['espontâneo', 'disciplinado']
                    },
                    {
                        pair: 'flexível-persistente', // Concept: 'persistência'
                        concept: 'persistência',
                        options: ['flexível', 'persistente']
                    }
                ]
            }
        ]
    },

    'ABERTURA': {
        label: 'ABERTURA',
        dichotomies: [
            {
                label: 'Concreto-Abstrato',
                options: [
                    { value: 'CONCRETO', label: 'CONCRETO' },
                    { value: 'ABSTRATO', label: 'ABSTRATO' }
                ],
                subtraits: [
                    {
                        pair: 'realista-imaginativo', // Concept: 'imaginação'
                        concept: 'imaginação',
                        options: ['realista', 'imaginativo']
                    },
                    {
                        pair: 'prático-conceitual', // Concept: 'intelectualidade'
                        concept: 'intelectualidade',
                        options: ['prático', 'conceitual']
                    },
                    {
                        pair: 'conservador-aberto', // Concept: 'abertura ao novo'
                        concept: 'abertura ao novo',
                        options: ['conservador', 'aberto']
                    }
                ]
            }
        ]
    },

    'NEUROTICISMO': { // ESTABILIDADE EMOCIONAL
        label: 'ESTABILIDADE EMOCIONAL',
        dichotomies: [
            {
                label: 'Emoção-Razão', // Or Instabilidade-Estabilidade. User used Emoção-Razão.
                options: [
                    { value: 'EMOCIONAL', label: 'EMOCIONAL' },
                    { value: 'RACIONAL', label: 'RACIONAL' }
                ],
                subtraits: [
                    {
                        pair: 'inquieto-despreocupado', // Concept: 'confiança'? Or 'Autoconfiança'?
                        // List: confiança, autoconfiança, temperamento, controlado.
                        // Order: 14, 15, 16, 17.
                        // Subtraits: inquieto-despreocupado, inseguro-autoconfiante, irritável-paciente, reativo-controlado.
                        concept: 'confiança',
                        options: ['inquieto', 'despreocupado']
                    },
                    {
                        pair: 'inseguro-autoconfiante',
                        concept: 'autoconfiança',
                        options: ['inseguro', 'autoconfiante']
                    },
                    {
                        pair: 'irritável-paciente',
                        concept: 'temperamento',
                        options: ['irritável', 'paciente']
                    },
                    {
                        pair: 'reativo-controlado',
                        concept: 'controlado',
                        options: ['reativo', 'controlado']
                    }
                ]
            }
        ]
    }
};

// Mapa de compatibilidade de chaves
export const TRAIT_KEY_MAP: Record<string, string> = {
    'extroversao': 'EXTROVERSAO',
    'extraversion': 'EXTROVERSAO',
    'amabilidade': 'AMABILIDADE',
    'agreeableness': 'AMABILIDADE',
    'conscienciosidade': 'CONSCIENCIOSIDADE',
    'conscientiousness': 'CONSCIENCIOSIDADE',
    'abertura': 'ABERTURA',
    'openness': 'ABERTURA',
    'estabilidade emocional': 'NEUROTICISMO', // User uses Estabilidade, code usually Neuroticism.
    'neuroticismo': 'NEUROTICISMO',
    'neuroticism': 'NEUROTICISMO'
};
