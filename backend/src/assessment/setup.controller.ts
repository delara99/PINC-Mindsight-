import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/setup')
@UseGuards(AuthGuard('jwt'))
export class SetupController {
    constructor(private prisma: PrismaService) { }

    @Post('populate-texts')
    async populateTexts(@Request() req) {
        const user = req.user;

        // Verificar se é admin
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN') {
            return { error: 'Somente administradores podem executar' };
        }

        try {
            // 1. Buscar todas as configs ativas
            const configs = await this.prisma.bigFiveConfig.findMany({
                where: { isActive: true }
            });

            if (configs.length === 0) {
                return { error: 'Nenhuma configuração Big Five encontrada' };
            }

            const traits = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
            const ranges = ['VERY_LOW', 'LOW', 'AVERAGE', 'HIGH', 'VERY_HIGH'];
            const categories = ['SUMMARY', 'PRACTICAL_IMPACT', 'EXPERT_SYNTHESIS', 'EXPERT_HYPOTHESIS'];

            let created = 0;

            for (const config of configs) {
                for (const trait of traits) {
                    for (const range of ranges) {
                        for (const category of categories) {
                            // Verificar se já existe
                            const existing = await this.prisma.bigFiveInterpretativeText.findFirst({
                                where: {
                                    configId: config.id,
                                    traitKey: trait,
                                    scoreRange: range,
                                    category: category
                                }
                            });

                            if (!existing) {
                                await this.prisma.bigFiveInterpretativeText.create({
                                    data: {
                                        configId: config.id,
                                        traitKey: trait,
                                        scoreRange: range,
                                        category: category,
                                        context: category === 'PRACTICAL_IMPACT' ? 'TRABALHO' : null,
                                        text: `Texto ${category} para ${trait} em nível ${range} (Placeholder - Config: ${config.name})`
                                    }
                                });
                                created++;
                            }
                        }
                    }
                }
            }

            return {
                success: true,
                message: `${created} textos criados com sucesso!`,
                configs: configs.length,
                totalPossible: configs.length * traits.length * ranges.length * categories.length
            };

        } catch (error) {
            return {
                error: error.message,
                stack: error.stack
            };
        }
    }

    @Post('verify-setup')
    async verifySetup() {
        const configs = await this.prisma.bigFiveConfig.count();
        const texts = await this.prisma.bigFiveInterpretativeText.count();
        const assignments = await this.prisma.assessmentAssignment.count();

        return {
            configs,
            texts,
            assignments,
            status: configs > 0 && texts > 0 ? 'OK' : 'INCOMPLETE'
        };
    }
}
