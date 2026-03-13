'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import api from '@/lib/api';

export default function NewVaultPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: '',
        status: 'Open'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/vaults', formData);
            router.push('/dashboard/vaults');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create vault');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/vaults"
                    className="p-2 text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors bg-black/5 dark:bg-white/5"
                >
                    <ArrowLeft className="w-5 h-5 ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-6 h-6 text-crm-600" />
                        New Vault
                    </h1>
                    <p className="text-sm text-muted-text mt-1">Create a new secure storage repository.</p>
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
                            <h3 className="text-lg font-medium leading-6 text-foreground border-b border-border-subtle pb-2 mb-4">Vault Information</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="name" className="block text-sm font-medium text-foreground">
                                        Vault Name *
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                            placeholder="e.g. Primary Deposit Box"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-foreground">
                                        Location
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="location"
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="capacity" className="block text-sm font-medium text-foreground">
                                        Capacity
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="capacity"
                                            id="capacity"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            className="shadow-sm focus:ring-crm-500 focus:border-crm-500 block w-full sm:text-sm border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-md py-2 px-3 border placeholder-muted-text"
                                            placeholder="e.g. 500 lbs, 10 slots"
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
                                            <option value="Open">Open</option>
                                            <option value="Locked">Locked</option>
                                            <option value="Maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/5 dark:bg-white/5 md:bg-transparent px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 sm:px-8">
                    <Link
                        href="/dashboard/vaults"
                        className="px-4 py-2 border border-border-subtle shadow-sm text-sm font-medium rounded-md text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-crm-600 hover:bg-crm-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Vault'}
                    </button>
                </div>
            </form>
        </div>
    );
}
