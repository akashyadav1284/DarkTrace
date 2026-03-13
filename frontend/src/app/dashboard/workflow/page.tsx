"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Network, Activity, Brain, ShieldAlert, Fingerprint, Lock, FileText, ArrowRight } from 'lucide-react';
import { NeonPanel } from '@/components/ui/NeonPanel';
import { motion } from 'framer-motion';

const steps = [
    { id: 'capture', label: 'PACKET CAPTURED', icon: Activity },
    { id: 'ml', label: 'ML ANOMALY SCORE', icon: Brain },
    { id: 'classify', label: 'THREAT CLASSIFICATION', icon: Network },
    { id: 'ids', label: 'IDS SENSOR VERIFY', icon: Fingerprint },
    { id: 'firewall', label: 'FIREWALL AUTO-BLOCK', icon: Lock },
    { id: 'log', label: 'INCIDENT LOGGED', icon: FileText }
];

export default function IncidentWorkflow() {
    const [activeStep, setActiveStep] = useState<string>('capture');
    const [lastThreat, setLastThreat] = useState<string | null>(null);

    useEffect(() => {
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')}`);

        socket.on('new_traffic', (data: any) => {
            setActiveStep('capture');
            setTimeout(() => setActiveStep('ml'), 150);
            
            if (data.classification === 'Normal') {
                setTimeout(() => setActiveStep('classify'), 300);
            }
        });

        socket.on('new_alert', (data: any) => {
            setLastThreat(data.ipAddress);
            setActiveStep('classify');
            setTimeout(() => setActiveStep('ids'), 300);
            
            if (data.actionTaken === 'Blocked') {
                setTimeout(() => setActiveStep('firewall'), 700);
                setTimeout(() => setActiveStep('log'), 1100);
            } else {
                setTimeout(() => setActiveStep('log'), 700);
            }
            
            setTimeout(() => {
                setActiveStep('capture');
                setLastThreat(null);
            }, 6000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                        <Network className="w-8 h-8 text-cyber-primary" />
                        AUTOMATED RESPONSE WORKFLOW
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Live tracking of the SOC incident response pipeline.</p>
                </div>
                <div className="flex items-center gap-2 bg-cyber-primary/10 border border-cyber-primary/30 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                    <span className="text-sm font-bold text-cyber-primary tracking-wider">PIPELINE ACTIVE</span>
                </div>
            </div>

            <NeonPanel className="min-h-[60vh] flex flex-col items-center justify-center p-12 overflow-x-auto" variant="primary">
                <div className="h-24 mb-12 flex items-center justify-center w-full">
                    {lastThreat ? (
                        <div className="text-center animate-pulse">
                            <div className="text-sm font-bold text-cyber-danger tracking-widest mb-2 flex items-center justify-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                ACTIVE THREAT TRACKING
                            </div>
                            <div className="text-3xl font-mono text-white bg-red-500/10 border border-red-500/50 px-8 py-3 rounded-lg inline-block cyber-glow-danger">
                                {lastThreat}
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-600 font-mono tracking-widest flex items-center gap-3">
                            <Activity className="w-5 h-5 animate-spin-slow" />
                            AWAITING THREAT DATA
                        </div>
                    )}
                </div>
                
                <div className="flex items-center justify-center min-w-max pb-8 px-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = activeStep === step.id;
                        
                        return (
                            <div key={step.id} className="flex items-center">
                                <motion.div 
                                    className={`relative flex flex-col items-center justify-center w-36 h-36 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'bg-cyber-primary/20 border-cyber-primary cyber-glow scale-110 z-10' : 'bg-slate-900/50 border-slate-700/50 scale-100 opacity-70'}`}
                                >
                                    <Icon className={`w-12 h-12 mb-3 ${isActive ? 'text-cyber-primary' : 'text-slate-500'}`} />
                                    <span className={`text-xs font-bold text-center px-4 tracking-wider leading-relaxed ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div className="flex items-center justify-center w-12 text-slate-700 mx-1">
                                        <ArrowRight className={`w-8 h-8 ${isActive ? 'text-cyber-primary animate-pulse' : ''}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </NeonPanel>
        </div>
    );
}
