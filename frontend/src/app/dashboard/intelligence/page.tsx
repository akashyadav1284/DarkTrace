"use client";

import { useState } from 'react';
import axios from 'axios';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { Database, Search, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntelResult {
    ip: string;
    score: number;
    label: 'Clean' | 'Suspicious' | 'Malicious';
    tags: string[];
    lastSeen: string;
    country: string;
}

export default function ThreatIntelligence() {
    const [ip, setIp] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IntelResult | null>(null);
    const [error, setError] = useState('');

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ip) return;

        // Basic IP format validation
        const cleanIp = ip.trim();
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(cleanIp)) {
            setError('Invalid IP address format');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await axios.get(`http://localhost:5000/api/intelligence/lookup/${ip}`);
            setResult(res.data);
        } catch (err) {
            setError('Failed to fetch intelligence data. The threat intelligence API might be down.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score < 30) return 'text-cyber-primary border-cyber-primary cyber-glow';
        if (score < 70) return 'text-cyber-warning border-cyber-warning';
        return 'text-cyber-danger border-cyber-danger cyber-glow-danger';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Database className="w-8 h-8 text-cyber-primary" />
                        THREAT INTELLIGENCE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Global IP reputation and signature lookup.</p>
                </div>
            </div>

            <NeonPanel title="IP REPUTATION LOOKUP" className="max-w-3xl">
                <form onSubmit={handleLookup} className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="Enter IP address to analyze..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-cyber-primary/20 hover:bg-cyber-primary/40 text-cyan-100 border border-cyber-primary/50 px-8 rounded-lg font-bold tracking-wider hover:cyber-glow transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'ANALYZING...' : 'ANALYZE'}
                    </button>
                </form>

                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3 text-red-200">
                        <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreColor(result.score)} bg-opacity-5 bg-black`}>
                                <div className="text-sm font-semibold tracking-widest mb-2 opacity-80">THREAT SCORE</div>
                                <div className="text-7xl font-bold font-mono">{result.score}</div>
                                <div className="text-sm mt-2 font-mono opacity-60">/ 100</div>
                            </div>

                            <div className="space-y-4">
                                <div className="glass-panel p-4 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 font-semibold tracking-wider mb-1">CLASSIFICATION</div>
                                    <div className="flex items-center gap-2">
                                        {result.label === 'Clean' && <CheckCircle2 className="w-5 h-5 text-cyber-primary" />}
                                        {result.label === 'Suspicious' && <AlertTriangle className="w-5 h-5 text-cyber-warning" />}
                                        {result.label === 'Malicious' && <ShieldAlert className="w-5 h-5 text-cyber-danger" />}
                                        <span className="text-lg font-bold text-white">{result.label.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 rounded-lg border border-slate-700/50">
                                    <div className="text-xs text-slate-500 font-semibold tracking-wider mb-2">KNOWN SIGNATURES</div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.tags.length > 0 ? (
                                            result.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-xs font-mono text-slate-300">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-sm font-italic">No known signatures</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-panel p-4 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-500 font-semibold tracking-wider mb-1">COUNTRY</div>
                                        <div className="text-slate-200">{result.country}</div>
                                    </div>
                                    <div className="glass-panel p-4 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-500 font-semibold tracking-wider mb-1">LAST SEEN</div>
                                        <div className="text-slate-200 font-mono text-sm">{new Date(result.lastSeen).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </NeonPanel>
        </div>
    );
}
