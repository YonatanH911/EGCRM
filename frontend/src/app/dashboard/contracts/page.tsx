'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FileText, Plus, Search, Building2, Calendar,
    ChevronDown, ChevronUp, Users, DollarSign,
    Pencil, X, Check, Loader2,
} from 'lucide-react';
import api from '@/lib/api';

interface Account {
    id: number;
    name: string;
}

interface Contract {
    id: number;
    title: string;
    status: string;
    value: number;
    currency: string | null;
    start_date: string | null;
    end_date: string | null;
    beneficiary: string | null;
    management_contact: string | null;
    technical_contact: string | null;
    financial_contact: string | null;
    supplier: string | null;
    account: Account | null;
    account_id: number | null;
    created_at: string;
}

type EditDraft = {
    title: string;
    status: string;
    value: number;
    currency: string;
    start_date: string;
    end_date: string;
    beneficiary: string;
    management_contact: string;
    technical_contact: string;
    financial_contact: string;
    supplier: string;
    account_id: string;
};

function contractToEditDraft(c: Contract): EditDraft {
    const toDateInput = (d: string | null) =>
        d ? new Date(d).toISOString().split('T')[0] : '';
    return {
        title: c.title ?? '',
        status: c.status ?? 'Draft',
        value: c.value ?? 0,
        currency: c.currency ?? 'USD',
        start_date: toDateInput(c.start_date),
        end_date: toDateInput(c.end_date),
        beneficiary: c.beneficiary ?? '',
        management_contact: c.management_contact ?? '',
        technical_contact: c.technical_contact ?? '',
        financial_contact: c.financial_contact ?? '',
        supplier: c.supplier ?? '',
        account_id: c.account_id ? String(c.account_id) : '',
    };
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
            <p className="text-sm text-slate-800 font-medium">
                {value || <span className="text-slate-400 font-normal italic">—</span>}
            </p>
        </div>
    );
}

