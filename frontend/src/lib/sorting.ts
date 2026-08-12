export type SortDirection = 'asc' | 'desc';

export type SortValue = string | number | boolean | null | undefined;

export function compareSortValues(a: SortValue, b: SortValue, direction: SortDirection) {
    const aMissing = a === null || a === undefined || a === '' || (typeof a === 'number' && Number.isNaN(a));
    const bMissing = b === null || b === undefined || b === '' || (typeof b === 'number' && Number.isNaN(b));

    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;

    let result: number;
    if (typeof a === 'string' && typeof b === 'string') {
        result = a.localeCompare(b, undefined, { sensitivity: 'base' });
    } else {
        const aValue = typeof a === 'boolean' ? Number(a) : Number(a);
        const bValue = typeof b === 'boolean' ? Number(b) : Number(b);
        result = aValue - bValue;
    }

    return direction === 'asc' ? result : -result;
}

export function dateSortValue(value: string | null | undefined) {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}
