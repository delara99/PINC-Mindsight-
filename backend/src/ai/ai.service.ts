
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private openai: OpenAI;
    private readonly logger = new Logger(AiService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY not found. AI features will be disabled.');
        }
        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
        });
    }

    async generateChatResponse(userProfile: any, messages: any[], userPlan: string) {
        // 1. Validação de Plano (Business Rule)
        // Se não for PRO ou BUSINESS, retornamos uma mensagem de teaser fixa ou erro,
        // mas idealmente o frontend bloqueia. Aqui é a segurança final.
        if (userPlan !== 'PRO' && userPlan !== 'BUSINESS' && userPlan !== 'SUPER_ADMIN') {
            return {
                role: 'assistant',
                content: '🔒 Recurso exclusivo para assinantes PRO. Faça o upgrade para continuar nossa conversa e desbloquear sua mentoria personalizada.'
            };
        }

        try {
            // 2. Construção do System Prompt (A "Personalidade" da PINC)
            const systemPrompt = this.buildSystemPrompt(userProfile);

            // 3. Chamada para OpenAI
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages // Histórico da conversa
                ],
                model: 'gpt-4o-mini',
                temperature: 0.7, // Criativo mas focado
                max_tokens: 500, // Respostas concisas
            });

            return completion.choices[0].message;

        } catch (error) {
            this.logger.error('Error talking to OpenAI', error);
            throw new Error('Falha ao processar resposta da IA.');
        }
    }

    private buildSystemPrompt(profile: any): string {
        // Formatar os dados do relatório para a IA entender
        // Assumindo que 'profile' vem com os scores do Big Five/TalkingTo

        // Fallback se não tiver dados ainda
        const factors = profile?.factors || {};

        return `
      VOCÊ É A "PINC": Uma Inteligência Artificial especialista em Psicologia Organizacional e Comportamento Humano, baseada na metodologia Big Five (TalkingTo).
      
      SUA MISSÃO:
      Atuar como uma mentora de carreira e coach pessoal para o usuário. Você deve analisar os traços de personalidade dele e oferecer conselhos práticos, empáticos e acionáveis.

      DADOS DO USUÁRIO (Perfil Comportamental):
      - Nome: ${profile?.name || 'Usuário'}
      - Cargo/Função: ${profile?.role || 'Não informado'}
      
      SEUS TRAÇOS (0-100):
      - Extroversão (Comunicação/Energia): ${factors.extroversion || 'N/A'}
      - Amabilidade (Empatia/Cooperação): ${factors.agreeableness || 'N/A'}
      - Conscienciosidade (Foco/Organização): ${factors.conscientiousness || 'N/A'}
      - Estabilidade Emocional (Resiliência): ${factors.neuroticism ? (100 - factors.neuroticism) : 'N/A'} (Nota: Neuroticismo invertido)
      - Abertura (Criatividade/Inovação): ${factors.openness || 'N/A'}

      DIRETRIZES DE PERSONALIDADE:
      1. Seja PROFISSIONAL mas ACOLHEDORA. Use emojis ocasionalmente ✨.
      2. BASEIE-SE NOS DADOS: Sempre que dar um conselho, ligue-o a um traço do usuário. Ex: "Como sua Conscienciosidade é alta, você tende a..."
      3. SEJA CONCISA: Respostas curtas e diretas (max 2 parágrafos). O usuário está lendo no celular ou no trabalho.
      4. FOCO EM SOLUÇÃO: Se o usuário reclamar, acolha a dor mas mostre um caminho prático baseado no perfil dele.
      5. NÃO INVENTE DADOS: Se não souber algo sobre o usuário, pergunte.

      CONTEXTO ATUAL:
      O usuário está lendo o relatório dele agora. Esteja pronta para tirar dúvidas sobre o significado dos traços ou dar dicas de desenvolvimento.
    `;
    }
}
