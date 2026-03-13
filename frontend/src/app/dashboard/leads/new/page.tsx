'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Briefcase, ArrowLeft, Loader2 } from 'lucide-react';

export default function NewLeadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        value: '',
        status: 'New',
        contact_id: ''
    });

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await api.get('/contacts');
                setContacts(response.data);
            } catch (err) {
                console.error("Failed to fetch contacts", err);
            }
        };
        fetchContacts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            value: formData.value ? parseFloat(formData.value) : 0,
            contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
        };

        try {
            await api.post('/leads', payload);
            router.push('/dashboard/leads');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create lead');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/leads" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors bg-black/5 dark:bg-white/5">
                    <ArrowLeft className="w-5 h-5 text-muted-text ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Lead</h1>
                    <p className="text-sm text-muted-text">Create a new sales opportunity for the pipeline</p>
                </div>
            </div>

            <div className="glass-card border border-border-subtle rounded-xl shadow-sm overflow-hidden">
                <div className="bg-black/5 dark:bg-white/5 p-6 border-b border-border-subtle flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-muted-text" />
                    <h2 className="text-lg font-medium text-foreground">Lead Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Opportunity Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm placeholder-muted-text"
                                placeholder="e.g. Q3 Enterprise Server Upgrade"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Estimated Value ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm placeholder-muted-text"
                                placeholder="25000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Initial Stage</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm *:bg-background"
                            >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Primary Contact</label>
                            <select
                                value={formData.contact_id}
                                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm *:bg-background"
                            >
                                <option value="">-- Unassigned --</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle flex justify-end gap-3">
                        <Link
                            href="/dashboard/leads"
                            className="px-5 py-2.5 text-sm font-medium text-foreground bg-black/5 dark:bg-white/5 border border-border-subtle rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-crm-600 rounded-lg hover:bg-crm-700 focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
