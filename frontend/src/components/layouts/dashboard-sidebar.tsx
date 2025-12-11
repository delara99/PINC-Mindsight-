'use client';
import Link from 'next/link';
import { useAuthStore } from '@/src/store/auth-store';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    Building2,
    BrainCircuit,
    PlayCircle,
    UserPlus,
    TrendingUp
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, roles: ['TENANT_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
    { label: 'Relatórios', href: '/dashboard/reports', icon: FileText, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Avaliações', href: '/dashboard/assessments', icon: BrainCircuit, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Clientes', href: '/dashboard/clients', icon: Users, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Minhas Conexões', href: '/dashboard/connections', icon: UserPlus, roles: ['TENANT_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
    { label: 'Métricas de Avaliação', href: '/dashboard/metrics-config', icon: TrendingUp, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Configurações', href: '/dashboard/settings', icon: Settings, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Responder', href: '/dashboard/my-assessments', icon: PlayCircle, roles: ['MEMBER'] },
    { label: 'Meus Resultados', href: '/dashboard/my-assessments', icon: FileText, roles: ['MEMBER'] },
];

export function DashboardSidebar() {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const pathname = usePathname();
    const router = useRouter();

    // Debug
    console.log('DashboardSidebar - User:', user);
    console.log('DashboardSidebar - User Role:', user?.role);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 shadow-sm z-30">
            <div className="p-6 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Building2 size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 leading-tight">{user?.name || 'Usuário'}</h1>
                    <span className="text-xs text-gray-500 font-medium">{user?.email || 'email@exemplo.com'}</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">Menu Principal</div>
                {menuItems.filter(item => {
                    if (!user) return false;

                    // Se for Pessoa Física (INDIVIDUAL) e NÃO for Super Admin, visualiza como MEMBRO (Perfil Simplificado)
                    const isSuperAdmin = user.role === 'SUPER_ADMIN';
                    const effectiveRole = (user.userType === 'INDIVIDUAL' && !isSuperAdmin) ? 'MEMBER' : user.role;

                    // Verifica se a role do usuário (ou efetiva) está na lista de roles permitidas
                    return item.roles.includes(effectiveRole);
                }).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                >
                    <LogOut size={20} />
                    Encerrar Sessão
                </button>
            </div>
        </aside>
    );
}
