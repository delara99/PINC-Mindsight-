'use client';
import { useState, useEffect } from 'react';
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
    TrendingUp,
    Lock,
    Crown,
    Menu,
    X
} from 'lucide-react';
import clsx from 'clsx';
import { UpgradeModal } from '@/src/components/common/upgrade-modal';
import { motion, AnimatePresence } from 'framer-motion';

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

interface SidebarContentProps {
    user: any;
    pathname: string;
    onLogout: () => void;
    onUpgradeOpen: () => void;
}

function SidebarContent({ user, pathname, onLogout, onUpgradeOpen }: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header / Logo */}
            <div className="p-6 flex items-center justify-center border-b border-gray-50 bg-gray-50/50">
                <img src="/logo.png" alt="PINC" className="h-12 w-auto object-contain" />
            </div>
            {/* User Info */}
            <div className="px-6 pb-6 pt-2 border-b border-gray-50 bg-gray-50/50">
                <h1 className="font-bold text-gray-800 leading-tight truncate">{user?.name || 'Usuário'}</h1>
                <span className="text-xs text-gray-500 font-medium block truncate">{user?.email || 'email@exemplo.com'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${
                    user?.plan === 'PRO' || user?.plan === 'BUSINESS'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                    {(user?.plan === 'PRO' || user?.plan === 'BUSINESS') && <Crown size={10} />}
                    {user?.plan || 'START'}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">Menu Principal</div>
                {menuItems.filter(item => {
                    if (!user) return false;
                    const isSuperAdmin = user.role === 'SUPER_ADMIN';
                    const effectiveRole = (user.userType === 'INDIVIDUAL' && !isSuperAdmin) ? 'MEMBER' : user.role;
                    return item.roles.includes(effectiveRole);
                }).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
                    const isLocked = item.label === 'Minhas Conexões' && user?.plan === 'START' && !isSuperAdmin;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                if (isLocked) {
                                    e.preventDefault();
                                    onUpgradeOpen();
                                }
                            }}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                isLocked && "opacity-75"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className="flex-1">{item.label}</span>
                            {isLocked && <Lock size={16} className="text-gray-400" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                >
                    <LogOut size={20} />
                    Encerrar Sessão
                </button>
            </div>
        </div>
    );
}

export function DashboardSidebar() {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const pathname = usePathname();
    const router = useRouter();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Fechar sidebar mobile ao navegar
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <>
            {/* Mobile Header / Navbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                     <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">SA</span>
                     <span className="font-bold text-gray-800">SaaS Avaliação</span>
                </div>
                <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>
            
            {/* Spacer para o Header Mobile evitar sobreposição */}
            <div className="md:hidden h-16 mb-6" />

            {/* Desktop Sidebar (Fixo, visível apenas em md+) */}
            <aside className="hidden md:flex w-72 h-screen fixed left-0 top-0 border-r border-gray-100 shadow-sm z-30">
                 <SidebarContent 
                    user={user} 
                    pathname={pathname} 
                    onLogout={handleLogout} 
                    onUpgradeOpen={() => setIsUpgradeModalOpen(true)} 
                 />
            </aside>

            {/* Mobile Drawer (Overlay + Animation) */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
                        />
                        
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden shadow-2xl flex flex-col"
                        >
                            <div className="flex justify-end p-2 absolute top-2 right-2 z-10">
                                <button 
                                    onClick={() => setIsMobileOpen(false)}
                                    className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <SidebarContent 
                                user={user} 
                                pathname={pathname} 
                                onLogout={handleLogout} 
                                onUpgradeOpen={() => setIsUpgradeModalOpen(true)} 
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        </>
    );
}
