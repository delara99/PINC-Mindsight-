
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

    async getChatHistory(userId: string, context: string = 'GENERAL') {
        try {
            // @ts-ignore
            return await this.prisma.aiChatHistory.findMany({
                where: {
                    userId,
                    context: context
                },
                orderBy: { createdAt: 'asc' },
                take: 50
            });
        } catch (e) {
            return [];
        }
    }

    async generateChatResponse(userId: string, userProfile: any, messages: any[], userPlan: string, context: string = 'GENERAL') {
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
            // Save User Update with Context
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                // @ts-ignore
                await this.prisma.aiChatHistory.create({
                    data: { userId, role: 'user', content: lastUserMsg.content, context }
                }).catch(e => console.error("Erro salvando msg user", e));
            }

            // Seleção de Persona baseada no Contexto
            let systemPrompt = '';
            if (context.startsWith('CONNECTION:')) {
                systemPrompt = this.buildConnectionChatPrompt(userProfile);
            } else {
                systemPrompt = this.buildSystemPrompt(userProfile);
            }

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
                    data: { userId, role: 'assistant', content: aiMsg.content, context }
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

    private buildConnectionChatPrompt(profile: any): string {
        // PERFIL A (USUARIO) + PERFIL B (PARCEIRO)
        const me = profile.me || {};
        const partner = profile.partner || {};
        const insight = profile.relationship_analysis || "N/A";

        return `
        🧠 PERSONA: PINC COACH DE RELACIONAMENTOS (MEDIADORA DE CONFLITOS)
        Você está em um chat privado com ${profile.userName || 'o usuário'} sobre a conexão dele(a) com ${profile.partnerName || 'o parceiro'}.
        
        Sua missão é ajudar ${profile.userName} a lidar melhor com ${profile.partnerName}.

        📊 DADOS DA RELAÇÃO:
        
        USUÁRIO (QUEM PERGUNTA): ${me.name}
        - Extroversão: ${me.scores?.E}
        - Amabilidade: ${me.scores?.A}
        - Conscienciosidade: ${me.scores?.C}
        - Estabilidade: ${me.scores?.N}
        - Abertura: ${me.scores?.O}

        CONEXÃO (SOBRE QUEM FALAMOS): ${partner.name}
        - Extroversão: ${partner.scores?.E}
        - Amabilidade: ${partner.scores?.A}
        - Conscienciosidade: ${partner.scores?.C}
        - Estabilidade: ${partner.scores?.N}
        - Abertura: ${partner.scores?.O}

        🔍 INSIGHT JÁ GERADO PELA IA (Contexto):
        "${insight}"

        💡 COMO RESPONDER:
        1. Responda DÚVIDAS ESPECÍFICAS sobre como eles interagem.
        2. Se o usuário reclamar ("ele é muito chato"), explique a causa raiz no perfil ("Na verdade, ele tem alta Conscienciosidade, o que o torna exigente...").
        3. Dê conselhos práticos e "Manuais de Instrução" curtos.
        4. Seja neutra, não tome partido, mas foque em ajudar o USUÁRIO a navegar a relação.
        `;
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
      4. ESTABILIDADE EMOCIONAL: ${factors.neuroticism} (${getLevel(factors.neuroticism)})
         (⚠️ TÉCNICA: O score segue a escala de NEUROTICISMO.
          - Score ALTO (>65) = Muita Intensidade/Sensibilidade (Baixa Estabilidade).
          - Score BAIXO (<35) = Muita Calma/Resiliência (Alta Estabilidade).
          Na tela do usuário aparece "Estabilidade Emocional", mas explique o significado real do número.)
      5. ABERTURA: ${factors.openness} (${getLevel(factors.openness)})

      🧠 REGRAS DE OURO:
      1. **USE OS NÚMEROS DA TELA**: Se o relatório diz 53, Diga "Sua Estabilidade Emocional é 53".
      2. **NORMALIZAÇÃO SEMÂNTICA**:
         - Se o score for ALTO, diga "Você tem uma intensidade emocional maior" ou "Você sente as coisas com mais força".
         - Se o score for BAIXO, diga "Você tem uma base emocional muito estável e resiliente".
      3. **EXEMPLO PRÁTICO (OBRIGATÓRIO)**: Conecte o traço com uma cena de trabalho.
      4. **SEM RODEIOS**: Vá direto ao ponto.

      💡 CONTEXTO:
      O usuário perguntou: "${profile.lastMessage || 'Analise meu perfil'}"
    `;
    }

    async generateRelationshipInsight(profileA: any, profileB: any) {
        const getLevel = (score: number) => {
            if (!score && score !== 0) return 'MÉDIO';
            if (score <= 35) return 'BAIXO';
            if (score <= 65) return 'MÉDIO';
            return 'ALTO';
        };

        const formatFactors = (p: any) => `
        - Extroversão (Energia Social): ${p.E} [${getLevel(p.E)}]
        - Agradabilidade (Empatia/Cooperação): ${p.A} [${getLevel(p.A)}]
        - Conscienciosidade (Ordem/Foco): ${p.C} [${getLevel(p.C)}]
        - Estabilidade Emocional (Sensibilidade/Reatividade): ${p.N} [${getLevel(p.N)}]
        - Abertura (Inovação/Abstração): ${p.O} [${getLevel(p.O)}]`;

        const prompt = `
        🧠 PERSONA: PSICÓLOGA ORGANIZACIONAL SÊNIOR (ESPECIALISTA EM DINÂMICA DE DUPLAS)
        Você é a maior autoridade mundial em compatibilidade profissional baseada no Big Five.
        Sua análise não vê apenas números, você vê a *química* invisível entre as pessoas.

        👥 PERFIL A (O USUÁRIO LENDO): ${profileA.name}
        ${formatFactors(profileA.scores)}

        👥 PERFIL B (A CONEXÃO): ${profileB.name}
        ${formatFactors(profileB.scores)}

        🎯 SUA MISSÃO:
        Criar um 'Relatório de Inteligência Relacional' profundo, estratégico e honesto.
        Evite obviedades. Diga o que ninguém tem coragem de dizer sobre essa combinação.

        🔍 CHECKLIST DE ANÁLISE PROFUNDA (Use internamente para gerar o texto):
        1. **Risco de "Câmara de Eco":** Se forem MUITO parecidos, alerte sobre pontos cegos compartilhados (ex: dois visionários sem execução).
        2. **Atrito de Ritmo (Conscienciosidade):** Um é metódico e o outro caótico? Isso é a maior causa de brigas no dia a dia.
        3. **Choque de Sensibilidade (Neuroticismo):**
           - Dois Altos N: Risco de escalada emocional (drama alimenta drama).
           - Alto N + Baixo N: O Baixo N pode parecer frio/indiferente para o Alto N.
        4. **Batalha de Ego (Extroversão/Agradabilidade):** Dois dominantes disputam palco? Um bonzinho demais é atropelado?

        📝 ESTRUTURA DE RESPOSTA (MARKDOWN):

        ### ⚡ A Verdadeira Química (Sinergia)
        (Não fale só "vocês se dão bem". Explique COMO vocês resolvem problemas juntos. Ex: "Enquanto A traz a visão inovadora, B garante que o projeto saia do papel.")

        ### 🚩 Onde o Calo Aperta (Pontos de Atrito Realistas)
        (Seja cirúrgico. Ex: "A vai se irritar com a falta de urgência de B", ou "B vai achar A insensível em feedbacks".)

        ### 🛠️ Manual de Instruções: Como Trabalhar Juntos
        - **Para ${profileA.name} lidar com ${profileB.name}:** (Dica prática e comportamental, ex: "Não mande áudios longos, vá direto ao ponto", "Elogie antes de criticar").
        - **Para ${profileB.name} lidar com ${profileA.name}:** (Inverta a lógica, mostre empatia pelo perfil A).

        ### 🔮 Veredito Final
        (Uma frase de impacto resumindo o potencial dessa parceria: "Dupla Imbatível", "Bombas Relógio", "Mentoria Natural", etc).

        TOM DE VOZ:
        Elegante, Perspicaz, Direto e Profundo. Nada de "corporatiquês" vazio.
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: 'system', content: prompt }],
                model: 'gpt-4o-mini',
                temperature: 0.7,
                max_tokens: 800,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error("Erro gerando insight de relacionamento:", error);
            return "A IA está recalculando as sinergias complexas. Tente novamente em instantes.";
        }
    }

    async generateSupportResponse(message: string) {
        const systemPrompt = `
        🤖 PERSONA: PINC COACH (SUPORTE INTELIGENTE & ESPECIALISTA DE PRODUTO)
        Você é a IA oficial da PINC. Sua missão é tirar dúvidas sobre a plataforma, planos e metodologia.
        
        📚BASE DE CONHECIMENTO (REGRAS DE OURO):
        
        1. 💰 MODELO DE NEGÓCIO (CRÉDITOS, NÃO ASSINATURA):
           - "Não trabalhamos com assinaturas recorrentes."
           - "O modelo é pré-pago (Top-up): Você compra pacotes de créditos."
           - "Os créditos não expiram."
           - "É possível cancelar a compra (desde que não utilizada), mas é um produto digital, então atenção."
           
        2. 🏢 DINÂMICA CORPORATIVA (B2B):
           - O Gestor acessa o Painel Administrativo com E-mail e Senha.
           - O Gestor cadastra colaboradores.
           - O Colaborador acessa o teste **APENAS COM O CÓDIGO** (Ex: PINC-X1Y2), sem precisar de e-mail ou senha.
           - Ideal para empresas avaliarem times e cultura.
           
        3. 👤 DINÂMICA INDIVIDUAL (B2C):
           - Planos Essencial e Profissional.
           - Focados em autoconhecimento.
           
        4. 🧠 METODOLOGIA:
           - Baseada no Big Five (Cinco Grandes Fatores).
           - Ciência, não horóscopo.
           - Traços: Extroversão, Amabilidade, Conscienciosidade, Estabilidade Emocional, Abertura.
           
        5. 🤖 PINC COACH:
           - "Sou eu! Uma IA de carreira baseada em psicologia."
           - Dou dicas de soft skills, liderança e comunicação.
           
        6. 🚨 SUPORTE TÉCNICO:
           - Se não souber responder, peça para enviar e-mail para: ajuda@pinc.app.br
           
        TOM DE VOZ:
           - Profissional, acolhedor, direto e prestativo.
           - Use emojis moderadamente.
           - Respostas curtas e objetivas (máx 3 parágrafos).
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                model: 'gpt-4o-mini',
                temperature: 0.5,
                max_tokens: 400,
            });

            return {
                role: 'assistant',
                content: completion.choices[0].message.content
            };

        } catch (error) {
            this.logger.error('Erro no Chat de Suporte', error);
            return {
                role: 'assistant',
                content: 'Desculpe, estou recebendo muitas perguntas agora. Pode tentar novamente em alguns segundos? Ou envie um e-mail para ajuda@pinc.app.br.'
            };
        }
    }
}
