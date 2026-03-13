'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Plus, Search, Building } from 'lucide-react';

/* ── shared dark-table helpers ── */
const thCls = "px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";
const tdCls = "px-6 py-4 whitespace-nowrap";

export default function AccountsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts');
                setAccounts(response.data);
            } catch (error) {
                console.error("Failed to fetch accounts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const uniqueIndustries = Array.from(new Set(accounts.map(a => a.industry).filter(Boolean)));

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterIndustry ? account.industry === filterIndustry : true;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Accounts</h1>
                        <p className="text-xs text-slate-500">Manage client organizations and companies.</p>
                    </div>
                </div>
                <Link href="/dashboard/accounts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> Add Account
                </Link>
            </div>

            {/* Card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-white/5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search names or industries…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'; }}
                            onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }} />
                    </div>
                    <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-slate-300 focus:outline-none transition-all sm:w-48"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <option value="">All Industries…</option>
                        {uniqueIndustries.map(ind => (
                            <option key={ind as string} value={ind as string}>{ind as string}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 text-sm">Loading accounts…</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <Building className="w-10 h-10 text-slate-700 mb-3" />
                            <h3 className="text-base font-semibold text-slate-400">No accounts found</h3>
                            <p className="text-slate-600 mt-1 text-sm">Get started by creating a new account.</p>
                            <Link href="/dashboard/accounts/new" className="mt-5 text-indigo-400 font-medium text-sm hover:text-indigo-300 transition-colors">
                                Create Account →
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    {['Account Name', 'Industry', 'Street', 'City', 'State / Prov', 'ZIP', 'Country', 'Phone / Website', 'Created'].map(h => (
                                        <th key={h} scope="col" className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map((account) => (
                                    <tr key={account.id}
                                        onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                                        className="cursor-pointer group transition-all duration-150"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                                                    {account.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-200">{account.name}</span>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.industry || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.street || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.city || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.state_or_province || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.zip_code || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{account.country || '—'}</span></td>
                                        <td className={tdCls}>
                                            <div className="text-sm text-slate-300">{account.phone || '—'}</div>
                                            {account.website && (
                                                <div className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5">
                                                    <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                                        target="_blank" rel="noopener noreferrer">Website ↗</a>
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${tdCls} text-right text-sm text-slate-500`}>
                                            {new Date(account.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
