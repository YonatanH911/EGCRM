'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users2, Building, Briefcase, DollarSign, Landmark, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CopyButton from '@/components/CopyButton';

interface DashboardDeposit {
    id: number;
    reference_number: string;
    product_name?: string | null;
    supplier?: string | null;
    date?: string | null;
    created_at: string;
    status: string;
    is_active?: boolean;
}

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
    const [openDeposits, setOpenDeposits] = useState<DashboardDeposit[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [accRes, conRes, leadRes, depositRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/contacts'),
                    api.get('/leads'),
                    api.get('/deposits'),
                ]);
                const leads = leadRes.data;
                const pipelineValue = leads.reduce((acc: number, lead: any) => acc + (lead.value || 0), 0);
                setStats({ accounts: accRes.data.length, contacts: conRes.data.length, leads: leads.length, pipelineValue });
                setRecentLeads(leads.slice(-5).reverse());
                setOpenDeposits(
                    (depositRes.data as DashboardDeposit[])
                        .filter(deposit => deposit.status === 'Open' && deposit.is_active !== false)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                );
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
                    <h1 className="text-5xl font-bold text-foreground">Dashboard <span className="gradient-text">Overview</span></h1>
                    <p className="text-xl text-muted-text mt-0.5">Welcome back. Here's what's happening with your pipeline today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/leads"
                        className="flex items-center gap-2 px-4 py-2 text-xl font-semibold text-white rounded-xl transition-all duration-200 shadow-lg"
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
                        <div key={key} className="glass-card rounded-2xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
                            {/* glow blob */}
                            <div className="absolute -bottom-4 ltr:-right-4 rtl:-left-4 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none"
                                style={{ background: glow }} />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-lg font-semibold text-muted-text uppercase tracking-wider">{label}</p>
                                    <h3 className="text-5xl font-bold text-foreground mt-1.5">
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
                {/* Open Deposits */}
                <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col glass-card">
                    <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <Landmark className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <h3 className="font-semibold text-foreground text-xl">Open Deposits</h3>
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-base font-semibold text-amber-500">
                                {openDeposits.length}
                            </span>
                        </div>
                        <Link href="/dashboard/deposits" className="text-lg text-indigo-500 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></span>
                        </Link>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                        {openDeposits.length > 0 ? (
                            <div className="divide-y divide-border-subtle">
                                {openDeposits.map(deposit => (
                                    <div key={deposit.id} className="flex items-center gap-3 px-5 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <Link href={`/dashboard/deposits/${deposit.id}`} className="grid min-w-0 flex-1 grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-xl font-medium text-foreground">{deposit.product_name || 'Untitled deposit'}</p>
                                                <p className="truncate text-lg text-muted-text">{deposit.reference_number}</p>
                                            </div>
                                            <p className="truncate text-lg text-muted-text">{deposit.supplier || 'No supplier'}</p>
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-lg text-muted-text">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {deposit.date ? new Date(deposit.date).toLocaleDateString('en-GB') : 'No date'}
                                            </span>
                                        </Link>
                                        <CopyButton value={deposit.reference_number} label="Copy deposit number" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-8 text-center">
                                <Landmark className="mb-3 h-9 w-9 text-muted-text opacity-40" />
                                <p className="text-xl text-muted-text">No open deposits.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="rounded-2xl overflow-hidden flex flex-col glass-card">
                    <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-xl">Recent Leads</h3>
                        <Link href="/dashboard/leads" className="text-lg text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                            View all →
                        </Link>
                    </div>
                    <div className="p-4 flex-1">
                        {recentLeads.length > 0 ? (
                            <div className="space-y-3">
                                {recentLeads.map((lead) => (
                                    <div key={lead.id} className="flex justify-between items-center py-2.5 border-b border-border-subtle last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-xl font-medium text-foreground">{lead.title}</p>
                                            <p className="text-lg text-muted-text mt-0.5">{lead.status} · ${lead.value?.toLocaleString()}</p>
                                        </div>
                                        <span className="text-lg px-2 py-0.5 rounded-full font-medium text-crm-600 dark:text-crm-300 bg-crm-500/15 border border-crm-500/25">
                                            {lead.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                <p className="text-xl text-muted-text">No recent leads found.</p>
                                <Link href="/dashboard/leads" className="text-xl text-indigo-500 font-medium mt-2 hover:text-indigo-400 transition-colors">
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
