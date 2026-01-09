-- ============================================
-- SEÇÕES INTERPRETATIVAS INICIAIS
-- Para uso com Camada Interpretativa Avançada
-- ============================================

-- SEÇÕES PARA CLIENTE
-- 1. Como Você Funciona
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'HOW_YOU_FUNCTION',
    'Como Você Funciona',
    'Baseado nos seus resultados, você apresenta um perfil {{PATTERN_1}}. 

Isso significa que você tende a:
- Ter uma extroversão de {{E_SCORE}}%, indicando que você {{#if E_SCORE > 70}}é bastante sociável e energético{{else}}prefere interações menores e mais profundas{{/if}}
- Sua conscienciosidade de {{C_SCORE}}% mostra que você {{#if C_SCORE > 70}}é organizado e disciplinado{{else}}é mais flexível e espontâneo{{/if}}

Seu modo de operar é influenciado principalmente por essas características combinadas.',
    'CLIENT',
    1,
    1,
    NOW(),
    NOW()
);

-- 2. Necessidades Predominantes
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'PREDOMINANT_NEEDS',
    'Suas Necessidades Predominantes',
    'Para funcionar no seu melhor, você precisa de:

{{NEEDS_LIST}}

Essas necessidades surgem naturalmente do seu perfil {{PATTERN_1}} e são fundamentais para seu bem-estar e performance.',
    'CLIENT',
    2,
    1,
    NOW(),
    NOW()
);

-- 3. Ambientes Favoráveis
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'FAVORABLE_ENVIRONMENTS',
    'Onde Você Prospera',
    'Com base no seu perfil, você tende a se destacar em:

✅ Ambientes que oferecem o que você mais precisa ({{NEED_1}})
✅ Situações que valorizam suas forças naturais
✅ Contextos alinhados com sua forma de funcionar

Busque oportunidades que tenham essas características para maximizar seu potencial.',
    'CLIENT',
    3,
    1,
    NOW(),
    NOW()
);

-- 4. Recomendações Práticas
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'PRACTICAL_RECOMMENDATIONS',
    'Recomendações Para Você',
    'Para aproveitar melhor seu perfil:

1. Foque em satisfazer sua necessidade principal de {{NEED_1}}
2. Reconheça quando está em um ambiente que não favorece seu estilo
3. Comunique suas preferências de trabalho para sua equipe
4. Use seu padrão {{PATTERN_1}} como força, não como limitação',
    'CLIENT',
    4,
    1,
    NOW(),
    NOW()
);

-- SEÇÕES PARA ESPECIALISTA
-- 1. Análise Técnica de Padrão
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'TECHNICAL_PATTERN_ANALYSIS',
    'Análise Técnica do Padrão Detectado',
    'Padrão Primário: {{PATTERN_1}}

Scores Big Five:
- Extroversão (E): {{E_SCORE}}
- Amabilidade (A): {{A_SCORE}}
- Conscienciosidade (C): {{C_SCORE}}
- Abertura (O): {{O_SCORE}}
- Neuroticismo (N): {{N_SCORE}}

Este perfil indica uma combinação específica de traços que gera um modo de funcionamento característico. O padrão {{PATTERN_1}} foi detectado com base nas condições configuradas e apresenta forte aderência aos critérios estabelecidos.',
    'SPECIALIST',
    1,
    1,
    NOW(),
    NOW()
);

-- 2. Necessidades Psicológicas Identificadas
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'IDENTIFIED_NEEDS',
    'Necessidades Psicológicas Identificadas',
    'A análise detectou as seguintes necessidades funcionais:

{{NEEDS_LIST}}

Estas necessidades emergem da combinação específica de traços e são preditivas de:
- Satisfação no trabalho
- Performance em diferentes contextos
- Potencial de conflito em ambientes desalinhados
- Estratégias de desenvolvimento mais efetivas',
    'SPECIALIST',
    2,
    1,
    NOW(),
    NOW()
);

-- 3. Implicações Organizacionais
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'ORGANIZATIONAL_IMPLICATIONS',
    'Implicações Para Gestão',
    'Considerações para liderança e RH:

