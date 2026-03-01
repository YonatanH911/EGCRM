'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const VAULT_STATUSES = ['Open', 'Locked', 'Maintenance'];

interface VaultForm { name: string; location: string; capacity: string; status: string; }

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

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
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/vaults"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Vault</h1>
                        <p className="text-xs text-slate-500">Update vault details below</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-6 space-y-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {error && (
                    <div className="p-3.5 text-sm text-red-400 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                    </div>
                )}

                <div>
                    <label className={labelCls}>Vault Name <span className="text-red-400">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange}
                        className={inputCls} style={inputStyle} placeholder="e.g. Hard Disk Ronen"
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>

                <div>
                    <label className={labelCls}>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}
                        className={inputCls} style={inputStyle}
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                        {VAULT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelCls}>Location</label>
                    <input name="location" value={form.location} onChange={handleChange}
                        className={inputCls} style={inputStyle} placeholder="e.g. Leumi Raanana"
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>

                <div>
                    <label className={labelCls}>Capacity</label>
                    <input name="capacity" value={form.capacity} onChange={handleChange}
                        className={inputCls} style={inputStyle} placeholder="e.g. 2 TB"
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <button onClick={handleSave} disabled={saving || !form.name}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/vaults"
                        className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
