'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Plus, Search, Shield, Calendar, Package, Tag, User, Box } from 'lucide-react';
import api from '@/lib/api';

interface Vault { id: number; name: string; }
interface Deposit {
    id: number; reference_number: string; date: string | null;
    vault: Vault | null; box: string | null; version: string | null;
    supplier: string | null; received_by: string | null; product_name: string | null;
}

const thCls = "px-3 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";
const tdCls = "px-3 py-3.5";

export default function DepositsPage() {
    const router = useRouter();
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDeposits = async () => {
            try { const response = await api.get('/deposits'); setDeposits(response.data); }
            catch (error) { console.error("Failed to load deposits:", error); }
            finally { setLoading(false); }
        };
        fetchDeposits();
    }, []);

    const filteredDeposits = deposits.filter(deposit => {
        const q = searchQuery.toLowerCase();
        return (
            (deposit.reference_number || '').toLowerCase().includes(q) ||
            (deposit.supplier || '').toLowerCase().includes(q) ||
            (deposit.version || '').toLowerCase().includes(q) ||
            (deposit.vault?.name || '').toLowerCase().includes(q) ||
            (deposit.received_by || '').toLowerCase().includes(q)
        );
    });

    const filterInputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
    const dash = <span className="text-slate-600 italic">—</span>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Deposits</h1>
                        <p className="text-xs text-slate-500">Track software and hardware deposits in secure vaults.</p>
                    </div>
                </div>
                <Link href="/dashboard/deposits/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Deposit
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-4 border-b border-white/5">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search by deposit number, supplier, version…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                            style={filterInputStyle}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'; }}
                            onBlur={(e) => { e.currentTarget.style.border = filterInputStyle.border; }} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th className={thCls}><div className="flex items-center gap-1"><Package className="w-3 h-3" />Product Name</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Tag className="w-3 h-3" />Version</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><User className="w-3 h-3" />Supplier</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Date Received</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Shield className="w-3 h-3" />Vault</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Box className="w-3 h-3" />Box</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Landmark className="w-3 h-3" />Deposit Number</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><User className="w-3 h-3" />Received By</div></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-500 text-sm">Loading deposits…</td></tr>
                            ) : filteredDeposits.length === 0 ? (
                                <tr><td colSpan={8} className="px-3 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <Landmark className="h-10 w-10 text-slate-700 mb-3" />
                                        <p className="text-slate-500 text-sm">No deposits found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="cursor-pointer transition-all duration-150 group"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onClick={() => router.push(`/dashboard/deposits/${deposit.id}`)}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.06)'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                        <td className={tdCls}><div className="text-sm text-slate-300 max-w-[160px] truncate">{deposit.product_name || dash}</div></td>
                                        <td className={tdCls}><div className="text-sm text-slate-200 font-medium max-w-[120px] truncate">{deposit.version || dash}</div></td>
                                        <td className={tdCls}><div className="text-sm text-slate-300 whitespace-nowrap">{deposit.supplier || dash}</div></td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-sm text-slate-400 whitespace-nowrap">
                                                <Calendar className="mr-1 h-3.5 w-3.5 text-slate-600" />
                                                {deposit.date
                                                    ? new Date(deposit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-sm text-slate-300 whitespace-nowrap">
                                                <Shield className="mr-1 h-3.5 w-3.5 text-slate-600" />
                                                {deposit.vault ? deposit.vault.name : dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}><div className="text-sm text-slate-300 whitespace-nowrap">{deposit.box || dash}</div></td>
                                        <td className={tdCls}>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-semibold"
                                                style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                {deposit.reference_number}
                                            </span>
                                        </td>
                                        <td className={tdCls}><div className="text-sm text-slate-300 whitespace-nowrap">{deposit.received_by || dash}</div></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
