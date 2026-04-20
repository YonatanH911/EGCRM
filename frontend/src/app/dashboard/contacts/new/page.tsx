'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users2, ArrowLeft, Loader2 } from 'lucide-react';

export default function NewContactPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        job_title: '',
        email: '',
        phone: '',
        company_name: '',
        description: '',
        account_id: ''
    });

    useEffect(() => {
        // Fetch accounts to populate the dropdown
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts');
                setAccounts(response.data);
            } catch (err) {
                console.error("Failed to fetch accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            account_id: formData.account_id ? parseInt(formData.account_id) : null,
        };

        try {
            await api.post('/contacts', payload);
            router.push('/dashboard/contacts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create contact');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/contacts" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-text ltr:mr-0 rtl:rotate-180" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Contact</h1>
                    <p className="text-sm text-muted-text">Add a new person to your network</p>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden border border-border-subtle">
                <div className="bg-black/5 dark:bg-white/5 p-6 border-b border-border-subtle flex items-center gap-3">
                    <Users2 className="w-6 h-6 text-muted-text" />
                    <h2 className="text-lg font-medium text-foreground">Contact Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-500/10 rounded-md border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Core Details */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">First Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Last Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Job Title</label>
                            <input
                                type="text"
                                value={formData.job_title}
                                placeholder="e.g. Sales Director"
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm placeholder-muted-text"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                            <input
                                type="text"
                                value={formData.company_name}
                                placeholder="e.g. Acme Corp"
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm placeholder-muted-text"
                            />
                        </div>

                        {/* Contact Info */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* CRM Relations */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Associated Account</label>
                            <select
                                value={formData.account_id}
                                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm *:bg-background *:text-foreground"
                            >
                                <option value="">-- No Account --</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>



                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Description / Notes</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-border-subtle bg-black/5 dark:bg-white/5 text-foreground rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm resize-none placeholder-muted-text"
                                placeholder="Write detailed notes about this contact here..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle flex justify-end gap-3">
                        <Link
                            href="/dashboard/contacts"
                            className="px-5 py-2.5 text-sm font-medium text-foreground bg-black/5 dark:bg-white/5 border border-border-subtle rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-crm-600 rounded-lg hover:bg-crm-700 focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
