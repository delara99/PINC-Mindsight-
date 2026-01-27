export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    content: string; // HTML content for simplicity now, could be MDX later
    author: string;
    date: string;
    category: string;
    image: string;
    tags: string[];
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'o-que-e-big-five',
        title: 'O Que é o Big Five e Por Que Ele é a Ciência da Personalidade?',
        description: 'Descubra como os 5 Grandes Fatores (OCEAN) moldam quem você é e como usar essa ciência para alavancar sua carreira e relacionamentos.',
        author: 'Time PINC',
        date: '2026-01-27',
        category: 'Autoconhecimento',
        image: '/blog/big-five-hero.jpg', // Placeholder
        tags: ['Big Five', 'Psicologia', 'Carreira'],
        content: `
            <h2>A Ciência por trás de quem você é</h2>
            <p>Diferente de testes de revista ou horóscopos, o Big Five (ou Modelo dos Cinco Grandes Fatores) é o padrão-ouro na psicologia científica moderna.</p>
            <p>Ele não te coloca em uma "caixa". Ele mapeia sua personalidade em um espectro contínuo de 5 dimensões fundamentais:</p>
            
            <h3>1. Abertura à Experiência (Openness)</h3>
            <p>Mede sua curiosidade, criatividade e abertura ao novo. Pessoas com alta abertura tendem a ser visionárias, enquanto as com baixa pontuação preferem rotinas e tradição.</p>
            
            <h3>2. Conscienciosidade (Conscientiousness)</h3>
            <p>Relacionado à disciplina, organização e foco em objetivos. É o maior preditor de sucesso profissional a longo prazo.</p>
            
            <h3>3. Extroversão (Extraversion)</h3>
            <p>Como você busca recompensas sociais. Não é apenas sobre "falar muito", mas sobre quão energizado você se sente em ambientes sociais.</p>
            
            <h3>4. Amabilidade (Agreeableness)</h3>
            <p>Sua tendência a ser cooperativo, compassivo e confiável. Essencial para trabalho em equipe e liderança empática.</p>
            
            <h3>5. Neuroticismo (Neuroticism)</h3>
            <p>Refere-se à estabilidade emocional. Pessoas com pontuação mais alta podem sentir ansiedade com mais facilidade, mas também são ótimas em detectar riscos.</p>

            <h2>Por que isso importa para sua carreira?</h2>
            <p>Entender seu perfil não é sobre mudar quem você é, mas sobre <strong>alinhar seu ambiente</strong> com sua natureza.</p>
            <p>Na PINC, usamos essa ciência para ajudar você a encontrar o "Fit" perfeito entre sua personalidade e seus desafios profissionais.</p>
        `
    },
    {
        slug: 'soft-skills-2026',
        title: 'As Soft Skills Mais Valorizadas em 2026 (e Como o PINC Ajuda)',
        description: 'O mercado mudou. Habilidades técnicas não são mais suficientes. Veja quais comportamentos estão em alta no RH das grandes empresas.',
        author: 'Equipe de RH',
        date: '2026-01-25',
        category: 'Carreira',
        image: '/blog/soft-skills.jpg',
        tags: ['Soft Skills', 'Mercado de Trabalho', 'RH'],
        content: `
            <h2>O Fim da Era Apenas Técnica</h2>
            <p>Com a IA automatizando tarefas técnicas, o diferencial humano se tornou comportamental.</p>
            <p>Empresas não demitem por falta de técnica, demitem por comportamento. As skills do momento são:</p>
            <ul>
                <li><strong>Adaptabilidade:</strong> A capacidade de aprender rápido (ligada à Abertura).</li>
                <li><strong>Resiliência Emocional:</strong> Manter a calma sob pressão (ligada ao Neuroticismo).</li>
                <li><strong>Colaboração:</strong> Trabalhar bem com outros (ligada à Amabilidade).</li>
            </ul>
        `
    }
];
