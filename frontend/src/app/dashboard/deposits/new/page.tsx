'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Landmark, Shield } from 'lucide-react';
import api from '@/lib/api';

interface Account {
    id: number;
    name: string;
}

interface Vault {
    id: number;
    name: string;
}

export default function NewDepositPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [vaults, setVaults] = useState<Vault[]>([]);

    // Generate a random 8 char ref number for placeholder convenience
    const defaultRef = 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const [formData, setFormData] = useState({
        reference_number: defaultRef,
        amount: 0,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        vault_id: '',
        supplier: '',
        product_name: '',
        version: '',
        box: '',
        received_by: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const accountsRes = await api.get('/accounts');
                setAccounts(accountsRes.data);
                const vaultsRes = await api.get('/vaults');
                setVaults(vaultsRes.data);
            } catch (err) {
                console.error("Failed to load initial form data", err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                account_id: formData.account_id ? Number(formData.account_id) : null,
                vault_id: formData.vault_id ? Number(formData.vault_id) : null,
                date: formData.date ? new Date(formData.date).toISOString() : null
            };

            await api.post('/deposits', payload);
            router.push('/dashboard/deposits');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to record deposit');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-crm-600" />
                        New Deposit
                    </h1>
                    <p className="text-sm text-muted-text mt-1">Record an incoming financial transaction.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card shadow-sm rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4">Transaction Details</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="reference_number" className="block text-sm font-medium text-foreground">
                                        Reference Number *
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="reference_number"
                                            id="reference_number"
                                            required
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                            className="shadow-sm font-mono focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="account_id" className="block text-sm font-medium text-foreground">
                                        Billed Account
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="account_id"
                                            name="account_id"
                                            value={formData.account_id}
                                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border *:bg-background"
                                        >
                                            <option value="">Select an account</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="supplier" className="block text-sm font-medium text-foreground">Supplier</label>
                                    <div className="mt-1">
                                        <select
                                            id="supplier"
                                            name="supplier"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border *:bg-background"
                                        >
                                            <option value="">— Select Supplier —</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.name}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="product_name" className="block text-sm font-medium text-foreground">Product Name</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="product_name"
                                            value={formData.product_name}
                                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="version" className="block text-sm font-medium text-foreground">Version</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="version"
                                            value={formData.version}
                                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="box" className="block text-sm font-medium text-foreground">Box</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="box"
                                            value={formData.box}
                                            onChange={(e) => setFormData({ ...formData, box: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="vault_id" className="block text-sm font-medium text-foreground flex items-center gap-1">
                                        <Shield className="w-4 h-4 text-muted-text" />
                                        Destination Vault
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="vault_id"
                                            name="vault_id"
                                            value={formData.vault_id}
                                            onChange={(e) => setFormData({ ...formData, vault_id: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border *:bg-background"
                                        >
                                            <option value="">Select a storage vault (optional)</option>
                                            {vaults.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                                        Deposit Amount ($) *
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-subtle bg-black/5 dark:bg-white/5 text-muted-text sm:text-sm">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            name="amount"
                                            id="amount"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-crm-500 focus:border-crm-500 sm:text-sm border-border-subtle border bg-black/5 dark:bg-white/5 text-foreground"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-foreground">
                                        Status
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border *:bg-background"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Cleared">Cleared</option>
                                            <option value="Failed">Failed</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-foreground">
                                        Deposit Date
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="date"
                                            id="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border"
                                        />
                                    </div>
                                </div>
                                
                                <div className="sm:col-span-2">
                                    <label htmlFor="received_by" className="block text-sm font-medium text-foreground">Received By</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="received_by"
                                            value={formData.received_by}
                                            onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                            placeholder="e.g. Delivery"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/5 dark:bg-white/5 md:bg-transparent px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 sm:px-8">
                    <Link
                        href="/dashboard/deposits"
                        className="px-4 py-2 border border-border-subtle shadow-sm text-sm font-medium rounded-md text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Deposit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
