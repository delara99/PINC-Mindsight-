'use client';

import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, Building2, User } from 'lucide-react';
import { API_URL } from '../../config/api';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LeadFormModal({ isOpen, onClose }: LeadFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company: '',
        companySize: '', role: '',
        interestsUser: [] as string[],
        interestsBusiness: [] as string[],
        consent: false
    });

    if (!isOpen) return null;

    const handleInterestChange = (type: 'user' | 'business', value: string) => {
        if (type === 'user') {
            setFormData(prev => ({
                ...prev,
                interestsUser: prev.interestsUser.includes(value)
                    ? prev.interestsUser.filter(i => i !== value)
                    : [...prev.interestsUser, value]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                interestsBusiness: prev.interestsBusiness.includes(value)
                    ? prev.interestsBusiness.filter(i => i !== value)
                    : [...prev.interestsBusiness, value]
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.consent) {
            alert('Você precisa concordar com os termos para continuar.');
            return;
        }

        setIsLoading(true);
        try {
            // Using correct API version prefix (/api/v1) configured in backend main.ts
            const res = await fetch(`${API_URL}/api/v1/public/business/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    companySize: formData.companySize,
                    role: formData.role,
                    interests: { user: formData.interestsUser, business: formData.interestsBusiness },
                    consent: formData.consent
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Falha no envio');
            }

            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Ocorreu um erro ao enviar seus dados. Por favor, tente novamente ou entre em contato pelo email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                {isSuccess ? (
                    <div className="p-12 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação Recebida!</h3>
                        <p className="text-slate-600 mb-8 max-w-sm">
                            Nossa equipe de especialistas entrará em contato com você em breve para apresentar como o PINC pode transformar sua organização.
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                ) : (
                    <div className="p-8 md:p-10">
                        <div className="mb-8 border-b border-slate-100 pb-6">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full mb-3 inline-block">Contato Comercial</span>
                            <h2 className="text-3xl font-black text-slate-900 leading-tight">Fale com um Especialista</h2>
                            <p className="text-slate-500 mt-2">Preencha o formulário abaixo para receber um diagnóstico personalizado.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Nome Completo*</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Seu nome"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Email Corporativo*</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Celular*</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="(11) 99999-9999"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Empresa*</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Nome da organização"
                                        value={formData.company}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building2 size={14} /> Porte da Empresa*</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all bg-white text-slate-600 appearance-none"
                                        value={formData.companySize}
                                        onChange={e => setFormData({ ...formData, companySize: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Até 9 colaboradores">Até 9 colaboradores</option>
                                        <option value="De 10 a 49 colaboradores">De 10 a 49 colaboradores</option>
                                        <option value="De 50 a 99 colaboradores">De 50 a 99 colaboradores</option>
                                        <option value="Mais de 100 colaboradores">Mais de 100 colaboradores</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={14} /> Cargo*</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all bg-white text-slate-600 appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Coach/Consultor">Coach/Consultor</option>
                                        <option value="Psicólogo/Pedagogo">Psicólogo/Pedagogo</option>
                                        <option value="Especialista/Analista">Especialista/Analista</option>
                                        <option value="Coordenador">Coordenador</option>
                                        <option value="Gerente/Diretor">Gerente/Diretor</option>
                                        <option value="C-Level/Sócio">C-Level/Sócio</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Para Você:</h4>
                                    {[
                                        'Instrumentos de Diagnósticos',
                                        'Cursos e Certificações',
                                        'Coaching',
                                        'Mentoria de Carreira'
                                    ].map(item => (
                                        <label key={item} className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-5 w-5 appearance-none rounded border border-slate-300 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                                                    checked={formData.interestsUser.includes(item)}
                                                    onChange={() => handleInterestChange('user', item)}
                                                />
                                                <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity" />
                                            </div>
                                            <span className="text-sm text-slate-600 group-hover:text-purple-700 transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Para Empresas:</h4>
                                    {[
                                        'Desenvolvendo pessoas e construindo o futuro',
                                        'Liderança de alta performance',
                                        'Eficácia das equipes com diagnósticos'
                                    ].map(item => (
                                        <label key={item} className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-5 w-5 appearance-none rounded border border-slate-300 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                                                    checked={formData.interestsBusiness.includes(item)}
                                                    onChange={() => handleInterestChange('business', item)}
                                                />
                                                <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity" />
                                            </div>
                                            <span className="text-sm text-slate-600 group-hover:text-purple-700 transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-1 h-5 w-5 appearance-none rounded border border-slate-300 checked:bg-slate-900 checked:border-slate-900 transition-all"
                                        checked={formData.consent}
                                        onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                                    />
                                    <span className="text-xs text-slate-500 leading-relaxed">
                                        Eu concordo em receber comunicações e autorizo o uso dos meus dados. Ao informar meus dados, eu concordo com a <a href="#" className="underline">Política de Privacidade</a> e <a href="#" className="underline">Termos de Uso</a>.
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !formData.consent}
                                className="w-full bg-emerald-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Solicitação'}
                            </button>

                            <p className="text-[10px] text-center text-slate-400">
                                Prometemos não utilizar suas informações de contato para enviar qualquer tipo de SPAM.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
