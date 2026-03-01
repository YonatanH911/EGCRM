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
        <aside className="w-64 bg-slate-900 h-screen flex flex-col text-slate-300 transition-all duration-300 shadow-xl border-r border-slate-800">
            <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/50">
                <Target className="w-8 h-8 text-crm-500" />
                <span className="text-xl font-bold text-white tracking-tight">EGCRM</span>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main Menu</div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-crm-600/20 text-crm-400"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon className={clsx("w-5 h-5", isActive ? "text-crm-400" : "text-slate-400 group-hover:text-white")} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-crm-600 flex items-center justify-center text-white font-bold text-sm shadow-md uppercase">
                            {user ? user.name.slice(0, 2) : 'US'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-white truncate">{user ? user.name : 'Loading User'}</span>
                            <span className="text-xs text-slate-400 truncate">{user ? user.role : 'Member'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Log out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
