
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Building2 } from 'lucide-react';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

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

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/business/login');
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Carregando ambiente...</div>;

    const menu = [
        { name: 'Visão Geral', href: '/business/dashboard', icon: LayoutDashboard },
        { name: 'Colaboradores', href: '/business/dashboard/candidates', icon: Users },
        { name: 'Relatórios de Perfil', href: '/business/dashboard/reports', icon: FileText },
        { name: 'Configurações', href: '/business/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <div className="bg-slate-900 text-white p-1 rounded font-bold text-lg">PINC</div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business</span>
                </div>

                <div className="p-4 flex items-center gap-3 bg-slate-50 mx-4 mt-4 rounded-lg border border-slate-100">
                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">
                        <Building2 size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-400 uppercase">Empresa</div>
                        <div className="text-sm font-bold text-slate-900 truncate">Minha Empresa</div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menu.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <item.icon size={18} opacity={active ? 1 : 0.7} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={18} />
                        Sair
                    </button>
                    <div className="mt-4 px-3 text-xs text-slate-400">
                        Logado como <strong>{user.name}</strong>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
