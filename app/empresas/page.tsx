'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, BarChart3, Users, Building2, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/src/config/api';

export default function BusinessPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        employees: '1-10',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                setSuccess(true);
            } else {
                alert('Erro ao enviar. Tente novamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const scrollToForm = () => {
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Navbar (Custom or Reuse? Reuse Main but adding simple back) */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <img src="/logo-pinc.png" alt="PINC Logo" className="h-10 w-auto object-contain" />
                    </Link>
                    <div className="hidden md:flex items-center gap-8">

                        <button onClick={scrollToForm} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-primary/20">
                            Falar com Vendas
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold uppercase tracking-wider">
                            🚀 Solução Corporativa
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1]">
                            Contratações inteligentes com o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">melhor teste comportamental</span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                            Potencialize suas lideranças e reduza o turnover com a metodologia Big Five validada cientificamente. Tome decisões baseadas em dados, não em intuição.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={scrollToForm} className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                                Falar com um Consultor <ArrowRight size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <span>Mais de 500 empresas confiam</span>
                        </div>
                    </div>
                    <div className="lg:w-1/2 relative lg:h-[600px] flex items-center justify-center">
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10"
                        >
                             <img 
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" 
                                alt="Team Meeting" 
                                className="rounded-3xl shadow-2xl w-full max-w-lg object-cover transform rotate-2 hover:rotate-0 transition-all duration-500"
                            />
                            {/* Floating Analytics Card */}
                            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom duration-1000 delay-300">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Eficiência</p>
                                        <p className="text-xl font-bold text-gray-900">+45% assertividade</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                         {/* Background Blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] -z-10" />
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Por que escolher o PINC Mindsight?</h2>
                        <p className="mt-4 text-lg text-gray-600">Nossa plataforma oferece insights profundos que currículos não mostram.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="text-blue-600" size={32} />,
                                title: "Abordagem Analítica",
                                desc: "Tome decisões baseadas em dados do perfil de seus candidatos, contratando as pessoas certas e reduzindo turnover."
                            },
                            {
                                icon: <Users className="text-purple-600" size={32} />,
                                title: "Entrevistas Assertivas",
                                desc: "Utilize os insights do teste para aprofundar suas entrevistas, conhecendo a fundo o perfil comportamental."
                            },
                            {
                                icon: <Building2 className="text-orange-600" size={32} />,
                                title: "Experiência Centralizada",
                                desc: "Gerencie todos os candidatos e resultados em um único dashboard intuitivo e colaborativo."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100 transition-all duration-300 group">
                                <div className="mb-6 bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section id="contact-form" className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/40 to-transparent" />
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row gap-16 items-center">
                    <div className="md:w-1/2 space-y-8">
                        <h2 className="text-4xl font-bold leading-tight">Pronto para transformar seu RH?</h2>
                        <ul className="space-y-6">
                            {[
                                "Acesso total à plataforma de People Analytics",
                                "Suporte consultivo especializado",
                                "Planos flexíveis para empresas de todos os tamanhos",
                                "Demonstração personalizada gratuita"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-lg text-gray-300">
                                    <div className="bg-blue-600/20 p-1 rounded-full text-blue-400">
                                        <CheckCircle size={20} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:w-1/2 w-full">
                        <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-2xl">
                            {success ? (
                                <div className="text-center py-16 space-y-6">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold">Solicitação Recebida!</h3>
                                    <p className="text-gray-600">
                                        Obrigado pelo interesse. Um de nossos consultores entrará em contato em breve através do email cadastrado.
                                    </p>
                                    <button onClick={() => setSuccess(false)} className="text-primary font-bold hover:underline">
                                        Enviar nova solicitação
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold">Fale com um Especialista</h3>
                                        <p className="text-gray-500 text-sm">Preencha o formulário para receber contato.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Seu nome"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Corporativo</label>
                                            <input 
                                                required
                                                type="email" 
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="voce@empresa.com"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                                            <input 
                                                required
                                                type="tel" 
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="(11) 99999-9999"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho da Empresa</label>
                                            <select 
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                value={formData.employees}
                                                onChange={e => setFormData({...formData, employees: e.target.value})}
                                            >
                                                <option>1-10</option>
                                                <option>11-50</option>
                                                <option>51-200</option>
                                                <option>201-1000</option>
                                                <option>1000+</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Nome da sua empresa"
                                                value={formData.companyName}
                                                onChange={e => setFormData({...formData, companyName: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Solicitar Contato'} <ArrowRight size={20} />
                                    </button>
                                    
                                    <p className="text-xs text-center text-gray-400 mt-4">
                                        Ao clicar, você concorda com nossos Termos de Uso e Política de Privacidade.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
