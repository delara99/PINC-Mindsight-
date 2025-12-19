-- AlterTable
ALTER TABLE `assessment_assignments` ADD COLUMN `configId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `assessment_assignments` ADD CONSTRAINT `assessment_assignments_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `bigfive_configs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
