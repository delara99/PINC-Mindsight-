'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../src/store/auth-store';
import { API_URL } from '../../../src/config/api';
import {
    LayoutDashboard,
    Type,
    Save,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    Database,
    RefreshCcw,
    Sliders,
    PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface TalkingToMessage {
    id: string;
    key: string;
    group: string;
    description?: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

// --- COMPONENTS ---

const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
    >
        {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">✕</button>
    </motion.div>
);

export default function PincControlCenter() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    // States
    const [activeTab, setActiveTab] = useState<'CONTENT' | 'RULES' | 'CALIBRATION'>('CONTENT');
    const [texts, setTexts] = useState<TalkingToMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [editingText, setEditingText] = useState<TalkingToMessage | null>(null);
    const [saving, setSaving] = useState(false);

    // Notification
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Initial Load
    useEffect(() => {
        if (token) fetchTexts();
    }, [token]);

    const showNotif = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchTexts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/admin/texts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTexts(data);
            } else {
                throw new Error('Falha ao carregar textos');
            }
        } catch (e) {
            console.error(e);
            showNotif('Erro ao carregar dados. Verifique sua conexão ou permissões.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (msg: TalkingToMessage) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/admin/texts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(msg)
            });

            if (res.ok) {
                const updated = await res.json();
                setTexts(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingText(null);
                showNotif('Texto atualizado com sucesso!', 'success');
            } else {
                throw new Error('Erro ao salvar');
            }
        } catch (e) {
            console.error(e);
            showNotif('Erro ao salvar texto.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Filter Logic
    const groups = ['ALL', ...Array.from(new Set(texts.map(t => t.group))).sort()];
    const filteredTexts = texts.filter(t => {
        const matchesSearch = t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesGroup = selectedGroup === 'ALL' || t.group === selectedGroup;

        return matchesSearch && matchesGroup;
    });

    // --- UI SECTIONS ---

    const renderContentTab = () => (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Filter size={14} /> Filtros
                    </h3>

                    <div className="space-y-2">
                        {groups.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedGroup(g)}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedGroup === g
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {g === 'ALL' ? 'Todos os Grupos' : g}
                                {g !== 'ALL' && (
                                    <span className="float-right text-xs opacity-50 bg-white px-2 rounded-full border border-gray-100">
                                        {texts.filter(t => t.group === g).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                        <Database size={16} /> Status do Motor
                    </h4>
                    <p className="text-sm text-blue-600 mb-4">
                        O backend popula o banco automaticamente conforme novos cenários são encontrados.
                    </p>
                    <div className="text-xs font-mono bg-white/50 p-2 rounded text-blue-700">
                        Total de Chaves: <strong>{texts.length}</strong>
                    </div>
                </div>
            </div>

            {/* Main Content List */}
            <div className="flex-1 min-w-0">
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por chave, conteúdo ou descrição..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {filteredTexts.map((text) => (
                                <motion.div
                                    layoutId={text.id}
                                    key={text.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setEditingText(text)}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${text.group === 'DIMENSION' ? 'bg-indigo-100 text-indigo-700' :
                                                    text.group === 'NEEDS' ? 'bg-amber-100 text-amber-700' :
                                                        text.group === 'TEMPLATES' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {text.group}
                                                </span>
                                                <h4 className="font-mono text-sm font-bold text-gray-900 truncate max-w-md" title={text.key}>
                                                    {text.key}
                                                </h4>
                                            </div>
                                            {text.description && (
                                                <p className="text-xs text-gray-400 italic">{text.description}</p>
                                            )}
                                        </div>
                                        <button className="text-gray-300 group-hover:text-purple-600 transition-colors">
                                            <PenTool size={18} />
                                        </button>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                        {text.content}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredTexts.length === 0 && (
                            <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhum texto encontrado para os filtros atuais.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Notification Toast */}
            <AnimatePresence>
                {notification && <Notification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
            </AnimatePresence>

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 pt-8 pb-4 px-8 sticky top-0 z-30 mb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <Sliders className="text-purple-600" />
                                Central de Controle PINC
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">
                                Gerencie a inteligência comportamental, calibrações e narrativas do sistema.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-8 border-b border-gray-200 -mb-4">
                        {[
                            { id: 'CONTENT', label: 'Conteúdo & Narrativas', icon: Type },
                            { id: 'RULES', label: 'Regras do Motor', icon: LayoutDashboard },
                            { id: 'CALIBRATION', label: 'Calibração Fina', icon: RefreshCcw }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 px-2 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-7xl mx-auto px-8 pb-20">
                {activeTab === 'CONTENT' && renderContentTab()}

                {activeTab === 'RULES' && (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className="bg-purple-50 p-6 rounded-full mb-6">
                            <LayoutDashboard size={48} className="text-purple-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Editor de Regras Avançado</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            A interface visual para criação de regras complexas (condicionais if/then) está em desenvolvimento.
                            Atualmente as regras são gerenciadas via script de migração.
                        </p>
                        <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors" disabled>
                            Em Breve
                        </button>
                    </div>
                )}

                {activeTab === 'CALIBRATION' && (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className="bg-purple-50 p-6 rounded-full mb-6">
                            <RefreshCcw size={48} className="text-purple-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ferramentas de Calibração</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Ferramentas para simular perfis em massa e ajustar os thresholds (35/65) estarão disponíveis aqui.
                        </p>
                        <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors" disabled>
                            Em Breve
                        </button>
                    </div>
                )}
            </div>

            {/* EDITING MODAL */}
            <AnimatePresence>
                {editingText && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingText(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                                <div>
                                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${editingText.group === 'DIMENSION' ? 'bg-indigo-100 text-indigo-700' :
                                        editingText.group === 'NEEDS' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {editingText.group}
                                    </div>
                                    <h3 className="font-mono text-lg font-bold text-gray-900 break-all">{editingText.key}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{editingText.description || "Sem descrição"}</p>
                                </div>
                                <button onClick={() => setEditingText(null)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Conteúdo do Texto</label>
                                <textarea
                                    className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-sans text-lg leading-relaxed resize-none bg-gray-50 focus:bg-white transition-all shadow-inner"
                                    value={editingText.content}
                                    onChange={(e) => setEditingText({ ...editingText, content: e.target.value })}
                                    placeholder="Digite o conteúdo aqui..."
                                />
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    Suporta Markdown simples.
                                    {editingText.group === 'TEMPLATES' && <span className="text-amber-600 font-bold ml-1">⚠ Atenção às variáveis {`{brackets}`}</span>}
                                </p>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingText(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSave(editingText)}
                                    disabled={saving}
                                    className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
