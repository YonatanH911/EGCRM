'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ColumnFilter from '@/components/ColumnFilter';
import { Plus, Trash2, Activity, Loader2, Settings, Check, X, Search } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';
import { ColumnFilters, matchesColumnFilters } from '@/lib/columnFilters';
import SortControl from '@/components/SortControl';
import { compareSortValues, dateSortValue, SortDirection } from '@/lib/sorting';
import InactiveToggle from '@/components/InactiveToggle';

interface TaskType { id: number; name: string; color: string; }
interface ActivityRecord {
    id: number; task_type_id: number | null; task_type?: TaskType; subject: string;
    regarding: string | null; start_date: string | null; due_date: string | null;
    notes: string | null; created_at: string; is_active?: boolean;
}

function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

const thCls = "min-w-0 px-3 py-2 ltr:text-left rtl:text-right text-sm font-semibold text-muted-text uppercase";
const inputCls = "w-full px-3 py-2 text-xl rounded-lg text-foreground bg-background-subtle border border-border-subtle focus:border-crm-500 focus:outline-none";
const columns = [
    { key: 'type', label: 'Type', heading: 'Type', width: '14%' },
    { key: 'subject', label: 'Subject', heading: 'Subject', width: '33%' },
    { key: 'regarding', label: 'Regarding', heading: 'Regarding', width: '22%' },
    { key: 'sentOn', label: 'Sent on', heading: 'Sent', width: '13%' },
    { key: 'dueDate', label: 'Due Date', heading: 'Due', width: '13%' },
] as const;

