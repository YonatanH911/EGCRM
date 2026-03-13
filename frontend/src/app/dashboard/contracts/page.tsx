'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FileText, Plus, Search, Building2, Calendar,
} from 'lucide-react';
import api from '@/lib/api';

interface Account { id: number; name: string; }
interface Contract {
    id: number; title: string; status: string; value: number; currency: string | null;
    start_date: string | null; end_date: string | null; account: Account | null; created_at: string;
}

const thCls = "px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Active': return { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' };
        case 'Draft': return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
        case 'Expired': return { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.25)' };
        case 'Terminated': return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.25)' };
        default: return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
    }
};

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;

const formatCurrency = (value: number, currency: string | null) => {
    const cur = currency || 'USD';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(value); }
    catch { return `${cur} ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`; }
};

export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get('/contracts');
                setContracts(res.data);
            } catch (error) { console.error('Failed to load contracts:', error); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    const uniqueStatuses = Array.from(new Set(contracts.map(c => c.status).filter(Boolean)));
    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (contract.account?.name && contract.account.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterStatus ? contract.status === filterStatus : true;
        return matchesSearch && matchesFilter;
    });

    const filterInputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Contracts</h1>
                        <p className="text-xs text-slate-500">Manage formal agreements and service records.</p>
                    </div>
                </div>
                <Link href="/dashboard/contracts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Contract
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-white/5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search contracts or accounts…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                            style={filterInputStyle}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'; }}
                            onBlur={(e) => { e.currentTarget.style.border = filterInputStyle.border; }} />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-slate-300 focus:outline-none sm:w-44"
                        style={filterInputStyle}>
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {['Title', 'Status', 'Account', 'Value', 'Dates'].map((h, i) => (
                                    <th key={i} scope="col" className={thCls}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">Loading contracts…</td></tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <FileText className="h-10 w-10 text-slate-700 mb-3" />
                                        <p className="text-slate-500 text-sm">No contracts found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredContracts.map((contract) => {
                                    const sc = getStatusColor(contract.status);
                                    return (
                                        <tr key={contract.id}
                                            className="cursor-pointer group transition-all duration-150"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                                                        <FileText className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-200">{contract.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                    {contract.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-slate-400">
                                                    <Building2 className="mr-1.5 h-4 w-4 text-slate-600" />
                                                    {contract.account ? contract.account.name : '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-slate-200">
                                                    {formatCurrency(contract.value, contract.currency)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {contract.start_date || contract.end_date ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                                        {formatDate(contract.start_date) || 'N/A'} – {formatDate(contract.end_date) || 'N/A'}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                        </tr>
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
