'use client';

import { Search, Bell, Menu } from 'lucide-react';

export default function TopBar() {
    return (
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-10"
            style={{
                background: 'rgba(13, 17, 23, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
            <div className="flex items-center gap-4 flex-1">
                <button className="lg:hidden text-slate-500 hover:text-slate-300 transition-colors">
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search */}
                <div className="max-w-sm w-full relative hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-600" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl leading-5 placeholder-slate-600 focus:outline-none transition-all duration-300"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e2e8f0',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="Search accounts, contacts, leads…"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Bell */}
                <button className="relative p-2 text-slate-500 hover:text-slate-200 transition-colors rounded-xl hover:bg-white/5">
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-glow" />
                </button>
            </div>
        </header>
    );
}
