'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Building2, ArrowLeft, Loader2, Check, Trash2, MapPin } from 'lucide-react';

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

export default function EditAccountPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id;

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
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
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
                className={inputCls} style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/accounts"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Account</h1>
                        <p className="text-xs text-slate-500">Update an existing organizational record</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3.5 text-sm text-red-400 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                </div>
            )}

            {/* Main Info Card */}
            <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-slate-300">Account Details</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Account Name *" field="name" placeholder="e.g. Acme Corporation" colSpan2 />
                        <Field label="Industry" field="industry" placeholder="e.g. Technology" />
                        <Field label="Phone Number" field="phone" placeholder="+1 (555) 000-0000" />
                        <Field label="Website" field="website" type="url" placeholder="https://www.example.com" colSpan2 />
                    </div>

                    {/* Address Section */}
                    <div className="pt-5 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-slate-600" />
                            <h3 className="text-sm font-semibold text-slate-400">Address Information</h3>
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
                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-white/5">
                        <button type="button" onClick={handleDelete} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-400 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <Trash2 className="w-4 h-4" /> Delete Account
                        </button>
                        <div className="flex gap-3">
                            <Link href="/dashboard/accounts"
                                className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
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
