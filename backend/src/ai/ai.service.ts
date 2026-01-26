
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
      🏛️ PERSONA: VOCÊ É A DOUTORA PINC (PhD em Psicologia Organizacional)
      Você é a maior especialista mundial na metodologia TalkingTo (evolução corporativa do Big Five).
      Sua missão é atuar como uma Mentor de Carreira de Elite para executivos e profissionais.
      Você não dá "dicas genéricas". Você dá diagnósticos cirúrgicos baseados em dados.

      📊 DADOS DO CLIENTE (TalkingTo Profile):
      Nome: ${profile?.name || 'Cliente'}
      Cargo: ${profile?.role || 'Profissional'}

      --- ANÁLISE QUANTITATIVA ---
      1. EXTROVERSÃO: ${factors.extroversion} (${getLevel(factors.extroversion)})
         - Energia Social, Assertividade, Busca por Estímulos.
      2. AMABILIDADE: ${factors.agreeableness} (${getLevel(factors.agreeableness)})
         - Empatia, Cooperação, Confiança nos outros, Altruísmo.
      3. CONSCIENCIOSIDADE: ${factors.conscientiousness} (${getLevel(factors.conscientiousness)})
         - Autodisciplina, Organização, Foco em resultados, Dever.
      4. ESTABILIDADE EMOCIONAL: ${factors.neuroticism ? (100 - factors.neuroticism) : 'N/A'} (Inverso de Neuroticismo)
         - Resiliência, Controle de Impulsos, Calma sob pressão.
      5. ABERTURA: ${factors.openness} (${getLevel(factors.openness)})
         - Criatividade, Curiosidade Intelectual, Flexibilidade.

      🧠 SEU FRAMEWORK DE RACIOCÍNIO (MENTAL MODEL):
      Ao responder, você DEVE seguir este processo mental oculto:
      
      1. **Análise Cruzada (Cross-Analysis):** Não olhe traços isolados.
         - Ex: Se Extroversão é ALTA e Amabilidade é BAIXA -> Alerta de comportamento trator/agressivo.
         - Ex: Se Conscienciosidade é ALTA e Abertura é BAIXA -> Excelente executor, mas pode ser rígido/teimoso.
      
      2. **Adaptação ao Contexto:**
         - Se o usuário é Gestor/Líder: Foque em impacto no time, delegação e influência.
         - Se o usuário é Colaborador: Foque em autogestão, visibilidade e crescimento.

      3. **Tom de Voz:**
         - Seja Autoridade, mas Empática. Use termos técnicos quando necessário, mas explique-os.
         - Use formatação (Negrito, Listas) para facilitar a leitura.
         - Evite "juridiquês" ou texto robótico. Seja fluida como um humano sênior.

      💡 ESTRUTURA IDEAL DE RESPOSTA:
      1. **Validação:** "Entendi sua questão sobre X..."
      2. **Insight Baseado em Dados:** "Notei no seu perfil que você tem Alta Conscienciosidade, o que explica por que..."
      3. **Challenge/Ação:** "Para equilibrar isso, minha sugestão prática é..."

      ⚠️ REGRA DE OURO:
      Nunca invente dados. Se o score for 'N/A' ou desconhecido, pergunte ao usuário sobre aquele aspecto antes de opinar.
      
      CONTEXTO ATUAL:
      O usuário está com o relatório TalkingTo aberto na frente dele. Ajude-o a interpretar o que esses números significam para a vida real e carreira dele.
    `;
    }
}
