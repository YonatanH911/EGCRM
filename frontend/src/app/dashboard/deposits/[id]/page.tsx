'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Landmark, Save, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Vault {
    id: number;
    name: string;
}

interface DepositForm {
    product_name: string;
    version: string;
    supplier: string;
    date: string;
    vault_id: string;
    box: string;
    reference_number: string;
    received_by: string;
}

export default function EditDepositPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [form, setForm] = useState<DepositForm>({
        product_name: '',
        version: '',
        supplier: '',
        date: '',
        vault_id: '',
        box: '',
        reference_number: '',
        received_by: '',
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
                    product_name: d.product_name || '',
                    version: d.version || '',
                    supplier: d.supplier || '',
                    date: d.date ? d.date.substring(0, 10) : '',
                    vault_id: d.vault_id ? String(d.vault_id) : '',
                    box: d.box || '',
                    reference_number: d.reference_number || '',
                    received_by: d.received_by || '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

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
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
            </div>
        );
    }

    const Field = ({ label, name, placeholder, type = 'text' }: { label: string; name: keyof DepositForm; placeholder?: string; type?: string }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
            />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/dashboard/deposits')}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-crm-600" />
                        Edit Deposit
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Update deposit details below
                    </p>
                </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Product Name" name="product_name" placeholder="e.g. 4370-8001-00 MW QCL kit" />
                    <Field label="Version" name="version" placeholder="e.g. Rev. B" />
                    <Field label="Supplier" name="supplier" placeholder="e.g. Alpes Lasers SA" />
                    <Field label="Date Received" name="date" type="date" />

                    {/* Vault dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vault</label>
                        <select
                            name="vault_id"
                            value={form.vault_id}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-crm-500 focus:border-crm-500 transition-all"
                        >
                            <option value="">— No Vault —</option>
                            {vaults.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    <Field label="Box" name="box" placeholder="e.g. IAI" />
                    <Field label="Deposit Number" name="reference_number" placeholder="e.g. 2022061901" />
                    <Field label="Received By" name="received_by" placeholder="e.g. Delivery" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-crm-600 hover:bg-crm-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/deposits')}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
