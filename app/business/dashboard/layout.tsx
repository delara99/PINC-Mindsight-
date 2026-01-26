"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Building2, BrainCircuit, Menu, X, ChevronRight } from 'lucide-react';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/business/login');
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'TENANT_ADMIN' && parsedUser.role !== 'SUPER_ADMIN') {
                router.push('/business/login?error=no_permission');
            }
            setUser(parsedUser);
        } catch (e) {
            router.push('/business/login');
        }
    }, [router]);

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/business/login');
    };

    if (!user) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Carregando ambiente corporativo...</p>
        </div>
    );

    const menu = [
        { name: 'Visão Geral', href: '/business/dashboard', icon: LayoutDashboard },
        { name: 'Inventário', href: '/business/dashboard/inventory', icon: BrainCircuit },
        { name: 'Colaboradores', href: '/business/dashboard/candidates', icon: Users },
        { name: 'Relatórios de Perfil', href: '/business/dashboard/reports', icon: FileText },
        { name: 'Inteligência de Talento', href: '/business/dashboard/talent', icon: BrainCircuit },
        // { name: 'Configurações', href: '/business/dashboard/settings', icon: Settings },
    ];

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <Image src="/pinc-logo.png" alt="PINC" width={80} height={30} className="object-contain" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 border-l border-slate-300">Business</span>
            </div>

            <div className="p-4">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-white text-purple-700 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                        <Building2 size={18} />
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Organização</div>
                        <div className="text-sm font-bold text-slate-900 truncate">Minha Empresa</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
                {menu.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'}`}
                        >
                            <item.icon size={18} className={active ? "text-purple-300" : "text-slate-400"} />
                            <span className="flex-1">{item.name}</span>
                            {active && <ChevronRight size={14} className="text-slate-500" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                    <LogOut size={16} />
                    Sair
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Image src="/pinc-logo.png" alt="PINC" width={60} height={24} className="object-contain" />
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 bg-slate-100 rounded-lg text-slate-600"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* MOBILE SIDEBAR OVERLAY/DRAWER */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <aside className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left-64 duration-200">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col h-full z-10 shadow-sm">
                <SidebarContent />
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-0 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full w-full">
                <div className="max-w-7xl mx-auto pb-20 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
