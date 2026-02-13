'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../src/store/auth-store';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../../src/config/api';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    BrainCircuit,
    PlayCircle,
    UserPlus,
    Lock,
    Crown,
    Menu,
    X,
    Sparkles,
    MessageSquare,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { UpgradeModal } from '../../../src/components/common/upgrade-modal';
import { motion, AnimatePresence } from 'framer-motion';

// --- CRITICAL CORE ACCESS - DO NOT REMOVE OR MODIFY WITHOUT AUTHORIZATION ---
const CRITICAL_ADMIN_ITEMS = [
    {
        label: 'Gerenciar TalkingTO',
        href: '/admin/dashboard/talking-to',
        icon: BrainCircuit,
        roles: ['TENANT_ADMIN', 'SUPER_ADMIN']
    }
];
// ---------------------------------------------------------------------------

const menuItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, roles: ['TENANT_ADMIN', 'SUPER_ADMIN', 'MEMBER'] },
    { label: 'Meu Perfil Comportamental', href: '/dashboard/my-report', icon: BrainCircuit, roles: ['MEMBER'] },
    { label: 'Relatórios', href: '/dashboard/reports', icon: FileText, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'], notificationKey: 'relatorios' },
    { label: 'Avaliações', href: '/dashboard/assessments', icon: BrainCircuit, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Clientes', href: '/dashboard/clients', icon: Users, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'], notificationKey: 'clientes' },
    { label: 'Devolutivas', href: '/dashboard/devolutivas', icon: MessageSquare, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'], premium: true, notificationKey: 'devolutivas' },
    { label: 'Minhas Conexões', href: '/dashboard/connections', icon: UserPlus, roles: ['TENANT_ADMIN', 'SUPER_ADMIN', 'MEMBER'], notificationKey: 'conexoes' },

    // Inserção dos Itens Críticos (Blindados)
    ...CRITICAL_ADMIN_ITEMS,


    { label: 'Configurações', href: '/dashboard/settings', icon: Settings, roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Responder', href: '/dashboard/my-assessments', icon: PlayCircle, roles: ['MEMBER'] },
    { label: 'Meus Resultados', href: '/dashboard/my-assessments', icon: FileText, roles: ['MEMBER'] },
    { label: 'Fale com um Especialista', href: '/dashboard/devolutiva', icon: Sparkles, roles: ['MEMBER'], premium: true },
];

const PROTECTED_LABELS = ['Gerenciar TalkingTO', 'Clientes'];
const SECURITY_PIN = '8813';

interface SidebarContentProps {
    user: any;
    pathname: string;
    onLogout: () => void;
    onUpgradeOpen: () => void;
    notifications?: any;
    onProtectedClick: (href: string) => void;
    isPinVerified: boolean;
}

function SidebarContent({ user, pathname, onLogout, onUpgradeOpen, notifications, onProtectedClick, isPinVerified }: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header / Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-gray-50 bg-gray-50/50">
                <img src="/logo.png" alt="PINC" className="h-8 w-auto object-contain" />
                <div className="h-8 w-px bg-gray-300" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight leading-tight w-24">
                    Inventário de personalidade
                </span>
            </div>
            {/* User Info */}
            <div className="px-6 pb-6 pt-2 border-b border-gray-50 bg-gray-50/50">
                <h1 className="font-bold text-gray-800 leading-tight truncate">{user?.name || 'Usuário'}</h1>
                <span className="text-xs text-gray-500 font-medium block truncate">{user?.email || 'email@exemplo.com'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${user?.plan === 'PRO' || user?.plan === 'BUSINESS'
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
                }).map((item: any) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
                    const isLocked = item.label === 'Minhas Conexões' && user?.plan === 'START' && !isSuperAdmin;
                    const notificationCount = item.notificationKey && notifications ? notifications[item.notificationKey] : 0;
                    const isProtected = PROTECTED_LABELS.includes(item.label);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                if (isLocked) {
                                    e.preventDefault();
                                    onUpgradeOpen();
                                    return;
                                }
                                if (isProtected && !isPinVerified) {
                                    e.preventDefault();
                                    onProtectedClick(item.href);
                                }
                            }}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                isLocked && "opacity-75"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className="flex-1">
                                {item.label}
                                {isProtected && !isPinVerified && (
                                    <Lock size={12} className="inline ml-2 text-gray-300 mb-0.5" />
                                )}
                            </span>
                            {isLocked && <Lock size={16} className="text-gray-400" />}
                            {notificationCount > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
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

function PinModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shaking, setShaking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === SECURITY_PIN) {
            onSuccess();
        } else {
            setError(true);
            setShaking(true);
            setTimeout(() => setShaking(false), 500);
            setPin('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: shaking ? [0, -10, 10, -10, 10, 0] : 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-100"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Área Restrita</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Para sua segurança, confirme o PIN de acesso administrativo para visualizar esta seção.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                if (error) setError(false);
                            }}
                            maxLength={4}
                            autoFocus
                            className={`w-full text-center text-2xl tracking-[0.5em] font-bold py-3 border-2 rounded-xl outline-none transition-all placeholder:tracking-normal
                                ${error
                                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200'
                                    : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                }`}
                            placeholder="••••"
                        />
                        {error && (
                            <p className="text-red-500 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                                <AlertTriangle size={12} /> PIN Incorreto
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-2.5 px-4 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={pin.length < 4}
                                className="py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                            >
                                Validar Acesso
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export function DashboardSidebar() {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const pathname = usePathname();
    const router = useRouter();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // PIN Security State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pendingRoute, setPendingRoute] = useState<string | null>(null);
    const [isPinVerified, setIsPinVerified] = useState(false);

    useEffect(() => {
        // Checar sessão ao carregar
        const verified = sessionStorage.getItem('pinc_admin_pin_verified');
        if (verified === 'true') {
            setIsPinVerified(true);
        }
    }, []);

    const handlePinSuccess = () => {
        setIsPinVerified(true);
        sessionStorage.setItem('pinc_admin_pin_verified', 'true');
        setIsPinModalOpen(false);
        if (pendingRoute) {
            router.push(pendingRoute);
            setPendingRoute(null);
        }
    };

    const handleProtectedClick = (href: string) => {
        setPendingRoute(href);
        setIsPinModalOpen(true);
    };

    // Buscar notificações para admin
    const { data: notifications } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            if (user?.role !== 'TENANT_ADMIN' && user?.role !== 'SUPER_ADMIN') return null;
            const res = await fetch(`${API_URL}/api/v1/notifications/admin/counts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!(user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN'),
        refetchInterval: 30000 // Atualizar a cada 30 segundos
    });

    // Fechar sidebar mobile ao navegar
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            // Limpar sessão do PIN
            sessionStorage.removeItem('pinc_admin_pin_verified');

            // Notifica o backend para remover status online imediatamente
            if (token) {
                await fetch(`${API_URL}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: AbortSignal.timeout(2000)
                }).catch(() => { });
            }
        } catch (e) {
            // Ignora
        } finally {
            logout();
            router.push('/auth/login');
        }
    };

    return (
        <>
            <PinModal
                isOpen={isPinModalOpen}
                onClose={() => {
                    setIsPinModalOpen(false);
                    setPendingRoute(null);
                }}
                onSuccess={handlePinSuccess}
            />

            {/* Mobile Header / Navbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">P</span>
                    <span className="font-bold text-gray-800">PINC</span>
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
                    notifications={notifications}
                    onProtectedClick={handleProtectedClick}
                    isPinVerified={isPinVerified}
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
                                notifications={notifications}
                                onProtectedClick={handleProtectedClick}
                                isPinVerified={isPinVerified}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        </>
    );
}
