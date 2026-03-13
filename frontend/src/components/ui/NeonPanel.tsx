import { ReactNode } from 'react';

interface NeonPanelProps {
    children: ReactNode;
    title?: string | ReactNode;
    icon?: ReactNode;
    className?: string;
    variant?: 'primary' | 'danger' | 'warning' | 'accent';
}

export function NeonPanel({ children, title, icon, className = '', variant = 'primary' }: NeonPanelProps) {
    const borders = {
        primary: 'border-cyber-primary/30',
        danger: 'border-cyber-danger/30',
        warning: 'border-cyber-warning/30',
        accent: 'border-cyber-accent/30',
    };

    return (
        <div className={`glass-panel p-6 rounded-xl overflow-hidden border ${borders[variant]} ${className}`}>
            {(title || icon) && (
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                    {icon}
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase">{title}</h2>
                </div>
            )}
            {children}
        </div>
    );
}
