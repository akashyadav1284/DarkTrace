"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, AlertOctagon, Settings, LogOut, ShieldAlert, Map, Database, ShieldBan, BarChart3, Cpu, Radar, Terminal, Network } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const links = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Live Traffic', href: '/dashboard/traffic', icon: Activity },
        { name: 'Workflow', href: '/dashboard/workflow', icon: Network },
        { name: 'Attack Map', href: '/dashboard/map', icon: Map },
        { name: 'Threat Intel', href: '/dashboard/intelligence', icon: Database },
        { name: 'Threat Console', href: '/dashboard/console', icon: Terminal },
        { name: 'Threat Logs', href: '/dashboard/logs', icon: AlertOctagon },
        { name: 'System Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'ML Insights', href: '/dashboard/ml', icon: Cpu },
        { name: 'IDS Sensors', href: '/dashboard/ids', icon: Radar },
        { name: 'Blocked IPs', href: '/dashboard/blocked', icon: ShieldBan },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, adminOnly: true },
    ];

    return (
        <aside className="w-64 h-screen bg-[#03050C] border-r border-cyber-border flex flex-col pt-6 flex-shrink-0 overflow-y-auto">
            <div className="px-6 mb-10 flex items-center gap-3 cyber-glow text-cyber-primary w-max pb-1 border-b border-cyber-primary/30 mx-6">
                <img src="/logo.svg" alt="DarkTrace Logo" className="w-10 h-10 drop-shadow-[0_0_10px_rgba(255,0,51,0.8)]" />
                <h1 className="text-xl font-bold tracking-wider">DARKTRACE</h1>
            </div>

            <div className="px-6 mb-6">
                <div className="text-xs font-semibold text-slate-500 tracking-wider mb-2">OPERATOR</div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyber-primary/20 border border-cyber-primary flex items-center justify-center text-cyber-primary font-bold">
                        {user?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                        <div className="text-sm text-slate-200">{user?.name || 'Operator'}</div>
                        <div className="text-xs text-cyber-primary">{user?.role?.toUpperCase() || 'USER'}</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {links.map((link) => {
                    if (link.adminOnly && user?.role !== 'admin') return null;

                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link key={link.name} href={link.href}>
                            <div
                                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-cyber-primary/20 to-transparent text-cyber-primary border-y border-r border-y-transparent border-r-transparent border-l-2 border-l-cyber-primary cyber-glow'
                                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 glitch-hover'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{link.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 bg-cyber-primary rounded-r-md"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-cyber-border mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Disconnect</span>
                </button>
            </div>
        </aside>
    );
}
