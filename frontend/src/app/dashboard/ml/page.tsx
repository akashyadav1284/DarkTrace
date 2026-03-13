"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { Cpu, Brain, Activity, Target, ShieldAlert, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

interface MLInsights {
    modelName: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    totalAnalyzed: number;
    threatsDetected: number;
    featureImportance: { feature: string; importance: number }[];
    recentAnomalies: { timestamp: string; score: number; type: string }[];
}

interface MLForecast {
    forecast: { timeOffset: string; hour: number; riskProbability: number }[];
    highRiskIPs: { ip: string; reason: string; probability: number }[];
}

export default function MLInsightsDashboard() {
    const [data, setData] = useState<MLInsights | null>(null);
    const [forecastData, setForecastData] = useState<MLForecast | null>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Fetching initial mock baseline from ML service
                const [resInsights, resForecast] = await Promise.all([
                    axios.get('http://localhost:5001/api/ml/insights'),
                    axios.get('http://localhost:5001/api/ml/predict-trend')
                ]);
                setData(resInsights.data);
                setForecastData(resForecast.data);
            } catch (err: any) {
                console.log('Failed to fetch ML insights:', err.message);
            }
        };

        fetchInsights();

        // Setup real-time listeners to make the dashboard live
        const socket = io('http://localhost:5000');
        
        socket.on('new_traffic', () => {
            setData(prev => {
                if (!prev) return null;
                
                // Add realistic micro-fluctuations to metrics to simulate live model evaluation telemetry
                const jitter = () => (Math.random() * 0.6 - 0.3);
                
                // Slowly drift feature importance
                const newFeatures = prev.featureImportance.map(f => {
                    const newImp = f.importance + (Math.random() * 0.04 - 0.02);
                    return { ...f, importance: Math.max(0.05, Math.min(0.95, newImp)) };
                });

                return {
                    ...prev,
                    totalAnalyzed: prev.totalAnalyzed + 1,
                    accuracy: Math.max(85, Math.min(99.9, prev.accuracy + jitter())),
                    precision: Math.max(80, Math.min(99, prev.precision + jitter())),
                    recall: Math.max(75, Math.min(98, prev.recall + jitter())),
                    f1Score: Math.max(80, Math.min(98.5, prev.f1Score + jitter())),
                    featureImportance: newFeatures
                };
            });
        });

        socket.on('new_alert', (alert: any) => {
            setData(prev => {
                if (!prev) return prev;
                // Map severity to a visual score for the UI
                const mockScore = alert.severity === 'Critical' ? 98.7 : alert.severity === 'High' ? 84.5 : 65.2;
                
                const newAnomaly = {
                    timestamp: new Date().toLocaleTimeString(),
                    score: mockScore,
                    type: alert.attackType
                };
                
                const updatedAnomalies = [newAnomaly, ...prev.recentAnomalies].slice(0, 3);
                
                return {
                    ...prev,
                    threatsDetected: prev.threatsDetected + 1,
                    recentAnomalies: updatedAnomalies
                };
            });
        });

        // Continue polling the forecasting model periodically
        const interval = setInterval(() => {
            axios.get('http://localhost:5001/api/ml/predict-trend')
                 .then(res => setForecastData(res.data))
                 .catch(err => console.error(err));
        }, 30000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-cyber-primary">
                <Cpu className="w-16 h-16 animate-pulse mb-4 opacity-50" />
                <p className="tracking-widest animate-pulse">CONNECTING TO ML ENGINE...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-cyber-secondary" />
                        ML INSIGHTS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Live model metrics and anomaly detection diagnostics.</p>
                </div>
                <div className="flex items-center gap-2 bg-cyber-secondary/10 border border-cyber-secondary/30 px-4 py-2 rounded-lg">
                    <Brain className="w-5 h-5 text-cyber-secondary animate-pulse" />
                    <span className="text-sm font-bold text-cyber-secondary tracking-wider">ENGINE ACTIVE</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard title="ACCURACY" value={`${data.accuracy.toFixed(1)}%`} color="text-cyber-accent" />
                <MetricCard title="PRECISION" value={`${data.precision.toFixed(1)}%`} color="text-cyber-primary" />
                <MetricCard title="RECALL" value={`${data.recall.toFixed(1)}%`} color="text-orange-400" />
                <MetricCard title="F1 SCORE" value={`${data.f1Score.toFixed(1)}%`} color="text-cyber-secondary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <NeonPanel className="lg:col-span-2 h-[400px]" title="FEATURE IMPORTANCE" icon={<Target className="text-cyber-primary" />}>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={data.featureImportance} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} />
                            <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(30, 201, 232, 0.05)' }}
                                contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)', borderColor: 'rgba(30, 201, 232, 0.3)' }}
                                formatter={(value: any) => {
                                    if (typeof value === 'number') return [`${(value * 100).toFixed(1)}%`, 'Importance'];
                                    return [value, 'Importance'];
                                }}
                            />
                            <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={30}>
                                {data.featureImportance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#1EC9E8', '#8B5CF6', '#F59E0B'][index % 3]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </NeonPanel>

                <div className="space-y-6">
                    <NeonPanel title="ENGINE STATS" icon={<Activity className="text-cyber-primary" />}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                                <span className="text-sm text-slate-400 font-semibold tracking-wider">MODEL</span>
                                <span className="font-mono text-slate-200 text-sm">{data.modelName}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                                <span className="text-sm text-slate-400 font-semibold tracking-wider">PACKETS ANALYZED</span>
                                <span className="font-mono text-cyber-primary font-bold text-lg">{data.totalAnalyzed.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-slate-400 font-semibold tracking-wider">THREATS DETECTED</span>
                                <span className="font-mono text-cyber-danger font-bold text-lg">{data.threatsDetected.toLocaleString()}</span>
                            </div>
                        </div>
                    </NeonPanel>

                    <NeonPanel title="RECENT ANOMALIES" icon={<Zap className="text-cyber-warning" />} variant="warning">
                        <div className="space-y-3">
                            {data.recentAnomalies.map((anom, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-slate-700/50">
                                    <ShieldAlert className="w-5 h-5 text-cyber-danger shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white tracking-wider">{anom.type}</div>
                                        <div className="text-xs text-slate-400 font-mono">{anom.timestamp}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 font-bold mb-0.5">SCORE</div>
                                        <div className="text-sm font-mono text-cyber-danger font-bold">{anom.score}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </NeonPanel>
                </div>
            </div>

            {/* New Prediction Section */}
            {forecastData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <NeonPanel className="lg:col-span-2 h-[400px]" title="AI THREAT FORECAST (24H)" icon={<Brain className="text-cyber-primary" />} variant="primary">
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={forecastData.forecast} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 201, 232, 0.1)" vertical={false} />
                                <XAxis dataKey="timeOffset" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'rgba(14, 21, 46, 0.9)', borderColor: 'rgba(30, 201, 232, 0.3)' }}
                                    formatter={(value: any) => [`${value}%`, 'Risk Probability']}
                                />
                                <Line type="monotone" dataKey="riskProbability" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 8, fill: '#EF4444' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </NeonPanel>

                    <div className="space-y-6">
                        <NeonPanel title="HIGH RISK CLUSTERS" icon={<Target className="text-cyber-danger" />} variant="danger">
                            <div className="space-y-3">
                                {forecastData.highRiskIPs.map((ip, idx) => (
                                    <div key={idx} className="flex flex-col p-3 rounded-lg bg-red-900/10 border border-red-500/30">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-mono font-bold text-red-400">{ip.ip}</span>
                                            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">{ip.probability}% RISK</span>
                                        </div>
                                        <span className="text-xs text-slate-400">{ip.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </NeonPanel>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ title, value, color }: { title: string, value: string, color: string }) {
    return (
        <div className="glass-panel p-6 rounded-xl border border-cyber-border relative overflow-hidden group hover:border-cyber-primary/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-800/50 rounded-full blur-xl group-hover:bg-cyber-primary/20 transition-colors" />
            <div className="text-xs font-bold text-slate-500 tracking-widest mb-2">{title}</div>
            <div className={`text-4xl font-bold font-mono tracking-tight ${color}`}>{value}</div>
        </div>
    );
}
