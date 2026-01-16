const mysql = require('mysql2/promise');

const QUESTIONS_DATA = `
1	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	ouvinte-falante	falante	 1 	Eu sou da turma dos mais animados e falantes quando estou na roda de amigos.
2	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	seletivo-interativo	seletivo	(1)	Eu prefiro passar meu tempo livre com pouquíssimas pessoas ou até sozinho(a).
3	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	seletivo-interativo	interativo	 1 	Eu gosto de participar de atividades sociais mesmo com pessoas desconhecidas.
4	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	ouvinte-falante	ouvinte	(1)	As pessoas pensam que eu sou tímido, pois falo pouco.
5	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	reflexivo-ativo	ativo	 1 	Eu me sinto energizado(a) quando estou rodeado(a) de pessoas.
6	AMABILIDADE	Lógico-Sentimental	LÓGICO	crítico-tolerante	crítico	(1)	Eu gosto de lógica, pois ela não liga para os sentimentos das pessoas.
7	AMABILIDADE	Lógico-Sentimental	LÓGICO	crítico-tolerante	crítico	(1)	Eu escolho o que considero ser a melhor opção baseado em resultados, gostem ou não.
8	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	independente-conectado	conectado	 1 	Eu consigo fazer as pessoas se sentirem à vontade comigo.
9	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	crítico-tolerante	tolerante	 1 	Eu evito conflitos e busco a harmonia nas relações.
10	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	crítico-tolerante	tolerante	 1 	Eu realmente procuro ser agradável com as pessoas ao meu redor.
11	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	aventureiro-planejado	aventureiro	(1)	Eu evito assumir compromissos com antecedência, pois gosto de flexibilidade.
12	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	espontâneo-disciplinado	disciplinado	 1 	Eu me considero uma pessoa organizada e metódica.
13	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	espontâneo-disciplinado	disciplinado	 1 	Eu só consigo relaxar depois que eu faço primeiro minhas obrigações.
14	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	aventureiro-planejado	planejado	 1 	Eu gosto de saber sobre minhas tarefas e compromisso com antecedência, assim consigo me planejar.
15	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	espontâneo-disciplinado	espontâneo	(1)	Eu funciono melhor quando alterno entre diferentes atividades ao longo do dia. 
16	ABERTURA	Concreto-Abstrato	CONCRETO	realista-imaginativo	realista	(1)	Eu me considero uma pessoa realista do tipo "pés no chão".
17	ABERTURA	Concreto-Abstrato	ABSTRATO	prático-conceitual	conceitual	 1 	Eu costumo fazer associações entre diferentes conceitos e teorias.
18	ABERTURA	Concreto-Abstrato	CONCRETO	prático-conceitual	prático	(1)	Eu acho perda de tempo aprender sobre assuntos que não vejo utilidade prática.
19	ABERTURA	Concreto-Abstrato	CONCRETO	prático-conceitual	prático	(1)	Eu aprendo na prática e acho explicações teóricas bastante cansativas.
20	ABERTURA	Concreto-Abstrato	ABSTRATO	realista-imaginativo	imaginativo	 1 	Eu tenho frequentemente ideias criativas que surgem "do nada" para solucionar problemas.
21	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	irritável-tranquilo	irritável	(1)	Eu me sinto facilmente irritado(a) ou frustrado(a).
22	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	irritável-tranquilo	tranquilo	 1 	Eu sou uma pessoa calma e tranquila, raramente perco a paciência.
23	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inquieto-despreocupado	inquieto	(1)	Eu me preocupo muito com o futuro e acho até difícil me lembrar de situações nas quais agi sem pensar.
24	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	reativo-controlado	controlado	 1 	Eu consigo me controlar mesmo quando estou bastante estressado.
25	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inseguro-autoconfiante	inseguro	(1)	Eu me aborreço facilmente quando sou criticado(a).
26	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inseguro-autoconfiante	inseguro	(1)	Eu sou uma pessoa tímida.
27	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	reativo-controlado	reativo	(1)	Eu costumo agir sem pensar.
28	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	reativo-controlado	controlado	 1 	Por mais incomodado que eu me sinta com a situação, poucas pessoas irão notar.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	contido-afirmativo	contido	(1)	Eu guardo a maior parte de minhas opiniões para mim.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	contido-afirmativo	contido	(1)	Eu não gosto de dizer aos outros o que fazer, no máximo dou sugestões do tipo "e se você..."
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	contido-afirmativo	contido	(1)	Eu sou diplomático e discreto.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	contido-afirmativo	afirmativo	 1 	Eu costumo conduzir as ações do grupo quando estou em uma equipe.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	contido-afirmativo	afirmativo	 1 	Eu sou claro ao me posicionar sobre minhas opiniões e expectativas.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	contido-afirmativo	afirmativo	 1 	Eu sou firme na defesa de meus pontos de vista.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	ouvinte-falante	ouvinte	(1)	Eu realmente sou uma pessoa que pensa antes de falar.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	ouvinte-falante	ouvinte	(1)	Eu sou melhor ouvinte do que falante.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	ouvinte-falante	falante	 1 	Eu penso em voz alta.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	ouvinte-falante	falante	 1 	Eu falo sem pensar.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	reflexivo-ativo	reflexivo	(1)	Muitas tarefas e muita interação social sugam minha energia.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	reflexivo-ativo	reflexivo	(1)	Eu me canso quando estou com muita gente facilmente.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	reflexivo-ativo	reflexivo	(1)	Eu sou muito observador e reflexivo.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	reflexivo-ativo	ativo	 1 	Eu parto para ação o mais breve possível.
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	reflexivo-ativo	ativo	 1 	Eu tenho energia de sobra.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	seletivo-interativo	seletivo	(1)	Poucas pessoas conhecem detalhes de minha vida pessoal.
A	EXTROVERSÃO	Introversão-Extroversão	INTROVERTIDO	seletivo-interativo	seletivo	(1)	Eu prefiro conversas um a um: conversas em grupo são geralmente superficiais e cansativas. 
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	seletivo-interativo	interativo	 1 	Eu prefiro trabalhar em equipe do que sozinho(a).
A	EXTROVERSÃO	Introversão-Extroversão	EXTROVERTIDO	seletivo-interativo	interativo	 1 	Eu prefiro estar cercado de pessoas do que estar sozinho.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	competitivo-colaborativo	competitivo	(1)	Eu costumo levar a sério até partidas de videogame. 
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	competitivo	(1)	Eu acho importante metas e recompensas individuais.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	competitivo	(1)	Eu negocio para garantir que minhas necessidades sejam atendidas.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	competitivo	(1)	Eu sou insistente para convencer as pessoas.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	colaborativo	 1 	Eu deixo minhas próprias tarefas de lado para ajudar quem precisa.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	colaborativo	 1 	Eu procuro atender as expectativas do outro antes de pedir algo para mim.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	colaborativo	 1 	Eu procuro seguir a vontade da maioria.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	competitivo-colaborativo	colaborativo	 1 	Eu geralmente faço concessões em benefício do grupo com o qual estou.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	crítico-tolerante	crítico	(1)	Eu costumo encontrar facilmente erros que precisam ser corrigidos nas mais diversas situações.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	crítico-tolerante	crítico	(1)	Eu evito que meus sentimentos influenciem minhas análises, prefiro usar a lógica.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	crítico-tolerante	tolerante	 1 	Eu costumo seguir meu coração mais do que minha cabeça.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	crítico-tolerante	tolerante	 1 	Eu evito fazer críticas para não ferir os sentimentos das pessoas.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	independente-conectado	independente	(1)	Eu não me importo muito com a opinião das pessoas sobre mim.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	independente-conectado	independente	(1)	Sou mais produtivo quando posso fazer minhas tarefas sozinho.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	independente-conectado	independente	(1)	A lógica me traz mais segurança do que ter a concordância e apoio de muitas pessoas.
B	AMABILIDADE	Lógico-Sentimental	LÓGICO	independente-conectado	independente	(1)	Eu acho importante ser claro sobre minha opinião, mesmo que a maioria discorde.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	independente-conectado	conectado	 1 	Eu sinto que valorizo ser compreendido pelas pessoas.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	independente-conectado	conectado	 1 	Eu costumo mostrar para as pessoas o quanto me importo com elas.
B	AMABILIDADE	Lógico-Sentimental	SENTIMENTAL	independente-conectado	conectado	 1 	Quando vejo alguém pra baixo, eu tenho vontade de oferecer ajuda. 
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	aventureiro-planejado	aventureiro	(1)	Meu planejamento é apenas uma ideia geral, pois gosto de explorar as alternativas conforme cada situação.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	aventureiro-planejado	aventureiro	(1)	Eu gosto de manter as opções em aberto para todas as áreas de minha vida.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	aventureiro-planejado	aventureiro	(1)	Eu sou mais hábil em aproveitar as oportunidades do momento, do que em seguir planos elaborados.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	aventureiro-planejado	planejado	 1 	Eu preciso ter metas e objetivos claros para serem alcançados.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	aventureiro-planejado	planejado	 1 	Eu gosto de fazer listas, utilizar agendas e coisas parecidas para me organizar.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	aventureiro-planejado	planejado	 1 	Eu costumo definir objetivos e traçar planos passo a passo para alcançá-los.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	espontâneo-disciplinado	espontâneo	(1)	Eu admito que não dou muita atenção a regras e normas estabelecidas.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	espontâneo-disciplinado	espontâneo	(1)	Eu lido bem com mudanças de última hora.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	espontâneo-disciplinado	espontâneo	(1)	Eu sou mais produtivo quando aproveito meus picos de energia.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	espontâneo-disciplinado	disciplinado	 1 	Eu posso facilmente manter o foco em uma única tarefa até a sua conclusão.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	espontâneo-disciplinado	disciplinado	 1 	Eu gosto de concluir uma tarefa para só depois iniciar outra.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	flexível-persistente	flexível	(1)	Eu admito que não sou insistente com meu planejamento e mudo com facilidade.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	flexível-persistente	flexível	(1)	Confio mais em minha habilidade de contornar obstáculos, do que em minha força de vontade.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	flexível-persistente	flexível	(1)	Sinto que minha energia oscila de tempos em tempos.
C	ESTRUTURA	Adaptável-Estruturado	ADAPTÁVEL	flexível-persistente	flexível	(1)	Costumo rever minhas prioridades com frequência.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	flexível-persistente	persistente	 1 	Diante de dificuldades eu não desanimo, insisto em seguir meu plano até o final.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	flexível-persistente	persistente	 1 	Algumas pessoas me acham teimoso(a), mas eu acredito que sou insistente.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	flexível-persistente	persistente	 1 	Acredito que sou mais ambicioso que a maioria das pessoas.
C	ESTRUTURA	Adaptável-Estruturado	ESTRUTURADO	flexível-persistente	persistente	 1 	Sou minucioso e detalhista quando persigo meus objetivos.
D	ABERTURA	Concreto-Abstrato	CONCRETO	conservador-aberto	conservador	(1)	Eu valorizo muito minhas experiências, por isso evito certas mudanças.
D	ABERTURA	Concreto-Abstrato	CONCRETO	conservador-aberto	conservador	(1)	Diante de problemas, eu desconfio de soluções e ideias mirabolantes, prefiro soluções comprovadas.
D	ABERTURA	Concreto-Abstrato	CONCRETO	conservador-aberto	conservador	(1)	Eu tomo decisões com base em fatos e acho chato quando ficam me perguntando "e se?".
D	ABERTURA	Concreto-Abstrato	ABSTRATO	conservador-aberto	aberto	 1 	Eu aprecio oportunidades de viver novas experiências culturais.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	conservador-aberto	aberto	 1 	Eu sou uma pessoa curiosa e me interesso por tudo que é novidade.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	conservador-aberto	aberto	 1 	Eu costumo me sentir motivado(a) para tentar coisas diferentes e sair de minha zona de conforto.
D	ABERTURA	Concreto-Abstrato	CONCRETO	prático-conceitual	prático	(1)	Eu sou realmente hábil em encontrar soluções para problemas práticos.
D	ABERTURA	Concreto-Abstrato	CONCRETO	prático-conceitual	prático	(1)	Eu entendo melhor com exemplos práticos, mais do que com metáforas e analogias.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	prático-conceitual	conceitual	 1 	Estou sempre pesquisando, lendo e estudando em busca de novas teorias, ideias e possibilidades.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	prático-conceitual	conceitual	 1 	Eu frequentemente me pergunto o porquê as coisas são como são e fico elaborando minhas próprias teorias.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	prático-conceitual	conceitual	 1 	Eu tenho facilidade para olhar para o todo e identificar padrões, mas admito que detalhes me cansam.
D	ABERTURA	Concreto-Abstrato	CONCRETO	realista-imaginativo	realista	(1)	Eu penso que a maioria das pessoas perde tempo com teorias, ao invés de "por a mão na massa" e resolver.
D	ABERTURA	Concreto-Abstrato	CONCRETO	realista-imaginativo	realista	(1)	Eu sou uma pessoa atualizada sobre o que se passa no momento .
D	ABERTURA	Concreto-Abstrato	CONCRETO	realista-imaginativo	realista	(1)	Eu vivo um dia de cada vez e ajo de acordo com os dados e fatos apresentados.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	realista-imaginativo	imaginativo	 1 	Eu às vezes fico pensando em coisas aleatórios e estranhas.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	realista-imaginativo	imaginativo	 1 	Eu costumo pensar em cenários futuros que a maioria das pessoas sequer imaginaram.
D	ABERTURA	Concreto-Abstrato	ABSTRATO	realista-imaginativo	imaginativo	 1 	Eu penso em múltiplas possibilidades antes de tomar uma decisão final.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inquieto-despreocupado	inquieto	(1)	Eu penso tanto nos meus compromissos ou tarefas futuras que não consigo relaxar.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inquieto-despreocupado	inquieto	(1)	Eu frequentemente sinto que me preocupo com as coisas.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inquieto-despreocupado	inquieto	(1)	Eu tenho uma tendência em me preocupar que as coisas vão piorar.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inquieto-despreocupado	despreocupado	 1 	As pessoas acham que eu sou otimista.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inquieto-despreocupado	despreocupado	 1 	Eu acho estranho as pessoas sofrerem por antecipação, pois isso raramente acontece comigo.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inquieto-despreocupado	despreocupado	 1 	Quando tenho um compromisso ou tarefa importante geralmente só tenho bons pensamentos e expectativas.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inquieto-despreocupado	despreocupado	 1 	Eu consigo manter a calma mesmo estou sob pressão .
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inseguro-autoconfiante	inseguro	(1)	Quando inicio novas atividades e aprendizados, fico tão preocupado se vou conseguir que até penso em desistir.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	inseguro-autoconfiante	inseguro	(1)	Eu preciso de tempo para confiar nas pessoas. 
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inseguro-autoconfiante	autoconfiante	 1 	Eu conheço claramente meus pontos fortes e limitações.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inseguro-autoconfiante	autoconfiante	 1 	Eu tenho plena confiança em minhas habilidade e conhecimentos.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inseguro-autoconfiante	autoconfiante	 1 	Minha postura corporal é ereta, com cabeça e ombros erguidos; eu olho nos olhos quando converso.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	inseguro-autoconfiante	autoconfiante	 1 	Eu tenho facilidade para tomar decisões difíceis e assumir riscos.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	irritável-tranquilo	irritável	(1)	Eu às vezes fico nervoso(a) e nem sei ao certo a razão.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	irritável-tranquilo	irritável	(1)	Meu humor muda com frequência.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	irritável-tranquilo	irritável	(1)	Tem situações em que sinto que eu vou explodir.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	irritável-tranquilo	tranquilo	 1 	Eu penso que poucas coisas conseguem ameaçar minha paz.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	irritável-tranquilo	tranquilo	 1 	Eu não fico irritado(a) nem mesmo com gente reclamando.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	irritável-tranquilo	tranquilo	 1 	Eu não sou o tipo de pessoa que se empolga facilmente.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	reativo-controlado	reativo	(1)	Eu às vezes tomo decisões e logo depois me arrependo.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	reativo-controlado	reativo	(1)	Eu me arrependo de alguma de minhas ações quase todo dia.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	EMOCIONAL	reativo-controlado	reativo	(1)	Eu às vezes acho difícil controlar minhas emoções: elas transbordam.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	reativo-controlado	controlado	 1 	Eu acho difícil me lembrar de situações nas quais agi sem pensar.
E	ESTABILIDADE EMOCIONAL	Emoção-Razão	RACIONAL	reativo-controlado	controlado	 1 	Eu logo percebo quando estou ficando impaciente e me afasto da situação.
`;

