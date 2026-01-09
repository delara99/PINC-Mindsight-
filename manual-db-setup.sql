-- ═══════════════════════════════════════════════════════════════
-- CRIAÇÃO MANUAL DAS TABELAS DA CAMADA INTERPRETATIVA
-- Execute via Railway MySQL Console
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabela de Padrões Interpretativos
CREATE TABLE IF NOT EXISTS `interpretation_patterns` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `conditions` JSON NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `interpretation_patterns_code_key` (`code`),
    KEY `interpretation_patterns_tenant_id_fkey` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Necessidades Psicológicas
CREATE TABLE IF NOT EXISTS `psychological_needs` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `client_title` VARCHAR(191) NOT NULL,
    `client_description` TEXT NOT NULL,
    `client_impact` TEXT NOT NULL,
    `specialist_title` VARCHAR(191) NOT NULL,
    `specialist_description` TEXT NOT NULL,
    `specialist_analysis` TEXT NOT NULL,
    `favorable_environments` TEXT NOT NULL,
    `unfavorable_environments` TEXT NOT NULL,
    `recommendations` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `psychological_needs_code_key` (`code`),
    KEY `psychological_needs_tenant_id_fkey` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Vínculos Padrão→Necessidade
CREATE TABLE IF NOT EXISTS `pattern_needs` (
    `id` VARCHAR(191) NOT NULL,
    `pattern_id` VARCHAR(191) NOT NULL,
    `need_id` VARCHAR(191) NOT NULL,
    `intensity` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `pattern_needs_pattern_id_fkey` (`pattern_id`),
    KEY `pattern_needs_need_id_fkey` (`need_id`),
    CONSTRAINT `pattern_needs_pattern_id_fkey` FOREIGN KEY (`pattern_id`) REFERENCES `interpretation_patterns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `pattern_needs_need_id_fkey` FOREIGN KEY (`need_id`) REFERENCES `psychological_needs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Necessidades Detectadas em Resultado
CREATE TABLE IF NOT EXISTS `result_needs` (
    `id` VARCHAR(191) NOT NULL,
    `result_id` VARCHAR(191) NOT NULL,
    `need_id` VARCHAR(191) NOT NULL,
    `intensity` INTEGER NOT NULL,
    `source_pattern` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `result_needs_result_id_fkey` (`result_id`),
    KEY `result_needs_need_id_fkey` (`need_id`),
    CONSTRAINT `result_needs_result_id_fkey` FOREIGN KEY (`result_id`) REFERENCES `assessment_results` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `result_needs_need_id_fkey` FOREIGN KEY (`need_id`) REFERENCES `psychological_needs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela de Seções Interpretativas
CREATE TABLE IF NOT EXISTS `interpretation_sections` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `template` TEXT NOT NULL,
    `audience` ENUM('CLIENT', 'SPECIALIST') NOT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `interpretation_sections_code_key` (`code`),
    KEY `interpretation_sections_tenant_id_fkey` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- DADOS INICIAIS
-- ═══════════════════════════════════════════════════════════════

-- Padrões
INSERT INTO interpretation_patterns (id, code, name, description, conditions, priority, active, created_at, updated_at)
VALUES 
    (UUID(), 'SOCIAL_PROFILE', 'Perfil Social', 'Alta extroversão combinada com alta amabilidade', '{"E": {"min": 70}, "A": {"min": 70}}', 100, 1, NOW(), NOW()),
    (UUID(), 'STRUCTURED_PROFILE', 'Perfil Estruturado', 'Alta conscienciosidade com baixa abertura', '{"C": {"min": 80}, "O": {"max": 40}}', 90, 1, NOW(), NOW()),
    (UUID(), 'EXPLORER_PROFILE', 'Perfil Explorador', 'Alta abertura combinada com alta extroversão', '{"O": {"min": 70}, "E": {"min": 70}}', 85, 1, NOW(), NOW()),
    (UUID(), 'ANALYTICAL_PROFILE', 'Perfil Analítico', 'Baixa extroversão com alta conscienciosidade', '{"E": {"max": 40}, "C": {"min": 70}}', 80, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Necessidades
INSERT INTO psychological_needs (id, code, name, client_title, client_description, client_impact, specialist_title, specialist_description, specialist_analysis, favorable_environments, unfavorable_environments, recommendations, active, created_at, updated_at)
VALUES 
    (UUID(), 'BELONGING', 'Pertencimento', 'Necessidade de Pertencer', 'Você precisa sentir que faz parte de um grupo ou comunidade.', 'Isso afeta sua motivação e bem-estar no trabalho e nas relações.', 'Necessidade Psicológica: Pertencimento', 'Necessidade fundamental de conexão social e aceitação grupal.', 'Indivíduos com alta necessidade de pertencimento prosperam em ambientes colaborativos.', '["Trabalho em equipe", "Cultura colaborativa", "Eventos sociais"]', '["Trabalho isolado", "Competição agressiva", "Falta de feedback"]', '["Busque projetos em equipe", "Participe de grupos de interesse"]', 1, NOW(), NOW()),
    (UUID(), 'AUTONOMY', 'Autonomia', 'Necessidade de Autonomia', 'Você precisa de liberdade para tomar suas próprias decisões.', 'Microgerenciamento pode afetar negativamente sua performance.', 'Necessidade Psicológica: Autonomia', 'Necessidade de autodeterminação e controle sobre ações.', 'Requer ambientes com alto grau de liberdade decisória.', '["Home office", "Projetos independentes", "Flexibilidade"]', '["Microgerenciamento", "Regras rígidas", "Hierarquia vertical"]', '["Negocie flexibilidade", "Busque projetos com autonomia"]', 1, NOW(), NOW()),
    (UUID(), 'STRUCTURE', 'Estrutura', 'Necessidade de Estrutura', 'Você funciona melhor com processos claros e organizados.', 'Ambiguidade e caos podem gerar estresse e perda de produtividade.', 'Necessidade Psicológica: Estrutura', 'Necessidade de previsibilidade, ordem e clareza de expectativas.', 'Indivíduos orientados a estrutura prosperam com processos definidos.', '["Processos claros", "Metas definidas", "Rotinas estabelecidas"]', '["Ambiguidade", "Mudanças frequentes", "Desorganização"]', '["Crie checklists", "Defina processos pessoais"]', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Vínculos Padrão→Necessidade
INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT UUID(), p.id, n.id, 100, NOW()
FROM interpretation_patterns p, psychological_needs n
WHERE p.code = 'SOCIAL_PROFILE' AND n.code = 'BELONGING'
AND NOT EXISTS (SELECT 1 FROM pattern_needs WHERE pattern_id = p.id AND need_id = n.id);

INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT UUID(), p.id, n.id, 100, NOW()
FROM interpretation_patterns p, psychological_needs n
WHERE p.code = 'STRUCTURED_PROFILE' AND n.code = 'STRUCTURE'
AND NOT EXISTS (SELECT 1 FROM pattern_needs WHERE pattern_id = p.id AND need_id = n.id);

INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT UUID(), p.id, n.id, 100, NOW()
FROM interpretation_patterns p, psychological_needs n
WHERE p.code = 'EXPLORER_PROFILE' AND n.code = 'AUTONOMY'
AND NOT EXISTS (SELECT 1 FROM pattern_needs WHERE pattern_id = p.id AND need_id = n.id);

INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT UUID(), p.id, n.id, 80, NOW()
FROM interpretation_patterns p, psychological_needs n
WHERE p.code = 'ANALYTICAL_PROFILE' AND n.code = 'STRUCTURE'
AND NOT EXISTS (SELECT 1 FROM pattern_needs WHERE pattern_id = p.id AND need_id = n.id);

INSERT INTO pattern_needs (id, pattern_id, need_id, intensity, created_at)
SELECT UUID(), p.id, n.id, 70, NOW()
FROM interpretation_patterns p, psychological_needs n
WHERE p.code = 'ANALYTICAL_PROFILE' AND n.code = 'AUTONOMY'
AND NOT EXISTS (SELECT 1 FROM pattern_needs WHERE pattern_id = p.id AND need_id = n.id);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════

SELECT 'Padrões:' as tipo, COUNT(*) as total FROM interpretation_patterns
UNION ALL
SELECT 'Necessidades:', COUNT(*) FROM psychological_needs
UNION ALL
SELECT 'Vínculos:', COUNT(*) FROM pattern_needs;