const inputCls = "w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 bg-white";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5";

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<EditDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [cRes, aRes] = await Promise.all([
                    api.get('/contracts/'),
                    api.get('/accounts/'),
                ]);
                setContracts(cRes.data);
                setAccounts(aRes.data);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const uniqueStatuses = Array.from(new Set(contracts.map(c => c.status).filter(Boolean)));

    const filteredContracts = contracts.filter(contract => {
        const matchesSearch =
            contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contract.account?.name && contract.account.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterStatus ? contract.status === filterStatus : true;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-200';
            case 'Draft': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'Expired': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Terminated': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const toggleExpand = (id: number) => {
        if (editingId === id) return; // don't collapse while editing
        setExpandedId(prev => (prev === id ? null : id));
        if (expandedId !== id) {
            setEditingId(null);
            setDraft(null);
        }
    };

    const startEdit = (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        setDraft(contractToEditDraft(contract));
        setEditingId(contract.id);
        setExpandedId(contract.id);
        setSaveError('');
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setDraft(null);
        setSaveError('');
    };

    const setDraftField = (field: keyof EditDraft, value: string | number) =>
        setDraft(prev => prev ? { ...prev, [field]: value } : prev);

    const saveEdit = async (e: React.MouseEvent, contractId: number) => {
        e.stopPropagation();
        if (!draft) return;
        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                title: draft.title,
                status: draft.status,
                value: Number(draft.value),
                currency: draft.currency || 'USD',
                start_date: draft.start_date ? new Date(draft.start_date).toISOString() : null,
                end_date: draft.end_date ? new Date(draft.end_date).toISOString() : null,
                beneficiary: draft.beneficiary || null,
                management_contact: draft.management_contact || null,
                technical_contact: draft.technical_contact || null,
                financial_contact: draft.financial_contact || null,
                supplier: draft.supplier || null,
                account_id: draft.account_id ? Number(draft.account_id) : null,
            };
            const res = await api.put(`/contracts/${contractId}`, payload);
            // Update local state
            setContracts(prev => prev.map(c => c.id === contractId ? res.data : c));
            setEditingId(null);
            setDraft(null);
        } catch (err: any) {
            setSaveError(err.response?.data?.detail || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    const formatCurrency = (value: number, currency: string | null) => {
        const cur = currency || 'USD';
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(value);
        } catch {
            return `${cur} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-crm-600" />
                        Contracts
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage formal agreements and service records.</p>
                </div>
                <Link
                    href="/dashboard/contracts/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crm-600 hover:bg-crm-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Contract
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search contracts or accounts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-auto min-w-[200px]">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white block w-full pl-3 pr-10 py-2 text-base border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm rounded-lg transition-all"
                        >
                            <option value="">All Statuses</option>
                            {uniqueStatuses.map(s => (
                                <option key={String(s)} value={String(s)}>{String(s)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                                <th scope="col" className="px-6 py-4 w-24" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading contracts...</td>
                                </tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-slate-300 mb-4" />
                                            <p className="text-slate-500 text-sm">No contracts found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((contract) => {
                                    const isExpanded = expandedId === contract.id;
                                    const isEditing = editingId === contract.id;

                                    return (
                                        <React.Fragment key={contract.id}>
                                            {/* Main row */}
                                            <tr
                                                onClick={() => toggleExpand(contract.id)}
                                                className={`transition-colors group cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="ml-4 text-sm font-medium text-slate-900">{contract.title}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                                                        {contract.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-slate-500">
                                                        <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                        {contract.account ? contract.account.name : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {formatCurrency(contract.value, contract.currency)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {contract.start_date || contract.end_date ? (
                                                        <div className="flex items-center">
                                                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                            {formatDate(contract.start_date) || 'N/A'} – {formatDate(contract.end_date) || 'N/A'}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isExpanded && !isEditing && (
                                                            <button
                                                                onClick={(e) => startEdit(e, contract)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                                Edit
                                                            </button>
                                                        )}
                                                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors inline-flex">
                                                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded panel */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="bg-indigo-50/40 border-b border-indigo-100 px-6 py-0">
                                                        <div className="py-5 space-y-3">

                                                            {/* Error banner */}
                                                            {isEditing && saveError && (
                                                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                                                    {saveError}
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                                                {/* Contract Details Box */}
                                                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                                                <Users className="h-4 w-4" />
                                                                            </div>
                                                                            <h3 className="text-sm font-semibold text-slate-700">Contract Details</h3>
                                                                        </div>
                                                                    </div>

                                                                    {isEditing && draft ? (
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                                            <EditField label="Title">
                                                                                <input type="text" value={draft.title} onChange={(e) => setDraftField('title', e.target.value)} className={inputCls} />
                                                                            </EditField>
                                                                            <EditField label="Status">
                                                                                <select value={draft.status} onChange={(e) => setDraftField('status', e.target.value)} className={inputCls}>
                                                                                    <option>Draft</option>
                                                                                    <option>Active</option>
                                                                                    <option>Expired</option>
                                                                                    <option>Terminated</option>
                                                                                </select>
                                                                            </EditField>
                                                                            <EditField label="Beneficiary">
                                                                                <input type="text" value={draft.beneficiary} onChange={(e) => setDraftField('beneficiary', e.target.value)} className={inputCls} placeholder="—" />
                                                                            </EditField>
                                                                            <EditField label="Supplier">
                                                                                <input type="text" value={draft.supplier} onChange={(e) => setDraftField('supplier', e.target.value)} className={inputCls} placeholder="—" />
                                                                            </EditField>
                                                                            <EditField label="Management Contact">
                                                                                <input type="text" value={draft.management_contact} onChange={(e) => setDraftField('management_contact', e.target.value)} className={inputCls} placeholder="—" />
                                                                            </EditField>
                                                                            <EditField label="Technical Contact">
                                                                                <input type="text" value={draft.technical_contact} onChange={(e) => setDraftField('technical_contact', e.target.value)} className={inputCls} placeholder="—" />
                                                                            </EditField>
                                                                            <EditField label="Financial Contact">
                                                                                <input type="text" value={draft.financial_contact} onChange={(e) => setDraftField('financial_contact', e.target.value)} className={inputCls} placeholder="—" />
                                                                            </EditField>
                                                                            <EditField label="Account">
                                                                                <select value={draft.account_id} onChange={(e) => setDraftField('account_id', e.target.value)} className={inputCls}>
                                                                                    <option value="">— None —</option>
                                                                                    {accounts.map(a => (
                                                                                        <option key={a.id} value={a.id}>{a.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </EditField>
                                                                            <EditField label="Date Contract Signed">
                                                                                <input type="date" value={draft.start_date} onChange={(e) => setDraftField('start_date', e.target.value)} className={inputCls} />
                                                                            </EditField>
                                                                            <EditField label="Date Contract Ends">
                                                                                <input type="date" value={draft.end_date} onChange={(e) => setDraftField('end_date', e.target.value)} className={inputCls} />
                                                                            </EditField>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                                            <InfoField label="Beneficiary" value={contract.beneficiary} />
                                                                            <InfoField label="Supplier" value={contract.supplier} />
                                                                            <InfoField label="Management Contact" value={contract.management_contact} />
                                                                            <InfoField label="Technical Contact" value={contract.technical_contact} />
                                                                            <InfoField label="Financial Contact" value={contract.financial_contact} />
                                                                            <div />
                                                                            <InfoField label="Date Contract Signed" value={formatDate(contract.start_date)} />
                                                                            <InfoField label="Date Contract Ends" value={formatDate(contract.end_date)} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Billing Info Box */}
                                                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600">
                                                                            <DollarSign className="h-4 w-4" />
                                                                        </div>
                                                                        <h3 className="text-sm font-semibold text-slate-700">Billing Information</h3>
                                                                    </div>

                                                                    {isEditing && draft ? (
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                                            <EditField label="Currency">
                                                                                <select value={draft.currency} onChange={(e) => setDraftField('currency', e.target.value)} className={inputCls}>
                                                                                    <option value="USD">USD — US Dollar</option>
                                                                                    <option value="EUR">EUR — Euro</option>
                                                                                    <option value="GBP">GBP — British Pound</option>
                                                                                    <option value="ILS">ILS — Israeli Shekel</option>
                                                                                    <option value="JPY">JPY — Japanese Yen</option>
                                                                                    <option value="CAD">CAD — Canadian Dollar</option>
                                                                                    <option value="AUD">AUD — Australian Dollar</option>
                                                                                    <option value="CHF">CHF — Swiss Franc</option>
                                                                                </select>
                                                                            </EditField>
                                                                            <EditField label="Annual Fee">
                                                                                <input type="number" min="0" step="0.01" value={draft.value} onChange={(e) => setDraftField('value', parseFloat(e.target.value) || 0)} className={inputCls} />
                                                                            </EditField>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                                            <InfoField label="Currency" value={contract.currency || 'USD'} />
                                                                            <InfoField label="Annual Fee" value={formatCurrency(contract.value, contract.currency)} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Edit action buttons */}
                                                            {isEditing && (
                                                                <div className="flex justify-end gap-2 pt-1">
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <X className="h-4 w-4" /> Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => saveEdit(e, contract.id)}
                                                                        disabled={saving}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-crm-600 hover:bg-crm-700 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        {saving
                                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                            : <Check className="h-4 w-4" />}
                                                                        Save Changes
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
