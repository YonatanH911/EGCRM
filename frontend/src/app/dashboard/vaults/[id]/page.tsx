'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { usePreferences } from '@/components/PreferencesProvider';

const VAULT_STATUSES = ['Open', 'Locked', 'Maintenance'];

interface VaultForm { name: string; location: string; capacity: string; status: string; }

export default function EditVaultPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isRTL } = usePreferences();

    const [form, setForm] = useState<VaultForm>({ name: '', location: '', capacity: '', status: 'Open' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const labelCls = "block text-xs font-bold text-muted-text uppercase tracking-wider mb-1.5";
    const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl bg-background-subtle border border-border-subtle text-foreground placeholder-muted-text focus:outline-none focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 transition-all";

    useEffect(() => {
        const fetchVault = async () => {
            try {
                const res = await api.get(`/vaults/${id}`);
                const v = res.data;
                setForm({ name: v.name || '', location: v.location || '', capacity: v.capacity || '', status: v.status || 'Open' });
            } catch {
                setError('Failed to load vault.');
            } finally {
                setLoading(false);
            }
        };
        fetchVault();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/vaults/${id}`, form);
            router.push('/dashboard/vaults');
        } catch {
            setError('Failed to save changes. Please try again.');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-crm-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-crm-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/vaults"
                    className="p-2 rounded-xl text-muted-text hover:text-foreground transition-colors bg-background-subtle border border-border-subtle">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-crm-500 to-crm-600 shadow-lg shadow-crm-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Vault</h1>
                        <p className="text-xs text-muted-text">Update vault details below</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
                {error && (
                    <div className="p-3.5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                        {error}
                    </div>
                )}

                <div>
                    <label className={labelCls}>Vault Name <span className="text-red-500">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange}
                        className={inputCls} placeholder="e.g. Hard Disk Ronen" />
                </div>

                <div>
                    <label className={labelCls}>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}
                        className={inputCls}>
                        {VAULT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelCls}>Location</label>
                    <input name="location" value={form.location} onChange={handleChange}
                        className={inputCls} placeholder="e.g. Leumi Raanana" />
                </div>

                <div>
                    <label className={labelCls}>Capacity</label>
                    <input name="capacity" value={form.capacity} onChange={handleChange}
                        className={inputCls} placeholder="e.g. 2 TB" />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
                    <button onClick={handleSave} disabled={saving || !form.name}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-crm-500 hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/vaults"
                        className="px-5 py-2.5 text-sm font-semibold text-muted-text hover:text-foreground bg-background-subtle border border-border-subtle rounded-xl transition-all">
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