1. Alocação: Este perfil se beneficia de posições que permitam expressão de {{NEED_1}}
2. Comunicação: Adaptar estilo considerando necessidade de {{NEED_1}}
3. Desenvolvimento: Focar em habilidades que complementem o padrão {{PATTERN_1}}
4. Risco: Atenção a contextos que contrariem as necessidades identificadas

A gestão efetiva deste perfil requer alinhamento entre demandas do cargo e necessidades psicológicas.',
    'SPECIALIST',
    3,
    1,
    NOW(),
    NOW()
);

-- 4. Recomendações de Intervenção
INSERT INTO interpretation_sections 
(id, code, title, template, audience, display_order, active, created_at, updated_at)
VALUES (
    UUID(),
    'INTERVENTION_RECOMMENDATIONS',
    'Recomendações de Intervenção',
    'Estratégias sugeridas:

CURTO PRAZO:
- Avaliar fit atual do ambiente vs necessidades
- Identificar fontes de atrito comportamental
- Ajustar expectativas de performance

MÉDIO PRAZO:
- Desenvolver competências complementares
- Explorar oportunidades de job crafting
- Fortalecer pontos de resiliência

LONGO PRAZO:
- Considerar movimentações estratégicas
- Planejar desenvolvimento de carreira alinhado
- Construir contextos favoráveis sustentáveis',
    'SPECIALIST',
    4,
    1,
    NOW(),
    NOW()
);

-- Vincular Padrões a Necessidades
-- SOCIAL_PROFILE → BELONGING
INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT 
    UUID(),
    (SELECT id FROM interpretation_patterns WHERE code = 'SOCIAL_PROFILE'),
    (SELECT id FROM psychological_needs WHERE code = 'BELONGING'),
    100,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_needs 
    WHERE pattern_id = (SELECT id FROM interpretation_patterns WHERE code = 'SOCIAL_PROFILE')
    AND need_id = (SELECT id FROM psychological_needs WHERE code = 'BELONGING')
);

-- STRUCTURED_PROFILE → STRUCTURE
INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT 
    UUID(),
    (SELECT id FROM interpretation_patterns WHERE code = 'STRUCTURED_PROFILE'),
    (SELECT id FROM psychological_needs WHERE code = 'STRUCTURE'),
    100,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_needs 
    WHERE pattern_id = (SELECT id FROM interpretation_patterns WHERE code = 'STRUCTURED_PROFILE')
    AND need_id = (SELECT id FROM psychological_needs WHERE code = 'STRUCTURE')
);

-- EXPLORER_PROFILE → AUTONOMY
INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT 
    UUID(),
    (SELECT id FROM interpretation_patterns WHERE code = 'EXPLORER_PROFILE'),
    (SELECT id FROM psychological_needs WHERE code = 'AUTONOMY'),
    100,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_needs 
    WHERE pattern_id = (SELECT id FROM interpretation_patterns WHERE code = 'EXPLORER_PROFILE')
    AND need_id = (SELECT id FROM psychological_needs WHERE code = 'AUTONOMY')
);

-- ANALYTICAL_PROFILE → STRUCTURE + AUTONOMY
INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT 
    UUID(),
    (SELECT id FROM interpretation_patterns WHERE code = 'ANALYTICAL_PROFILE'),
    (SELECT id FROM psychological_needs WHERE code = 'STRUCTURE'),
    80,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_needs 
    WHERE pattern_id = (SELECT id FROM interpretation_patterns WHERE code = 'ANALYTICAL_PROFILE')
    AND need_id = (SELECT id FROM psychological_needs WHERE code = 'STRUCTURE')
);

INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT 
    UUID(),
    (SELECT id FROM interpretation_patterns WHERE code = 'ANALYTICAL_PROFILE'),
    (SELECT id FROM psychological_needs WHERE code = 'AUTONOMY'),
    70,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM pattern_needs 
    WHERE pattern_id = (SELECT id FROM interpretation_patterns WHERE code = 'ANALYTICAL_PROFILE')
    AND need_id = (SELECT id FROM psychological_needs WHERE code = 'AUTONOMY')
);
