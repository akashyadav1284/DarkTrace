"use client";

import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { Map as MapIcon, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatEvent {
    _id: string;
    sourceIP: string;
    classification: string;
    threatScore: number;
    lat: number;
    lng: number;
    timestamp: string;
    country?: string;
    destinationPort?: number;
    protocol?: string;
}

export default function AttackMap() {
    const [attacks, setAttacks] = useState<ThreatEvent[]>([]);
    const [countryStats, setCountryStats] = useState<Record<string, number>>({});
    const [portStats, setPortStats] = useState<Record<string, number>>({});
    const [protocolStats, setProtocolStats] = useState<Record<string, number>>({});

    useEffect(() => {
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}`);

        // Mock server coordinates (e.g., somewhere in central US)
        const serverLocation = { lng: -95.7129, lat: 37.0902 };

        socket.on('new_traffic', (data: any) => {
            if (data.classification === 'Malicious' || data.classification === 'Suspicious') {
                const newAttack: ThreatEvent = {
                    ...data,
                    // Note: In a real app we would use geoip-lite on the backend.
                    // For the simulator, we randomly assign coordinates if not provided.
                    lat: data.lat || (Math.random() * 140 - 70), // Rough global span
                    lng: data.lng || (Math.random() * 360 - 180),
                    country: data.country || 'Unknown',
                    destinationPort: data.destinationPort || 80,
                    protocol: data.protocol || 'TCP',
                    threatScore: data.threatScore || 0
                };

                setAttacks(prev => [newAttack, ...prev].slice(0, 50));
                
                setCountryStats(prev => ({
                    ...prev,
                    [newAttack.country as string]: (prev[newAttack.country as string] || 0) + 1
                }));
                
                setPortStats(prev => ({
                    ...prev,
                    [newAttack.destinationPort as number]: (prev[newAttack.destinationPort as number] || 0) + 1
                }));

                setProtocolStats(prev => ({
                    ...prev,
                    [newAttack.protocol as string]: (prev[newAttack.protocol as string] || 0) + 1
                }));
            }
        });

        // Cleanup stale attacks over time
        const cleanup = setInterval(() => {
            setAttacks(prev => {
                const now = Date.now();
                return prev.filter(a => now - new Date(a.timestamp).getTime() < 10000); // keep for 10s
            });
        }, 2000);

        return () => {
            socket.disconnect();
            clearInterval(cleanup);
        };
    }, []);

    // Server location for lines
    const TARGET = [-95.7129, 37.0902];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <MapIcon className="w-8 h-8 text-cyber-primary" />
                        GLOBAL ATTACK MAP
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time geographical visualization of threat origins.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyber-danger cyber-glow-danger animate-pulse" />
                        <span className="text-sm font-bold text-cyber-danger">LIVE TRACKING</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <NeonPanel className="lg:col-span-3 h-[75vh] relative !p-0 overflow-hidden" variant="primary">
                    {/* Overlay statistics */}
                    <div className="absolute top-6 left-6 z-10 space-y-4">
                        <div className="glass-panel p-4 rounded-lg bg-black/60 border border-cyber-border/50 backdrop-blur-md">
                            <div className="text-xs text-slate-400 font-semibold mb-1 tracking-widest">ACTIVE THREATS</div>
                            <div className="text-3xl font-bold text-cyber-danger">{attacks.length}</div>
                        </div>
                        <div className="glass-panel p-4 rounded-lg bg-black/60 border border-cyber-border/50 backdrop-blur-md">
                            <div className="text-xs text-slate-400 font-semibold mb-1 tracking-widest">CRITICAL RATE</div>
                            <div className="text-xl font-bold text-orange-500">
                                {attacks.length > 0 ? Math.round((attacks.filter(a => a.classification === 'Malicious').length / attacks.length) * 100) : 0}%
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-6 right-6 z-10 space-y-4">
                        <div className="glass-panel p-4 rounded-lg bg-black/60 border border-cyber-border/50 backdrop-blur-md text-right">
                            <div className="text-xs text-slate-400 font-semibold mb-1 tracking-widest">TOP TARGETED PORT</div>
                            <div className="text-2xl font-bold text-cyber-warning">
                                {Object.entries(portStats).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-lg bg-black/60 border border-cyber-border/50 backdrop-blur-md text-right">
                            <div className="text-xs text-slate-400 font-semibold mb-1 tracking-widest">TOP PROTOCOL</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {Object.entries(protocolStats).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <ComposableMap
                        projectionConfig={{ scale: 140 }}
                        style={{ width: "100%", height: "100%", backgroundColor: "#03050C" }}
                    >
                        <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={8}>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="rgba(30, 201, 232, 0.05)"
                                            stroke="rgba(30, 201, 232, 0.2)"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "rgba(30, 201, 232, 0.1)", outline: "none" },
                                                pressed: { outline: "none" },
                                            }}
                                        />
                                    ))
                                }
                            </Geographies>

                            {/* Server Marker */}
                            <Marker coordinates={[TARGET[0], TARGET[1]]}>
                                <circle r={4} fill="#1EC9E8" className="cyber-glow" />
                                <circle r={12} fill="transparent" stroke="#1EC9E8" strokeWidth={1} className="animate-ping" />
                            </Marker>

                            {/* Attack Lines & Markers */}
                            {attacks.map((attack) => {
                                const isCritical = attack.classification === 'Malicious';
                                const color = isCritical ? "#EF4444" : "#F59E0B";

                                return (
                                    <g key={`map-event-${attack._id}`}>
                                        <Line
                                            from={[attack.lng, attack.lat]}
                                            to={[TARGET[0], TARGET[1]] as [number, number]}
                                            stroke={color}
                                            strokeWidth={isCritical ? 1.5 : 1}
                                            strokeLinecap="round"
                                            className="opacity-60"
                                            style={{
                                                strokeDasharray: "4",
                                                animation: "dash 1s linear infinite"
                                            }}
                                        />
                                        <Marker coordinates={[attack.lng, attack.lat]}>
                                            <motion.circle
                                                initial={{ r: 0, opacity: 1 }}
                                                animate={{ r: 20, opacity: 0 }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                fill={color}
                                            />
                                            <circle r={3} fill={color} />
                                        </Marker>
                                    </g>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes dash {
                            to { stroke-dashoffset: -8; }
                        }
                    `}} />
                </NeonPanel>

                <div className="lg:col-span-1 flex flex-col gap-6">
                    <NeonPanel title="TOP TARGETING COUNTRIES" variant="danger" className="flex-1 flex flex-col items-stretch max-h-[38vh]">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-2">
                            {Object.entries(countryStats)
                                .sort((a, b) => b[1] - a[1])
                                .map(([country, count]) => (
                                    <div key={country} className="flex justify-between items-center p-3 rounded bg-slate-800/50 border border-slate-700/50">
                                        <span className="text-slate-200 font-semibold text-sm">{country}</span>
                                        <span className="text-cyber-danger font-mono font-bold text-sm bg-cyber-danger/10 px-2 rounded">{count}</span>
                                    </div>
                                ))}
                            {Object.keys(countryStats).length === 0 && (
                                <div className="text-slate-500 text-sm text-center py-8">
                                    Awaiting threat data...
                                </div>
                            )}
                        </div>
                    </NeonPanel>

                    <NeonPanel title="LIVE THREAT FEED" variant="primary" className="flex-1 flex flex-col items-stretch max-h-[35vh]">
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pt-2">
                            <AnimatePresence mode="popLayout">
                                {attacks.slice(0, 15).map((attack) => (
                                    <motion.div 
                                        key={`feed-${attack._id}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col p-3 rounded bg-black/40 border border-slate-700/50 hover:border-cyber-primary/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-mono font-bold text-sm ${attack.classification === 'Malicious' ? 'text-cyber-danger' : 'text-orange-400'}`}>
                                                {attack.sourceIP}
                                            </span>
                                            <span className="text-cyber-primary font-mono text-xs">
                                                {attack.protocol}:{attack.destinationPort}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-xs">{attack.country}</span>
                                            <span className="text-slate-500 text-xs">{new Date(attack.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </motion.div>
                                ))}
                                {attacks.length === 0 && (
                                    <div className="text-slate-500 text-sm text-center py-6">
                                        Scanning global network...
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </NeonPanel>
                </div>
            </div>
        </div>
    );
}
