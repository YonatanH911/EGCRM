'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Plus, Search, Building } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';

const thCls = "px-6 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
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
        const matchesSearch = account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterIndustry ? account.industry === filterIndustry : true;
        return matchesSearch && matchesFilter;
    });

    // Sort accounts: active first, deactivated last, then by created_at descending
    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        const aActive = a.is_active !== false;
        const bActive = b.is_active !== false;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const handleReactivate = async (e: React.MouseEvent, accountId: number) => {
        e.stopPropagation();
        try {
            await api.patch(`/accounts/${accountId}/reactivate`);
            setAccounts(accounts.map(a => a.id === accountId ? { ...a, is_active: true } : a));
        } catch (error) {
            console.error("Failed to reactivate account", error);
        }
    };

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
                        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
                        <p className="text-xs text-muted-text">Manage client organizations and companies.</p>
                    </div>
                </div>
                <Link href="/dashboard/accounts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> Add Account
                </Link>
            </div>

            {/* Card */}
            <div className="rounded-2xl overflow-hidden glass-card">
                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search names or industries…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <SearchableDropdown
                            value={filterIndustry}
                            onChange={setFilterIndustry}
                            placeholder="All Industries..."
                            className="px-3 py-2 text-sm rounded-xl text-foreground focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                            options={[
                                { value: '', label: 'All Industries...' },
                                ...uniqueIndustries.map(ind => ({ value: String(ind), label: String(ind) })),
                            ]}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-muted-text text-sm">Loading accounts…</div>
                    ) : sortedAccounts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <Building className="w-10 h-10 text-muted-text mb-3 opacity-50" />
                            <h3 className="text-base font-semibold text-foreground">No accounts found</h3>
                            <p className="text-muted-text mt-1 text-sm">Get started by creating a new account.</p>
                            <Link href="/dashboard/accounts/new" className="mt-5 text-indigo-500 font-medium text-sm hover:text-indigo-400 transition-colors">
                                Create Account →
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                                <tr>
                                    {['Account Name', 'Industry', 'Street', 'City', 'Country', 'Actions'].map(h => (
                                        <th key={h} scope="col" className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {sortedAccounts.map((account) => {
                                    const isActive = account.is_active !== false;
                                    const rowStyle = isActive ? {} : { opacity: 0.5, filter: 'grayscale(100%)' };
                                    return (
                                    <tr key={account.id}
                                        onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                                        className="cursor-pointer group transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                                        style={rowStyle}
                                    >
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm"
                                                    style={{ background: isActive ? 'linear-gradient(135deg, #6366f1, #3b82f6)' : '#64748b' }}>
                                                    {account.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{account.name || 'Unnamed'}</span>
                                                    {!isActive && <span className="text-[10px] text-muted-text uppercase tracking-wider">Inactive</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.industry || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.street || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.city || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{account.country || '—'}</span></td>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-2">
                                                {!isActive && (
                                                    <button onClick={(e) => handleReactivate(e, account.id)}
                                                        className="px-3 py-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20 uppercase tracking-widest">
                                                        Reactivate
                                                    </button>
                                                )}
                                                <span className="text-xs text-muted-text">
                                                    {new Date(account.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
