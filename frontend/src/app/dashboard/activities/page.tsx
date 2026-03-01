'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Phone, Mail, CalendarDays, CheckSquare, Activity } from 'lucide-react';

type ActivityType = 'Task' | 'Email' | 'Appointment' | 'Phone Call';

interface ActivityRecord {
    id: number;
    activity_type: ActivityType;
    subject: string;
    regarding: string | null;
    start_date: string | null;
    due_date: string | null;
    notes: string | null;
    created_at: string;
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
    'Task': { icon: <CheckSquare className="w-3.5 h-3.5" />, color: 'text-violet-700', bg: 'bg-violet-100' },
    'Email': { icon: <Mail className="w-3.5 h-3.5" />, color: 'text-blue-700', bg: 'bg-blue-100' },
    'Appointment': { icon: <CalendarDays className="w-3.5 h-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    'Phone Call': { icon: <Phone className="w-3.5 h-3.5" />, color: 'text-amber-700', bg: 'bg-amber-100' },
};

function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FILTERS: (ActivityType | 'All')[] = ['All', 'Task', 'Email', 'Appointment', 'Phone Call'];

export default function ActivitiesPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'All'>('All');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchActivities = async () => {
        try {
            const res = await api.get('/activities/');
            setActivities(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this activity?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/activities/${id}`);
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = filter === 'All' ? activities : activities.filter(a => a.activity_type === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-crm-600/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-crm-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
                        <p className="text-sm text-slate-500">{activities.length} total</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/activities/new"
                    className="flex items-center gap-2 px-4 py-2 bg-crm-600 text-white text-sm font-medium rounded-lg hover:bg-crm-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Activity
                </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f
                                ? 'bg-crm-600 text-white shadow'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-crm-400'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-crm-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Activity className="w-12 h-12 mb-3 opacity-30" />
                        <p className="font-medium text-slate-500">No activities yet</p>
                        <p className="text-sm mt-1">Create your first activity to get started</p>
                        <Link href="/dashboard/activities/new" className="mt-4 px-4 py-2 bg-crm-600 text-white text-sm rounded-lg hover:bg-crm-700 transition-colors">
                            New Activity
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Regarding</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(activity => {
                                const cfg = TYPE_CONFIG[activity.activity_type] ?? TYPE_CONFIG['Task'];
                                return (
                                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                                                {cfg.icon}
                                                {activity.activity_type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-slate-800">{activity.subject}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{activity.regarding || '—'}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{fmt(activity.start_date)}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{fmt(activity.due_date)}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => router.push(`/dashboard/activities/${activity.id}/edit`)}
                                                    className="p-1.5 text-slate-400 hover:text-crm-600 hover:bg-crm-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(activity.id)}
                                                    disabled={deletingId === activity.id}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
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
