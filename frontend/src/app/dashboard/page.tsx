"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, Cpu, Network } from 'lucide-react';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardOverview() {
    const [stats, setStats] = useState({
        totalThreats: 0,
        typeDistribution: [],
        severityDistribution: [],
        activeConnections: 1245
    });

    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        fetchStats();
        
        // Initialize an empty chart array for the rolling window
        const initialChart = Array.from({ length: 20 }, (_, i) => ({
            time: i,
            packets: 0,
        }));
        setTrafficData(initialChart);
        
        fetchHealth();

        // Setup WebSocket for Real-time Chart
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}`);
        
        socket.on('new_traffic', (data: any) => {
            setTrafficData(prev => {
                const newData = [...prev];
                newData.shift(); // Remove oldest
                newData.push({
                    time: new Date().toLocaleTimeString(),
                    packets: data.packetSize / 100 // Scale down arbitrarily for visual purposes
                });
                return newData;
            });
            // Update connection count dynamically (simplification)
            setStats(s => ({...s, activeConnections: (s.activeConnections || 1245) + 1}));
        });

        const interval = setInterval(() => {
            fetchHealth();
        }, 10000);
        
        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/health');
            setHealth(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/threat/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const widgetCards = [
        { title: "Network Status", value: "ONLINE", icon: Network, color: "text-cyber-accent", border: "border-cyber-accent/50" },
        { title: "Total Threats Detected", value: stats.totalThreats.toString(), icon: ShieldAlert, color: "text-cyber-danger", border: "border-cyber-danger/50" },
        { title: "Active Connections", value: (stats as any).activeConnections || "1,245", icon: Activity, color: "text-cyber-primary", border: "border-cyber-primary/50" },
        { 
            title: "ML Model Status", 
            value: (health?.ml_service?.status === 'online' || health?.ml_service?.status === 'Healthy') ? "ACTIVE" : "OFFLINE", 
            icon: Cpu, 
            color: (health?.ml_service?.status === 'online' || health?.ml_service?.status === 'Healthy') ? "text-cyber-secondary" : "text-cyber-danger", 
            border: (health?.ml_service?.status === 'online' || health?.ml_service?.status === 'Healthy') ? "border-cyber-secondary/50" : "border-cyber-danger/50" 
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide">SOC OVERVIEW</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time threat monitoring and network analytics.</p>
                </div>
                <div className="px-4 py-2 rounded-full border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent text-sm font-semibold flex items-center gap-2 cyber-glow">
                    <div className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
                    SYSTEM SECURE
                </div>
            </div>

            {/* Top Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {widgetCards.map((widget, i) => (
                    <div key={i} className={`glass-panel p-6 rounded-xl border-t-2 ${widget.border} flex items-center justify-between`}>
                        <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{widget.title}</p>
                            <h3 className={`text-2xl font-bold ${widget.color}`}>{widget.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg bg-black/20 ${widget.color}`}>
                            <widget.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Network Traffic Trend */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyber-primary" />
                        Network Traffic Flow
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1EC9E8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1EC9E8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#1EC9E8' }}
                                />
                                <Area type="monotone" dataKey="packets" stroke="#1EC9E8" strokeWidth={2} fillOpacity={1} fill="url(#colorPackets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Threat Distribution (Placeholder for Recharts Pie) */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">Threat Type Distribution</h3>
                    {stats.typeDistribution.length > 0 ? (
                        <div className="space-y-4">
                            {stats.typeDistribution.map((threat: any, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300">{threat._id || "Unknown"}</span>
                                    <span className="font-bold text-cyber-danger">{threat.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm pb-10">
                            No recent threats detected
                        </div>
                    )}
                </div>

                {/* System Health */}
                <div className="glass-panel p-6 rounded-xl border border-cyber-border/50">
                    <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                    {health ? (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-400">CPU LOAD</span>
                                    <span className={parseFloat(health.cpu.usagePercent) > 80 ? 'text-cyber-danger' : 'text-cyber-primary'}>{health.cpu.usagePercent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyber-primary" style={{ width: `${health.cpu.usagePercent}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-400">MEMORY USAGE</span>
                                    <span className="text-slate-300">{health.memory.usedGB}GB / {health.memory.totalGB}GB</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyber-secondary" style={{ width: `${health.memory.usagePercent}%` }} />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-700/50 mt-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Database</span>
                                    <span className="text-cyber-accent font-semibold flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />
                                        {health.database.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">ML Engine</span>
                                    <span className="text-cyber-accent font-semibold flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />
                                        {health.ml_service.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 flex justify-center py-6 animate-pulse">Loading health data...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
