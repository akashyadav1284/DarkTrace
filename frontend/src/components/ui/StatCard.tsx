import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    className?: string;
}

export function StatCard({ title, value, subValue, icon, trend, trendValue, className = '' }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-panel p-6 rounded-xl border border-cyber-border hover:border-cyber-primary/50 transition-all group ${className}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest group-hover:text-cyber-primary transition-colors">
                    {title}
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50 text-cyber-primary">
                    {icon}
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-3xl font-bold text-white tracking-wider">{value}</span>
                <div className="flex items-center gap-2 mt-2">
                    {subValue && <span className="text-sm text-slate-400 font-mono">{subValue}</span>}
                    {trend && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-cyber-danger bg-cyber-danger/10' : trend === 'down' ? 'text-cyber-accent bg-cyber-accent/10' : 'text-slate-400 bg-slate-800'}`}>
                            {trendValue}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
