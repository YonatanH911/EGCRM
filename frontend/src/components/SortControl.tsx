'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { SortDirection } from '@/lib/sorting';

export type SortOption = {
    value: string;
    label: string;
};

interface SortControlProps {
    value: string;
    onChange: (value: string) => void;
    direction: SortDirection;
    onDirectionChange: (direction: SortDirection) => void;
    options: SortOption[];
}

export default function SortControl({
    value,
    onChange,
    direction,
    onDirectionChange,
    options,
}: SortControlProps) {
    const ascending = direction === 'asc';
    const directionLabel = ascending ? 'Ascending' : 'Descending';

    return (
        <div className="flex w-full items-stretch gap-2 sm:w-auto">
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5 sm:w-64 sm:flex-none">
                <span className="flex-shrink-0 px-3 text-lg font-semibold text-muted-text">Sort by</span>
                <div className="min-w-0 flex-1 border-l border-border-subtle rtl:border-l-0 rtl:border-r">
                    <SearchableDropdown
                        value={value}
                        onChange={onChange}
                        className="min-h-10 px-3 py-2 text-xl text-foreground outline-none"
                        options={options}
                    />
                </div>
            </div>
            <button
                type="button"
                onClick={() => onDirectionChange(ascending ? 'desc' : 'asc')}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-black/5 bg-black/5 text-foreground transition-colors hover:bg-black/10 focus:outline-none focus:ring-4 focus:ring-crm-500/10 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
                title={`${directionLabel} order`}
                aria-label={`Sort ${directionLabel.toLowerCase()}; click to switch direction`}
            >
                {ascending ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
            </button>
        </div>
    );
}
