'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, FileText, Trash2, PowerOff, Power, User, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import SearchableDropdown from '@/components/SearchableDropdown';

interface Contact { id: number; first_name: string; last_name: string; job_title?: string; }

const CONTRACT_TYPES = ['3-party', 'frame'];
const BILLING_CURRENCIES = ['EUR', 'USD', 'NIS', 'BP'].map(currency => ({ value: currency, label: currency }));

const labelCls = "block text-lg font-bold text-muted-text uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-xl rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10";

type FormField =
    'title' | 'beneficiary_title' | 'supplier_title' | 'status' | 'contact_type' | 'value' | 'currency' | 'start_date' | 'end_date' | 'paid_by' |
    'product_name' | 'deposit_id' |
    'beneficiary_currency' | 'beneficiary_set_up_fee' | 'beneficiary_annual_fee' | 'beneficiary_updates' | 'beneficiary_ext_verification' |
    'supplier_currency' | 'supplier_set_up_fee' | 'supplier_annual_fee' | 'supplier_updates' | 'supplier_ext_verification' |
    'beneficiary_management_contact' | 'beneficiary_technical_contact' | 'beneficiary_financial_contact' |
    'supplier_management_contact' | 'supplier_technical_contact' | 'supplier_financial_contact';

const CUBES = [
    {
        key: 'beneficiary',
        label: 'Beneficiary',
        gradient: 'from-purple-500 to-indigo-500',
        titleField: 'beneficiary_title' as FormField,
        titleLabel: 'Beneficiary Title',
        fields: [
            { field: 'beneficiary_management_contact' as FormField, label: 'Management Contact' },
            { field: 'beneficiary_technical_contact'  as FormField, label: 'Technical Contact' },
            { field: 'beneficiary_financial_contact'  as FormField, label: 'Financial Contact' },
        ],
    },
    {
        key: 'supplier',
        label: 'Supplier',
        gradient: 'from-emerald-500 to-teal-500',
        titleField: 'supplier_title' as FormField,
        titleLabel: 'Supplier Title',
        fields: [
            { field: 'supplier_management_contact' as FormField, label: 'Management Contact' },
            { field: 'supplier_technical_contact'  as FormField, label: 'Technical Contact' },
            { field: 'supplier_financial_contact'  as FormField, label: 'Financial Contact' },
        ],
    },
];

const emptyForm: Record<FormField, string | string[]> = {
    title: '', beneficiary_title: '', supplier_title: '', status: 'Draft', contact_type: '3-party', value: '0', currency: 'USD',
    beneficiary_currency: 'USD', beneficiary_set_up_fee: '', beneficiary_annual_fee: '', beneficiary_updates: '', beneficiary_ext_verification: '',
    supplier_currency: 'USD', supplier_set_up_fee: '', supplier_annual_fee: '', supplier_updates: '', supplier_ext_verification: '',
    start_date: '', end_date: '', paid_by: [], product_name: '', deposit_id: [],
    beneficiary_management_contact: [], beneficiary_technical_contact: [], beneficiary_financial_contact: [],
    supplier_management_contact: [],   supplier_technical_contact: [],   supplier_financial_contact: [],
};

const BILLING_COLUMNS = [
    {
        key: 'beneficiary',
        label: 'Beneficiary',
        currencyField: 'beneficiary_currency' as FormField,
        fields: [
            { field: 'beneficiary_set_up_fee' as FormField, label: 'Beneficiary Set Up Fee' },
            { field: 'beneficiary_annual_fee' as FormField, label: 'Beneficiary Annual Fee' },
            { field: 'beneficiary_updates' as FormField, label: 'Beneficiary Updates' },
            { field: 'beneficiary_ext_verification' as FormField, label: 'Beneficiary Ext Verification' },
        ],
    },
    {
        key: 'supplier',
        label: 'Supplier',
        currencyField: 'supplier_currency' as FormField,
        fields: [
            { field: 'supplier_set_up_fee' as FormField, label: 'Supplier Set Up Fee' },
            { field: 'supplier_annual_fee' as FormField, label: 'Supplier Annual Fee' },
            { field: 'supplier_updates' as FormField, label: 'Supplier Updates' },
            { field: 'supplier_ext_verification' as FormField, label: 'Supplier Ext Verification' },
        ],
    },
];

const splitContractTitle = (title: string) => {
    const [beneficiary, ...supplierParts] = title.split(' - ');
    return {
        beneficiaryTitle: beneficiary?.trim() || '',
        supplierTitle: supplierParts.join(' - ').trim(),
    };
};

