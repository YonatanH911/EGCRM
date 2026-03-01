'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Landmark, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Vault { id: number; name: string; }
interface DepositForm {
    product_name: string; version: string; supplier: string; date: string;
    vault_id: string; box: string; reference_number: string; received_by: string;
}

const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
const focusStyle = { border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' };
const blurStyle = { border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' };

export default function EditDepositPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [form, setForm] = useState<DepositForm>({
        product_name: '', version: '', supplier: '', date: '',
        vault_id: '', box: '', reference_number: '', received_by: '',
    });
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depositRes, vaultsRes] = await Promise.all([
                    api.get(`/deposits/${id}`),
                    api.get('/vaults/'),
                ]);
                const d = depositRes.data;
                setForm({
                    product_name: d.product_name || '', version: d.version || '',
                    supplier: d.supplier || '', date: d.date ? d.date.substring(0, 10) : '',
                    vault_id: d.vault_id ? String(d.vault_id) : '', box: d.box || '',
                    reference_number: d.reference_number || '', received_by: d.received_by || '',
                });
                setVaults(vaultsRes.data);
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
        label: string; name: keyof DepositForm; placeholder?: string; type?: string;
    }) => (
        <div>
            <label className={labelCls}>{label}</label>
            <input name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder}
                className={inputCls} style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/deposits"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-200 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Deposit</h1>
                        <p className="text-xs text-slate-500">Update deposit details below</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Product Name" name="product_name" placeholder="e.g. 4370-8001-00 MW QCL kit" />
                    <Field label="Version" name="version" placeholder="e.g. Rev. B" />
                    <Field label="Supplier" name="supplier" placeholder="e.g. Alpes Lasers SA" />
                    <Field label="Date Received" name="date" type="date" />

                    <div>
                        <label className={labelCls}>Vault</label>
                        <select name="vault_id" value={form.vault_id} onChange={handleChange}
                            className={inputCls} style={inputStyle}
                            onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                            onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                            <option value="">— No Vault —</option>
                            {vaults.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>

                    <Field label="Box" name="box" placeholder="e.g. IAI" />
                    <Field label="Deposit Number" name="reference_number" placeholder="e.g. 2022061901" />
                    <Field label="Received By" name="received_by" placeholder="e.g. Delivery" />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/deposits"
                        className="px-5 py-2.5 text-sm font-semibold text-slate-400 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
