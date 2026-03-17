'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Type } from 'lucide-react';
import { usePreferences } from './PreferencesProvider';

export default function SettingsDropdown() {
    const { theme, setTheme, fontSize, setFontSize } = usePreferences();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                title="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-64 rounded-xl shadow-xl overflow-hidden glass-card z-50">
                    <div className="p-4 border-b border-border-subtle bg-background-subtle/50">
                        <h3 className="text-sm font-bold text-foreground">Preferences</h3>
                    </div>

                    <div className="p-2 space-y-1 bg-surface">
                        {/* Theme */}
                        <div className="px-3 py-2">
                            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-2">Theme</label>
                            <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <Sun className="w-3.5 h-3.5" /> Light
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <Moon className="w-3.5 h-3.5" /> Dark
                                </button>
                            </div>
                        </div>


                        {/* Font Size */}
                        <div className="px-3 py-2 border-t border-border-subtle">
                            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-2">Text Size</label>
                            <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => setFontSize('normal')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${fontSize === 'normal' ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <Type className="w-3 h-3" /> Normal
                                </button>
                                <button
                                    onClick={() => setFontSize('large')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${fontSize === 'large' ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                >
                                    <Type className="w-4 h-4" /> Large
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
