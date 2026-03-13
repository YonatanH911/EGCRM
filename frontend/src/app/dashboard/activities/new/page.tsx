'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ACTIVITY_TYPES = ['Task', 'Email', 'Appointment', 'Phone Call'];

export default function NewActivityPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        activity_type: 'Task',
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

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/activities" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New Activity</h1>
                    <p className="text-sm text-slate-500">Log a task, email, appointment or phone call</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {error && (
                    <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Activity Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {ACTIVITY_TYPES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => set('activity_type', t)}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${form.activity_type === t
                                            ? 'bg-crm-600 text-white border-crm-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-crm-400'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            value={form.subject}
                            onChange={e => set('subject', e.target.value)}
                            placeholder="Enter a subject..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500"
                        />
                    </div>

                    {/* Regarding */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Regarding</label>
                        <input
                            type="text"
                            value={form.regarding}
                            onChange={e => set('regarding', e.target.value)}
                            placeholder="Related to account, contact, etc."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => set('start_date', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={e => set('due_date', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            rows={4}
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder="Additional notes..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-crm-600 text-white text-sm font-medium rounded-lg hover:bg-crm-700 transition-colors disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Activity
                        </button>
                        <Link href="/dashboard/activities" className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
