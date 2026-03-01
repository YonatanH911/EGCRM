'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Save, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const VAULT_STATUSES = ['Open', 'Locked', 'Maintenance'];

interface VaultForm {
    name: string;
    location: string;
    capacity: string;
    status: string;
}

export default function EditVaultPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [form, setForm] = useState<VaultForm>({ name: '', location: '', capacity: '', status: 'Open' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVault = async () => {
            try {
                const res = await api.get(`/vaults/${id}`);
                const v = res.data;
                setForm({
                    name: v.name || '',
                    location: v.location || '',
                    capacity: v.capacity || '',
                    status: v.status || 'Open',
                });
            } catch {
                setError('Failed to load vault.');
            } finally {
                setLoading(false);
            }
        };
        fetchVault();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

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
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/dashboard/vaults')}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-crm-600" />
                        Edit Vault
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Update vault details below</p>
                </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vault Name <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
                        placeholder="e.g. Hard Disk Ronen"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
                    >
                        {VAULT_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
                        placeholder="e.g. Leumi Raanana"
                    />
                </div>

                {/* Capacity */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                    <input
                        name="capacity"
                        value={form.capacity}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
                        placeholder="e.g. 2 TB"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.name}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-crm-600 hover:bg-crm-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/vaults')}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
