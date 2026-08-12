'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Plus, Search, Shield, Calendar, Package, Tag, User, Box, CheckSquare } from 'lucide-react';
import api from '@/lib/api';
import ScrollableTable from '@/components/ScrollableTable';
import CopyButton from '@/components/CopyButton';
import ColumnFilter from '@/components/ColumnFilter';
import { ColumnFilters, matchesColumnFilters } from '@/lib/columnFilters';
import SortControl from '@/components/SortControl';
import { compareSortValues, dateSortValue, SortDirection } from '@/lib/sorting';

interface Vault { id: number; name: string; }
interface Deposit {
    id: number; reference_number: string; date: string | null;
    vault: Vault | null; is_confirmation_sent: boolean | null; version: string | null;
    supplier: string | null; received_by: string | null; product_name: string | null; status: string;
    created_at: string; date_report_sent: string | null; is_active?: boolean;
}

const formatDepositDate = (date: string | null) => date
    ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

const depositColumns = [
    { key: 'productName', label: 'Product Name', icon: Package },
    { key: 'version', label: 'Version', icon: Tag },
    { key: 'supplier', label: 'Supplier', icon: User },
    { key: 'date', label: 'Date', icon: Calendar },
    { key: 'vault', label: 'Vault', icon: Shield },
    { key: 'depositNumber', label: 'Deposit number', icon: Landmark },
    { key: 'status', label: 'Verification Status', icon: CheckSquare },
];

const thCls = "px-3 py-3.5 ltr:text-left rtl:text-right text-base font-bold text-muted-text uppercase tracking-widest";
const tdCls = "px-3 py-3.5";

export default function DepositsPage() {
    const router = useRouter();
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});

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
        const matchesSearch = (
            (deposit.reference_number || '').toLowerCase().includes(q) ||
            (deposit.supplier || '').toLowerCase().includes(q) ||
            (deposit.version || '').toLowerCase().includes(q) ||
            (deposit.vault?.name || '').toLowerCase().includes(q) ||
            (deposit.received_by || '').toLowerCase().includes(q)
        );
        const matchesColumns = matchesColumnFilters(columnFilters, {
            productName: deposit.product_name,
            version: deposit.version,
            supplier: deposit.supplier,
            date: formatDepositDate(deposit.date),
            vault: deposit.vault?.name,
            depositNumber: deposit.reference_number,
            status: deposit.status || 'Pending',
        });
        return matchesSearch && matchesColumns;
    });

    const sortedDeposits = [...filteredDeposits].sort((a, b) => {
        if (sortBy === 'active') {
            return compareSortValues(a.is_active !== false, b.is_active !== false, sortDirection);
        }
        if (sortBy === 'date') {
            return compareSortValues(dateSortValue(a.date), dateSortValue(b.date), sortDirection);
        }
        if (sortBy === 'date_report_sent') {
            return compareSortValues(dateSortValue(a.date_report_sent), dateSortValue(b.date_report_sent), sortDirection);
        }
        return compareSortValues(dateSortValue(a.created_at), dateSortValue(b.created_at), sortDirection);
    });

    const dash = <span className="text-slate-600 italic">—</span>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg">
                        <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold text-foreground">Deposits</h1>
                        <p className="text-lg text-muted-text">Track software and hardware deposits in secure vaults.</p>
                    </div>
                </div>
                <Link href="/dashboard/deposits/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xl font-semibold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> New Deposit
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search by deposit number, supplier, version…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xl rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                    <SortControl
                        value={sortBy}
                        onChange={setSortBy}
                        direction={sortDirection}
                        onDirectionChange={setSortDirection}
                        options={[
                            { value: 'created_at', label: 'Date Created' },
                            { value: 'active', label: 'Active' },
                            { value: 'date', label: 'Date Received' },
                            { value: 'date_report_sent', label: 'Date Report Sent' },
                        ]}
                    />
                </div>

                <ScrollableTable>
                    <table className="min-w-full">
                        <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                            <tr>
                                {depositColumns.map(({ key, label, icon: Icon }) => (
                                    <th key={key} className={thCls}>
                                        <div className="flex items-center gap-1">
                                            <Icon className="h-3 w-3" />
                                            <span>{label}</span>
                                            <ColumnFilter
                                                label={label}
                                                value={columnFilters[key] || ''}
                                                onChange={value => setColumnFilters(current => ({ ...current, [key]: value }))}
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-text text-xl">Loading deposits…</td></tr>
                            ) : sortedDeposits.length === 0 ? (
                                <tr><td colSpan={7} className="px-3 py-16 text-center">
                                    <div className="flex flex-col items-center opacity-50">
                                        <Landmark className="h-10 w-10 text-muted-text mb-3" />
                                        <p className="text-foreground text-xl font-semibold">No deposits found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                sortedDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="cursor-pointer transition-colors duration-150 group hover:bg-black/5 dark:hover:bg-white/5"
                                        onClick={() => router.push(`/dashboard/deposits/${deposit.id}`)}
                                    >
                                        <td className={tdCls}><div className="text-xl text-foreground max-w-[160px] truncate">{deposit.product_name || dash}</div></td>
                                        <td className={tdCls}><div className="text-xl text-foreground font-medium max-w-[120px] truncate">{deposit.version || dash}</div></td>
                                        <td className={tdCls}><div className="text-xl text-muted-text whitespace-nowrap">{deposit.supplier || dash}</div></td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-xl text-muted-text whitespace-nowrap">
                                                <Calendar className="mr-1 h-3.5 w-3.5 text-muted-text" />
                                                {formatDepositDate(deposit.date) || dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <div className="flex items-center text-xl text-muted-text whitespace-nowrap">
                                                <Shield className="mr-1 h-3.5 w-3.5 text-muted-text" />
                                                {deposit.vault ? deposit.vault.name : dash}
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-lg font-mono font-semibold"
                                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                    {deposit.reference_number}
                                                </span>
                                                <CopyButton value={deposit.reference_number} label="Copy deposit number" />
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-lg font-semibold ${
                                                deposit.status === 'Cleared' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                deposit.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`} style={{ border: '1px solid' }}>
                                                {deposit.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </ScrollableTable>
            </div>
        </div>
    );
}
