'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users2, Building, Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

const STAT_CARDS = [
    { key: 'accounts', label: 'Total Accounts', icon: Building, gradient: 'from-blue-600 to-cyan-500', glow: 'rgba(59,130,246,0.25)' },
    { key: 'contacts', label: 'Total Contacts', icon: Users2, gradient: 'from-violet-600 to-purple-500', glow: 'rgba(139,92,246,0.25)' },
    { key: 'leads', label: 'Active Leads', icon: Briefcase, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.25)' },
    { key: 'pipelineValue', label: 'Est. Pipeline Value', icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.25)', isCurrency: true },
];

export default function DashboardOverview() {
    const [stats, setStats] = useState({ accounts: 0, contacts: 0, leads: 0, pipelineValue: 0 });
    const [loading, setLoading] = useState(true);
    const [recentLeads, setRecentLeads] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [accRes, conRes, leadRes] = await Promise.all([
                    api.get('/accounts/'),
                    api.get('/contacts/'),
                    api.get('/leads/')
                ]);
                const leads = leadRes.data;
                const pipelineValue = leads.reduce((acc: number, lead: any) => acc + (lead.value || 0), 0);
                setStats({ accounts: accRes.data.length, contacts: conRes.data.length, leads: leads.length, pipelineValue });
                setRecentLeads(leads.slice(-5).reverse());
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard <span className="gradient-text">Overview</span></h1>
                    <p className="text-sm text-slate-500 mt-0.5">Welcome back. Here's what's happening with your pipeline today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/leads"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        + New Lead
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {STAT_CARDS.map(({ key, label, icon: Icon, gradient, glow, isCurrency }) => {
                    const val = stats[key as keyof typeof stats];
                    return (
                        <div key={key} className="rounded-2xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}>
                            {/* glow blob */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none"
                                style={{ background: glow }} />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                                    <h3 className="text-2xl font-bold text-white mt-1.5">
                                        {isCurrency ? `$${val.toLocaleString()}` : val}
                                    </h3>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Chart placeholder */}
                <div className="lg:col-span-2 rounded-2xl flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <TrendingUp className="w-12 h-12 text-indigo-500/20 mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Pipeline Chart coming soon</p>
                    <p className="text-xs text-slate-600 mt-1">Requires additional charting library setup.</p>
                </div>

                {/* Recent Leads */}
                <div className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-white text-sm">Recent Leads</h3>
                        <Link href="/dashboard/leads" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            View all →
                        </Link>
                    </div>
                    <div className="p-4 flex-1">
                        {recentLeads.length > 0 ? (
                            <div className="space-y-3">
                                {recentLeads.map((lead) => (
                                    <div key={lead.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{lead.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{lead.status} · ${lead.value?.toLocaleString()}</p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                                            {lead.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                <p className="text-sm text-slate-500">No recent leads found.</p>
                                <Link href="/dashboard/leads" className="text-sm text-indigo-400 font-medium mt-2 hover:text-indigo-300 transition-colors">
                                    Create your first lead
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
