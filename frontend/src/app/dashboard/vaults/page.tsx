'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Search, MapPin, Database } from 'lucide-react';
import api from '@/lib/api';

interface Vault { id: number; name: string; location: string | null; capacity: string | null; status: string; created_at: string; }

const thCls = "px-6 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
const tdCls = "px-6 py-4 whitespace-nowrap";

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Open': return { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' };
        case 'Locked': return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.25)' };
        case 'Maintenance': return { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.25)' };
        default: return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
    }
};

export default function VaultsPage() {
    const router = useRouter();
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        const fetchVaults = async () => {
            try { const response = await api.get('/vaults'); setVaults(response.data); }
            catch (error) { console.error("Failed to load vaults:", error); }
            finally { setLoading(false); }
        };
        fetchVaults();
    }, []);

    const uniqueStatuses = Array.from(new Set(vaults.map(v => v.status).filter(Boolean)));
    const filteredVaults = vaults.filter(vault => {
        const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vault.location && vault.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterStatus ? vault.status === filterStatus : true;
        return matchesSearch && matchesFilter;
    });

    const filterInputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Vaults</h1>
                        <p className="text-xs text-muted-text">Manage secure storage and asset repositories.</p>
                    </div>
                </div>
                <Link href="/dashboard/vaults/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Vault
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search vaults by name or location…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-foreground focus:outline-none sm:w-44 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                    >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(status => (<option key={status as string} value={status as string}>{status as string}</option>))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                            <tr>
                                {['Name', 'Status', 'Location', 'Capacity', 'Created At'].map(h => (
                                    <th key={h} scope="col" className={thCls}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-text text-sm">Loading vaults…</td></tr>
                            ) : filteredVaults.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center opacity-50">
                                        <Shield className="h-10 w-10 text-muted-text mb-3" />
                                        <p className="text-foreground text-sm font-semibold">No vaults found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredVaults.map((vault) => {
                                    const st = getStatusStyle(vault.status);
                                    return (
                                        <tr key={vault.id} className="cursor-pointer transition-colors duration-150 group hover:bg-black/5 dark:hover:bg-white/5"
                                            onClick={() => router.push(`/dashboard/vaults/${vault.id}`)}
                                        >
                                            <td className={tdCls}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                                                        <Shield className="h-4 w-4 text-indigo-500" />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground">{vault.name}</span>
                                                </div>
                                            </td>
                                            <td className={tdCls}>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                                    {vault.status}
                                                </span>
                                            </td>
                                            <td className={tdCls}>
                                                <div className="flex items-center text-sm text-muted-text">
                                                    <MapPin className="mr-1.5 h-3.5 w-3.5 text-muted-text" />{vault.location || '—'}
                                                </div>
                                            </td>
                                            <td className={tdCls}>
                                                <div className="flex items-center text-sm text-muted-text">
                                                    <Database className="mr-1.5 h-3.5 w-3.5 text-muted-text" />{vault.capacity || '—'}
                                                </div>
                                            </td>
                                            <td className={`${tdCls} text-sm text-muted-text`}>
                                                {new Date(vault.created_at).toLocaleDateString()}
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
