'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Loader2, Activity, Calendar, CheckSquare, Phone, Mail } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

const ACTIVITY_TYPES = ['Task', 'Email', 'Appointment', 'Phone Call'] as const;
type ActivityType = typeof ACTIVITY_TYPES[number];

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

export default function NewActivityPage() {
    const router = useRouter();
    const { isRTL } = usePreferences();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        activity_type: 'Task' as ActivityType,
        subject: '',
        regarding: '',
        start_date: '',
        due_date: '',
        notes: '',
    });

    const set = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload: Record<string, string | null> = {
                activity_type: form.activity_type,
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

    const icons: Record<ActivityType, React.ReactNode> = {
        'Task': <CheckSquare className="w-3.5 h-3.5" />,
        'Email': <Mail className="w-3.5 h-3.5" />,
        'Appointment': <Calendar className="w-3.5 h-3.5" />,
        'Phone Call': <Phone className="w-3.5 h-3.5" />,
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
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {ACTIVITY_TYPES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => set('activity_type', t)}
                                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${form.activity_type === t
                                        ? 'bg-crm-500 border-crm-500 text-white shadow-lg shadow-crm-500/20'
                                        : 'bg-background-subtle border-border-subtle text-muted-text hover:bg-background-subtle/80 hover:text-foreground'
                                        }`}
                                >
                                    {icons[t]}{t}
                                </button>
                            ))}
                        </div>
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
