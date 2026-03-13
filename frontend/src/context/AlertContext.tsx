"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';
import { io } from 'socket.io-client';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AlertMessage {
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: Date;
}

interface AlertContextProps {
    alerts: AlertMessage[];
    addAlert: (alert: Omit<AlertMessage, 'id' | 'timestamp'>) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<AlertMessage[]>([]);

    const addAlert = useCallback((alert: Omit<AlertMessage, 'id' | 'timestamp'>) => {
        const id = Math.random().toString(36).substring(7);
        setAlerts((prev) => [...prev, { ...alert, id, timestamp: new Date() }]);

        // Auto-remove after 5s unless critical
        if (alert.severity !== 'critical') {
            setTimeout(() => removeAlert(id), 5000);
        }
    }, []);

    const removeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const clearAlerts = useCallback(() => setAlerts([]), []);

    useEffect(() => {
        // Global socket listener for alerts
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        socket.on('new_traffic', (data: any) => {
            if (data.classification === 'Malicious' && Math.random() < 0.05) {
                // Simulate occasional critical alerts from malicious traffic
                addAlert({
                    title: 'CRITICAL THREAT DETECTED',
                    message: `Malicious traffic blocked from ${data.sourceIP} on port ${data.destinationPort}`,
                    severity: 'critical'
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [addAlert]);

    return (
        <AlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAlerts }}>
            {children}
            <AlertContainer alerts={alerts} removeAlert={removeAlert} />
        </AlertContext.Provider>
    );
}

export function useAlerts() {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlerts must be used within AlertProvider');
    return context;
}

function AlertContainer({ alerts, removeAlert }: { alerts: AlertMessage[], removeAlert: (id: string) => void }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence>
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-xl backdrop-blur-md ${getSeverityStyles(alert.severity)}`}
                    >
                        <div className="mr-3 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold uppercase tracking-wider">{alert.title}</h4>
                            <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                        </div>
                        <button onClick={() => removeAlert(alert.id)} className="ml-3 opacity-50 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function getSeverityStyles(severity: AlertSeverity) {
    switch (severity) {
        case 'critical': return 'bg-cyber-danger/20 border-cyber-danger text-red-100 cyber-glow-danger';
        case 'high': return 'bg-orange-500/20 border-orange-500 text-orange-100';
        case 'medium': return 'bg-cyber-warning/20 border-cyber-warning text-yellow-100';
        case 'low': return 'bg-cyber-primary/20 border-cyber-primary text-cyan-100 cyber-glow';
    }
}

function getSeverityIcon(severity: AlertSeverity) {
    switch (severity) {
        case 'critical': return <ShieldAlert className="w-5 h-5 text-cyber-danger animate-pulse" />;
        case 'high': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
        case 'medium': return <AlertTriangle className="w-5 h-5 text-cyber-warning" />;
        case 'low': return <Info className="w-5 h-5 text-cyber-primary" />;
    }
}
