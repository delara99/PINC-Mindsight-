
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
    private openai: OpenAI;
    private readonly logger = new Logger(AiService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not found. AI features will be disabled.');
        }
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
        });
    }

    async getChatHistory(userId: string) {
        try {
            // @ts-ignore
            return await this.prisma.aiChatHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                take: 50
            });
        } catch (e) {
            return [];
        }
    }

    async generateChatResponse(userId: string, userProfile: any, messages: any[], userPlan: string) {
        // Validation
        const normalizedPlan = (userPlan || '').toUpperCase().trim();
        const allowedPlans = ['PRO', 'BUSINESS', 'SUPER_ADMIN', 'ENTERPRISE'];

        if (!allowedPlans.includes(normalizedPlan)) {
            return {
                role: 'assistant',
                content: '🔒 Recurso exclusivo para assinantes PRO. Faça o upgrade para continuar nossa conversa e desbloquear sua mentoria personalizada.'
            };
        };

        try {
            // Save User Update
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                // @ts-ignore
                await this.prisma.aiChatHistory.create({
                    data: { userId, role: 'user', content: lastUserMsg.content }
                }).catch(e => console.error("Erro salvando msg user", e));
            }

            const systemPrompt = this.buildSystemPrompt(userProfile);

            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                model: 'gpt-4o-mini',
                temperature: 0.7,
                max_tokens: 500,
            });

            const aiMsg = completion.choices[0].message;

            if (aiMsg && aiMsg.content) {
                // @ts-ignore
                await this.prisma.aiChatHistory.create({
                    data: { userId, role: 'assistant', content: aiMsg.content }
                }).catch(e => console.error("Erro salvando msg AI", e));
            }

            return aiMsg;

        } catch (error) {
            this.logger.error('Error talking to OpenAI', error);

            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                const msg = '🚨 ERRO CRÍTICO OPENAI: COTA EXCEDIDA OU SALDO INSUFICIENTE. Adicione créditos em platform.openai.com';
                this.logger.error(msg);
                console.error(msg);
            }

            throw new Error('Falha ao processar resposta da IA.');
        }
    }

    private buildSystemPrompt(profile: any): string {
        const factors = profile?.factors || {};

        const getLevel = (score: number) => {
            if (!score && score !== 0) return 'Desconhecido';
            if (score <= 35) return 'BAIXO';
            if (score <= 65) return 'MÉDIO';
            return 'ALTO';
        };

        return `
      🏛️ PERSONA: VOCÊ É A PINC, MENTORA PRÁTICA DE CARREIRA
      Esqueça termos acadêmicos difíceis. Traduza a psicologia para a vida real.
      Você é direta, empática e focada em sucesso profissional.

      📊 DADOS DO CLIENTE (Do Relatório na Tela):
      Nome: ${profile?.name || 'Cliente'}
      Cargo: ${profile?.role || 'Profissional'}

      --- PERFIL (BIG FIVE) ---
      1. EXTROVERSÃO: ${factors.extroversion} (${getLevel(factors.extroversion)})
      2. AMABILIDADE: ${factors.agreeableness} (${getLevel(factors.agreeableness)})
      3. CONSCIENCIOSIDADE: ${factors.conscientiousness} (${getLevel(factors.conscientiousness)})
      4. NEUROTICISMO: ${factors.neuroticism} (${getLevel(factors.neuroticism)})
         (⚠️ ATENÇÃO: No relatório aparece 'Neuroticismo' = ${factors.neuroticism}. Use este número.
          Explique que Neuroticismo Alto significa ALTA Sensibilidade/Intensidade Emocional, e não 'loucura'.
          Neuroticismo Baixo significa Estabilidade.)
      5. ABERTURA: ${factors.openness} (${getLevel(factors.openness)})

      🧠 REGRAS DE OURO:
      1. **USE OS NÚMEROS DA TELA**: Se o relatório diz 53, Diga "Seu Neuroticismo é 53". Não inverta o cálculo para não confundir.
      2. **NORMALIZAÇÃO SEMÂNTICA**:
         - Em vez de falar "Você é neurótico", diga "Você tem uma intensidade emocional maior".
         - Diga: "Isso significa que você se importa muito e sente o ambiente com força."
      3. **EXEMPLO PRÁTICO (OBRIGATÓRIO)**: Conecte o traço com uma cena de trabalho.
      4. **SEM RODEIOS**: Vá direto ao ponto.

      💡 CONTEXTO:
      O usuário perguntou: "${profile.lastMessage || 'Analise meu perfil'}"
    `;
    }
}
