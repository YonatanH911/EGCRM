'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Briefcase, Plus, MoreHorizontal, ArrowRight, DollarSign, Calendar, Search } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];

const STATUS_STYLES: Record<string, { top: string; bg: string; badge: string; badgeTxt: string }> = {
    New: { top: '#6366f1', bg: 'rgba(99,102,241,0.06)', badge: 'rgba(99,102,241,0.15)', badgeTxt: '#a5b4fc' },
    Contacted: { top: '#3b82f6', bg: 'rgba(59,130,246,0.06)', badge: 'rgba(59,130,246,0.15)', badgeTxt: '#93c5fd' },
    Qualified: { top: '#10b981', bg: 'rgba(16,185,129,0.06)', badge: 'rgba(16,185,129,0.15)', badgeTxt: '#6ee7b7' },
    Lost: { top: '#ef4444', bg: 'rgba(239,68,68,0.06)', badge: 'rgba(239,68,68,0.15)', badgeTxt: '#fca5a5' },
};

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

    useEffect(() => { fetchLeads(); }, []);

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

    const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
                        <p className="text-xs text-slate-500">Track and manage your opportunities across stages.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
                    <div className="relative w-full sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search leads…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                            style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'; }}
                            onBlur={(e) => { e.currentTarget.style.border = inputStyle.border; }} />
                    </div>
                    <select value={filterLead} onChange={(e) => setFilterLead(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-slate-300 focus:outline-none w-full sm:w-32"
                        style={inputStyle}>
                        <option value="">All Leads</option>
                        <option value="has_value">Has Value</option>
                    </select>
                    <Link href="/dashboard/leads/new"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <Plus className="w-4 h-4" /> New Lead
                    </Link>
                </div>
            </div>

            {/* Kanban */}
            <div className="flex-1 overflow-x-auto pb-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading pipeline…</div>
                ) : (
                    <div className="flex h-full gap-4 min-w-max">
                        {STATUSES.map(status => {
                            const st = STATUS_STYLES[status];
                            const columnLeads = leadsByStatus(status);
                            const totalValue = columnLeads.reduce((acc, lead) => acc + (lead.value || 0), 0);

                            return (
                                <div key={status} className="w-72 flex flex-col rounded-2xl max-h-full overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${st.top}` }}>
                                    {/* Column header */}
                                    <div className="px-4 py-3.5 flex justify-between items-center border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-200 text-sm">{status}</h3>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                style={{ background: st.badge, color: st.badgeTxt }}>
                                                {columnLeads.length}
                                            </span>
                                        </div>
                                        {totalValue > 0 && (
                                            <span className="text-xs font-semibold text-slate-400">
                                                ${totalValue.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                                        {columnLeads.map(lead => (
                                            <div key={lead.id} className="rounded-xl p-4 group cursor-default transition-all duration-200 hover:-translate-y-0.5"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = st.top + '60'; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                                                <div className="flex justify-between items-start mb-2.5">
                                                    <h4 className="font-semibold text-slate-200 text-sm leading-snug">{lead.title}</h4>
                                                    <button className="text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1 text-emerald-400 font-semibold text-sm mb-3">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    {lead.value?.toLocaleString() || '0'}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-white/5">
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
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all duration-150"
                                                            style={{ background: st.badge, color: st.badgeTxt }}>
                                                            Advance <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {columnLeads.length === 0 && (
                                            <div className="text-center py-8 rounded-xl text-slate-600 text-sm"
                                                style={{ border: '1.5px dashed rgba(255,255,255,0.07)' }}>
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
