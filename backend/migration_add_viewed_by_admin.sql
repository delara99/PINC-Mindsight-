-- Migration: add_viewed_by_admin_fields
-- Adicionar campos viewed_by_admin nas tabelas users e assessment_assignments

ALTER TABLE `users` ADD COLUMN `viewed_by_admin` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `assessment_assignments` ADD COLUMN `viewed_by_admin` BOOLEAN NOT NULL DEFAULT false;
