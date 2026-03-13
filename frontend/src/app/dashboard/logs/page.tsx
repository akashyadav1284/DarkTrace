"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Download, Filter, Search, Ban } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ThreatEvent {
    _id: string;
    attackType: string;
    ipAddress: string;
    severity: string;
    actionTaken: string;
    detectedAt: string;
}

export default function ThreatLogs() {
    const [logs, setLogs] = useState<ThreatEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState('All');
    const [protocolFilter, setProtocolFilter] = useState('All');

    useEffect(() => {
        fetchLogs();

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        socket.on('new_alert', (threat: ThreatEvent) => {
            setLogs(prev => [threat, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/threat/logs`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleManualBlock = async (ip: string) => {
        if (!user || user.role !== 'admin') {
            alert("Requires Admin Clearance");
            return;
        }

        setActionLoading(ip);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/block-ip`,
                { ipAddress: ip, reason: 'Manual block from dashboard' },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            // Optimistically update logs or show success toast
            alert(`IP ${ip} blocked successfully.`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error blocking IP');
        }
        setActionLoading(null);
    };

    const downloadCSV = () => {
        const headers = ['Generated At', 'Attack Type', 'Source IP', 'Severity', 'Action Taken'];
        const rows = logs.map(l => [
            new Date(l.detectedAt).toISOString(),
            l.attackType,
            l.ipAddress,
            l.severity,
            l.actionTaken
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `threat_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.ipAddress.includes(searchTerm) || log.attackType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
        // Mock protocol data for local context (assume logs don't directly have protocol in ThreatEvent model, but we would filter by it if it did)
        // We'll rely on severity and search for the main filtering since protocol is in LiveTraffic.
        return matchesSearch && matchesSeverity;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-cyber-danger tracking-wide flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8" />
                        THREAT LOGS
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Incident reports and automated response actions.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search IP or Attack Type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#03050C] border border-slate-700 text-slate-200 rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-cyber-primary focus:border-cyber-primary text-sm"
                        />
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-[#03050C] border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:border-cyber-primary outline-none"
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <button onClick={downloadCSV} className="p-2 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2 px-4 shadow-sm text-sm">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-cyber-border/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-xs uppercase bg-[#03050C] text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Incident Time</th>
                                <th className="px-6 py-4 font-semibold">Attacker IP</th>
                                <th className="px-6 py-4 font-semibold">Detection Type</th>
                                <th className="px-6 py-4 font-semibold">Severity</th>
                                <th className="px-6 py-4 font-semibold">Action Taken</th>
                                <th className="px-6 py-4 font-semibold text-right">Manual Override</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            <AnimatePresence>
                                {filteredLogs.map((log) => (
                                    <motion.tr
                                        key={log._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-800/20 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono text-slate-400">
                                            {new Date(log.detectedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-200">{log.ipAddress}</td>
                                        <td className="px-6 py-4">{log.attackType}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded inline-block w-20 text-center text-xs font-bold border ${log.severity === 'Critical' ? 'bg-cyber-danger/20 text-cyber-danger border-cyber-danger/30' :
                                                log.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                    log.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                }`}>
                                                {log.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-300 uppercase tracking-wide">{log.actionTaken}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleManualBlock(log.ipAddress)}
                                                disabled={actionLoading === log.ipAddress || log.actionTaken === 'Blocked'}
                                                className={`p-1.5 rounded-lg border transition-colors ${log.actionTaken === 'Blocked'
                                                    ? 'border-slate-800 text-slate-600 bg-slate-900 cursor-not-allowed'
                                                    : 'border-cyber-danger/50 text-cyber-danger hover:bg-cyber-danger hover:text-[#03050C]'
                                                    }`}
                                                title="Block IP Address"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            No threats found matching criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
