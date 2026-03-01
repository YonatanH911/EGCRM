'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Plus, Search, MapPin, Database } from 'lucide-react';
import api from '@/lib/api';

interface Vault {
    id: number;
    name: string;
    location: string | null;
    capacity: string | null;
    status: string;
    created_at: string;
}

export default function VaultsPage() {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        const fetchVaults = async () => {
            try {
                const response = await api.get('/vaults/');
                setVaults(response.data);
            } catch (error) {
                console.error("Failed to load vaults:", error);
            } finally {
                setLoading(false);
            }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-green-100 text-green-800 border-green-200';
            case 'Locked': return 'bg-red-100 text-red-800 border-red-200';
            case 'Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-crm-600" />
                        Vaults
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage secure storage and asset repositories.</p>
                </div>
                <Link
                    href="/dashboard/vaults/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crm-600 hover:bg-crm-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crm-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Vault
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search vaults by name or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm transition-all shadow-sm"
                        />
                    </div>

                    <div className="w-full sm:w-auto min-w-[200px]">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white block w-full pl-3 pr-10 py-2 text-base border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm rounded-lg transition-all shadow-sm"
                        >
                            <option value="">All Statuses</option>
                            {uniqueStatuses.map(status => (
                                <option key={status as string} value={status as string}>{status as string}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Capacity
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Created At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Loading vaults...
                                    </td>
                                </tr>
                            ) : filteredVaults.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Shield className="h-12 w-12 text-slate-300 mb-4" />
                                            <p className="text-slate-500 text-sm">No vaults found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVaults.map((vault) => (
                                    <tr key={vault.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{vault.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(vault.status)}`}>
                                                {vault.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                {vault.location || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Database className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                {vault.capacity || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(vault.created_at).toLocaleDateString()}
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
