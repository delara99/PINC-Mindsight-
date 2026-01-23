import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/seed')
@UseGuards(AuthGuard('jwt'))
export class SeedController {
    constructor(private prisma: PrismaService) { }

    @Post('interpretative-texts')
    async seedInterpretativeTexts() {
        console.log('🔄 Iniciando inserção de textos interpretativos...');

        const configs = await this.prisma.bigFiveConfig.findMany({
            where: { isActive: true }
        });

        if (configs.length === 0) {
            const lastConfig = await this.prisma.bigFiveConfig.findFirst({
                orderBy: { createdAt: 'desc' }
            });
            if (lastConfig) configs.push(lastConfig);
            else {
                return { error: 'Nenhuma configuração Big Five encontrada no sistema.' };
            }
        }

        const textsToInsert = [
            // === AMABILIDADE (AGREEABLENESS) ===
            {
                trait: 'AGREEABLENESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma direta e objetiva, priorizando clareza e eficiência. Pode parecer mais assertivo ou reservado emocionalmente, o que favorece decisões rápidas, mas exige atenção à sensibilidade do outro.'
            },
            {
                trait: 'AGREEABLENESS', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma direta, priorizando clareza. Pode parecer mais assertivo, o que favorece decisões rápidas.'
            },
            {
                trait: 'AGREEABLENESS', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você consegue equilibrar empatia e objetividade ao se comunicar. Sabe ouvir, mas também expressar seus pontos de vista com clareza.'
            },
            {
                trait: 'AGREEABLENESS', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma acolhedora, buscando compreensão mútua. Sua escuta ativa fortalece vínculos.'
            },
            {
                trait: 'AGREEABLENESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma acolhedora e empática, buscando compreensão mútua. Sua escuta ativa fortalece vínculos.'
            },

            // === EXTROVERSÃO (EXTRAVERSION) ===
            {
                trait: 'EXTRAVERSION', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma reservada, priorizando qualidade da interação. Prefere conversas profundas e objetivas.'
            },
            {
                trait: 'EXTRAVERSION', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você tende a se comunicar de forma mais reservada, priorizando qualidade da interação em vez de quantidade. Prefere conversas profundas e objetivas.'
            },
            {
                trait: 'EXTRAVERSION', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Comunicação',
                text: 'Você equilibra momentos de interação social com momentos de reflexão individual. Adapta-se bem a diferentes contextos.'
            },
            {
                trait: 'EXTRAVERSION', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Ambiente Profissional',
                text: 'Seu perfil favorece ambientes dinâmicos, colaborativos e com alta interação social. Você tende a se energizar com pessoas e trocas constantes.'
            },
            {
                trait: 'EXTRAVERSION', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Ambiente Profissional',
                text: 'Seu perfil favorece ambientes muito dinâmicos e colaborativos. Você se energiza intensamente com interações sociais frequentes.'
            },

            // === CONSCIENCIOSIDADE (CONSCIENTIOUSNESS) ===
            {
                trait: 'CONSCIENTIOUSNESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Organização',
                text: 'Seu perfil favorece flexibilidade e espontaneidade, podendo preferir rotinas menos estruturadas e maior liberdade de ação.'
            },
            {
                trait: 'CONSCIENTIOUSNESS', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Organização / Rotina',
                text: 'Seu perfil favorece flexibilidade e adaptação, podendo preferir rotinas menos estruturadas e maior liberdade de ação.'
            },
            {
                trait: 'CONSCIENTIOUSNESS', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Organização',
                text: 'Você equilibra planejamento e flexibilidade, conseguindo se adaptar sem perder o foco em objetivos importantes.'
            },
            {
                trait: 'CONSCIENTIOUSNESS', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Tomada de Decisão',
                text: 'Você tende a tomar decisões de forma planejada, analisando riscos. Organização e responsabilidade orientam suas escolhas.'
            },
            {
                trait: 'CONSCIENTIOUSNESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Tomada de Decisão',
                text: 'Você tende a tomar decisões de forma muito planejada, analisando riscos e consequências. Organização e responsabilidade orientam suas escolhas.'
            },

            // === ABERTURA (OPENNESS) ===
            {
                trait: 'OPENNESS', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
                text: 'Você tende a preferir estabilidade e métodos comprovados, podendo ser mais cauteloso com mudanças e novidades.'
            },
            {
                trait: 'OPENNESS', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
                text: 'Você tende a preferir estabilidade e métodos conhecidos, sendo mais seletivo com mudanças.'
            },
            {
                trait: 'OPENNESS', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
                text: 'Você equilibra abertura para o novo com valorização do que já funciona. Adapta-se quando necessário.'
            },
            {
                trait: 'OPENNESS', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
                text: 'Você tende a lidar bem com mudanças, demonstrando curiosidade e abertura para novas ideias, métodos e experiências.'
            },
            {
                trait: 'OPENNESS', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Mudanças',
                text: 'Você demonstra grande curiosidade e abertura para novas ideias, métodos e experiências. Mudanças são bem-vindas.'
            },

            // === ESTABILIDADE EMOCIONAL (NEUROTICISM - INVERTIDO) ===
            {
                trait: 'NEUROTICISM', range: 'VERY_LOW', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
                text: 'Você mantém alta estabilidade emocional mesmo sob pressão, lidando com desafios de forma muito racional e equilibrada.'
            },
            {
                trait: 'NEUROTICISM', range: 'LOW', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
                text: 'Você tende a manter estabilidade emocional mesmo sob pressão, lidando com desafios de forma racional e equilibrada.'
            },
            {
                trait: 'NEUROTICISM', range: 'AVERAGE', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
                text: 'Você vivencia emoções de forma equilibrada, conseguindo manter controle na maioria das situações de pressão.'
            },
            {
                trait: 'NEUROTICISM', range: 'HIGH', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
                text: 'Em contextos de pressão, você pode vivenciar emoções de forma mais intensa. Estratégias de autorregulação ajudam a manter o equilíbrio.'
            },
            {
                trait: 'NEUROTICISM', range: 'VERY_HIGH', category: 'PRACTICAL_IMPACT', context: 'Pressão / Estresse',
                text: 'Em contextos de pressão, você vivencia emoções de forma muito intensa. Estratégias de autorregulação são importantes para manter o equilíbrio.'
            }
        ];

        let totalAdded = 0;
        for (const config of configs) {
            console.log(`👉 Processando Configuração: ${config.name} (ID: ${config.id})`);

            for (const item of textsToInsert) {
                const exists = await this.prisma.bigFiveInterpretativeText.findFirst({
                    where: {
                        configId: config.id,
                        traitKey: item.trait,
                        scoreRange: item.range,
                        category: item.category,
                        context: item.context
                    }
                });

                if (!exists) {
                    await this.prisma.bigFiveInterpretativeText.create({
                        data: {
                            configId: config.id,
                            traitKey: item.trait,
                            scoreRange: item.range,
                            category: item.category,
                            context: item.context,
                            text: item.text
                        }
                    });
                    totalAdded++;
                }
            }
        }

        return {
            success: true,
            message: `Textos interpretativos inseridos com sucesso!`,
            configsProcessed: configs.length,
            textsAdded: totalAdded
        };
    }
}
