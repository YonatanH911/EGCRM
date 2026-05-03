'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';

export type DropdownOption = {
    value: string;
    label: string;
};

interface SearchableDropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
}

export default function SearchableDropdown({
    value,
    options,
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Type to filter...',
    emptyText = 'No options found',
    className,
    disabled = false,
}: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [menuStyle, setMenuStyle] = useState({ left: 0, top: 0, width: 0, maxHeight: 256 });
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(option => option.value === value);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(normalizedQuery) ||
            option.value.toLowerCase().includes(normalizedQuery)
        );
    }, [options, query]);

    useEffect(() => {
        if (!open) return;
        const updateMenuPosition = () => {
            const rect = rootRef.current?.getBoundingClientRect();
            if (!rect) return;
            const viewportPadding = 12;
            const gap = 8;
            const preferredHeight = 256;
            const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
            const spaceAbove = rect.top - viewportPadding;
            const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
            const maxHeight = Math.max(160, Math.min(preferredHeight, opensAbove ? spaceAbove - gap : spaceBelow - gap));

            setMenuStyle({
                left: rect.left,
                top: opensAbove
                    ? Math.max(viewportPadding, rect.top - maxHeight - gap)
                    : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding),
                width: rect.width,
                maxHeight,
            });
        };

        updateMenuPosition();
        window.setTimeout(() => inputRef.current?.focus(), 0);

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
                setOpen(false);
                setQuery('');
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [open]);

    const selectOption = (nextValue: string) => {
        onChange(nextValue);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={rootRef} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(prev => !prev)}
                className={clsx(
                    'flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60',
                    className
                )}
            >
                <span className={clsx('min-w-0 flex-1 truncate', !selected && 'text-muted-text')}>
                    {selected?.label || placeholder}
                </span>
                <ChevronDown className={clsx('h-4 w-4 flex-shrink-0 text-muted-text transition-transform', open && 'rotate-180')} />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl"
                    style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }}
                >
                    <div className="relative border-b border-border-subtle">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-text outline-none"
                        />
                    </div>
                    <div className="overflow-y-auto py-1" style={{ maxHeight: menuStyle.maxHeight }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const active = option.value === value;
                                return (
                                    <button
                                        key={`${option.value}-${option.label}`}
                                        type="button"
                                        onClick={() => selectOption(option.value)}
                                        className={clsx(
                                            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                                            active
                                                ? 'bg-crm-500/10 text-crm-500'
                                                : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                                        )}
                                    >
                                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                        {active && <Check className="h-4 w-4 flex-shrink-0" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-3 text-sm text-muted-text">{emptyText}</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
