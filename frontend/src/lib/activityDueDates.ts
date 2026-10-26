export type ActivityDueDatePeriod =
    | ''
    | 'overdue'
    | 'today_or_earlier'
    | 'tomorrow_or_earlier'
    | 'next_7_days_or_earlier'
    | 'next_30_days_or_earlier';

export const ACTIVITY_DUE_DATE_OPTIONS = [
    { value: 'overdue', label: 'Overdue' },
    { value: 'today_or_earlier', label: 'Today or earlier' },
    { value: 'tomorrow_or_earlier', label: 'Tomorrow or earlier' },
    { value: 'next_7_days_or_earlier', label: 'Next 7 days or earlier' },
    { value: 'next_30_days_or_earlier', label: 'Next 30 days or earlier' },
] as const;

const PERIOD_END_DAY_OFFSETS: Record<Exclude<ActivityDueDatePeriod, ''>, number> = {
    overdue: 0,
    today_or_earlier: 1,
    tomorrow_or_earlier: 2,
    next_7_days_or_earlier: 8,
    next_30_days_or_earlier: 31,
};

export function matchesActivityDueDatePeriod(
    value: string | null | undefined,
    period: ActivityDueDatePeriod,
    now: Date = new Date(),
) {
    if (!period) return true;
    if (!value) return false;

    const dueDate = new Date(value);
    if (Number.isNaN(dueDate.getTime())) return false;

    const endExclusive = new Date(now);
    endExclusive.setHours(0, 0, 0, 0);
    endExclusive.setDate(endExclusive.getDate() + PERIOD_END_DAY_OFFSETS[period]);

    return dueDate < endExclusive;
}

export function isActivityOverdue(value: string | null | undefined, now: Date = new Date()) {
    return matchesActivityDueDatePeriod(value, 'overdue', now);
}
