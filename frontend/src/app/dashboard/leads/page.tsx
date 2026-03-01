'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Briefcase, Plus, MoreHorizontal, ArrowRight, DollarSign, Calendar, Search } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];

export default function LeadsKanbanPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLead, setFilterLead] = useState('');

    const fetchLeads = async () => {
        try {
            const response = await api.get('/leads/');
            setLeads(response.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const moveLead = async (leadId: number, newStatus: string) => {
        try {
            await api.patch(`/leads/${leadId}/status?status=${newStatus}`);
            fetchLeads();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.title?.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesFilter = true;
        if (filterLead === 'has_value') matchesFilter = (lead.value && lead.value > 0);
        return matchesSearch && matchesFilter;
    });

    const leadsByStatus = (status: string) => filteredLeads.filter((l) => l.status === status);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0 mx-6 mt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
                        <p className="text-sm text-slate-500">Track and manage your opportunities across stages.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 sm:mt-0 items-center">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm transition-all shadow-sm"
                        />
                    </div>

                    <select
                        value={filterLead}
                        onChange={(e) => setFilterLead(e.target.value)}
                        className="bg-white block w-full sm:w-36 pl-3 pr-8 py-2 text-base border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm rounded-lg transition-all shadow-sm"
                    >
                        <option value="">All Leads</option>
                        <option value="has_value">Has Value</option>
                    </select>

                    <Link
                        href="/dashboard/leads/new"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-lg text-white bg-crm-600 hover:bg-crm-700 shadow-sm transition-colors text-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Lead
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-6 px-6">
                {loading ? (
                    <div className="flex h-full items-center justify-center p-8 text-slate-500">Loading pipeline...</div>
                ) : (
                    <div className="flex h-full gap-6 min-w-max">
                        {STATUSES.map(status => {
                            const columnLeads = leadsByStatus(status);
                            const totalValue = columnLeads.reduce((acc, lead) => acc + (lead.value || 0), 0);

                            return (
                                <div key={status} className="w-80 flex flex-col bg-slate-100 rounded-xl max-h-full">
                                    <div className="p-4 flex justify-between items-center border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-800">{status}</h3>
                                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                {columnLeads.length}
                                            </span>
                                        </div>
                                        {totalValue > 0 && (
                                            <span className="text-sm font-medium text-slate-500">
                                                ${totalValue.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {columnLeads.map(lead => (
                                            <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-crm-300 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-slate-900 leading-tight">{lead.title}</h4>
                                                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm mb-4">
                                                    <DollarSign className="w-3 h-3" />
                                                    {lead.value?.toLocaleString() || '0'}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </div>

                                                    {status !== 'Lost' && status !== 'Qualified' && (
                                                        <button
                                                            onClick={() => {
                                                                const nextStatus = STATUSES[STATUSES.indexOf(status) + 1];
                                                                if (nextStatus) moveLead(lead.id, nextStatus);
                                                            }}
                                                            className="flex items-center gap-1 text-crm-600 hover:text-crm-800 font-medium bg-crm-50 px-2 py-1 rounded"
                                                        >
                                                            Advance <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {columnLeads.length === 0 && (
                                            <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                                No leads in this stage
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
