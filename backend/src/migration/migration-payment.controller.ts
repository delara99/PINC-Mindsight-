import { Controller, Post, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/migration')
export class MigrationPaymentController {
    constructor(private prisma: PrismaService) { }

    @Get('check-payment-table')
    async checkPaymentTable() {
        try {
            const count = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM payments`;
            return { exists: true, count };
        } catch (error) {
            return { exists: false, message: 'Table does not exist yet' };
        }
    }

    @Post('create-payment-table')
    async createPaymentTable() {
        try {
            // Criar tabela payments
            await this.prisma.$executeRaw`
                CREATE TABLE IF NOT EXISTS payments (
                    id VARCHAR(191) PRIMARY KEY,
                    userId VARCHAR(191) NOT NULL,
                    planId VARCHAR(191) NOT NULL,
                    planName VARCHAR(191) NOT NULL,
                    amount DOUBLE NOT NULL,
                    status ENUM('PENDING', 'PAID', 'EXPIRED', 'CANCELED', 'REFUNDED') DEFAULT 'PENDING',
                    btgChargeId VARCHAR(191) UNIQUE,
                    pixCopyPaste TEXT,
                    qrCodeBase64 TEXT,
                    expiresAt DATETIME NOT NULL,
                    paidAt DATETIME,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_userId (userId),
                    INDEX idx_btgChargeId (btgChargeId),
                    INDEX idx_status (status),
                    FOREIGN KEY (userId) REFERENCES users(id)
                )
            `;

            return { success: true, message: 'Tabela payments criada com sucesso!' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
