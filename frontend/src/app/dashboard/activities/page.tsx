'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Activity, Loader2, Settings, Check, X } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

interface TaskType { id: number; name: string; color: string; }
interface ActivityRecord {
    id: number; task_type_id: number | null; task_type?: TaskType; subject: string;
    regarding: string | null; start_date: string | null; due_date: string | null;
    notes: string | null; created_at: string;
}

function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const thCls = "px-5 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
const inputCls = "w-full px-3 py-2 text-sm rounded-lg text-foreground bg-background-subtle border border-border-subtle focus:border-crm-500 focus:outline-none";

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
    const [deletingId, setDeletingId] = useState<number | null>(null);
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

    const filtered = filter === 'All' ? activities : activities.filter(a => a.task_type_id === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Activities</h1>
                        <p className="text-xs text-muted-text">{activities.length} total activities</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsManageModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-text border border-border-subtle rounded-xl hover:bg-background-subtle transition-all">
                        <Settings className="w-4 h-4" /> Manage Types
                    </button>
                    <Link href="/dashboard/activities/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-crm-500 hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-transform hover:-translate-y-0.5 duration-200">
                        <Plus className="w-4 h-4" /> New Activity
                    </Link>
                </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap items-center">
                <button onClick={() => setFilter('All')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${filter === 'All' ? 'bg-crm-500 border-crm-500 text-white shadow-lg shadow-crm-500/20' : 'bg-background-subtle border-border-subtle text-muted-text hover:bg-background-subtle/80 hover:text-foreground'}`}
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
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${isActive ? 'shadow-lg' : 'bg-background-subtle hover:bg-background-subtle/80'}`}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-subtle">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-background-subtle flex items-center justify-center mb-4 border border-border-subtle shadow-inner">
                                <Activity className="w-8 h-8 text-muted-text opacity-50" />
                            </div>
                            <p className="font-bold text-foreground">No activities found</p>
                            <p className="text-sm mt-1 text-muted-text max-w-[250px]">Track your tasks and appointments by adding a new one.</p>
                            <Link href="/dashboard/activities/new"
                                className="mt-6 px-4 py-2 rounded-xl text-crm-500 font-bold text-sm bg-crm-500/10 hover:bg-crm-500/20 transition-all">
                                New Activity <Plus className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-border-subtle bg-background-subtle/30">
                                <tr>
                                    {['Type', 'Subject', 'Regarding', 'Start Date', 'Due Date', ''].map((h, i) => (
                                        <th key={i} className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {filtered.map(activity => {
                                    const tColor = activity.task_type?.color || '#9ca3af';
                                    const tName = activity.task_type?.name || 'Unassigned';
                                    return (
                                        <tr key={activity.id} className="group transition-colors duration-150 cursor-pointer hover:bg-background-subtle/50"
                                            onClick={() => router.push(`/dashboard/activities/${activity.id}/edit`)}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
                                                    style={{ background: hexToRgba(tColor), color: tColor, border: `1px solid ${hexToRgba(tColor, 0.3)}` }}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tColor }}></div>
                                                    {tName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-foreground group-hover:text-crm-500 transition-colors">{activity.subject}</td>
                                            <td className="px-5 py-3.5 text-muted-text font-medium">{activity.regarding || '—'}</td>
                                            <td className="px-5 py-3.5 text-muted-text font-medium whitespace-nowrap">{fmt(activity.start_date)}</td>
                                            <td className="px-5 py-3.5 text-muted-text font-medium whitespace-nowrap">{fmt(activity.due_date)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }} disabled={deletingId === activity.id}
                                                        className="p-1.5 rounded-lg transition-colors disabled:opacity-50 text-muted-text hover:bg-red-500/10 hover:text-red-500"
                                                        title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Manage Task Types Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-background border border-border-subtle shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-subtle">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
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
                                <h3 className="text-xs font-bold text-muted-text uppercase tracking-widest">Create New Type</h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <input type="color" value={newTypeColor} onChange={e => setNewTypeColor(e.target.value)}
                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                        <div className="w-10 h-10 rounded-xl border border-border-subtle shadow-sm cursor-pointer" style={{ backgroundColor: newTypeColor }}></div>
                                    </div>
                                    <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} required
                                        className={inputCls} placeholder="Type Name (e.g. Code Review)" />
                                    <button type="submit" disabled={savingType || !newTypeName.trim()}
                                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-crm-500 text-white hover:bg-crm-600 disabled:opacity-50 transition-all">
                                        {savingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    </button>
                                </div>
                            </form>

                            {/* Existing List */}
                            <div className="space-y-2 relative">
                                {taskTypes.length === 0 ? (
                                    <p className="text-sm text-center text-muted-text py-4">No task types exist yet.</p>
                                ) : (
                                    taskTypes.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-background-subtle/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-md shadow-sm border border-black/10 dark:border-white/10" style={{ backgroundColor: t.color }}></div>
                                                <span className="text-sm font-bold text-foreground">{t.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteType(t.id)} className="p-1.5 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
