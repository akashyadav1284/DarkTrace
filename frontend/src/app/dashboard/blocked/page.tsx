"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { ShieldBan, Lock, Unlock, Search, Plus } from 'lucide-react';

interface BlockedIP {
    _id: string;
    ipAddress: string;
    reason: string;
    blockedAt: string;
}

export default function BlockedIPCenter() {
    const { user } = useAuth();
    const token = user?.token;
    const [blocked, setBlocked] = useState<BlockedIP[]>([]);
    const [search, setSearch] = useState('');
    const [ipToBlock, setIpToBlock] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const fetchBlocked = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/admin/blocked', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlocked(res.data);
        } catch (err: any) {
            // Log as warning rather than error to prevent Next.js dev overlay from trapping the UI
            console.log('Failed to fetch blocked IPs or User is not Admin:', err.message);
        }
    };

    useEffect(() => {
        if (token) fetchBlocked();
    }, [token]);

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/admin/block-ip',
                { ipAddress: ipToBlock, reason: reason || 'Manual block' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIpToBlock('');
            setReason('');
            fetchBlocked();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to block IP');
        }
    };

    const handleUnblock = async (ipAddress: string) => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}/api/admin/unblock-ip',
                { ipAddress },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBlocked();
        } catch (err) {
            console.error('Failed to unblock', err);
        }
    };

    const isAdmin = user?.role === 'admin';
    const filtered = blocked.filter(b => b.ipAddress.includes(search) || b.reason.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <ShieldBan className="w-8 h-8 text-cyber-danger" />
                        BLOCKED IP CENTER
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage and monitor network-level IP blocks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {isAdmin && (
                    <NeonPanel className="lg:col-span-1 h-fit" title="MANUAL BLOCK" variant="danger">
                        <form onSubmit={handleBlock} className="space-y-4">
                            {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 tracking-wider">IP ADDRESS</label>
                                <input
                                    type="text"
                                    value={ipToBlock}
                                    onChange={(e) => setIpToBlock(e.target.value)}
                                    placeholder="e.g. 192.168.1.100"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyber-danger transition-colors font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 tracking-wider">REASON</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Malicious probing"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyber-danger transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-cyber-danger/20 hover:bg-cyber-danger/40 text-red-100 border border-cyber-danger/50 py-2 rounded-lg font-bold tracking-wider hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Lock className="w-4 h-4" />
                                ENFORCE BLOCK
                            </button>
                        </form>
                    </NeonPanel>
                )}

                <NeonPanel className={isAdmin ? "lg:col-span-2" : "col-span-1 lg:col-span-3"} title="BLOCKED ENTITIES" variant="primary">
                    <div className="flex items-center gap-3 mb-6 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus-within:border-cyber-primary transition-colors">
                        <Search className="w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search IPs or reasons..."
                            className="w-full bg-transparent border-none text-white outline-none"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">IP Address</th>
                                    <th className="px-6 py-4 font-semibold">Reason</th>
                                    <th className="px-6 py-4 font-semibold">Blocked At</th>
                                    {isAdmin && <th className="px-6 py-4 font-semibold text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-500">
                                            No blocked IPs found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((b) => (
                                        <tr key={b._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-3 font-mono text-cyber-danger font-bold">
                                                <div className="flex items-center gap-2">
                                                    {b.ipAddress}
                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/50 flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" />
                                                        OS SYNCED
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-300">{b.reason}</td>
                                            <td className="px-6 py-3 text-slate-400 font-mono">
                                                {new Date(b.blockedAt).toLocaleString()}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => handleUnblock(b.ipAddress)}
                                                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-end gap-2 ml-auto transition-colors border border-slate-600 hover:border-slate-400"
                                                    >
                                                        <Unlock className="w-3.5 h-3.5" />
                                                        Unblock
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonPanel>
            </div>
        </div>
    );
}
