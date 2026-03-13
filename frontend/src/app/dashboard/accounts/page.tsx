'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Plus, Search, Building, Loader2 } from 'lucide-react';
import { usePreferences } from '@/components/PreferencesProvider';

/* ── shared dark-table helpers ── */
const thCls = "px-6 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
const tdCls = "px-6 py-4 whitespace-nowrap";

export default function AccountsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('');
    const { isRTL } = usePreferences();

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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
                        <p className="text-xs text-muted-text">Manage client organizations and companies.</p>
                    </div>
                </div>
                <Link href="/dashboard/accounts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-crm-500 hover:bg-crm-600 shadow-lg shadow-crm-500/20 transition-transform hover:-translate-y-0.5 duration-200">
                    <Plus className="w-4 h-4" /> Add Account
                </Link>
            </div>

            {/* Card */}
            <div className="rounded-2xl overflow-hidden glass-card">
                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text`} />
                        <input type="text" placeholder="Search names or industries…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10`}
                        />
                    </div>
                    <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-foreground focus:outline-none transition-all sm:w-48 bg-background-subtle border border-border-subtle focus:border-crm-500/50 focus:ring-4 focus:ring-crm-500/10">
                        <option value="">All Industries…</option>
                        {uniqueIndustries.map(ind => (
                            <option key={ind as string} value={ind as string}>{ind as string}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-subtle">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-crm-500" />
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-background-subtle flex items-center justify-center mb-4 border border-border-subtle shadow-inner">
                                <Building className="w-8 h-8 text-muted-text opacity-50" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">No accounts found</h3>
                            <p className="text-muted-text mt-1 text-sm max-w-[250px]">Get started by creating a new organization record.</p>
                            <Link href="/dashboard/accounts/new" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-crm-500 font-bold text-sm bg-crm-500/10 hover:bg-crm-500/20 transition-all">
                                Create Account <Plus className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="border-b border-border-subtle bg-background-subtle/30">
                                <tr>
                                    {['Account Name', 'Industry', 'Street', 'City', 'State / Prov', 'ZIP', 'Country', 'Phone / Website', 'Created'].map(h => (
                                        <th key={h} scope="col" className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {filteredAccounts.map((account) => (
                                    <tr key={account.id}
                                        onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                                        className="cursor-pointer group transition-colors duration-150 hover:bg-background-subtle/50"
                                    >
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm bg-gradient-to-br from-crm-500 to-blue-500">
                                                    {account.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-foreground group-hover:text-crm-500 transition-colors">{account.name}</span>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-sm text-foreground">{account.industry || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.street || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.city || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.state_or_province || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.zip_code || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.country || '—'}</span></td>
                                        <td className={tdCls}>
                                            <div className="text-sm text-foreground">{account.phone || '—'}</div>
                                            {account.website && (
                                                <div className="text-[11px] text-crm-500 hover:text-crm-600 mt-0.5 font-semibold">
                                                    <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Website ↗</a>
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${tdCls} ltr:text-right rtl:text-left text-sm text-muted-text font-medium`}>
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
