"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart3, TrendingUp, ShieldAlert, Activity } from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell,
    ScatterChart, Scatter, ZAxis
} from 'recharts';

interface TrafficData {
    timestamp: string;
    protocol: string;
    sourceIP: string;
    classification: string;
    threatScore: number;
    destinationPort: number;
}

export default function AnalyticsDashboard() {
    const [trafficData, setTrafficData] = useState<TrafficData[]>([]);

    useEffect(() => {
        // Fetch initial standard history from backend
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/traffic/live`)
            .then(res => setTrafficData(res.data))
            .catch(err => console.error(err));

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        socket.on('new_traffic', (packet: TrafficData) => {
            setTrafficData(prev => {
                const newData = [packet, ...prev];
                if (newData.length > 100) newData.pop();
                return newData;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Derived states for charts
    const history = (() => {
        const timeBuckets: Record<string, number> = {};
        trafficData.forEach(item => {
            const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            timeBuckets[time] = (timeBuckets[time] || 0) + 1;
        });
        return Object.keys(timeBuckets).slice(0, 20).map(time => ({ time, count: timeBuckets[time] })).reverse();
    })();

    const protocolData = (() => {
        const protos: Record<string, number> = {};
        trafficData.forEach(item => {
            protos[item.protocol] = (protos[item.protocol] || 0) + 1;
        });
        return Object.keys(protos).map(name => ({ name, value: protos[name] }));
    })();

    const topIPs = (() => {
        const ipCounts: Record<string, number> = {};
        trafficData.forEach(item => {
            if (item.classification !== 'Normal') {
                ipCounts[item.sourceIP] = (ipCounts[item.sourceIP] || 0) + 1;
            }
        });
        return Object.entries(ipCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ip, count]) => ({ ip, count }));
    })();

    const severityData = (() => {
        const severities: Record<string, number> = { Normal: 0, Suspicious: 0, Malicious: 0 };
        trafficData.forEach(item => {
            const s = item.classification || 'Normal';
            severities[s] = (severities[s] || 0) + 1;
        });
        return Object.keys(severities).map(name => ({ name, value: severities[name] }));
    })();

    const portData = (() => {
        const ports: Record<string, number> = {};
        trafficData.forEach(item => {
            ports[item.destinationPort] = (ports[item.destinationPort] || 0) + 1;
        });
        return Object.entries(ports)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([port, count]) => ({ port, count }));
    })();

    const heatmapData = (() => {
        return trafficData.slice(0, 50).map(item => ({
            x: parseInt(item.sourceIP?.split('.')[3] || '0'), 
            y: item.destinationPort,
            z: item.threatScore || 10,
            name: item.sourceIP
        }));
    })();

    const COLORS = ['#1EC9E8', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-cyber-primary" />
                        THREAT ANALYTICS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Aggregated metrics and statistical visualizations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Traffic Volume"
                    value={history.reduce((acc, curr) => acc + curr.count, 0)}
                    icon={<Activity />}
                    trend="up"
                    trendValue="+12%"
                />
                <StatCard
                    title="Unique Attackers"
                    value={topIPs.length * 12} // Mock multiplier for visual
                    icon={<ShieldAlert />}
                    trend="up"
                    trendValue="+4%"
                />
                <StatCard
                    title="Avg Threat Score"
                    value="64.2"
                    subValue="/ 100"
                    icon={<TrendingUp />}
                    trend="down"
                    trendValue="-2.1"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <NeonPanel className="lg:col-span-2 h-[400px]" title="Attack Frequency (Real-Time)">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1EC9E8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#1EC9E8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" />
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)', borderColor: 'rgba(30, 201, 232, 0.3)' }}
                                itemStyle={{ color: '#1EC9E8' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#1EC9E8" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </NeonPanel>

                <NeonPanel className="h-[400px]" title="Protocol Usage">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={protocolData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {protocolData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)', borderColor: 'rgba(30, 201, 232, 0.3)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                        {protocolData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-sm font-mono text-slate-300">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </NeonPanel>

                <NeonPanel className="lg:col-span-3 h-[400px]" title="Top Attacker IPs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topIPs} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" />
                            <XAxis dataKey="ip" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)', borderColor: 'rgba(30, 201, 232, 0.3)' }}
                                cursor={{ fill: 'rgba(30, 201, 232, 0.1)' }}
                            />
                            <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]}>
                                {topIPs.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : '#F59E0B'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </NeonPanel>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <NeonPanel className="h-[400px]" title="Threat Severity">
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                dataKey="value"
                            >
                                {severityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Normal' ? '#10B981' : entry.name === 'Suspicious' ? '#F59E0B' : '#EF4444'} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4 h-[20%]">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm font-mono text-slate-300">Normal</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm font-mono text-slate-300">Suspicious</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm font-mono text-slate-300">Malicious</span></div>
                    </div>
                </NeonPanel>

                <NeonPanel className="h-[400px]" title="Targeted Ports">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={portData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                            <YAxis dataKey="port" type="category" stroke="#94a3b8" fontSize={12} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)' }} cursor={{ fill: 'rgba(30, 201, 232, 0.1)' }} />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </NeonPanel>

                <NeonPanel className="h-[400px]" title="Network Destination Scatter (Heatmap)">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" />
                            <XAxis type="number" dataKey="x" name="IP Target Subnet" stroke="#94a3b8" fontSize={12} />
                            <YAxis type="number" dataKey="y" name="Port" stroke="#94a3b8" fontSize={12} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Score" />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)' }} />
                            <Scatter name="Network Targets" data={heatmapData} fill="#1EC9E8">
                                {heatmapData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.z > 80 ? '#EF4444' : entry.z > 50 ? '#F59E0B' : '#10B981'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </NeonPanel>
            </div>
        </div>
    );
}
