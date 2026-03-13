import { ShieldAlert, Zap, AlertTriangle, Info } from 'lucide-react';

interface AlertBadgeProps {
    severity: 'critical' | 'high' | 'medium' | 'low';
    text?: string;
    className?: string;
}

export function AlertBadge({ severity, text, className = '' }: AlertBadgeProps) {
    const config = {
        critical: { icon: ShieldAlert, color: 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30', defaultText: 'CRITICAL' },
        high: { icon: Zap, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', defaultText: 'HIGH RISK' },
        medium: { icon: AlertTriangle, color: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30', defaultText: 'SUSPICIOUS' },
        low: { icon: Info, color: 'text-cyber-primary bg-cyber-primary/10 border-cyber-primary/30', defaultText: 'INFO' },
    };

    const { icon: Icon, color, defaultText } = config[severity] || config.low;

    return (
        <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border ${color} ${className}`}>
            <Icon className="w-3 h-3" />
            {(text || defaultText).toUpperCase()}
        </div>
    );
}
