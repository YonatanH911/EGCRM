'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Activity, ArrowLeft, Loader2, Check, Calendar, CheckSquare, Phone, Mail } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

interface TaskType { id: number; name: string; color: string; }

function toDateInput(iso: string | null) {
    if (!iso) return '';
    return iso.slice(0, 10);
}

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

export default function EditActivityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { isRTL } = usePreferences();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [fetchingTypes, setFetchingTypes] = useState(true);
    const [form, setForm] = useState({
        task_type_id: '' as number | '', subject: '', regarding: '',
        start_date: '', due_date: '', notes: '',
    });

    const set = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        const fetch = async () => {
            try {
                const [actRes, typesRes] = await Promise.all([
                    api.get(`/activities/${id}`),
                    api.get('/task-types')
                ]);
                const a = actRes.data;
                setTaskTypes(typesRes.data);
                
                setForm({
                    task_type_id: a.task_type_id || (typesRes.data.length > 0 ? typesRes.data[0].id : ''), 
                    subject: a.subject || '',
                    regarding: a.regarding || '', start_date: toDateInput(a.start_date),
                    due_date: toDateInput(a.due_date), notes: a.notes || '',
                });
            } catch (err) {
                setError('Could not load activity or task types');
            } finally {
                setLoading(false);
                setFetchingTypes(false);
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
                task_type_id: form.task_type_id || null, subject: form.subject,
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
                <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
            </div>
        );
    }



    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/activities"
                    className="p-2.5 rounded-xl text-muted-text hover:text-foreground hover:bg-background-subtle transition-all">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Activity</h1>
                        <p className="text-xs text-muted-text">Update the activity details below.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="px-6 py-4 border-b border-border-subtle bg-background-subtle/30 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-crm-500" />
                    <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Activity Details</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Activity Type */}
                    <div>
                        <label className={labelCls}>Activity Type *</label>
                        {fetchingTypes ? (
                            <div className="h-10 flex items-center gap-2 text-sm text-muted-text">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading types...
                            </div>
                        ) : taskTypes.length === 0 ? (
                            <div className="text-sm text-red-500 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                No task types configured. Please create one in the Activities dashboard first.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {taskTypes.map(t => {
                                    const isSelected = form.task_type_id === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => set('task_type_id', t.id)}
                                            style={{
                                                backgroundColor: isSelected ? t.color : 'transparent',
                                                borderColor: isSelected ? t.color : '',
                                                color: isSelected ? '#fff' : '',
                                            }}
                                            className={`flex justify-center items-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${isSelected
                                                ? 'shadow-lg'
                                                : 'bg-background-subtle border-border-subtle text-muted-text hover:bg-background-subtle/80 hover:text-foreground'
                                                }`}
                                        >
                                            {t.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className={labelCls}>Subject *</label>
                        <input required type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
                            className={inputCls} placeholder="e.g. Follow-up call with client" />
                    </div>

                    {/* Regarding */}
                    <div>
                        <label className={labelCls}>Regarding</label>
                        <input type="text" value={form.regarding} onChange={e => set('regarding', e.target.value)}
                            className={inputCls} placeholder="e.g. Account name or opportunity" />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                                className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Due Date</label>
                            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                                className={inputCls} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelCls}>Notes</label>
                        <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                            className={`${inputCls} resize-none`} placeholder="Additional details about this activity…" />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-8 border-t border-border-subtle">
                        <Link href="/dashboard/activities"
                            className="px-6 py-2.5 text-sm font-bold text-muted-text bg-background-subtle border border-border-subtle rounded-xl hover:bg-background-subtle/80 hover:text-foreground transition-all">
                            Cancel
                        </Link>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-crm-500 rounded-xl hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 min-w-[140px] justify-center text-center">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Update Activity
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
