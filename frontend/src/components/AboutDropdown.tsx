'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import packageInfo from '../../package.json';

export default function AboutDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(current => !current)}
                className={`relative p-2 transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${isOpen ? 'text-foreground bg-black/5 dark:bg-white/5' : 'text-muted-text hover:text-foreground'}`}
                title="About EGCRM"
                aria-label="About EGCRM"
                aria-expanded={isOpen}
            >
                <Info className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-3 w-72 overflow-hidden rounded-xl border border-border-subtle bg-white shadow-2xl z-50 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-xl font-bold text-foreground">About EGCRM</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-muted-text transition-colors hover:text-foreground"
                            aria-label="Close About"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                        <span className="text-lg text-muted-text">Current version</span>
                        <span className="font-mono text-lg font-semibold text-foreground">
                            v{packageInfo.version}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
