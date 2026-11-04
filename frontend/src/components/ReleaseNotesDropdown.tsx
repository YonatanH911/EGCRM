
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Sparkles, CheckCircle2, Building2, Filter, Phone, Search, Users } from 'lucide-react';
import packageInfo from '../../package.json';

const RELEASE_STORAGE_KEY = 'egcrm:last-read-release';

export default function ReleaseNotesDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHasUnread(window.localStorage.getItem(RELEASE_STORAGE_KEY) !== packageInfo.version);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markReleaseRead = () => {
        window.localStorage.setItem(RELEASE_STORAGE_KEY, packageInfo.version);
        setHasUnread(false);
    };

    const toggleOpen = () => {
        if (!isOpen) markReleaseRead();
        setIsOpen(current => !current);
    };

    const notes = [
        {
            title: 'Contract Accounts',
            description: 'Beneficiary and Supplier titles now select their related accounts directly, replacing the separate Related Account field.',
            icon: Building2,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
        },
        {
            title: 'Inactive-Only Views',
            description: 'The inactive checkbox now switches every supported list from active records to inactive records only.',
            icon: Filter,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            title: 'Consistent Inactive Records',
            description: 'Inactive contacts, contracts, deposits, vaults, activities, and accounts are clearly labeled and can be reactivated from their lists.',
            icon: Users,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            title: 'Contact Phone Fields',
            description: 'Contacts now separate Business Phone and Mobile Phone, with search, filtering, copy controls, and updated Excel data.',
            icon: Phone,
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10',
        },
        {
            title: 'Contract Contact Search',
            description: 'Beneficiary and Supplier contact searches now return unique matching names and display only first and last name when selected.',
            icon: Search,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={`relative p-2 transition-all rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${
                    isOpen
                        ? 'text-foreground bg-black/5 dark:bg-white/5'
                        : hasUnread
                            ? 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.65)]'
                            : 'text-muted-text hover:text-foreground'
                }`}
                title={hasUnread ? `What's new in v${packageInfo.version}` : "What's new"}
                aria-label={hasUnread ? `Unread release notes for version ${packageInfo.version}` : 'Release notes'}
                aria-expanded={isOpen}
            >
                <Bell className={`w-5 h-5 ${hasUnread ? 'animate-pulse' : ''}`} />
                {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-surface" />}
            </button>

            {isOpen && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-3 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-subtle overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-border-subtle bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-xl font-bold text-foreground">What's New</h3>
                            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-mono text-sm font-semibold text-indigo-500">
                                v{packageInfo.version}
                            </span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-text hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="max-h-[70vh] overflow-y-auto p-5 space-y-6 bg-white dark:bg-zinc-900">
                        {notes.map((note, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${note.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                    <note.icon className={`w-5 h-5 ${note.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                        {note.title}
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <p className="text-lg text-muted-text leading-relaxed">
                                        {note.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-border-subtle text-center">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-base font-bold uppercase tracking-widest text-muted-text hover:text-foreground transition-colors"
                        >
                            Dismiss All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
