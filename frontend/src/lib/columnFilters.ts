export type ColumnFilters = Record<string, string>;

export const matchesColumnFilters = (
    filters: ColumnFilters,
    values: Record<string, unknown>,
) => Object.entries(filters).every(([key, filter]) => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return true;
    return String(values[key] ?? '').toLocaleLowerCase().includes(query);
});
