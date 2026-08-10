'use client';

import { useLayoutEffect, useRef } from 'react';

interface AutoResizeTextareaProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    minRows?: number;
}

export default function AutoResizeTextarea({
    value,
    onChange,
    className,
    placeholder,
    minRows = 7,
}: AutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            rows={minRows}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder}
            className={`${className || ''} resize-none overflow-hidden`}
        />
    );
}
