'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Search, MapPin, Database } from 'lucide-react';
import api from '@/lib/api';

interface Vault { id: number; name: string; location: string | null; capacity: string | null; status: string; created_at: string; }

const thCls = "px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Vaults</h1>
                        <p className="text-xs text-slate-500">Manage secure storage and asset repositories.</p>
                    </div>
                </div>
                <Link href="/dashboard/vaults/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Vault
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-white/5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search vaults by name or location…"
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
                        {uniqueStatuses.map(status => (<option key={status as string} value={status as string}>{status as string}</option>))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {['Name', 'Status', 'Location', 'Capacity', 'Created At'].map(h => (
                                    <th key={h} scope="col" className={thCls}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">Loading vaults…</td></tr>
                            ) : filteredVaults.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <Shield className="h-10 w-10 text-slate-700 mb-3" />
                                        <p className="text-slate-500 text-sm">No vaults found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredVaults.map((vault) => {
                                    const st = getStatusStyle(vault.status);
                                    return (
                                        <tr key={vault.id} className="cursor-pointer transition-all duration-150 group"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onClick={() => router.push(`/dashboard/vaults/${vault.id}`)}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                            <td className={tdCls}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                                                        <Shield className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-200">{vault.name}</span>
                                                </div>
                                            </td>
                                            <td className={tdCls}>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                                    {vault.status}
                                                </span>
                                            </td>
                                            <td className={tdCls}>
                                                <div className="flex items-center text-sm text-slate-400">
                                                    <MapPin className="mr-1.5 h-3.5 w-3.5 text-slate-600" />{vault.location || '—'}
                                                </div>
                                            </td>
                                            <td className={tdCls}>
                                                <div className="flex items-center text-sm text-slate-400">
                                                    <Database className="mr-1.5 h-3.5 w-3.5 text-slate-600" />{vault.capacity || '—'}
                                                </div>
                                            </td>
                                            <td className={`${tdCls} text-sm text-slate-500`}>
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
