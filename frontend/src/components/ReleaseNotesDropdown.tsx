
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Sparkles, CheckCircle2, Layout, Boxes, Database } from 'lucide-react';

export default function ReleaseNotesDropdown() {
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

    const notes = [
        {
            title: 'Dynamic Task Types',
            description: 'You can now create and manage custom activity types with unique colors. Head to the Activities page and click "Manage Types" to get started.',
            icon: Sparkles,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
        },
        {
            title: 'Refined Contract Module',
            description: 'Contracts now feature dedicated "Beneficiary" and "Supplier" contact cubes and a new "Paid By" dropdown in the billing section.',
            icon: Layout,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            title: 'Linked Deposit Suppliers',
            description: 'The Supplier field in Deposits is now a searchable dropdown linked to your Accounts database, ensuring consistent data entry.',
            icon: Boxes,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            title: 'Data Integrity Fixes',
            description: 'Accounts are now correctly imported with their names instead of internal GUIDs. We also added a database cleanup utility for resets.',
            icon: Database,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 transition-all rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${isOpen ? 'text-foreground bg-black/5 dark:bg-white/5' : 'text-muted-text hover:text-foreground'}`}
            >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-surface shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </button>

            {isOpen && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-sm font-bold text-foreground">What's New</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-text hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="max-h-[70vh] overflow-y-auto p-5 space-y-6">
                        {notes.map((note, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${note.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <note.icon className={`w-5 h-5 ${note.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        {note.title}
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <p className="text-xs text-muted-text leading-relaxed">
                                        {note.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-border-subtle text-center">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-text hover:text-foreground transition-colors"
                        >
                            Dismiss All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
