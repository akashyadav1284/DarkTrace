"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { Radar, ShieldAlert, FileSearch, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdsAlert {
    _id: string;
    timestamp: string;
    sourceIP: string;
    destinationIP: string;
    attackType: string;
    signatureId: string;
    severity: string;
    message: string;
}

export default function IdsDashboard() {
    const [alerts, setAlerts] = useState<IdsAlert[]>([]);

    useEffect(() => {
        // Fetch historical
        const fetchAlerts = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/ids/live');
                console.log('IDS GET Success:', res.data.length);
                setAlerts(res.data);
            } catch (err: any) {
                console.error('Failed to fetch IDS logs:', err.response?.data || err.message);
            }
        };
        fetchAlerts();

        // Listen for live
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}`);
        socket.on('new_ids_alert', (newAlert: IdsAlert) => {
            setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Keep last 100
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30';
            case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
            case 'Medium': return 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30';
            default: return 'text-cyber-primary bg-cyber-primary/10 border-cyber-primary/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Radar className="w-8 h-8 text-cyber-danger" />
                        IDS / IPS SENSORS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Live Intrusion Detection System alerts from Snort/Suricata.</p>
                </div>
                <div className="flex items-center gap-2 bg-cyber-danger/10 border border-cyber-danger/30 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-cyber-danger animate-pulse" />
                    <span className="text-sm font-bold text-cyber-danger tracking-wider">SENSOR ACTIVE</span>
                </div>
            </div>

            <NeonPanel className="min-h-[70vh]" variant="primary">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-sm tracking-wider">
                                <th className="p-4 font-semibold">TIMESTAMP</th>
                                <th className="p-4 font-semibold">SEVERITY</th>
                                <th className="p-4 font-semibold">SIGNATURE ID</th>
                                <th className="p-4 font-semibold">MESSAGE / RULE</th>
                                <th className="p-4 font-semibold">SOURCE IP</th>
                                <th className="p-4 font-semibold">TARGET IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {alerts.length === 0 ? (
                                    <motion.tr 
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={6} className="p-12 text-center text-slate-500 font-mono">
                                            Awaiting Sensor Data...
                                        </td>
                                    </motion.tr>
                                ) : (
                                    alerts.map((alert) => (
                                        <motion.tr
                                            key={alert._id}
                                            initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                            animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                                        >
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300 font-mono">
                                                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getSeverityColor(alert.severity || 'Low')}`}>
                                                    {(alert.severity || 'Low').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-300 font-mono bg-black/30 px-2 py-1 rounded inline-block">
                                                    <Fingerprint className="w-3 h-3 text-slate-500" />
                                                    {alert.signatureId || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-semibold text-white group-hover:text-cyber-primary transition-colors">
                                                    {alert.attackType || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-1">
                                                    {alert.message || 'No details'}
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-sm text-cyber-danger">{alert.sourceIP || 'N/A'}</td>
                                            <td className="p-4 font-mono text-sm text-slate-300">{alert.destinationIP || 'N/A'}</td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </NeonPanel>
        </div>
    );
}
