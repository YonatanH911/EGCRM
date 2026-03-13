'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Phone, Mail, CalendarDays, CheckSquare, Activity, Loader2 } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

type ActivityType = 'Task' | 'Email' | 'Appointment' | 'Phone Call';
interface ActivityRecord {
    id: number; activity_type: ActivityType; subject: string;
    regarding: string | null; start_date: string | null; due_date: string | null;
    notes: string | null; created_at: string;
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; badge: string; badgeTxt: string }> = {
    'Task': { icon: <CheckSquare className="w-3.5 h-3.5" />, badge: 'rgba(139,92,241,0.15)', badgeTxt: '#c4b5fd' },
    'Email': { icon: <Mail className="w-3.5 h-3.5" />, badge: 'rgba(59,130,246,0.15)', badgeTxt: '#93c5fd' },
    'Appointment': { icon: <CalendarDays className="w-3.5 h-3.5" />, badge: 'rgba(16,185,129,0.15)', badgeTxt: '#6ee7b7' },
    'Phone Call': { icon: <Phone className="w-3.5 h-3.5" />, badge: 'rgba(245,158,11,0.15)', badgeTxt: '#fcd34d' },
};

function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FILTERS: (ActivityType | 'All')[] = ['All', 'Task', 'Email', 'Appointment', 'Phone Call'];
const thCls = "px-5 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";

export default function ActivitiesPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'All'>('All');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { isRTL } = usePreferences();

    const fetchActivities = async () => {
        try { const res = await api.get('/activities'); setActivities(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchActivities(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this activity?')) return;
        setDeletingId(id);
        try { await api.delete(`/activities/${id}`); setActivities(prev => prev.filter(a => a.id !== id)); }
        catch (err) { console.error(err); }
        finally { setDeletingId(null); }
    };

    const filtered = filter === 'All' ? activities : activities.filter(a => a.activity_type === filter);

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
                <Link href="/dashboard/activities/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-crm-500 hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-transform hover:-translate-y-0.5 duration-200">
                    <Plus className="w-4 h-4" /> New Activity
                </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => {
                    const isActive = filter === f;
                    return (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${isActive ? 'bg-crm-500 border-crm-500 text-white shadow-lg shadow-crm-500/20' : 'bg-background-subtle border-border-subtle text-muted-text hover:bg-background-subtle/80 hover:text-foreground'}`}
                        >
                            {f}
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
                            <p className="font-bold text-foreground">No activities yet</p>
                            <p className="text-sm mt-1 text-muted-text max-w-[250px]">Track your tasks, calls, and appointments here.</p>
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
                                    const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG['Task'];
                                    return (
                                        <tr key={activity.id} className="group transition-colors duration-150 cursor-pointer hover:bg-background-subtle/50"
                                            onClick={() => router.push(`/dashboard/activities/${activity.id}/edit`)}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ background: cfg.badge, color: cfg.badgeTxt }}>
                                                    {cfg.icon}{activity.activity_type}
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
        </div>
    );
}
