'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
        } else {
            setIsAuthed(true);
        }
    }, [router]);

    if (!isAuthed) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#0d1117' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6" style={{ background: '#0d1117' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
