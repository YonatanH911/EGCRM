'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users2, ArrowLeft, Loader2, Check, Trash2 } from 'lucide-react';

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

export default function EditContactPage() {
    const router = useRouter();
    const params = useParams();
    const contactId = params.id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', job_title: '', email: '',
        phone: '', company_name: '', supplier: '', description: '', account_id: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contactRes, accountsRes] = await Promise.all([
                    api.get(`/contacts/${contactId}`),
                    api.get('/accounts'),
                ]);
                const data = contactRes.data;
                setFormData({
                    first_name: data.first_name || '', last_name: data.last_name || '',
                    job_title: data.job_title || '', email: data.email || '',
                    phone: data.phone || '', company_name: data.company_name || '',
                    supplier: data.supplier || '', description: data.description || '',
                    account_id: data.account_id ? data.account_id.toString() : ''
                });
                setAccounts(accountsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load details');
            } finally {
                setInitialLoading(false);
            }
        };
        if (contactId) fetchData();
    }, [contactId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.put(`/contacts/${contactId}`, {
                ...formData,
                account_id: formData.account_id ? parseInt(formData.account_id) : null,
            });
            router.push('/dashboard/contacts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update contact');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        setLoading(true);
        try {
            await api.delete(`/contacts/${contactId}`);
            router.push('/dashboard/contacts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete contact');
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    const Field = ({ label, field, type = 'text', placeholder }: { label: string; field: keyof typeof formData; type?: string; placeholder?: string }) => (
        <div>
            <label className={labelCls}>{label}</label>
            <input type={type} value={formData[field]} placeholder={placeholder}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className={inputCls} style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/contacts"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                        <Users2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Contact</h1>
                        <p className="text-xs text-slate-500">Update detailed contact information</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Card header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                    <Users2 className="w-4.5 h-4.5 text-indigo-400" />
                    <h2 className="text-sm font-semibold text-slate-300">Contact Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3.5 text-sm text-red-400 rounded-xl"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="First Name *" field="first_name" placeholder="Jane" />
                        <Field label="Last Name *" field="last_name" placeholder="Smith" />
                        <Field label="Job Title" field="job_title" placeholder="e.g. Chief Marketing Officer" />
                        <Field label="Company Name" field="company_name" placeholder="e.g. Acme Corp" />
                        <Field label="Email Address" field="email" type="email" placeholder="jane@example.com" />
                        <Field label="Phone Number" field="phone" placeholder="+1 (555) 000-0000" />

                        <div>
                            <label className={labelCls}>Associated Account</label>
                            <select value={formData.account_id}
                                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                                <option value="">— No Account —</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        <Field label="Supplier" field="supplier" placeholder="e.g. Parts Supplier LLC" />

                        <div className="col-span-1 md:col-span-2">
                            <label className={labelCls}>Description / Notes</label>
                            <textarea value={formData.description} rows={4}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`${inputCls} resize-none`} style={inputStyle}
                                placeholder="Write detailed notes about this contact…"
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-white/5">
                        <button type="button" onClick={handleDelete} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-400 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <Trash2 className="w-4 h-4" /> Delete Contact
                        </button>
                        <div className="flex gap-3">
                            <Link href="/dashboard/contacts"
                                className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Update Contact
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
