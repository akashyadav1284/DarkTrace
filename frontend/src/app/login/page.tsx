"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            login(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070B19] relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyber-primary opacity-10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-secondary opacity-15 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 glass-panel rounded-2xl border border-cyber-border z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-cyber-card border border-cyber-border rounded-xl cyber-glow">
                        <Shield className="w-10 h-10 text-cyber-primary" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-2">DARKTRACE SYSTEM</h2>
                <p className="text-center text-slate-400 mb-8 text-sm uppercase tracking-widest">Authorized Personnel Only</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Operator Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[#03050C] border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                                placeholder="operator@darktrace.soc"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Passcode</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#03050C] border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyber-primary hover:bg-cyan-400 text-[#03050C] font-bold py-3 rounded-lg flex items-center justify-center transition-all cyber-glow mt-4"
                    >
                        {loading ? 'AUTHENTICATING...' : 'INITIALIZE UPLINK'}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6 text-sm">
                    No clearance? <a href="/register" className="text-cyber-primary hover:underline">Request access</a>
                </p>
            </motion.div>
        </div>
    );
}
