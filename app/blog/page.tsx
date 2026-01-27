import { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/src/data/blog-posts';
import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Blog PINC | Autoconhecimento, Carreira e Ciência Comportamental',
    description: 'Artigos profundos sobre Big Five, desenvolvimento de carreira, soft skills e a ciência da personalidade. Conteúdo para quem quer evoluir.',
    openGraph: {
        title: 'Blog PINC - A Ciência do Autoconhecimento',
        description: 'Explore nossos guias e artigos sobre inteligência comportamental.',
        images: ['/pinc-logo.png']
    }
};

export default function BlogIndexPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
            {/* HERO SECTION - TYPOGRAPHIC BRUTALISM */}
            <header className="pt-32 pb-20 px-6 border-b border-slate-200 bg-white relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold tracking-wider uppercase mb-6">
                        <BookOpen size={14} />
                        PINC Knowledge
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-slate-900 mb-8 max-w-4xl">
                        A CIÊNCIA DA <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                            SUA MENTE.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
                        Desvendamos o comportamento humano com dados, psicologia e zero "achismo".
                        Guias práticos para sua carreira e vida pessoal.
                    </p>
                </div>

                {/* Abstract background element */}
                <div className="absolute -right-20 top-20 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -z-10 animate-pulse-slow" />
            </header>

            {/* MAIN CONTENT GRID */}
            <main className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {blogPosts.map((post, index) => (
                        <article
                            key={post.slug}
                            className={`group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out ${index === 0 ? 'md:col-span-2 lg:col-span-2 md:flex-row' : ''
                                }`}
                        >
                            {/* Image Placeholder Area */}
                            <div className={`bg-slate-200 relative overflow-hidden ${index === 0 ? 'md:w-1/2 aspect-video md:aspect-auto' : 'aspect-[4/3]'
                                }`}>
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-6xl opacity-20">
                                    PINC
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            {/* Content */}
                            <div className={`p-8 flex flex-col justify-between ${index === 0 ? 'md:w-1/2' : 'flex-1'
                                }`}>
                                <div>
                                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                                        <span className="text-purple-600">{post.category}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {post.date}
                                        </span>
                                    </div>

                                    <h2 className={`font-bold text-slate-900 mb-4 group-hover:text-purple-700 transition-colors ${index === 0 ? 'text-3xl md:text-4xl' : 'text-xl'
                                        }`}>
                                        <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                                            <span className="absolute inset-0 md:static" />
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                                        {post.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:translate-x-2 transition-transform">
                                    Ler Artigo <ArrowRight size={16} />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            {/* NEWSLETTER CTA */}
            <section className="bg-slate-900 py-24 px-6 text-center text-white">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Evolua toda semana.</h2>
                    <p className="text-slate-400 mb-8">Receba insights baseados em dados sobre comportamento e carreira. Sem spam, só ciência.</p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                        <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                            Inscrever-se
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
