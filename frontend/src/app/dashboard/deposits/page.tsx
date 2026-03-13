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

const thCls = "px-3 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg">
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
                        <p className="text-xs text-muted-text">Track software and hardware deposits in secure vaults.</p>
                    </div>
                </div>
                <Link href="/dashboard/deposits/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Deposit
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="p-4 border-b border-border-subtle">
                    <div className="relative max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search by deposit number, supplier, version…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                            <tr>
                                <th className={thCls}><div className="flex items-center gap-1"><Package className="w-3 h-3" />Product Name</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Tag className="w-3 h-3" />Version</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><User className="w-3 h-3" />Supplier</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Date</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Shield className="w-3 h-3" />Vault</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Box className="w-3 h-3" />Box</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><Landmark className="w-3 h-3" />Ref #</div></th>
                                <th className={thCls}><div className="flex items-center gap-1"><User className="w-3 h-3" />Received By</div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-text text-sm">Loading deposits…</td></tr>
                            ) : filteredDeposits.length === 0 ? (
                                <tr><td colSpan={8} className="px-3 py-16 text-center">
                                    <div className="flex flex-col items-center opacity-50">
                                        <Landmark className="h-10 w-10 text-muted-text mb-3" />
                                        <p className="text-foreground text-sm font-semibold">No deposits found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="cursor-pointer transition-colors duration-150 group hover:bg-black/5 dark:hover:bg-white/5"
                                        onClick={() => router.push(`/dashboard/deposits/${deposit.id}`)}
                                    >
                                        <td className={tdCls}><div className="text-sm text-foreground max-w-[160px] truncate">{deposit.product_name || dash}</div></td>
                                        <td className={tdCls}><div className="text-sm text-foreground font-medium max-w-[120px] truncate">{deposit.version || dash}</div></td>
                                        <td className={tdCls}><div className="text-sm text-muted-text whitespace-nowrap">{deposit.supplier || dash}</div></td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-sm text-muted-text whitespace-nowrap">
                                                <Calendar className="mr-1 h-3.5 w-3.5 text-muted-text" />
                                                {deposit.date
                                                    ? new Date(deposit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-sm text-muted-text whitespace-nowrap">
                                                <Shield className="mr-1 h-3.5 w-3.5 text-muted-text" />
                                                {deposit.vault ? deposit.vault.name : dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}><div className="text-sm text-muted-text whitespace-nowrap">{deposit.box || dash}</div></td>
                                        <td className={tdCls}>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-semibold"
                                                style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                {deposit.reference_number}
                                            </span>
                                        </td>
                                        <td className={tdCls}><div className="text-sm text-muted-text whitespace-nowrap">{deposit.received_by || dash}</div></td>
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
