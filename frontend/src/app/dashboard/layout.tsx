"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#070B19]">
                <div className="w-16 h-16 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#070B19] text-slate-200 selection:bg-cyber-primary/30">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Ambient background blur */}
                <div className="absolute top-0 left-1/2 w-[800px] h-[300px] bg-cyber-primary/5 blur-[150px] -translate-x-1/2 pointer-events-none rounded-full" />

                {/* Main Content Scroll Area */}
                <div className="flex-1 overflow-y-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 max-w-7xl mx-auto w-full z-10 relative"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
