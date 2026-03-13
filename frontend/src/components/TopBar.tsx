'use client';

import { Search, Bell, Menu } from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';

export default function TopBar() {
    return (
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-10 glass-card bg-surface/80 border-b border-border-subtle"
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}>
            <div className="flex items-center gap-4 flex-1">
                <button className="lg:hidden text-muted-text hover:text-foreground transition-colors">
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search */}
                <div className="max-w-sm w-full relative hidden md:block">
                    <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3.5 rtl:pr-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-text" />
                    </div>
                    <input
                        type="text"
                        className="block w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2 text-sm rounded-xl leading-5 placeholder-muted-text focus:outline-none transition-all duration-300 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-foreground focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        placeholder="Search accounts, contacts, leads…"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <SettingsDropdown />
                {/* Bell */}
                <button className="relative p-2 text-muted-text hover:text-foreground transition-colors rounded-xl hover:bg-black/5 dark:bg-white/5">
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-glow" />
                </button>
            </div>
        </header>
    );
}
