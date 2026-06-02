'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

type ScrollableTableProps = {
    children: ReactNode;
    className?: string;
};

const compactTableClass = [
    'overflow-x-auto scrollbar-thin scrollbar-thumb-border-subtle hover:scrollbar-thumb-muted-text',
    '[&_table]:w-full [&_table]:min-w-max',
    '[&_th]:!px-4 [&_th]:!py-2 [&_th]:!text-xs [&_th]:!tracking-wide',
    '[&_td]:!px-4 [&_td]:!py-2.5 [&_td]:!text-sm',
    '[&_td_span]:!text-sm [&_td_div]:!text-sm [&_td_button]:!text-xs',
    '[&_td>span]:block [&_td>span]:max-w-48 [&_td>span]:truncate',
    '[&_td_.text-lg]:!text-sm [&_td_.text-xl]:!text-sm',
].join(' ');

export default function ScrollableTable({ children, className = '' }: ScrollableTableProps) {
    const topRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const syncingRef = useRef(false);
    const [scrollWidth, setScrollWidth] = useState(0);

    useEffect(() => {
        const body = bodyRef.current;
        if (!body) return;

        const updateWidth = () => setScrollWidth(body.scrollWidth);
        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(body);
        if (body.firstElementChild) observer.observe(body.firstElementChild);

        return () => observer.disconnect();
    }, [children]);

    const syncScroll = (source: 'top' | 'body') => {
        if (syncingRef.current) return;
        const top = topRef.current;
        const body = bodyRef.current;
        if (!top || !body) return;

        syncingRef.current = true;
        if (source === 'top') {
            body.scrollLeft = top.scrollLeft;
        } else {
            top.scrollLeft = body.scrollLeft;
        }
        requestAnimationFrame(() => {
            syncingRef.current = false;
        });
    };

    return (
        <div className="min-w-0">
            <div
                ref={topRef}
                onScroll={() => syncScroll('top')}
                className="h-4 overflow-x-auto overflow-y-hidden border-b border-border-subtle bg-black/5 dark:bg-white/5 scrollbar-thin scrollbar-thumb-border-subtle hover:scrollbar-thumb-muted-text"
                aria-label="Table horizontal scroll"
            >
                <div style={{ width: scrollWidth, height: 1 }} />
            </div>
            <div
                ref={bodyRef}
                onScroll={() => syncScroll('body')}
                className={`${compactTableClass} ${className}`}
            >
                {children}
            </div>
        </div>
    );
}
