'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, FileText, User, CreditCard } from 'lucide-react';
import api from '@/lib/api';

interface Contact { id: number; first_name: string; last_name: string; job_title?: string; }
interface Account { id: number; name: string; }

const CONTRACT_STATUSES = ['Draft', 'Active', 'Expired', 'Terminated'];

const labelCls = "block text-xs font-bold text-muted-text uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10";

type FormField =
    'title' | 'status' | 'value' | 'currency' | 'start_date' | 'end_date' | 'paid_by' | 'account_id' |
    'beneficiary_management_contact' | 'beneficiary_technical_contact' | 'beneficiary_financial_contact' |
    'supplier_management_contact' | 'supplier_technical_contact' | 'supplier_financial_contact';

const CUBES = [
    {
        key: 'beneficiary',
        label: 'Beneficiary',
        gradient: 'from-purple-500 to-indigo-500',
        fields: [
            { field: 'beneficiary_management_contact' as FormField, label: 'Management Contact' },
            { field: 'beneficiary_technical_contact'  as FormField, label: 'Technical Contact' },
            { field: 'beneficiary_financial_contact'  as FormField, label: 'Financial Contact' },
        ],
    },
    {
        key: 'supplier',
        label: 'Supplier',
        gradient: 'from-emerald-500 to-teal-500',
        fields: [
            { field: 'supplier_management_contact' as FormField, label: 'Management Contact' },
            { field: 'supplier_technical_contact'  as FormField, label: 'Technical Contact' },
            { field: 'supplier_financial_contact'  as FormField, label: 'Financial Contact' },
        ],
    },
];

const emptyForm: Record<FormField, string> = {
    title: '', status: 'Draft', value: '0', currency: 'USD', account_id: '',
    start_date: '', end_date: '', paid_by: '',
    beneficiary_management_contact: '', beneficiary_technical_contact: '', beneficiary_financial_contact: '',
    supplier_management_contact: '',   supplier_technical_contact: '',   supplier_financial_contact: '',
};

export default function NewContractPage() {
    const router = useRouter();
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm]         = useState<Record<FormField, string>>(emptyForm);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contactsRes, accountsRes] = await Promise.all([
                    api.get('/contacts'),
                    api.get('/accounts'),
                ]);
                setContacts(contactsRes.data);
                setAccounts(accountsRes.data);
            } catch (err: any) {
                setError('Failed to load initial data');
            }
        };
        fetchData();
    }, []);

    const set = (field: FormField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) { setError('Contract Title is required'); return; }
        
        setLoading(true);
        setError('');
        try {
            await api.post('/contracts', {
                ...form,
                value:      Number(form.value) || 0,
                account_id: form.account_id ? Number(form.account_id) : null,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                end_date:   form.end_date   ? new Date(form.end_date).toISOString()   : null,
                beneficiary_management_contact: form.beneficiary_management_contact || null,
                beneficiary_technical_contact:  form.beneficiary_technical_contact  || null,
                beneficiary_financial_contact:  form.beneficiary_financial_contact  || null,
                supplier_management_contact:    form.supplier_management_contact    || null,
                supplier_technical_contact:     form.supplier_technical_contact     || null,
                supplier_financial_contact:     form.supplier_financial_contact     || null,
                paid_by:                        form.paid_by                        || null,
            });
            router.push('/dashboard/contracts');
            router.refresh();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(
                Array.isArray(detail) 
                    ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') 
                    : (detail || 'Failed to create contract')
            );
        } finally {
            setLoading(false);
        }
    };

    const ContactDropdown = ({ field }: { field: FormField }) => (
        <select value={form[field]} onChange={set(field)}
            className={`${inputCls} *:bg-background *:text-foreground`}>
            <option value="">— None —</option>
            {contacts.map(c => (
                <option key={c.id} value={`${c.first_name} ${c.last_name}`}>
                    {c.first_name} {c.last_name}{c.job_title ? ` · ${c.job_title}` : ''}
                </option>
            ))}
        </select>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/contracts"
                    className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 bg-black/5 dark:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">New Contract</h1>
                        <p className="text-xs text-muted-text">Create a formal agreement for an account</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contract Details */}
                <div className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
                    <div className="px-6 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-semibold text-foreground">Contract Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelCls}>Contract Title *</label>
                            <input type="text" value={form.title} onChange={set('title')}
                                placeholder="e.g. Annual Software License" className={inputCls} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelCls}>Related Account</label>
                            <select value={form.account_id} onChange={set('account_id')}
                                className={`${inputCls} *:bg-background *:text-foreground`}>
                                <option value="">Select an account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Status</label>
                            <select value={form.status} onChange={set('status')}
                                className={`${inputCls} *:bg-background *:text-foreground`}>
                                {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div />
                        <div>
                            <label className={labelCls}>Date Contract Signed</label>
                            <input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Date Contract Ends</label>
                            <input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Beneficiary + Supplier cubes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {CUBES.map(cube => (
                        <div key={cube.key} className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
                            <div className="px-5 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${cube.gradient}`}>
                                    <User className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">{cube.label}</h2>
                            </div>
                            <div className="p-5 space-y-4">
                                {cube.fields.map(({ field, label }) => (
                                    <div key={field}>
                                        <label className={labelCls}>{label}</label>
                                        <ContactDropdown field={field} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Billing */}
                <div className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
                    <div className="px-6 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-semibold text-foreground">Billing Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Currency</label>
                            <select value={form.currency} onChange={set('currency')}
                                className={`${inputCls} *:bg-background *:text-foreground`}>
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
                            <div className="flex rounded-xl overflow-hidden border border-border-subtle bg-black/5 dark:bg-white/5 focus-within:border-crm-500 focus-within:ring-4 focus-within:ring-crm-500/10 transition-all">
                                <span className="flex items-center px-3 text-xs font-semibold text-muted-text border-r border-border-subtle bg-black/5 dark:bg-white/5">
                                    {form.currency}
                                </span>
                                <input type="number" min="0" step="0.01" value={form.value}
                                    onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                                    className="flex-1 px-4 py-2.5 text-sm text-foreground focus:outline-none bg-transparent" />
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelCls}>Paid By</label>
                            <ContactDropdown field="paid_by" />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-3 pt-2">
                    <Link href="/dashboard/contracts"
                        className="px-5 py-2.5 text-sm font-semibold text-muted-text hover:text-foreground bg-black/5 dark:bg-white/5 border border-border-subtle hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded-xl">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-transform hover:-translate-y-0.5 duration-200 shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Create Contract
                    </button>
                </div>
            </form>
        </div>
    );
}

