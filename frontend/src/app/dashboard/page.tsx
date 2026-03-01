'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users2, Building, Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
    const [stats, setStats] = useState({
        accounts: 0,
        contacts: 0,
        leads: 0,
        pipelineValue: 0
    });
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

                setStats({
                    accounts: accRes.data.length,
                    contacts: conRes.data.length,
                    leads: leads.length,
                    pipelineValue
                });

                // Get 5 most recent leads
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
        return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-crm-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-sm text-slate-500">Welcome back. Here's what's happening with your pipeline today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/leads" className="bg-crm-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-crm-700 transition shadow-sm">
                        + New Lead
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Accounts</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.accounts}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Building className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Contacts</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.contacts}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Leads</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.leads}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Est. Pipeline Value</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">${stats.pipelineValue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <TrendingUp className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">Pipeline Chart coming soon</p>
                    <p className="text-xs text-slate-400 mt-1">Requires additional charting library setup.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Recent Leads</h3>
                    </div>
                    <div className="p-4 flex-1">
                        {recentLeads.length > 0 ? (
                            <div className="space-y-4">
                                {recentLeads.map((lead) => (
                                    <div key={lead.id} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{lead.title}</p>
                                            <p className="text-xs text-slate-500">{lead.status} • ${lead.value?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-sm text-slate-500">No recent leads found.</p>
                                <Link href="/dashboard/leads" className="text-sm text-crm-600 font-medium mt-2 hover:underline">
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
