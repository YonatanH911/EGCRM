'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

export default function NewAccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { isRTL } = usePreferences();

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        phone: '',
        street: '',
        city: '',
        state_or_province: '',
        zip_code: '',
        country: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/accounts', formData);
            router.push('/dashboard/accounts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create account');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/accounts" className="p-2.5 rounded-xl text-muted-text hover:text-foreground hover:bg-background-subtle transition-all">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Account</h1>
                    <p className="text-xs text-muted-text">Create a new organizational record.</p>
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="px-6 py-4 border-b border-border-subtle bg-background-subtle/30 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-crm-500" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Account Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2">
                            <label className={labelCls}>Account Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                required
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputCls}
                                placeholder="e.g. Acme Corporation"
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Industry</label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className={inputCls}
                                placeholder="e.g. Technology"
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={inputCls}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className={labelCls}>Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className={inputCls}
                                placeholder="https://www.example.com"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle">
                        <h3 className="text-[11px] font-bold text-muted-text uppercase tracking-widest mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-crm-500" />
                            Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2">
                                <label className={labelCls}>Street</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    className={inputCls}
                                    placeholder="123 Main St"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className={inputCls}
                                    placeholder="e.g. New York"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>State / Province</label>
                                <input
                                    type="text"
                                    value={formData.state_or_province}
                                    onChange={(e) => setFormData({ ...formData, state_or_province: e.target.value })}
                                    className={inputCls}
                                    placeholder="e.g. NY"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>ZIP / Postal Code</label>
                                <input
                                    type="text"
                                    value={formData.zip_code}
                                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                    className={inputCls}
                                    placeholder="10001"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Country / Region</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className={inputCls}
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-subtle flex justify-end gap-3">
                        <Link
                            href="/dashboard/accounts"
                            className="px-6 py-2.5 text-sm font-bold text-muted-text bg-background-subtle border border-border-subtle rounded-xl hover:bg-background-subtle/80 hover:text-foreground transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-crm-500 rounded-xl hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
