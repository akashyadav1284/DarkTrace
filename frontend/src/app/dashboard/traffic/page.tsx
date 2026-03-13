"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

interface TrafficPacket {
    _id: string;
    sourceIP: string;
    destinationPort: number;
    protocol: string;
    packetSize: number;
    threatScore: number;
    classification: string;
    timestamp: string;
}

export default function LiveTraffic() {
    const [traffic, setTraffic] = useState<TrafficPacket[]>([]);
    const [packetCount, setPacketCount] = useState(0);

    useEffect(() => {
        fetchInitialTraffic();

        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}`);

        socket.on('new_traffic', (data: TrafficPacket) => {
            setTraffic(prev => {
                if (prev.some(p => p._id === data._id)) return prev;
                return [data, ...prev].slice(0, 50);
            });
            setPacketCount(prev => prev + 1);
        });

        // Reset packet count every second to show packets per second (PPS)
        const interval = setInterval(() => {
            setPacketCount(0);
        }, 1000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, []);

    const fetchInitialTraffic = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/traffic/live');
            setTraffic(prev => {
                const existingIds = new Set(prev.map(p => p._id));
                const newItems = res.data.filter((p: TrafficPacket) => !existingIds.has(p._id));
                return [...prev, ...newItems]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 50);
            });
        } catch (err) {
            console.error('Failed to fetch initial traffic', err);
        }
    };

    const getThreatColor = (classification: string) => {
        switch (classification) {
            case 'Malicious': return 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30';
            case 'Suspicious': return 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30';
            default: return 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Activity className="w-8 h-8 text-cyber-primary" />
                        LIVE TRAFFIC FEED
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time socket stream of incoming network packets.</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Traffic Rate</div>
                    <div className="text-2xl font-bold text-cyber-primary flex items-center gap-2">
                        {packetCount} <span className="text-sm font-normal text-slate-400">PPS</span>
                        <div className={`w-3 h-3 rounded-full ${packetCount > 0 ? 'bg-cyber-accent animate-pulse cyber-glow' : 'bg-slate-600'}`} />
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl overflow-hidden border border-cyber-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Timestamp</th>
                                <th className="px-6 py-4 font-semibold">Source IP</th>
                                <th className="px-6 py-4 font-semibold">Protocol</th>
                                <th className="px-6 py-4 font-semibold">Port</th>
                                <th className="px-6 py-4 font-semibold">Size (B)</th>
                                <th className="px-6 py-4 font-semibold">Threat Score</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {traffic.map((packet) => (
                                    <motion.tr
                                        key={packet._id}
                                        initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(30, 201, 232, 0.2)' }}
                                        animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-3 font-mono text-slate-400">
                                            {new Date(packet.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-200">{packet.sourceIP}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-700">
                                                {packet.protocol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-mono">{packet.destinationPort}</td>
                                        <td className="px-6 py-3 font-mono">{packet.packetSize}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${packet.threatScore > 50 ? 'bg-cyber-danger' : packet.threatScore > 20 ? 'bg-cyber-warning' : 'bg-cyber-accent'}`}
                                                        style={{ width: `${Math.min(packet.threatScore, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-400 font-mono">{Math.round(packet.threatScore)}/100</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border ${getThreatColor(packet.classification)}`}>
                                                {packet.classification === 'Malicious' && <ShieldAlert className="w-3 h-3" />}
                                                {packet.classification === 'Suspicious' && <Zap className="w-3 h-3" />}
                                                {packet.classification === 'Normal' && <div className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />}
                                                {packet.classification.toUpperCase()}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {traffic.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Waiting for incoming network packets...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
