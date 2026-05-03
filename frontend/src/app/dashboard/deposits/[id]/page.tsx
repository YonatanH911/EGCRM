'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import SearchableDropdown from '@/components/SearchableDropdown';

interface Vault { id: number; name: string; }
interface Account { id: number; name: string; }
interface DepositForm {
    product_name: string; version: string; supplier: string; date: string;
    vault_id: string; is_confirmation_sent: boolean; reference_number: string; received_by: string; description: string;
}

const labelCls = "block text-xs font-bold text-muted-text uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10";

export default function EditDepositPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [form, setForm] = useState<DepositForm>({
        product_name: '', version: '', supplier: '', date: '',
        vault_id: '', is_confirmation_sent: false, reference_number: '', received_by: '', description: '',
    });
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depositRes, vaultsRes, accountsRes] = await Promise.all([
                    api.get(`/deposits/${id}`),
                    api.get('/vaults'),
                    api.get('/accounts'),
                ]);
                const d = depositRes.data;
                setForm({
                    product_name: d.product_name || '', version: d.version || '',
                    supplier: d.supplier || '', date: d.date ? d.date.substring(0, 10) : '',
                    vault_id: d.vault_id ? String(d.vault_id) : '', is_confirmation_sent: d.is_confirmation_sent || false,
                    reference_number: d.reference_number || '', received_by: d.received_by || '', description: d.description || '',
                });
                setVaults(vaultsRes.data);
                setAccounts(accountsRes.data);
            } catch {
                setError('Failed to load deposit.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/deposits/${id}`, {
                ...form,
                vault_id: form.vault_id ? Number(form.vault_id) : null,
                date: form.date || null,
            });
            router.push('/dashboard/deposits');
        } catch {
            setError('Failed to save changes. Please try again.');
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

    const Field = ({ label, name, placeholder, type = 'text' }: {
        label: string; name: keyof Omit<DepositForm, 'is_confirmation_sent' | 'description'>; placeholder?: string; type?: string;
    }) => (
        <div>
            <label className={labelCls}>{label}</label>
            <input name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder}
                className={inputCls} />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/deposits"
                    className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 bg-black/5 dark:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg"
                    >
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Deposit</h1>
                        <p className="text-xs text-muted-text">Update deposit details below</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="glass-card rounded-2xl p-6 space-y-5 border border-border-subtle"
            >
                {error && (
                    <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Product Name" name="product_name" placeholder="e.g. 4370-8001-00 MW QCL kit" />
                    <Field label="Version" name="version" placeholder="e.g. Rev. B" />
                    
                    <div>
                        <label className={labelCls}>Supplier</label>
                        <SearchableDropdown
                            value={form.supplier}
                            onChange={(value) => setForm(prev => ({ ...prev, supplier: value }))}
                            placeholder="Select Supplier"
                            className={inputCls}
                            options={[
                                { value: '', label: 'Select Supplier' },
                                ...accounts.map(acc => ({ value: acc.name, label: acc.name })),
                            ]}
                        />
                    </div>

                    <Field label="Date Received" name="date" type="date" />

                    <div>
                        <label className={labelCls}>Vault</label>
                        <SearchableDropdown
                            value={form.vault_id}
                            onChange={(value) => setForm(prev => ({ ...prev, vault_id: value }))}
                            placeholder="No Vault"
                            className={inputCls}
                            options={[
                                { value: '', label: 'No Vault' },
                                ...vaults.map(v => ({ value: String(v.id), label: v.name })),
                            ]}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Confirmation Sent?</label>
                        <SearchableDropdown
                            value={form.is_confirmation_sent ? 'true' : 'false'}
                            onChange={(value) => setForm(prev => ({ ...prev, is_confirmation_sent: value === 'true' }))}
                            className={inputCls}
                            options={[
                                { value: 'false', label: 'No' },
                                { value: 'true', label: 'Yes' },
                            ]}
                        />
                    </div>
                    <Field label="Deposit Number" name="reference_number" placeholder="e.g. 2022061901" />
                    <Field label="Received By" name="received_by" placeholder="e.g. Delivery" />
                    
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                            className={inputCls}
                            placeholder="Add deposit notes (optional)..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-transform hover:-translate-y-0.5 duration-200 shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/deposits"
                        className="px-5 py-2.5 text-sm font-semibold text-muted-text hover:text-foreground bg-black/5 dark:bg-white/5 border border-border-subtle hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded-xl"
                    >
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