export default function EditContractPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading]               = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [error, setError]                   = useState('');
    const [contacts, setContacts]             = useState<Contact[]>([]);
    const [isActive, setIsActive]             = useState(true);
    const [form, setForm]                     = useState<Record<FormField, string | string[]>>(emptyForm);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contractRes, contactsRes] = await Promise.all([
                    api.get(`/contracts/${id}`),
                    api.get('/contacts'),
                ]);
                const c = contractRes.data;
                const parsedTitle = splitContractTitle(c.title || '');
                setIsActive(c.is_active !== false);
                setForm({
                    title:    c.title    || '',
                    beneficiary_title: c.beneficiary_title || parsedTitle.beneficiaryTitle,
                    supplier_title: c.supplier_title || parsedTitle.supplierTitle,
                    status:   c.status   || 'Draft',
                    contact_type: c.contact_type || '3-party',
                    value:    c.value != null ? String(c.value) : '0',
                    currency: c.currency || 'USD',
                    beneficiary_currency: c.beneficiary_currency || c.currency || 'USD',
                    beneficiary_set_up_fee: c.beneficiary_set_up_fee || '',
                    beneficiary_annual_fee: c.beneficiary_annual_fee || (c.value != null ? String(c.value) : ''),
                    beneficiary_updates: c.beneficiary_updates || '',
                    beneficiary_ext_verification: c.beneficiary_ext_verification || '',
                    supplier_currency: c.supplier_currency || 'USD',
                    supplier_set_up_fee: c.supplier_set_up_fee || '',
                    supplier_annual_fee: c.supplier_annual_fee || '',
                    supplier_updates: c.supplier_updates || '',
                    supplier_ext_verification: c.supplier_ext_verification || '',
                    product_name: c.product_name || '',
                    deposit_id: (c.deposit_ids?.length ? c.deposit_ids : (c.deposit_id ? [c.deposit_id] : [])).map(String),
                    start_date: c.start_date ? c.start_date.slice(0, 10) : '',
                    end_date:   c.end_date   ? c.end_date.slice(0, 10)   : '',
                    beneficiary_management_contact: Array.isArray(c.beneficiary_management_contact) ? c.beneficiary_management_contact : typeof c.beneficiary_management_contact === 'string' ? c.beneficiary_management_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    beneficiary_technical_contact:  Array.isArray(c.beneficiary_technical_contact)  ? c.beneficiary_technical_contact  : typeof c.beneficiary_technical_contact  === 'string' ? c.beneficiary_technical_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    beneficiary_financial_contact:  Array.isArray(c.beneficiary_financial_contact)  ? c.beneficiary_financial_contact  : typeof c.beneficiary_financial_contact  === 'string' ? c.beneficiary_financial_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    supplier_management_contact:    Array.isArray(c.supplier_management_contact)    ? c.supplier_management_contact    : typeof c.supplier_management_contact    === 'string' ? c.supplier_management_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    supplier_technical_contact:     Array.isArray(c.supplier_technical_contact)     ? c.supplier_technical_contact     : typeof c.supplier_technical_contact     === 'string' ? c.supplier_technical_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    supplier_financial_contact:     Array.isArray(c.supplier_financial_contact)     ? c.supplier_financial_contact     : typeof c.supplier_financial_contact     === 'string' ? c.supplier_financial_contact.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
                    paid_by:                        Array.isArray(c.paid_by)                        ? c.paid_by                        : typeof c.paid_by                        === 'string' ? c.paid_by.split(',').map((item: string) => item.trim()).filter(Boolean) : [],

                });
                setContacts(contactsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load contract');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const set = (field: FormField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const beneficiaryTitle = String(form.beneficiary_title || '').trim();
        const supplierTitle = String(form.supplier_title || '').trim();
        if (!beneficiaryTitle || !supplierTitle) {
            setError('Beneficiary Title and Supplier Title are required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await api.put(`/contracts/${id}`, {
                ...form,
                title: `${beneficiaryTitle} - ${supplierTitle}`,
                beneficiary_title: beneficiaryTitle,
                supplier_title: supplierTitle,
                value:      Number(form.beneficiary_annual_fee) || 0,
                currency:   form.beneficiary_currency || 'USD',
                account_id: null,
                deposit_ids: (form.deposit_id as string[]).map(Number),
                deposit_id: (form.deposit_id as string[])[0] ? Number((form.deposit_id as string[])[0]) : null,
                product_name: null,
                start_date: form.start_date ? new Date(form.start_date as string).toISOString() : null,
                end_date:   form.end_date   ? new Date(form.end_date as string).toISOString()   : null,
                beneficiary_management_contact: (form.beneficiary_management_contact as string[]).join(', ') || null,
                beneficiary_technical_contact:  (form.beneficiary_technical_contact  as string[]).join(', ') || null,
                beneficiary_financial_contact:  (form.beneficiary_financial_contact  as string[]).join(', ') || null,
                supplier_management_contact:    (form.supplier_management_contact    as string[]).join(', ') || null,
                supplier_technical_contact:     (form.supplier_technical_contact     as string[]).join(', ') || null,
                supplier_financial_contact:     (form.supplier_financial_contact     as string[]).join(', ') || null,
                paid_by:                        (form.paid_by as string[]).join(', ') || null,
            });
            router.push('/dashboard/contracts');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(Array.isArray(detail) ? detail.map((d: any) => d.msg || String(d)).join(', ') : detail || 'Failed to update contract');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this contract? This cannot be undone.')) return;
        setLoading(true);
        try {
            await api.delete(`/contracts/${id}`);
            router.push('/dashboard/contracts');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete contract');
            setLoading(false);
        }
    };

    const handleToggleActive = async () => {
        const action = isActive ? 'deactivate' : 'reactivate';
        if (isActive && !confirm('Deactivate this contract? It will be moved to the bottom of the list and greyed out.')) return;
        setLoading(true);
        try {
            await api.patch(`/contracts/${id}/${action}`);
            setIsActive(!isActive);
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${action} contract`);
        } finally {
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

    const ContactDropdown = ({ field }: { field: FormField }) => (
        <SearchableDropdown
            multiple
            value={form[field] as string[]}
            onChange={(value) => setForm(prev => ({ ...prev, [field]: value }))}
            placeholder="None"
            className={inputCls}
            options={[
                ...contacts.map(c => ({
                    value: `${c.first_name} ${c.last_name}`,
                    label: `${c.first_name} ${c.last_name}${c.job_title ? ` - ${c.job_title}` : ''}`,
                })),
            ]}
        />
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/contracts"
                    className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 bg-black/5 dark:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isActive ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-slate-600'}`}>
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-5xl font-bold ${isActive ? 'text-foreground' : 'text-muted-text'}`}>Edit Contract</h1>
                            {!isActive && (
                                <span className="text-base font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-muted-text">{`${form.beneficiary_title || ''}${form.supplier_title ? ` - ${form.supplier_title}` : ''}` || 'Update contract details below'}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3.5 text-xl text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contract Details */}
                <div className="glass-card rounded-2xl overflow-visible border border-border-subtle">
                    <div className="px-6 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-xl font-semibold text-foreground">Contract Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Contact Type</label>
                            <SearchableDropdown
                                value={form.contact_type as string}
                                onChange={(value) => setForm(prev => ({ ...prev, contact_type: value }))}
                                className={inputCls}
                                options={CONTRACT_TYPES.map(type => ({ value: type, label: type }))}
                            />
                        </div>
                        <div />
                    </div>
                </div>

                {/* Beneficiary + Supplier cubes side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {CUBES.map(cube => (
                        <div key={cube.key} className="glass-card rounded-2xl overflow-visible border border-border-subtle">
                            <div className="px-5 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${cube.gradient}`}>
                                    <User className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground">{cube.label}</h2>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelCls}>{cube.titleLabel} *</label>
                                    <input type="text" value={form[cube.titleField] as string} onChange={set(cube.titleField)}
                                        placeholder="" className={inputCls} />
                                </div>
                                {cube.fields.map(({ field, label }) => (
                                    <div key={field}>
                                        <label className={labelCls}>{label}</label>
                                        <ContactDropdown field={field} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contract Dates */}
                <div className="glass-card rounded-2xl overflow-visible border border-border-subtle">
                    <div className="px-6 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-xl font-semibold text-foreground">Contract Dates</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Date Contract Signed</label>
                            <input type="date" value={form.start_date as string} onChange={set('start_date')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Date Contract Ends</label>
                            <input type="date" value={form.end_date as string} onChange={set('end_date')} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Billing */}
                <div className="glass-card rounded-2xl overflow-visible border border-border-subtle">
                    <div className="px-6 py-4 border-b border-border-subtle bg-black/5 dark:bg-white/5 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-xl font-semibold text-foreground">Billing Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {BILLING_COLUMNS.map(column => (
                            <div key={column.key} className="space-y-4">
                                <h3 className="text-2xl font-semibold text-foreground">{column.label}</h3>
                                <div>
                                    <label className={labelCls}>{column.label} Currency</label>
                                    <SearchableDropdown
                                        value={form[column.currencyField] as string}
                                        onChange={(value) => setForm(prev => ({ ...prev, [column.currencyField]: value }))}
                                        className={inputCls}
                                        options={BILLING_CURRENCIES}
                                    />
                                </div>
                                {column.fields.map(({ field, label }) => (
                                    <div key={field}>
                                        <label className={labelCls}>{label}</label>
                                        <input type="text" value={form[field] as string} onChange={set(field)}
                                            placeholder="" className={inputCls} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center gap-3 pt-2">
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleDelete} disabled={loading || saving}
                            className="flex items-center gap-2 px-4 py-2.5 text-xl font-semibold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-colors disabled:opacity-50">
                            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete Contract</span>
                        </button>
                        <button type="button" onClick={handleToggleActive} disabled={loading || saving}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xl font-bold rounded-xl border transition-all disabled:opacity-50 ${
                                isActive
                                    ? 'text-slate-400 bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20'
                                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}>
                            {isActive ? <><PowerOff className="w-4 h-4" /> <span className="hidden sm:inline">Deactivate</span></> : <><Power className="w-4 h-4" /> <span className="hidden sm:inline">Reactivate</span></>}
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/contracts"
                            className="px-5 py-2.5 text-xl font-semibold text-muted-text hover:text-foreground bg-black/5 dark:bg-white/5 border border-border-subtle hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded-xl">
                            Cancel
                        </Link>
                        <button type="submit" disabled={saving || loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-xl font-semibold text-white rounded-xl disabled:opacity-50 transition-transform hover:-translate-y-0.5 duration-200 shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Update <span className="hidden sm:inline">Contract</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
