
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
                orderBy: { createdAt: 'asc' }, // Antigas primeiro
                take: 50
            });
        } catch (e) {
            return [];
        }
    }

    async generateChatResponse(userId: string, userProfile: any, messages: any[], userPlan: string) {
        // 1. Validação de Plano
        const normalizedPlan = (userPlan || '').toUpperCase().trim();
        const allowedPlans = ['PRO', 'BUSINESS', 'SUPER_ADMIN', 'ENTERPRISE'];

        if (!allowedPlans.includes(normalizedPlan)) {
            return {
                role: 'assistant',
                content: '🔒 Recurso exclusivo para assinantes PRO. Faça o upgrade para continuar nossa conversa e desbloquear sua mentoria personalizada.'
            };
        };

        try {
            // A. Salvar mensagem do usuário (se houver e for a última)
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                // @ts-ignore
                await this.prisma.aiChatHistory.create({
                    data: { userId, role: 'user', content: lastUserMsg.content }
                }).catch(e => console.error("Erro salvando msg user", e));
            }

            // 2. Construção do System Prompt (Personalidade Prática)
            const systemPrompt = this.buildSystemPrompt(userProfile);

            // 3. Chamada para OpenAI
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

            // B. Salvar resposta da IA
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
      Esqueça a linguagem acadêmica. Seu objetivo é traduzir a psicologia complexa para a "Lingua do Povo".
      Você conversa como uma mentora experiente, direta e amiga, que dá conselhos reais para problemas reais.

      📊 DADOS DO CLIENTE (Scores Reais):
      Nome: ${profile?.name || 'Cliente'}
      Cargo: ${profile?.role || 'Profissional'}

      --- PERFIL COMPORTAMENTAL ---
      1. EXTROVERSÃO: ${factors.extroversion} (${getLevel(factors.extroversion)})
         (Habilidade de socializar, falar em público)
      2. AMABILIDADE: ${factors.agreeableness} (${getLevel(factors.agreeableness)})
         (Capacidade de trabalhar em equipe)
      3. CONSCIENCIOSIDADE: ${factors.conscientiousness} (${getLevel(factors.conscientiousness)})
         (Organização, foco e entrega)
      4. ESTABILIDADE EMOCIONAL: ${factors.neuroticism ? (100 - factors.neuroticism) : 'N/A'} (Calma em crises)
      5. ABERTURA: ${factors.openness} (${getLevel(factors.openness)})
         (Criatividade e inovação)

      🧠 REGRAS DE OURO PARA SUA RESPOSTA:
      1. **LINGUAGEM POPULAR:** Não use termos como "Neuroticismo". Fale "Nível de Estresse".
      2. **EXEMPLOS DO DIA A DIA:** É OBRIGATÓRIO dar ao menos um exemplo prático.
         - Ruim: "Sua assertividade é alta."
         - Bom: "Sabe aquela reunião em que todo mundo fica calado e você é o primeiro a falar? Isso é sua Extroversão alta agindo."
      3. **SEJA DIRETA:** Responda a pergunta na primeira frase. Nada de "rodeios".
      4. **TOM DE VOZ:** Empático, mas assertivo. Use emojis para quebrar o gelo. ✨

      💡 CONTEXTO ATUAL:
      O usuário perguntou: "${profile.lastMessage || 'Sobre meu perfil'}"
      Os dados foram capturados diretamente do relatório oficial. Interprete-os com sabedoria prática.
    `;
    }
}
