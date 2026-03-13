'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, FileText, Trash2, Users, CreditCard } from 'lucide-react';
import api from '@/lib/api';

interface Account { id: number; name: string; }

const CONTRACT_STATUSES = ['Draft', 'Active', 'Expired', 'Terminated'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'JPY', 'CAD', 'AUD', 'CHF'];

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

export default function EditContractPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [form, setForm] = useState({
        title: '', status: 'Draft', value: '0', currency: 'USD',
        start_date: '', end_date: '', account_id: '',
        beneficiary: '', management_contact: '', technical_contact: '',
        financial_contact: '', supplier: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contractRes, accountsRes] = await Promise.all([
                    api.get(`/contracts/${id}`),
                    api.get('/accounts'),
                ]);
                const c = contractRes.data;
                setForm({
                    title: c.title || '',
                    status: c.status || 'Draft',
                    value: c.value != null ? String(c.value) : '0',
                    currency: c.currency || 'USD',
                    start_date: c.start_date ? c.start_date.slice(0, 10) : '',
                    end_date: c.end_date ? c.end_date.slice(0, 10) : '',
                    account_id: c.account_id ? String(c.account_id) : '',
                    beneficiary: c.beneficiary || '',
                    management_contact: c.management_contact || '',
                    technical_contact: c.technical_contact || '',
                    financial_contact: c.financial_contact || '',
                    supplier: c.supplier || '',
                });
                setAccounts(accountsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load contract');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put(`/contracts/${id}`, {
                ...form,
                value: Number(form.value) || 0,
                account_id: form.account_id ? Number(form.account_id) : null,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
                beneficiary: form.beneficiary || null,
                management_contact: form.management_contact || null,
                technical_contact: form.technical_contact || null,
                financial_contact: form.financial_contact || null,
                supplier: form.supplier || null,
            });
            router.push('/dashboard/contracts');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(Array.isArray(detail) ? detail.map((d: any) => d.msg || String(d)).join(', ') : detail || 'Failed to update contract');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this contract? This cannot be undone.')) return;
        setLoading(true);
        try {
            await api.delete(`/contracts/${id}`);
            router.push('/dashboard/contracts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete contract');
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

    const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <span className="text-indigo-400">{icon}</span>
                <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );

    const Field = ({ label, field, type = 'text', placeholder, colSpan2 = false }: {
        label: string; field: keyof typeof form; type?: string; placeholder?: string; colSpan2?: boolean;
    }) => (
        <div className={colSpan2 ? 'col-span-1 sm:col-span-2' : ''}>
            <label className={labelCls}>{label}</label>
            <input type={type} value={form[field]} placeholder={placeholder} onChange={set(field)}
                className={inputCls} style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/contracts"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Contract</h1>
                        <p className="text-xs text-slate-500">{form.title || 'Update contract details below'}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3.5 text-sm text-red-400 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contract Details */}
                <Section icon={<FileText className="w-4 h-4" />} title="Contract Details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Contract Title *" field="title" placeholder="e.g. Annual Software License" colSpan2 />

                        <div>
                            <label className={labelCls}>Related Account</label>
                            <select value={form.account_id} onChange={set('account_id')}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                                <option value="">— Select an account —</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Status</label>
                            <select value={form.status} onChange={set('status')}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                                {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <Field label="Beneficiary" field="beneficiary" placeholder="e.g. Acme Corp" />
                        <Field label="Supplier" field="supplier" placeholder="e.g. Vendor Ltd" />
                        <Field label="Date Contract Signed" field="start_date" type="date" />
                        <Field label="Date Contract Ends" field="end_date" type="date" />
                    </div>
                </Section>

                {/* Contacts */}
                <Section icon={<Users className="w-4 h-4" />} title="Contacts">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Management Contact" field="management_contact" placeholder="Full name" />
                        <Field label="Technical Contact" field="technical_contact" placeholder="Full name" />
                        <Field label="Financial Contact" field="financial_contact" placeholder="Full name" />
                    </div>
                </Section>

                {/* Billing */}
                <Section icon={<CreditCard className="w-4 h-4" />} title="Billing Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Currency</label>
                            <select value={form.currency} onChange={set('currency')}
                                className={inputCls} style={inputStyle}
                                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                                <option value="USD">USD — US Dollar</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                                <option value="ILS">ILS — Israeli Shekel</option>
                                <option value="JPY">JPY — Japanese Yen</option>
                                <option value="CAD">CAD — Canadian Dollar</option>
                                <option value="AUD">AUD — Australian Dollar</option>
                                <option value="CHF">CHF — Swiss Franc</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Annual Fee</label>
                            <div className="flex rounded-xl overflow-hidden"
                                style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                                <span className="flex items-center px-3 text-xs font-semibold text-slate-500"
                                    style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.09)' }}>
                                    {form.currency}
                                </span>
                                <input type="number" min="0" step="0.01" value={form.value}
                                    onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                                    className="flex-1 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none bg-transparent"
                                    onFocus={e => { e.currentTarget.parentElement!.style.border = '1px solid rgba(99,102,241,0.5)'; e.currentTarget.parentElement!.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                                    onBlur={e => { e.currentTarget.parentElement!.style.border = '1px solid rgba(255,255,255,0.09)'; e.currentTarget.parentElement!.style.boxShadow = 'none'; }} />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Actions */}
                <div className="flex justify-between items-center gap-3 pt-2">
                    <button type="button" onClick={handleDelete} disabled={loading || saving}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-400 rounded-xl disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <Trash2 className="w-4 h-4" /> Delete Contract
                    </button>
                    <div className="flex gap-3">
                        <Link href="/dashboard/contracts"
                            className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            Cancel
                        </Link>
                        <button type="submit" disabled={saving || loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