// Simple helper to convert hex to rgba with 0.15 opacity for badges
function hexToRgba(hex: string, alpha: number = 0.15) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ActivitiesPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('due_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showInactive, setShowInactive] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
    const { isRTL } = usePreferences();

    // Modal state
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeColor, setNewTypeColor] = useState('#6366f1');
    const [savingType, setSavingType] = useState(false);

    const fetchData = async () => {
        try {
            const [actRes, typesRes] = await Promise.all([
                api.get('/activities'),
                api.get('/task-types')
            ]);
            setActivities(actRes.data);
            setTaskTypes(typesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this activity?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/activities/${id}`);
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch (err) { console.error(err); }
        finally { setDeletingId(null); }
    };

    const handleCreateType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        setSavingType(true);
        try {
            const res = await api.post('/task-types', { name: newTypeName.trim(), color: newTypeColor });
            setTaskTypes(prev => [...prev, res.data].sort((a,b) => a.name.localeCompare(b.name)));
            setNewTypeName('');
            setNewTypeColor('#6366f1');
            // Re-fetch activities just in case to synchronize
            const actRes = await api.get('/activities');
            setActivities(actRes.data);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create task type');
        } finally {
            setSavingType(false);
        }
    };

    const handleDeleteType = async (id: number) => {
        if (!confirm('Delete this task type? Activities using it will lose their type assignment.')) return;
        try {
            await api.delete(`/task-types/${id}`);
            setTaskTypes(prev => prev.filter(t => t.id !== id));
            if (filter === id) setFilter('All');
            // Re-fetch activities to reflect nullified task_type_id
            const actRes = await api.get('/activities');
            setActivities(actRes.data);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete task type');
        }
    };

    const filtered = activities.filter(activity => {
        const matchesActive = showInactive || activity.is_active !== false;
        const matchesType = filter === 'All' || activity.task_type_id === filter;
        const query = searchQuery.trim().toLocaleLowerCase();
        const matchesSearch = !query || [
            activity.task_type?.name || 'Unassigned',
            activity.subject,
            activity.regarding,
            activity.notes,
            fmt(activity.start_date),
            fmt(activity.due_date),
        ].some(value => String(value || '').toLocaleLowerCase().includes(query));
        const matchesColumns = matchesColumnFilters(columnFilters, {
            type: activity.task_type?.name || 'Unassigned',
            subject: activity.subject,
            regarding: activity.regarding,
            sentOn: fmt(activity.start_date),
            dueDate: fmt(activity.due_date),
        });
        return matchesActive && matchesType && matchesSearch && matchesColumns;
    });

    const sortedActivities = [...filtered].sort((a, b) => {
        if (sortBy === 'start_date') {
            return compareSortValues(dateSortValue(a.start_date), dateSortValue(b.start_date), sortDirection);
        }
        if (sortBy === 'due_date') {
            return compareSortValues(dateSortValue(a.due_date), dateSortValue(b.due_date), sortDirection);
        }
        return compareSortValues(dateSortValue(a.created_at), dateSortValue(b.created_at), sortDirection);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold text-foreground">Activities</h1>
                        <p className="text-lg text-muted-text">{activities.length} total activities</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsManageModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-xl font-semibold text-muted-text border border-border-subtle rounded-xl hover:bg-background-subtle transition-all">
                        <Settings className="w-4 h-4" /> Manage Types
                    </button>
                    <Link href="/dashboard/activities/new"
                        className="flex items-center gap-2 px-4 py-2 text-xl font-semibold text-white rounded-xl bg-crm-500 hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-transform hover:-translate-y-0.5 duration-200">
                        <Plus className="w-4 h-4" /> New Activity
                    </Link>
                </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap items-center">
                <button onClick={() => setFilter('All')}
                    className={`px-3.5 py-1.5 rounded-full text-lg font-bold transition-all duration-200 border ${filter === 'All' ? 'bg-crm-500 border-crm-500 text-white shadow-lg shadow-crm-500/20' : 'bg-background-subtle border-border-subtle text-muted-text hover:bg-background-subtle/80 hover:text-foreground'}`}
                >
                    All Activities
                </button>
                {taskTypes.map(t => {
                    const isActive = filter === t.id;
                    return (
                        <button key={t.id} onClick={() => setFilter(t.id)}
                            style={{
                                backgroundColor: isActive ? t.color : 'transparent',
                                borderColor: isActive ? t.color : 'var(--border-subtle)',
                                color: isActive ? '#fff' : 'var(--muted-text)',
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-lg font-bold transition-all duration-200 border ${isActive ? 'shadow-lg' : 'bg-background-subtle hover:bg-background-subtle/80'}`}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-3">
                    <div className="relative min-w-[220px] flex-[1_1_260px]">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={event => setSearchQuery(event.target.value)}
                            placeholder="Search activities..."
                            className="w-full rounded-xl border border-black/5 bg-black/5 py-2 text-xl text-foreground placeholder-muted-text outline-none transition-all ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10 dark:border-white/5 dark:bg-white/5"
                        />
                    </div>
                    <SortControl
                        value={sortBy}
                        onChange={setSortBy}
                        direction={sortDirection}
                        onDirectionChange={setSortDirection}
                        options={[
                            { value: 'created_at', label: 'Date Created' },
                            { value: 'start_date', label: 'Start Date' },
                            { value: 'due_date', label: 'Due Date' },
                        ]}
                    />
                    <InactiveToggle
                        checked={showInactive}
                        onChange={setShowInactive}
                        label="Show inactive activities?"
                    />
                </div>
                <div className="min-w-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
                        </div>
                    ) : sortedActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-background-subtle flex items-center justify-center mb-4 border border-border-subtle shadow-inner">
                                <Activity className="w-8 h-8 text-muted-text opacity-50" />
                            </div>
                            <p className="font-bold text-foreground">No activities found</p>
                            <p className="text-xl mt-1 text-muted-text max-w-[250px]">Track your tasks and appointments by adding a new one.</p>
                            <Link href="/dashboard/activities/new"
                                className="mt-6 px-4 py-2 rounded-xl text-crm-500 font-bold text-xl bg-crm-500/10 hover:bg-crm-500/20 transition-all">
                                New Activity <Plus className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-border-subtle px-3 py-2 lg:hidden">
                            {columns.map(column => (
                                <span key={column.key} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-text">
                                    {column.label}
                                    <ColumnFilter
                                        label={column.label}
                                        value={columnFilters[column.key] || ''}
                                        onChange={value => setColumnFilters(current => ({ ...current, [column.key]: value }))}
                                    />
                                </span>
                            ))}
                        </div>
                        <table className="block w-full text-base lg:table lg:table-fixed">
                            <colgroup className="hidden lg:table-column-group">
                                {columns.map(column => <col key={column.key} style={{ width: column.width }} />)}
                                <col style={{ width: '5%' }} />
                            </colgroup>
                            <thead className="hidden border-b border-border-subtle bg-background-subtle/30 lg:table-header-group">
                                <tr>
                                    {columns.map(column => (
                                        <th key={column.key} className={thCls}>
                                            <div className="flex min-w-0 items-center gap-1">
                                                <span>{column.heading}</span>
                                                <ColumnFilter
                                                    label={column.label}
                                                    value={columnFilters[column.key] || ''}
                                                    onChange={value => setColumnFilters(current => ({ ...current, [column.key]: value }))}
                                                />
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-0" />
                                </tr>
                            </thead>
                            <tbody className="block divide-y divide-border-subtle lg:table-row-group">
                                {sortedActivities.map(activity => {
                                    const tColor = activity.task_type?.color || '#9ca3af';
                                    const tName = activity.task_type?.name || 'Unassigned';
                                    return (
                                        <tr key={activity.id} className="group grid w-full grid-cols-2 gap-x-3 gap-y-1 p-3 transition-colors duration-150 cursor-pointer hover:bg-background-subtle/50 lg:table-row lg:p-0"
                                            onClick={() => router.push(`/dashboard/activities/${activity.id}/edit`)}
                                        >
                                            <td className="col-start-1 row-start-1 min-w-0 lg:table-cell lg:px-3 lg:py-2">
                                                <span className="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold"
                                                    style={{ background: hexToRgba(tColor), color: tColor, border: `1px solid ${hexToRgba(tColor, 0.3)}` }}>
                                                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: tColor }} />
                                                    <span className="min-w-0 truncate">{tName}</span>
                                                </span>
                                            </td>
                                            <td className="col-span-2 min-w-0 font-semibold text-foreground transition-colors group-hover:text-crm-500 lg:table-cell lg:px-3 lg:py-2">
                                                <span className="block line-clamp-2 break-words" title={activity.subject}>{activity.subject}</span>
                                            </td>
                                            <td className="col-span-2 min-w-0 text-muted-text lg:table-cell lg:px-3 lg:py-2">
                                                <span className="block line-clamp-2 break-words" title={activity.regarding || undefined}>{activity.regarding || '—'}</span>
                                            </td>
                                            <td className="min-w-0 whitespace-nowrap text-sm text-muted-text lg:table-cell lg:px-3 lg:py-2">
                                                <span className="mr-1 font-semibold lg:hidden">Sent:</span>{fmt(activity.start_date)}
                                            </td>
                                            <td className="min-w-0 whitespace-nowrap text-sm text-muted-text lg:table-cell lg:px-3 lg:py-2">
                                                <span className="mr-1 font-semibold lg:hidden">Due:</span>{fmt(activity.due_date)}
                                            </td>
                                            <td className="col-start-2 row-start-1 min-w-0 lg:table-cell lg:px-1 lg:py-2">
                                                <div className="flex justify-end opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }} disabled={deletingId === activity.id}
                                                        className="rounded-md p-1.5 text-muted-text transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                                                        title="Delete activity" aria-label="Delete activity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </>
                    )}
                </div>
            </div>

            {/* Manage Task Types Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-background border border-border-subtle shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-subtle">
                            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                                <Settings className="w-5 h-5 text-crm-500" /> Manage Task Types
                            </h2>
                            <button onClick={() => setIsManageModalOpen(false)} className="text-muted-text hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="overflow-y-auto p-6 space-y-6 flex-1">
                            {/* Create New */}
                            <form onSubmit={handleCreateType} className="bg-background-subtle border border-border-subtle p-4 rounded-xl space-y-3">
                                <h3 className="text-lg font-bold text-muted-text uppercase tracking-widest">Create New Type</h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <input type="color" value={newTypeColor} onChange={e => setNewTypeColor(e.target.value)}
                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                        <div className="w-10 h-10 rounded-xl border border-border-subtle shadow-sm cursor-pointer" style={{ backgroundColor: newTypeColor }}></div>
                                    </div>
                                    <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} required
                                        className={inputCls} placeholder="" />
                                    <button type="submit" disabled={savingType || !newTypeName.trim()}
                                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-crm-500 text-white hover:bg-crm-600 disabled:opacity-50 transition-all">
                                        {savingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    </button>
                                </div>
                            </form>

                            {/* Existing List */}
                            <div className="space-y-2 relative">
                                {taskTypes.length === 0 ? (
                                    <p className="text-xl text-center text-muted-text py-4">No task types exist yet.</p>
                                ) : (
                                    taskTypes.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-background-subtle/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-md shadow-sm border border-black/10 dark:border-white/10" style={{ backgroundColor: t.color }}></div>
                                                <span className="text-xl font-bold text-foreground">{t.name}</span>
                                            </div>
                                            {t.name.toLowerCase() !== 'billing' && (
                                                <button onClick={() => handleDeleteType(t.id)} title={`Delete ${t.name}`} className="p-1.5 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
