"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Settings, Shield, Ban, Users, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettings() {
    const { user } = useAuth();
    const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ips' | 'users'>('ips');
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchBlockedIPs();
            fetchUsers();
        }
    }, [user]);

    const fetchBlockedIPs = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/blocked`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setBlockedIPs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUnblock = async (ipAddress: string) => {
        setLoadingAction(ipAddress);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/unblock-ip`,
                { ipAddress },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            setBlockedIPs(prev => prev.filter(ip => ip.ipAddress !== ipAddress));
        } catch (err) {
            alert("Failed to unblock IP");
        }
        setLoadingAction(null);
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <Shield className="w-16 h-16 text-cyber-danger mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h2>
                <p className="text-slate-400">You require Administrator clearance to view this module.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-8 border-b border-cyber-border pb-6">
                <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                    <Settings className="w-8 h-8 text-cyber-primary" />
                    SYSTEM CONFIGURATION
                </h1>
                <p className="text-slate-400 text-sm mt-1">Manage blocked entities and system operators.</p>
            </div>

            <div className="flex gap-4 mb-6 relative">
                <button
                    onClick={() => setActiveTab('ips')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition-all ${activeTab === 'ips' ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary cyber-glow' : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Ban className="w-4 h-4" /> Blocked IPs
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-cyber-secondary/10 border-cyber-secondary text-cyber-secondary cyber-glow' : 'border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Users className="w-4 h-4" /> System Operators
                </button>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-cyber-border/30">
                {activeTab === 'ips' ? (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-xs uppercase bg-[#03050C] text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">IP Address</th>
                                <th className="px-6 py-4 font-semibold">Ban Reason</th>
                                <th className="px-6 py-4 font-semibold">Time of Ban</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            <AnimatePresence>
                                {blockedIPs.map((ip) => (
                                    <motion.tr key={ip._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-slate-800/20">
                                        <td className="px-6 py-4 font-mono text-slate-200">{ip.ipAddress}</td>
                                        <td className="px-6 py-4 text-slate-400">{ip.reason}</td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{new Date(ip.blockedAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleUnblock(ip.ipAddress)}
                                                disabled={loadingAction === ip.ipAddress}
                                                className="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500 hover:text-white transition-colors"
                                            >
                                                {loadingAction === ip.ipAddress ? 'Processing...' : 'Unblock'}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-xs uppercase bg-[#03050C] text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Operator ID</th>
                                <th className="px-6 py-4 font-semibold">Designation</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Clearance Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-slate-800/20">
                                    <td className="px-6 py-4 font-mono text-slate-500">...{u._id.substring(u._id.length - 6)}</td>
                                    <td className="px-6 py-4 text-slate-200">{u.name}</td>
                                    <td className="px-6 py-4 text-slate-400">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'admin' ? 'bg-cyber-secondary/20 border-cyber-secondary/50 text-cyber-secondary' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
