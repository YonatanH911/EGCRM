'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Building2, ArrowLeft, Loader2, Check, Trash2,
    ChevronDown, ChevronUp, User, Package, Mail, Phone, Banknote, Search, X
} from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

const labelCls = "block text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5";
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl text-foreground placeholder-muted-text bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10 focus:outline-none transition-all";

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    job_title?: string;
    account_id?: number | null;
}

interface Deposit {
    id: number;
    reference_number: string;
    amount: number;
    status: string;
    product_name?: string;
    date?: string;
    account_id?: number | null;
}

function RelatedSection({
    title, icon: Icon, count, open, onToggle, children, color = 'crm'
}: {
    title: string;
    icon: React.ElementType;
    count: number;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    color?: string;
}) {
    const colorMap: Record<string, string> = {
        crm: 'text-crm-500 bg-crm-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
    };
    const cls = colorMap[color] || colorMap.crm;

    return (
        <div className="rounded-2xl overflow-hidden glass-card">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-background-subtle/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">{title}</span>
                    <span className="text-xs font-medium text-muted-text bg-background-subtle px-2 py-0.5 rounded-full">{count}</span>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 text-muted-text" />
                    : <ChevronDown className="w-4 h-4 text-muted-text" />
                }
            </button>

            {open && (
                <div className="border-t border-border-subtle flex flex-col">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function EditAccountPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id;
    const { isRTL } = usePreferences();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '', website: '', phone: '',
        street: '', city: '', state_or_province: '', zip_code: '', country: '',
    });

    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
    
    const [contactsOpen, setContactsOpen] = useState(false);
    const [depositsOpen, setDepositsOpen] = useState(false);
    
    const [selectedContactId, setSelectedContactId] = useState('');
    const [selectedDepositId, setSelectedDepositId] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [accRes, contactsRes, depositsRes] = await Promise.all([
                    api.get(`/accounts/${accountId}`),
                    api.get(`/contacts`),
                    api.get(`/deposits`),
                ]);
                const d = accRes.data;
                    setFormData({
                        name: d.name || '', website: d.website || '',
                        phone: d.phone || '', street: d.street || '', city: d.city || '',
                        state_or_province: d.state_or_province || '', zip_code: d.zip_code || '', country: d.country || '',
                        is_active: d.is_active !== undefined ? d.is_active : true,
                    });

                setAllContacts(contactsRes.data);
                setAllDeposits(depositsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch account details');
            } finally {
                setInitialLoading(false);
            }
        };
        if (accountId) fetchAll();
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

    const handleToggleActive = async () => {
        const action = formData.is_active ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this account?`)) return;
        setLoading(true);
        try {
            const res = await api.put(`/accounts/${accountId}`, { ...formData, is_active: !formData.is_active });
            setFormData(prev => ({ ...prev, is_active: res.data.is_active }));
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${action} account`);
        } finally {
            setLoading(true); // Wait for navigation or refresh
            router.push('/dashboard/accounts');
        }
    };

    const handleLinkContact = async (contact: Contact) => {
        try {
            const res = await api.put(`/contacts/${contact.id}`, { ...contact, account_id: Number(accountId) });
            setAllContacts(prev => prev.map(c => c.id === contact.id ? res.data : c));
        } catch (err: any) {
            alert('Failed to link contact: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleUnlinkContact = async (e: React.MouseEvent, contact: Contact) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Are you sure you want to unlink ${contact.first_name} from this account?`)) return;
        try {
            const res = await api.put(`/contacts/${contact.id}`, { ...contact, account_id: null });
            setAllContacts(prev => prev.map(c => c.id === contact.id ? res.data : c));
        } catch (err: any) {
            alert('Failed to unlink contact: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleLinkDeposit = async (deposit: Deposit) => {
        try {
            const res = await api.put(`/deposits/${deposit.id}`, { ...deposit, account_id: Number(accountId) });
            setAllDeposits(prev => prev.map(d => d.id === deposit.id ? res.data : d));
        } catch (err: any) {
            alert('Failed to link deposit: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleUnlinkDeposit = async (e: React.MouseEvent, deposit: Deposit) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Are you sure you want to unlink ${deposit.reference_number} from this account?`)) return;
        try {
            const res = await api.put(`/deposits/${deposit.id}`, { ...deposit, account_id: null });
            setAllDeposits(prev => prev.map(d => d.id === deposit.id ? res.data : d));
        } catch (err: any) {
            alert('Failed to unlink deposit: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-crm-500" />
            </div>
        );
    }

    const linkedContacts = allContacts.filter(c => c.account_id === Number(accountId));
    const unlinkedContactsList = allContacts.filter(c => c.account_id !== Number(accountId));

    const linkedDeposits = allDeposits.filter(d => d.account_id === Number(accountId));
    const unlinkedDepositsList = allDeposits.filter(d => d.account_id !== Number(accountId));

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
                        <h1 className="text-2xl font-bold text-foreground">{formData.name || 'Edit Account'}</h1>
                        <p className="text-xs text-muted-text">Update this organizational record.</p>
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
                        <Field label="Phone Number" field="phone" placeholder="+1 (555) 000-0000" />
                        <Field label="Website" field="website" type="url" placeholder="https://www.example.com" />
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
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleDelete} disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-500 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                            <button type="button" onClick={handleToggleActive} disabled={loading}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border transition-all disabled:opacity-50 ${
                                    formData.is_active 
                                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' 
                                    : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}>
                                <Check className="w-4 h-4" /> {formData.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
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

            {/* Related Contacts */}
            <RelatedSection
                title="Related Contacts"
                icon={User}
                count={linkedContacts.length}
                open={contactsOpen}
                onToggle={() => setContactsOpen(v => !v)}
                color="crm"
            >
                {linkedContacts.length === 0 ? (
                    <p className="px-6 py-5 text-sm text-muted-text">No contacts currently linked to this account.</p>
                ) : (
                    <div className="divide-y divide-border-subtle bg-background/30">
                        {linkedContacts.map(c => (
                            <Link key={c.id} href={`/dashboard/contacts/${c.id}`}
                                className="flex items-center gap-4 px-6 py-3 hover:bg-background-subtle/60 transition-colors group">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-crm-500/10 text-crm-500 text-sm font-bold shrink-0">
                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-crm-500 transition-colors">
                                        {c.first_name} {c.last_name}
                                    </p>
                                    {c.job_title && <p className="text-xs text-muted-text">{c.job_title}</p>}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-text shrink-0">
                                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                                </div>
                                <button type="button" onClick={(e) => handleUnlinkContact(e, c)}
                                    className="p-2 ml-2 text-muted-text hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                    title="Unlink Contact">
                                    <X className="w-4 h-4" />
                                </button>
                            </Link>
                        ))}
                    </div>
                )}
                {/* Add new link block */}
                <div className="p-4 bg-background-subtle/30 border-t border-border-subtle">
                    <div className="flex gap-3">
                        <select
                            value={selectedContactId}
                            onChange={e => setSelectedContactId(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">-- Select an existing contact to link --</option>
                            {unlinkedContactsList.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={!selectedContactId}
                            onClick={() => {
                                const c = allContacts.find(x => x.id.toString() === selectedContactId);
                                if (c) {
                                    handleLinkContact(c);
                                    setSelectedContactId('');
                                }
                            }}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-crm-500 rounded-xl hover:bg-crm-600 transition-all disabled:opacity-50 shrink-0"
                        >
                            Link
                        </button>
                    </div>
                </div>
            </RelatedSection>

            {/* Related Deposits */}
            <RelatedSection
                title="Related Deposits"
                icon={Package}
                count={linkedDeposits.length}
                open={depositsOpen}
                onToggle={() => setDepositsOpen(v => !v)}
                color="emerald"
            >
                {linkedDeposits.length === 0 ? (
                    <p className="px-6 py-5 text-sm text-muted-text">No deposits currently linked to this account.</p>
                ) : (
                    <div className="divide-y divide-border-subtle bg-background/30">
                        {linkedDeposits.map(d => (
                            <Link key={d.id} href={`/dashboard/deposits/${d.id}`}
                                className="flex items-center gap-4 px-6 py-3 hover:bg-background-subtle/60 transition-colors group">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 text-sm font-bold shrink-0">
                                    <Banknote className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                                        {d.product_name || d.reference_number}
                                    </p>
                                    <p className="text-xs text-muted-text">Ref: {d.reference_number}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        d.status === 'Cleared' ? 'bg-emerald-500/10 text-emerald-500' :
                                        d.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-red-500/10 text-red-500'
                                    }`}>
                                        {d.status}
                                    </span>
                                </div>
                                <button type="button" onClick={(e) => handleUnlinkDeposit(e, d)}
                                    className="p-2 ml-2 text-muted-text hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                    title="Unlink Deposit">
                                    <X className="w-4 h-4" />
                                </button>
                            </Link>
                        ))}
                    </div>
                )}
                {/* Add new link block */}
                <div className="p-4 bg-background-subtle/30 border-t border-border-subtle">
                    <div className="flex gap-3">
                        <select
                            value={selectedDepositId}
                            onChange={e => setSelectedDepositId(e.target.value)}
                            className={inputCls.replace('focus:border-crm-500/50 focus:ring-crm-500/10', 'focus:border-emerald-500/50 focus:ring-emerald-500/10')}
                        >
                            <option value="">-- Select an existing deposit to link --</option>
                            {unlinkedDepositsList.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.reference_number} - {d.product_name || `Deposit #${d.id}`}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={!selectedDepositId}
                            onClick={() => {
                                const d = allDeposits.find(x => x.id.toString() === selectedDepositId);
                                if (d) {
                                    handleLinkDeposit(d);
                                    setSelectedDepositId('');
                                }
                            }}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 shrink-0"
                        >
                            Link
                        </button>
                    </div>
                </div>
            </RelatedSection>
        </div>
    );
}
