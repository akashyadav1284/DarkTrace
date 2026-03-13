"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, User as UserIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/auth/register', { name, email, password });
            setSuccess('Clearance granted. Initializing system...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070B19] relative overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyber-secondary opacity-10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyber-primary opacity-15 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 glass-panel rounded-2xl border border-cyber-border z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-cyber-card border border-cyber-border rounded-xl cyber-glow">
                        <Shield className="w-10 h-10 text-cyber-primary" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-2">NEW OPERATOR</h2>
                <p className="text-center text-slate-400 mb-8 text-sm uppercase tracking-widest">Requesting System Access</p>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-6 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {success}
                    </motion.div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Designation Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-[#03050C] border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                                placeholder="Agent Alpha"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Assigned Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[#03050C] border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                                placeholder="alpha@darktrace.soc"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Secure Passcode</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#03050C] border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-transparent border border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-[#03050C] font-bold py-3 rounded-lg flex items-center justify-center transition-all cyber-glow mt-6"
                    >
                        {loading ? 'PROCESSING...' : 'SUBMIT CLEARANCE'}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6 text-sm">
                    Already have clearance? <a href="/login" className="text-cyber-primary hover:underline">Access terminal</a>
                </p>
            </motion.div>
        </div>
    );
}
