'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import api from '@/lib/api';

interface Account {
    id: number;
    name: string;
}

export default function NewContractPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        status: 'Draft',
        value: 0,
        currency: 'USD',
        start_date: '',
        end_date: '',
        account_id: '',
        beneficiary: '',
        management_contact: '',
        technical_contact: '',
        financial_contact: '',
        supplier: '',
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts');
                setAccounts(response.data);
            } catch (err) {
                console.error("Failed to load accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                value: Number(formData.value),
                account_id: formData.account_id ? Number(formData.account_id) : null,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
                beneficiary: formData.beneficiary || null,
                management_contact: formData.management_contact || null,
                technical_contact: formData.technical_contact || null,
                financial_contact: formData.financial_contact || null,
                supplier: formData.supplier || null,
                currency: formData.currency || 'USD',
            };

            await api.post('/contracts', payload);
            router.push('/dashboard/contracts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create contract');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm rounded-md py-2 px-3 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground";
    const labelClass = "block text-sm font-medium text-foreground";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/contracts"
                    className="p-2 text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-6 h-6 text-crm-600" />
                        New Contract
                    </h1>
                    <p className="text-sm text-muted-text mt-1">Add a formal agreement directly to an account.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card shadow-sm rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* ── Contract Details ── */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-5">Contract Details</h3>
                        <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label htmlFor="title" className={labelClass}>Contract Title *</label>
                                <input type="text" id="title" required value={formData.title} onChange={set('title')} className={`mt-1 ${inputClass} placeholder-muted-text`} />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="account_id" className={labelClass}>Related Account</label>
                                <select id="account_id" value={formData.account_id} onChange={set('account_id')} className={`mt-1 ${inputClass} *:bg-background *:text-foreground`}>
                                    <option value="">Select an account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className={labelClass}>Status</label>
                                <select id="status" value={formData.status} onChange={set('status')} className={`mt-1 ${inputClass} *:bg-background *:text-foreground`}>
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="beneficiary" className={labelClass}>Beneficiary</label>
                                <input type="text" id="beneficiary" value={formData.beneficiary} onChange={set('beneficiary')} className={`mt-1 ${inputClass} placeholder-muted-text`} placeholder="e.g. Acme Corp" />
                            </div>

                            <div>
                                <label htmlFor="supplier" className={labelClass}>Supplier</label>
                                <input type="text" id="supplier" value={formData.supplier} onChange={set('supplier')} className={`mt-1 ${inputClass} placeholder-muted-text`} placeholder="e.g. Vendor Ltd" />
                            </div>

                            <div>
                                <label htmlFor="start_date" className={labelClass}>Date Contract Signed</label>
                                <input type="date" id="start_date" value={formData.start_date} onChange={set('start_date')} className={`mt-1 ${inputClass}`} />
                            </div>

                            <div>
                                <label htmlFor="end_date" className={labelClass}>Date Contract Ends</label>
                                <input type="date" id="end_date" value={formData.end_date} onChange={set('end_date')} className={`mt-1 ${inputClass}`} />
                            </div>
                        </div>
                    </div>

                    {/* ── Contacts ── */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-5">Contacts</h3>
                        <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="management_contact" className={labelClass}>Management Contact</label>
                                <input type="text" id="management_contact" value={formData.management_contact} onChange={set('management_contact')} className={`mt-1 ${inputClass} placeholder-muted-text`} placeholder="Full name" />
                            </div>

                            <div>
                                <label htmlFor="technical_contact" className={labelClass}>Technical Contact</label>
                                <input type="text" id="technical_contact" value={formData.technical_contact} onChange={set('technical_contact')} className={`mt-1 ${inputClass} placeholder-muted-text`} placeholder="Full name" />
                            </div>

                            <div>
                                <label htmlFor="financial_contact" className={labelClass}>Financial Contact</label>
                                <input type="text" id="financial_contact" value={formData.financial_contact} onChange={set('financial_contact')} className={`mt-1 ${inputClass} placeholder-muted-text`} placeholder="Full name" />
                            </div>
                        </div>
                    </div>

                    {/* ── Billing ── */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-5">Billing Information</h3>
                        <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="currency" className={labelClass}>Currency</label>
                                <select id="currency" value={formData.currency} onChange={set('currency')} className={`mt-1 ${inputClass} *:bg-background *:text-foreground`}>
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
                                <label htmlFor="value" className={labelClass}>Annual Fee</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-subtle bg-black/5 dark:bg-white/5 text-muted-text sm:text-sm">
                                        {formData.currency}
                                    </span>
                                    <input
                                        type="number"
                                        id="value"
                                        min="0"
                                        step="0.01"
                                        value={formData.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-crm-500 focus:border-crm-500 sm:text-sm border-border-subtle border bg-black/5 dark:bg-white/5 text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/5 dark:bg-white/5 md:bg-transparent px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 sm:px-8">
                    <Link
                        href="/dashboard/contracts"
                        className="px-4 py-2 border border-border-subtle shadow-sm text-sm font-medium rounded-md text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-crm-600 hover:bg-crm-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Contract'}
                    </button>
                </div>
            </form>
        </div>
    );
}
