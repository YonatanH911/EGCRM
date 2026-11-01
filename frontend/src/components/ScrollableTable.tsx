'use client';

import { ReactNode } from 'react';

type ScrollableTableProps = {
    children: ReactNode;
    className?: string;
};

const compactTableClass = [
    'min-w-0 overflow-hidden',
    '[&_table]:block [&_table]:w-full lg:[&_table]:table lg:[&_table]:table-fixed',
    '[&_thead]:block lg:[&_thead]:table-header-group',
    '[&_thead>tr]:flex [&_thead>tr]:flex-wrap [&_thead>tr]:gap-x-3 [&_thead>tr]:gap-y-1 [&_thead>tr]:px-3 [&_thead>tr]:py-2',
    'lg:[&_thead>tr]:table-row lg:[&_thead>tr]:p-0',
    '[&_tbody]:block lg:[&_tbody]:table-row-group',
    '[&_tbody>tr]:grid [&_tbody>tr]:w-full [&_tbody>tr]:grid-cols-2 [&_tbody>tr]:gap-x-3 [&_tbody>tr]:gap-y-1 [&_tbody>tr]:p-3',
    'lg:[&_tbody>tr]:table-row lg:[&_tbody>tr]:p-0',
    '[&_th]:block [&_th]:!p-0 [&_th]:!text-sm [&_th]:!tracking-normal lg:[&_th]:table-cell lg:[&_th]:!px-3 lg:[&_th]:!py-2',
    '[&_td]:block [&_td]:min-w-0 [&_td]:max-w-full [&_td]:overflow-hidden [&_td]:!whitespace-normal [&_td]:!px-0 [&_td]:!py-1 [&_td]:!text-base',
    'lg:[&_td]:table-cell lg:[&_td]:!px-3 lg:[&_td]:!py-2',
    '[&_tbody>tr>td:only-child]:col-span-2',
    '[&_td>a]:min-w-0 [&_td>a]:max-w-full [&_td>a]:overflow-hidden [&_td>a]:!p-0',
    '[&_td_div]:min-w-0 [&_td_div]:max-w-full [&_td_span]:max-w-full',
    '[&_td_.whitespace-nowrap]:!whitespace-normal [&_td_.text-lg]:!text-sm [&_td_.text-xl]:!text-base',
    '[&_td_button]:!text-sm',
].join(' ');

export default function ScrollableTable({ children, className = '' }: ScrollableTableProps) {
    return (
        <div className={`${compactTableClass} ${className}`}>
            {children}
        </div>
    );
}
