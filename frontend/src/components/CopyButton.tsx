'use client';

import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
    value?: string | null;
    label?: string;
}

const fallbackCopy = (value: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!copied) throw new Error('Copy command failed');
};

export default function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (!value) return null;

    const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
            } else {
                fallbackCopy(value);
            }

            setCopied(true);
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setCopied(false), 1400);
        } catch (error) {
            console.error('Failed to copy text', error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-text transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            title={copied ? 'Copied' : label}
            aria-label={copied ? 'Copied' : label}
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}
