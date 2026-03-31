'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Loader2, Activity, Calendar, CheckSquare, Phone, Mail } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

interface TaskType { id: number; name: string; color: string; }

export default function NewActivityPage() {
    const router = useRouter();
    const { isRTL } = usePreferences();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [fetchingTypes, setFetchingTypes] = useState(true);
    const [form, setForm] = useState({
        task_type_id: '' as number | '',
        subject: '',
        regarding: '',
        start_date: '',
        due_date: '',
        notes: '',
    });

    // Fetch dynamic task types
    useState(() => {
        api.get('/task-types').then(res => {
            setTaskTypes(res.data);
            if (res.data.length > 0) setForm(prev => ({ ...prev, task_type_id: res.data[0].id }));
        }).finally(() => setFetchingTypes(false));
    });

    const set = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload: Record<string, string | number | null> = {
                task_type_id: form.task_type_id || null,
                subject: form.subject,
                regarding: form.regarding || null,
                notes: form.notes || null,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
            };
            await api.post('/activities', payload);
            router.push('/dashboard/activities');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create activity');
        } finally {
            setSaving(false);
        }
    };



    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/activities" className="p-2.5 rounded-xl text-muted-text hover:text-foreground hover:bg-background-subtle transition-all">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Activity</h1>
                    <p className="text-xs text-muted-text">Log a task, email, appointment or phone call.</p>
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="px-6 py-4 border-b border-border-subtle bg-background-subtle/30 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-crm-500" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Activity Details</h2>
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
                        <input
                            required
                            type="text"
                            value={form.subject}
                            onChange={e => set('subject', e.target.value)}
                            placeholder="e.g. Follow-up call with client"
                            className={inputCls}
                        />
                    </div>

                    {/* Regarding */}
                    <div>
                        <label className={labelCls}>Regarding</label>
                        <input
                            type="text"
                            value={form.regarding}
                            onChange={e => set('regarding', e.target.value)}
                            placeholder="e.g. Account name or opportunity"
                            className={inputCls}
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => set('start_date', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Due Date</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={e => set('due_date', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelCls}>Notes</label>
                        <textarea
                            rows={4}
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder="Additional details about this activity..."
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    <div className="pt-8 border-t border-border-subtle flex justify-end gap-3">
                        <Link href="/dashboard/activities" className="px-6 py-2.5 text-sm font-bold text-muted-text bg-background-subtle border border-border-subtle rounded-xl hover:bg-background-subtle/80 hover:text-foreground transition-all">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-crm-500 rounded-xl hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Activity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
