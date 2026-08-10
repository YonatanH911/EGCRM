'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ListFilter, X } from 'lucide-react';

interface ColumnFilterProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function ColumnFilter({ label, value, onChange }: ColumnFilterProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const active = value.trim().length > 0;

    useEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (!rect) return;
            const width = 272;
            const padding = 12;
            setPosition({
                left: Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding)),
                top: rect.bottom + 8,
            });
        };

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        updatePosition();
        window.setTimeout(() => inputRef.current?.focus(), 0);
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen(current => !current)}
                className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                    active
                        ? 'bg-crm-500/15 text-crm-500'
                        : 'text-muted-text hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10'
                }`}
                title={`Filter ${label}`}
                aria-label={`Filter ${label}`}
                aria-expanded={open}
            >
                <ListFilter className="h-3.5 w-3.5" />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={panelRef}
                    className="fixed z-[9999] w-[272px] rounded-lg border border-border-subtle bg-surface p-3 text-left shadow-2xl"
                    style={position}
                >
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-base font-bold text-foreground">{label}</span>
                        {active && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-text hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                                title={`Clear ${label} filter`}
                                aria-label={`Clear ${label} filter`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={event => onChange(event.target.value)}
                        placeholder="Contains..."
                        className="w-full rounded-lg border border-border-subtle bg-background-subtle px-3 py-2 text-xl font-normal text-foreground placeholder-muted-text outline-none focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                    />
                </div>,
                document.body,
            )}
        </>
    );
}
