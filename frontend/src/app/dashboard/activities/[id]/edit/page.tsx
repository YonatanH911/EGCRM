'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Activity, ArrowLeft, Loader2, Check } from 'lucide-react';

const ACTIVITY_TYPES = ['Task', 'Email', 'Appointment', 'Phone Call'];

function toDateInput(iso: string | null) {
    if (!iso) return '';
    return iso.slice(0, 10);
}

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

export default function EditActivityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        activity_type: 'Task', subject: '', regarding: '',
        start_date: '', due_date: '', notes: '',
    });

    const set = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/activities/${id}`);
                const a = res.data;
                setForm({
                    activity_type: a.activity_type, subject: a.subject || '',
                    regarding: a.regarding || '', start_date: toDateInput(a.start_date),
                    due_date: toDateInput(a.due_date), notes: a.notes || '',
                });
            } catch (err) {
                setError('Could not load activity');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put(`/activities/${id}`, {
                activity_type: form.activity_type, subject: form.subject,
                regarding: form.regarding || null, notes: form.notes || null,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
            });
            router.push('/dashboard/activities');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(Array.isArray(detail) ? detail.map((d: any) => d.msg || String(d)).join(', ') : detail || 'Failed to update activity');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    const TYPE_COLORS: Record<string, string> = {
        'Task': '#818cf8', 'Email': '#60a5fa', 'Appointment': '#34d399', 'Phone Call': '#fbbf24',
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/activities"
                    className="p-2 rounded-xl transition-colors text-slate-500 hover:text-slate-200"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Activity</h1>
                        <p className="text-xs text-slate-500">Update the activity details below</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-6 space-y-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {error && (
                    <div className="p-3.5 text-sm text-red-400 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Activity Type */}
                    <div>
                        <label className={labelCls}>Activity Type <span className="text-red-400">*</span></label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {ACTIVITY_TYPES.map(t => (
                                <button key={t} type="button" onClick={() => set('activity_type', t)}
                                    className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                                    style={form.activity_type === t
                                        ? { background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', border: '1px solid transparent' }
                                        : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className={labelCls}>Subject <span className="text-red-400">*</span></label>
                        <input required type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
                            className={inputCls} style={inputStyle} placeholder="e.g. Follow-up call with client"
                            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                            onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                    </div>

                    {/* Regarding */}
                    <div>
                        <label className={labelCls}>Regarding</label>
                        <input type="text" value={form.regarding} onChange={e => set('regarding', e.target.value)}
                            className={inputCls} style={inputStyle} placeholder="e.g. Account name or opportunity"
                            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                            onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                        </div>
                        <div>
                            <label className={labelCls}>Due Date</label>
                            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelCls}>Notes</label>
                        <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                            className={`${inputCls} resize-none`} style={inputStyle}
                            placeholder="Additional details about this activity…"
                            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                            onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save Changes
                        </button>
                        <Link href="/dashboard/activities"
                            className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
