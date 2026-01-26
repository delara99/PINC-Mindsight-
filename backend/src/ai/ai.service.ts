
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
        // Normalização para evitar erros de case (PRO, pro, Pro)
        const normalizedPlan = (userPlan || '').toUpperCase().trim();

        // Lista de planos permitidos
        const allowedPlans = ['PRO', 'BUSINESS', 'SUPER_ADMIN', 'ENTERPRISE'];

        if (!allowedPlans.includes(normalizedPlan)) {
            this.logger.warn(`User blocked from AI. Plan: ${userPlan} (Normalized: ${normalizedPlan})`);

            return {
                role: 'assistant',
                content: '🔒 Recurso exclusivo para assinantes PRO. Faça o upgrade para continuar nossa conversa e desbloquear sua mentoria personalizada.'
            };
        };

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

            // Diagnóstico detalhado para Logs da Railway
            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                const msg = '🚨 ERRO CRÍTICO OPENAI: COTA EXCEDIDA OU SALDO INSUFICIENTE. Adicione créditos em platform.openai.com';
                this.logger.error(msg);
                console.error(msg); // Forçar saída no stdout
            }

            throw new Error('Falha ao processar resposta da IA.');
        }
    }

    private buildSystemPrompt(profile: any): string {
        const factors = profile?.factors || {};

        // Mapeamento de Níveis (Baixo/Médio/Alto) para dar contexto qualitativo à IA
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
      2. AMABILIDADE: ${factors.agreeableness} (${getLevel(factors.agreeableness)})
      3. CONSCIENCIOSIDADE (Foco/Organização): ${factors.conscientiousness} (${getLevel(factors.conscientiousness)})
      4. ESTABILIDADE (Calma sob pressão): ${factors.neuroticism ? (100 - factors.neuroticism) : 'N/A'} (Derivado de Neuroticismo)
      5. ABERTURA (Criatividade): ${factors.openness} (${getLevel(factors.openness)})

      🧠 REGRAS DE OURO PARA SUA RESPOSTA:
      1. **LINGUAGEM POPULAR:** Não use termos como "Neuroticismo" ou "Big Five" sem explicar. Fale "Nível de Estresse", "Vontade de Socializar".
      2. **EXEMPLOS DO DIA A DIA:** É OBRIGATÓRIO dar ao menos um exemplo prático.
         - Ruim: "Sua assertividade é alta."
         - Bom: "Sabe aquela reunião em que todo mundo fica calado e você é o primeiro a falar? Isso é sua Extroversão alta agindo."
      3. **SEJA DIRETA:** Responda a pergunta na primeira frase. Nada de "rodeios".
      4. **TOM DE VOZ:** Empático, mas assertivo. Use emojis para quebrar o gelo. ✨

      💡 CONTEXTO ATUAL:
      O usuário perguntou: "${profile.lastMessage || 'Sobre meu perfil'}"
      Ele está vendo o relatório na tela. Se os dados acima estiverem zerados ou N/A, diga honestamente que precisa que ele complete o teste primeiro, mas se tiver números, INTERPRETE-OS com base na pergunta dele.
    `;
    }
}
