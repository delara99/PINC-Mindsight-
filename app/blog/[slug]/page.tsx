import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, BlogPost } from '@/src/data/blog-posts';
import { ArrowLeft, Clock, Share2, Tag, Calendar } from 'lucide-react';

interface Props {
    params: { slug: string };
}

// 1. Generate Static Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = blogPosts.find(p => p.slug === params.slug);

    if (!post) {
        return {
            title: 'Artigo não encontrado | PINC',
        };
    }

    return {
        title: `${post.title} | Blog PINC`,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            images: [post.image || '/pinc-logo.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
        }
    };
}

// 2. Generate Static Params (for SSG - extremely fast loading)
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default function BlogPostPage({ params }: Props) {
    const post = blogPosts.find(p => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    // JSON-LD for Google Article Rich Snippet
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": [post.image || "https://www.pinc.app.br/pinc-logo.png"],
        "datePublished": post.date,
        "author": [{
            "@type": "Organization", // Or Person
            "name": post.author,
            "url": "https://www.pinc.app.br"
        }],
        "description": post.description
    };

    return (
        <article className="min-h-screen bg-white font-sans text-slate-900 pb-24">
            {/* Inject JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header / Hero */}
            <header className="bg-slate-50 border-b border-slate-100 pt-32 pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-700 mb-8 transition-colors">
                        <ArrowLeft size={16} /> Voltar para o Blog
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">{post.category}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> 5 min leitura</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-8">
                        {post.title}
                    </h1>

                    <p className="text-xl text-slate-600 leading-relaxed border-l-4 border-purple-500 pl-6">
                        {post.description}
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Author Block */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                            {post.author.charAt(0)}
                        </div>
                        <div className="text-sm">
                            <p className="font-bold text-slate-900">Escrito por {post.author}</p>
                            <p className="text-slate-500">Mapeamento & Carreira</p>
                        </div>
                    </div>
                    <button className="text-slate-400 hover:text-purple-600 transition-colors" aria-label="Compartilhar">
                        <Share2 size={20} />
                    </button>
                </div>

                {/* Article Body */}
                {/* Using a prose class for typography defaults would be ideal, but applying custom styles for now */}
                <div
                    className="prose prose-lg prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-purple-600 prose-img:rounded-xl max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                <div className="mt-16 pt-8 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Tópicos Relacionados:</h3>
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors">
                                <Tag size={12} /> {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Box */}
            <div className="max-w-4xl mx-auto px-6 mt-12">
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="relative z-10 flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">Quer descobrir o seu perfil?</h3>
                        <p className="text-slate-300 mb-6">O mapa completo da sua personalidade está a um teste de distância.</p>
                        <Link href="/dashboard" className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-purple-50 transition-colors">
                            Fazer Teste Grátis
                        </Link>
                    </div>
                    <div className="relative z-10 md:w-1/3 opacity-80">
                        {/* Placeholder for visual aid/chart */}
                        <div className="w-32 h-32 rounded-full border-4 border-purple-500/30 flex items-center justify-center mx-auto">
                            <span className="text-4xl">🧬</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
