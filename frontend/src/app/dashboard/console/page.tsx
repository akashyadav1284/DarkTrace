"use client";

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal as TerminalIcon } from 'lucide-react';
import { NeonPanel } from '@/components/ui/NeonPanel';

interface LogLine {
    id: string;
    timestamp: string;
    text: string;
    severity: 'info' | 'warn' | 'critical' | 'action';
}

export default function ThreatConsole() {
    const [logs, setLogs] = useState<LogLine[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

        const addLog = (text: string, severity: LogLine['severity']) => {
            const newLog: LogLine = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString(),
                text,
                severity
            };
            setLogs(prev => [...prev.slice(-200), newLog]);
        };

        socket.on('new_traffic', (data: any) => {
            if (data.classification === 'Normal') {
                addLog(`[INFO] Traffic from ${data.sourceIP}:${data.destinationPort} [${data.protocol}]`, 'info');
            } else if (data.classification === 'Suspicious') {
                addLog(`[WARN] Suspicious traffic detected from ${data.sourceIP} (Score: ${data.threatScore})`, 'warn');
            }
        });

        socket.on('new_alert', (data: any) => {
            addLog(`[ALERT] ${data.attackType} from ${data.ipAddress} [Severity: ${data.severity}]`, 'critical');
            if (data.actionTaken === 'Blocked') {
                addLog(`[ACTION] Automatically blocking IP address ${data.ipAddress}`, 'action');
            }
        });

        socket.on('new_ids_alert', (data: any) => {
            addLog(`[IDS] Signature match: ${data.signatureId} - ${data.message} SRC: ${data.sourceIP}`, 'critical');
        });
        
        // Initial boot message
        addLog(`[SYSTEM] Initializing DarkTrace Threat Console terminal...`, 'info');
        addLog(`[SYSTEM] Establishing encrypted uplink to sensors... OK.`, 'info');

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const getLogColor = (severity: string) => {
        switch (severity) {
            case 'info': return 'text-green-400';
            case 'warn': return 'text-yellow-400';
            case 'critical': return 'text-red-500 font-bold';
            case 'action': return 'text-cyber-primary font-bold';
            default: return 'text-slate-300';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <TerminalIcon className="w-8 h-8 text-green-500" />
                        THREAT CONSOLE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Hacker-style stream interface for granular real-time log monitoring.</p>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-green-500 tracking-wider">LIVE STREAM</span>
                </div>
            </div>

            <div className="flex-1 bg-[#050B14] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.05)] relative">
                {/* Scanline overlay effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
                
                <div className="h-[75vh] min-h-[500px] p-6 overflow-y-auto font-mono text-sm leading-relaxed z-0 relative scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                    {logs.map((log) => (
                        <div key={log.id} className="mb-1 hover:bg-white/5 transition-colors px-2 py-0.5 rounded -mx-2 flex gap-3">
                            <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })}]</span>
                            <span className={`${getLogColor(log.severity)} break-words`}>{log.text}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </div>
        </div>
    );
}
