'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Building2, ArrowLeft, Loader2, Check, Trash2, MapPin } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

export default function EditAccountPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id;
    const { isRTL } = usePreferences();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '', industry: '', website: '', phone: '',
        street: '', city: '', state_or_province: '', zip_code: '', country: '',
    });

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await api.get(`/accounts/${accountId}`);
                const d = res.data;
                setFormData({
                    name: d.name || '', industry: d.industry || '', website: d.website || '',
                    phone: d.phone || '', street: d.street || '', city: d.city || '',
                    state_or_province: d.state_or_province || '', zip_code: d.zip_code || '', country: d.country || '',
                });
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch account details');
            } finally {
                setInitialLoading(false);
            }
        };
        if (accountId) fetchAccount();
    }, [accountId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.put(`/accounts/${accountId}`, formData);
            router.push('/dashboard/accounts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update account');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        setLoading(true);
        try {
            await api.delete(`/accounts/${accountId}`);
            router.push('/dashboard/accounts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete account');
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
            </div>
        );
    }

    const Field = ({ label, field, type = 'text', placeholder, colSpan2 = false }: {
        label: string; field: keyof typeof formData; type?: string; placeholder?: string; colSpan2?: boolean;
    }) => (
        <div className={colSpan2 ? 'col-span-1 md:col-span-2' : ''}>
            <label className={labelCls}>{label}</label>
            <input type={type} value={formData[field]} placeholder={placeholder}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className={inputCls} />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/accounts"
                    className="p-2.5 rounded-xl text-muted-text hover:text-foreground hover:bg-background-subtle transition-all">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Account</h1>
                        <p className="text-xs text-muted-text">Update an existing organizational record.</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {error}
                </div>
            )}

            {/* Main Info Card */}
            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="px-6 py-4 border-b border-border-subtle bg-background-subtle/30 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-crm-500" />
                    <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Account Details</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Account Name *" field="name" placeholder="e.g. Acme Corporation" colSpan2 />
                        <Field label="Industry" field="industry" placeholder="e.g. Technology" />
                        <Field label="Phone Number" field="phone" placeholder="+1 (555) 000-0000" />
                        <Field label="Website" field="website" type="url" placeholder="https://www.example.com" colSpan2 />
                    </div>

                    {/* Address Section */}
                    <div className="pt-6 border-t border-border-subtle">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-crm-500" />
                            <h3 className="text-[11px] font-bold text-muted-text uppercase tracking-widest">Address Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Street" field="street" placeholder="123 Main St" colSpan2 />
                            <Field label="City" field="city" placeholder="e.g. New York" />
                            <Field label="State / Province" field="state_or_province" placeholder="e.g. NY" />
                            <Field label="ZIP / Postal Code" field="zip_code" placeholder="10001" />
                            <Field label="Country / Region" field="country" placeholder="United States" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center gap-3 pt-8 border-t border-border-subtle">
                        <button type="button" onClick={handleDelete} disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-500 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" /> Delete Account
                        </button>
                        <div className="flex gap-3">
                            <Link href="/dashboard/accounts"
                                className="px-6 py-2.5 text-sm font-bold text-muted-text bg-background-subtle border border-border-subtle rounded-xl hover:bg-background-subtle/80 hover:text-foreground transition-all">
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-crm-500 rounded-xl hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 min-w-[140px] justify-center text-center">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Update Account
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
