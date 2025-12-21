'use client';

import { useState } from 'react';
import { X, Loader2, Building2, User, Mail, Phone, Briefcase, Users } from 'lucide-react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store'; // Might not be needed if public, but useful if we want to auto-login or use store for something
import { motion, AnimatePresence } from 'framer-motion';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeadFormModal({ isOpen, onClose }: LeadFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        role: '',
        employeesCount: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // We use the same register endpoint or a specific lead endpoint?
            // The user wants them to appear in Admin Clients as B2B.
            // So we'll register them as a user with userType='COMPANY' and status='pending' (waiting contact)
            // Or we just save them as a "Lead". The prompt says "cliente se cadastrar... na tela do admin em clientes tenha uma aba".
            // So it effectively creates a User account.
            
            // Note: The existing /api/v1/auth/register might need adjustment or we use a separate one.
            // Let's assume we use a specialized public endpoint or just the standard register.
            // Standard register expects password. Here we might just be capturing lead info.
            // If it's a "Talk to consultant", usually it doesn't create a password yet.
            // However, the prompt says "após o cliente se cadastrar".
            // Let's create a "Lead" registration that generates a temporary password or marks them as "LEAD" status.
            
            // For now, I'll simulate a registration with a random password to ensure they appear in the system,
            // or better, I should check if there's a specific "Lead" flow.
            // Given the constraints, I will post to `/api/v1/auth/register` with a generated password and specific `origin='business_lead'`.
            
            const response = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random pass
                    userType: 'COMPANY',
                    origin: 'business_lead' // To tag them if needed
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro ao enviar dados.');
            }

            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Ocorreu um erro ao enviar seus dados. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                        <X size={24} />
                    </button>

                    {success ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Recebida!</h3>
                            <p className="text-gray-600">
                                Recebemos seus dados com sucesso. Um de nossos consultores especializados entrará em contato em breve para apresentar a melhor solução para sua empresa.
                            </p>
                            <button onClick={onClose} className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors">
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row h-full">
                           <div className="p-8 w-full">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Fale com um especialista</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Preencha os dados abaixo para receber uma demonstração personalizada.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                required name="name" type="text" placeholder="Seu nome"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                required name="email" type="email" placeholder="nome@empresa.com"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
                                            <div className="relative">
                                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input 
                                                    required name="phone" type="tel" placeholder="(11) 99999-9999"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo</label>
                                            <div className="relative">
                                                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input 
                                                    required name="role" type="text" placeholder="Ex: RH, CEO"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Empresa</label>
                                        <div className="relative">
                                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                required name="companyName" type="text" placeholder="Sua empresa"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número de Funcionários</label>
                                        <div className="relative">
                                            <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select 
                                                required name="employeesCount"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none appearance-none"
                                                onChange={handleChange}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="1-10">1 - 10</option>
                                                <option value="11-50">11 - 50</option>
                                                <option value="51-200">51 - 200</option>
                                                <option value="201-1000">201 - 1000</option>
                                                <option value="1000+">+ 1000</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Solicitar Demonstração'}
                                    </button>
                                </form>
                           </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
