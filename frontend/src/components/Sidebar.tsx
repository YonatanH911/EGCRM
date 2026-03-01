'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LayoutDashboard, Users, Building2, Briefcase, Target, LogOut, FileText, Shield, Landmark, Activity } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/dashboard/accounts', icon: Building2 },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Leads', href: '/dashboard/leads', icon: Briefcase },
    { name: 'Contracts', href: '/dashboard/contracts', icon: FileText },
    { name: 'Activities', href: '/dashboard/activities', icon: Activity },
    { name: 'Vaults', href: '/dashboard/vaults', icon: Shield },
    { name: 'Deposits', href: '/dashboard/deposits', icon: Landmark },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ name: string, role: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/users/me/');
                setUser(response.data);
            } catch (err) {
                console.error("Failed to load user profile", err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <aside className="w-64 h-screen flex flex-col text-slate-300 transition-all duration-300 shadow-2xl border-r border-white/5"
            style={{ background: 'linear-gradient(180deg, #0d1117 0%, #111827 100%)' }}>

            {/* Logo */}
            <div className="h-16 flex items-center px-5 gap-3 border-b border-white/5">
                <div className="relative">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <Target className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d1117] animate-pulse" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                    EG<span className="gradient-text">CRM</span>
                </span>
            </div>

            {/* Nav */}
            <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Main Menu</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium relative overflow-hidden",
                                isActive
                                    ? "text-white"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <span className="absolute inset-0 rounded-xl opacity-100"
                                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(59,130,246,0.15))' }} />
                            )}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                                    style={{ background: 'linear-gradient(180deg, #818cf8, #60a5fa)' }} />
                            )}
                            <Icon className={clsx("w-4.5 h-4.5 relative z-10 flex-shrink-0",
                                isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                            <span className="relative z-10">{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            {/* User footer */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center justify-between px-2 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            {user ? user.name.slice(0, 2) : 'US'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{user ? user.name : 'Loading…'}</span>
                            <span className="text-xs text-slate-500 truncate">{user ? user.role : 'Member'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        title="Log out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
