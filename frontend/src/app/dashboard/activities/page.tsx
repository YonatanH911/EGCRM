'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Phone, Mail, CalendarDays, CheckSquare, Activity } from 'lucide-react';

type ActivityType = 'Task' | 'Email' | 'Appointment' | 'Phone Call';
interface ActivityRecord {
    id: number; activity_type: ActivityType; subject: string;
    regarding: string | null; start_date: string | null; due_date: string | null;
    notes: string | null; created_at: string;
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; gradient: string; badge: string; badgeTxt: string }> = {
    'Task': { icon: <CheckSquare className="w-3.5 h-3.5" />, gradient: 'rgba(139,92,246,0.2)', badge: 'rgba(139,92,246,0.15)', badgeTxt: '#c4b5fd' },
    'Email': { icon: <Mail className="w-3.5 h-3.5" />, gradient: 'rgba(59,130,246,0.2)', badge: 'rgba(59,130,246,0.15)', badgeTxt: '#93c5fd' },
    'Appointment': { icon: <CalendarDays className="w-3.5 h-3.5" />, gradient: 'rgba(16,185,129,0.2)', badge: 'rgba(16,185,129,0.15)', badgeTxt: '#6ee7b7' },
    'Phone Call': { icon: <Phone className="w-3.5 h-3.5" />, gradient: 'rgba(245,158,11,0.2)', badge: 'rgba(245,158,11,0.15)', badgeTxt: '#fcd34d' },
};

function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FILTERS: (ActivityType | 'All')[] = ['All', 'Task', 'Email', 'Appointment', 'Phone Call'];
const thCls = "px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";

export default function ActivitiesPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'All'>('All');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchActivities = async () => {
        try { const res = await api.get('/activities/'); setActivities(res.data); }
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Activities</h1>
                        <p className="text-xs text-slate-500">{activities.length} total</p>
                    </div>
                </div>
                <Link href="/dashboard/activities/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Activity
                </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => {
                    const isActive = filter === f;
                    return (
                        <button key={f} onClick={() => setFilter(f)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                            style={isActive
                                ? { background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }
                                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            {f}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Activity className="w-10 h-10 mb-3 text-slate-700" />
                        <p className="font-semibold text-slate-400">No activities yet</p>
                        <p className="text-sm mt-1 text-slate-600">Create your first activity to get started</p>
                        <Link href="/dashboard/activities/new"
                            className="mt-5 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            New Activity
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {['Type', 'Subject', 'Regarding', 'Start Date', 'Due Date', ''].map((h, i) => (
                                    <th key={i} className={thCls}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(activity => {
                                const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG['Task'];
                                return (
                                    <tr key={activity.id} className="group transition-all duration-150 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/activities/${activity.id}/edit`)}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                style={{ background: cfg.badge, color: cfg.badgeTxt }}>
                                                {cfg.icon}{activity.activity_type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-200">{activity.subject}</td>
                                        <td className="px-5 py-3.5 text-slate-400">{activity.regarding || '—'}</td>
                                        <td className="px-5 py-3.5 text-slate-400">{fmt(activity.start_date)}</td>
                                        <td className="px-5 py-3.5 text-slate-400">{fmt(activity.due_date)}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }} disabled={deletingId === activity.id}
                                                    className="p-1.5 rounded-lg transition-all disabled:opacity-50"
                                                    style={{ color: '#94a3b8' }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#fca5a5'; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
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
    );
}