const TRAIT_MAP = {
    'EXTROVERSÃO': 'EXTRAVERSION',
    'AMABILIDADE': 'AGREEABLENESS',
    'ESTRUTURA': 'CONSCIENTIOUSNESS',
    'ABERTURA': 'OPENNESS',
    'ESTABILIDADE EMOCIONAL': 'NEUROTICISM'
};

async function importQuestions() {
    console.log('=== IMPORTADOR DE PERGUNTAS ===');
    const connection = await mysql.createConnection({
        host: 'yamanote.proxy.rlwy.net',
        port: 50133,
        user: 'root',
        password: 'bjaxTxAWIBBniBfYxGwRGJXluqiKxsva',
        database: 'railway'
    });

    try {
        const modelId = '4942ae96-4ce2-41ed-a21d-27a8bbb6e4d7';

        // 1. Limpar perguntas antigas (opcional, mas bom para garantir estado limpo)
        // await connection.execute('DELETE FROM questions WHERE assessmentModelId = ?', [modelId]);
        // console.log('Perguntas antigas removidas (se haviam).');

        // 2. Parsear dados
        const lines = QUESTIONS_DATA.trim().split('\n');

        console.log(`Processando ${lines.length} perguntas...`);

        for (const line of lines) {
            const parts = line.split('\t');
            // Estrutura esperada:
            // 0: TIPO (ex: 1 ou A)
            // 1: TRACO (EXTROVERSÃO)
            // 2: DICOTOMIA (Introversão-Extroversão)
            // 3: QUEST_TRAIT (EXTROVERTIDO)
            // 4: SUBTRACO_DIC (ouvinte-falante)
            // 5: SUBTRACO_QUEST (falante)
            // 6: PONTUACAO ( 1  ou (1))
            // 7: TE XTO (Eu sou...)

            if (parts.length < 8) continue; // Linha inválida

            const traitPT = parts[1].trim();
            const dichotomy = parts[2].trim();
            const questionTrait = parts[3].trim();
            const subtraitDichotomy = parts[4].trim();
            const subtrait = parts[5].trim();
            const rawScore = parts[6].trim();
            const text = parts[7].trim();

            const traitKey = TRAIT_MAP[traitPT];
            if (!traitKey) {
                console.warn(`Traço desconhecido: ${traitPT}`);
                continue;
            }

            // Calcular peso
            let weight = 1;
            let isReverse = false;

            if (rawScore.includes('(')) {
                weight = -1;
                isReverse = true;
            }

            // Inserir
            await connection.execute(`
                INSERT INTO questions (
                    id, 
                    assessmentModelId, 
                    text, 
                    traitKey, 
                    dichotomy, 
                    subtraitDichotomy,
                    questionTrait,
                    subtrait,
                    weight,
                    isReverse,
                    isActive,
                    createdAt
                ) VALUES (
                    UUID(),
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    1,
                    NOW()
                )
            `, [
                modelId,
                text,
                traitKey,
                dichotomy,
                subtraitDichotomy,
                questionTrait,
                subtrait,
                weight,
                isReverse ? 1 : 0
            ]);
        }

        console.log('✅ Importação concluída com sucesso!');

        // Contar totals
        const [count] = await connection.execute('SELECT traitKey, COUNT(*) as qtd FROM questions WHERE assessmentModelId = ? GROUP BY traitKey', [modelId]);
        console.table(count);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await connection.end();
    }
}

importQuestions();
