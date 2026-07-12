'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Landmark, Shield, Check, Trash2, PowerOff, Power } from 'lucide-react';
import api from '@/lib/api';
import SearchableDropdown from '@/components/SearchableDropdown';

interface Account {
    id: number;
    name: string;
}

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    email?: string | null;
}

interface Vault {
    id: number;
    name: string;
}

interface DepositForm {
    reference_number: string;
    amount: number;
    status: string;
    date: string;
    contact_ids: string[];
    vault_ids: string[];
    supplier: string[];
    product_name: string;
    version: string;
    description: string;
    is_confirmation_sent: boolean;
    received_by: string;
}

export default function EditDepositPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isVaulted, setIsVaulted] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [vaults, setVaults] = useState<Vault[]>([]);

    const [formData, setFormData] = useState<DepositForm>({
        reference_number: '',
        amount: 0,
        status: 'Pending',
        date: '',
        contact_ids: [],
        vault_ids: [],
        supplier: [],
        product_name: '',
        version: '',
        description: '',
        is_confirmation_sent: false,
        received_by: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depositRes, accountsRes, contactsRes, vaultsRes] = await Promise.all([
                    api.get(`/deposits/${id}`),
                    api.get('/accounts'),
                    api.get('/contacts'),
                    api.get('/vaults'),
                ]);
                const deposit = depositRes.data;
                setIsActive(deposit.is_active !== false);

                const mappedVaultIds = (deposit.vault_ids?.length ? deposit.vault_ids : (deposit.vault_id ? [deposit.vault_id] : [])).map(String);
                setIsVaulted(mappedVaultIds.length > 0);

                setFormData({
                    reference_number: deposit.reference_number || '',
                    amount: Number(deposit.amount || 0),
                    status: deposit.status || 'Pending',
                    date: deposit.date ? deposit.date.substring(0, 10) : '',
                    contact_ids: (deposit.contact_ids || []).map(String),
                    vault_ids: mappedVaultIds,
                    supplier: deposit.supplier ? deposit.supplier.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    product_name: deposit.product_name || '',
                    version: deposit.version || '',
                    description: deposit.description || '',
                    is_confirmation_sent: Boolean(deposit.is_confirmation_sent),
                    received_by: deposit.received_by || '',
                });
                setAccounts(accountsRes.data);
                setContacts(contactsRes.data);
                setVaults(vaultsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load deposit.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                contact_ids: formData.contact_ids.map(Number),
                vault_ids: formData.vault_ids.map(Number),
                vault_id: formData.vault_ids[0] ? Number(formData.vault_ids[0]) : null,
                supplier: formData.supplier.join(', '),
                date: formData.date ? new Date(formData.date).toISOString() : null,
            };

            await api.put(`/deposits/${id}`, payload);
            router.push('/dashboard/deposits');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save changes. Please try again.');
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this deposit?')) return;
        setSaving(true);
        setError('');
        try {
            await api.delete(`/deposits/${id}`);
            router.push('/dashboard/deposits');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete deposit');
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        const action = isActive ? 'deactivate' : 'reactivate';
        if (isActive && !confirm('Deactivate this deposit? It will be moved to the bottom of the list and greyed out.')) return;
        setSaving(true);
        setError('');
        try {
            await api.patch(`/deposits/${id}/${action}`);
            setIsActive(!isActive);
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${action} deposit`);
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
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/deposits"
                    className="p-2 text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors bg-black/5 dark:bg-white/5"
                >
                    <ArrowLeft className="w-5 h-5 ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className={`text-5xl font-bold flex items-center gap-2 ${isActive ? 'text-foreground' : 'text-muted-text'}`}>
                            <Landmark className={`w-6 h-6 ${isActive ? 'text-crm-600' : 'text-muted-text'}`} />
                        Edit Deposit
                        </h1>
                        {!isActive && (
                            <span className="text-base font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest">
                                Inactive
                            </span>
                        )}
                    </div>
                    <p className="text-xl text-muted-text mt-1">Update an incoming financial transaction.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card shadow-sm rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-3xl font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4">Transaction Details</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="reference_number" className="block text-xl font-medium text-foreground">
                                        Deposit Number *
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="reference_number"
                                            id="reference_number"
                                            required
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                            className="shadow-sm font-mono focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="supplier" className="block text-xl font-medium text-foreground">Supplier</label>
                                    <div className="mt-1">
                                        <SearchableDropdown
                                            value={formData.supplier}
                                            multiple
                                            onChange={(value) => setFormData({ ...formData, supplier: value })}
                                            placeholder="Select Supplier"
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                            options={accounts.map(account => ({ value: account.name, label: account.name }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="product_name" className="block text-xl font-medium text-foreground">Product Name</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="product_name"
                                            value={formData.product_name}
                                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="version" className="block text-xl font-medium text-foreground">Version</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="version"
                                            value={formData.version}
                                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="date" className="block text-xl font-medium text-foreground">
                                        Deposit Date
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="date"
                                            id="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="received_by" className="block text-xl font-medium text-foreground">Received By</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="received_by"
                                            value={formData.received_by}
                                            onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                            placeholder=""
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-muted-text" />
                                Vault Information
                            </h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="is_vaulted" className="block text-xl font-medium text-foreground">Is Vaulted</label>
                                    <div className="mt-1">
                                        <SearchableDropdown
                                            value={isVaulted ? 'Yes' : 'No'}
                                            onChange={(val) => {
                                                const yes = val === 'Yes';
                                                setIsVaulted(yes);
                                                if (!yes) {
                                                    setFormData(prev => ({ ...prev, vault_ids: [] }));
                                                } else if (formData.vault_ids.length === 0 && vaults.length > 0) {
                                                    setFormData(prev => ({ ...prev, vault_ids: [String(vaults[0].id)] }));
                                                }
                                            }}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                            options={[
                                                { value: 'No', label: 'No' },
                                                { value: 'Yes', label: 'Yes' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div className={!isVaulted ? "opacity-50 pointer-events-none" : ""}>
                                    <label htmlFor="vault_select" className="block text-xl font-medium text-foreground">Vault</label>
                                    <div className="mt-1">
                                        <SearchableDropdown
                                            value={formData.vault_ids[0] || ''}
                                            onChange={(val) => setFormData(prev => ({ ...prev, vault_ids: val ? [val] : [] }))}
                                            placeholder="Select a storage vault"
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                            options={vaults.map(vault => ({ value: String(vault.id), label: vault.name }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4">Verification Information</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="verification_status" className="block text-xl font-medium text-foreground">Verification Status</label>
                                    <div className="mt-1">
                                        <SearchableDropdown
                                            value={formData.status === 'Cleared' ? 'Verified' : 'Not Verified'}
                                            onChange={(val) => setFormData(prev => ({ ...prev, status: val === 'Verified' ? 'Cleared' : 'Pending' }))}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                            options={[
                                                { value: 'Not Verified', label: 'Not Verified' },
                                                { value: 'Verified', label: 'Verified' },
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="is_report_sent" className="block text-xl font-medium text-foreground">Is Report Sent</label>
                                    <div className="mt-1">
                                        <SearchableDropdown
                                            value={formData.is_confirmation_sent ? 'Yes' : 'No'}
                                            onChange={(val) => setFormData(prev => ({ ...prev, is_confirmation_sent: val === 'Yes' }))}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                            options={[
                                                { value: 'No', label: 'No' },
                                                { value: 'Yes', label: 'Yes' },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4">Description</h3>
                            <div className="mt-1">
                                <textarea
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-xl border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                    placeholder="Enter description..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/5 dark:bg-white/5 md:bg-transparent px-6 py-4 border-t border-border-subtle flex items-center justify-between gap-3 sm:px-8">
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/20 shadow-sm text-xl font-medium rounded-md text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete Deposit</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleActive}
                            disabled={saving}
                            className={`inline-flex items-center gap-2 px-4 py-2 border shadow-sm text-xl font-medium rounded-md transition-colors disabled:opacity-50 ${
                                isActive
                                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                                    : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                        >
                            {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            <span className="hidden sm:inline">{isActive ? 'Deactivate' : 'Reactivate'}</span>
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard/deposits"
                            className="px-4 py-2 border border-border-subtle shadow-sm text-xl font-medium rounded-md text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent shadow-sm text-xl font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-4 h-4" />}
                            Update Deposit
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
