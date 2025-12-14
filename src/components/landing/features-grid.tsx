'use client';

import { 
    Target, Grid3x3, Users, Shield, FileText, Star, CheckCircle, BrainCircuit, 
    Zap, Layout, BarChart3, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Icon mapping extended for more variety
const iconMap: any = {
    'target': Target,
    'grid': Grid3x3,
    'users': Users,
    'shield': Shield,
    'file-text': FileText,
    'star': Star,
    'check': CheckCircle,
    'brain': BrainCircuit,
    'zap': Zap,
    'layout': Layout,
    'chart': BarChart3,
    'message': MessageSquare
};

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: string;
    highlighted?: boolean; // New prop for special styling
}

interface FeaturesGridProps {
    features: Feature[];
}

export const FeaturesGrid = ({ features }: FeaturesGridProps) => {
    return (
        <section id="features" className="py-24 bg-gray-50 relative overflow-hidden">
             <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Funcionalidades que <span className="text-primary">Transformam</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Uma plataforma completa desenhada para elevar sua gestão de pessoas a um novo patamar
                        de inteligência e eficiência.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => {
                        const IconComponent = iconMap[feature.icon] || Star;
                        const isHighlighted = feature.highlighted;

                        return (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className={`
                                    relative p-8 rounded-3xl transition-all duration-300 group
                                    ${isHighlighted 
                                        ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105 z-10' 
                                        : 'bg-white hover:shadow-xl border border-gray-100 text-gray-900'
                                    }
                                `}
                            >
                                <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-xl transition-all
                                    ${isHighlighted 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-primary/10 text-primary group-hover:scale-110'
                                    }
                                `}>
                                    <IconComponent size={28} />
                                </div>

                                <h3 className={`text-xl font-bold mb-3 ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                                    {feature.title}
                                </h3>
                                
                                <p className={`leading-relaxed ${isHighlighted ? 'text-white/90' : 'text-gray-600'}`}>
                                    {feature.description}
                                </p>

                                {isHighlighted && (
                                    <div className="absolute top-0 right-0 p-6">
                                        <Star className="text-yellow-300 fill-yellow-300 animate-pulse" size={24} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

             </div>
        </section>
    );
};
