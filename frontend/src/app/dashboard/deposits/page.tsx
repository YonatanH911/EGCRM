'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Landmark, Plus, Search, Shield, Calendar, Package, Tag, User, Box } from 'lucide-react';
import api from '@/lib/api';

interface Vault {
    id: number;
    name: string;
}

interface Deposit {
    id: number;
    reference_number: string;
    date: string | null;
    vault: Vault | null;
    box: string | null;
    version: string | null;
    supplier: string | null;
    received_by: string | null;
    product_name: string | null;
}

export default function DepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDeposits = async () => {
            try {
                const response = await api.get('/deposits/');
                setDeposits(response.data);
            } catch (error) {
                console.error("Failed to load deposits:", error);
            } finally {
                setLoading(false);
            }
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-crm-600" />
                        Deposits
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Track software and hardware deposits in secure vaults.</p>
                </div>
                <Link
                    href="/dashboard/deposits/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crm-600 hover:bg-crm-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Deposit
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by deposit number, supplier, version..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Package className="w-3 h-3" />Product Name</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Tag className="w-3 h-3" />Version</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><User className="w-3 h-3" />Supplier</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Date Received</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Shield className="w-3 h-3" />Vault</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Box className="w-3 h-3" />Box</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Landmark className="w-3 h-3" />Deposit Number</div>
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><User className="w-3 h-3" />Received By</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-12 text-center text-slate-500">
                                        Loading deposits...
                                    </td>
                                </tr>
                            ) : filteredDeposits.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Landmark className="h-12 w-12 text-slate-300 mb-4" />
                                            <p className="text-slate-500 text-sm">No deposits found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                        {/* Product Name */}
                                        <td className="px-3 py-3">
                                            <div className="text-sm text-slate-700 max-w-[160px] truncate" title={deposit.product_name || ''}>
                                                {deposit.product_name || <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Version */}
                                        <td className="px-3 py-3">
                                            <div className="text-sm text-slate-900 font-medium max-w-[120px] truncate" title={deposit.version || ''}>
                                                {deposit.version || <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Supplier */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="text-sm text-slate-700">
                                                {deposit.supplier || <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Date Received */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Calendar className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-slate-400" />
                                                {deposit.date
                                                    ? new Date(deposit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Vault */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-700">
                                                <Shield className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-slate-400" />
                                                {deposit.vault ? deposit.vault.name : <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Box */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="text-sm text-slate-700">
                                                {deposit.box || <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
                                        {/* Deposit Number */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {deposit.reference_number}
                                            </span>
                                        </td>
                                        {/* Received By */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="text-sm text-slate-700">
                                                {deposit.received_by || <span className="text-slate-400 italic">—</span>}
                                            </div>
                                        </td>
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
