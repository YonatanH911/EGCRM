'use client';

interface InactiveToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

export default function InactiveToggle({ checked, onChange, label }: InactiveToggleProps) {
    return (
        <label className="flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-black/5 bg-black/5 px-3 text-lg font-semibold text-foreground transition-colors hover:bg-black/10 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
            <input
                type="checkbox"
                checked={checked}
                onChange={event => onChange(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border-subtle accent-crm-500"
            />
            <span>{label}</span>
        </label>
    );
}
