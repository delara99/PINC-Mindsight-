-- Migration: add_professional_feedback
-- Crie a tabela de feedbacks profissionais e o enum de status

-- 1. Criar a tabela professional_feedbacks
CREATE TABLE `professional_feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `assignment_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `phone` VARCHAR(191) NULL,
    `scheduled_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `professional_feedbacks_user_id_idx` (`user_id`),
    INDEX `professional_feedbacks_assignment_id_idx` (`assignment_id`),
    
    CONSTRAINT `professional_feedbacks_user_id_fkey` 
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `professional_feedbacks_assignment_id_fkey` 
        FOREIGN KEY (`assignment_id`) REFERENCES `assessment_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
