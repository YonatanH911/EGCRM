'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Building2, ArrowLeft, Loader2, Trash2 } from 'lucide-react';

export default function EditAccountPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        website: '',
        phone: '',
        street: '',
        city: '',
        state_or_province: '',
        zip_code: '',
        country: '',
    });

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const response = await api.get(`/accounts/${accountId}`);
                const data = response.data;
                setFormData({
                    name: data.name || '',
                    industry: data.industry || '',
                    website: data.website || '',
                    phone: data.phone || '',
                    street: data.street || '',
                    city: data.city || '',
                    state_or_province: data.state_or_province || '',
                    zip_code: data.zip_code || '',
                    country: data.country || '',
                });
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch account details');
            } finally {
                setInitialLoading(false);
            }
        };

        if (accountId) {
            fetchAccount();
        }
    }, [accountId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.put(`/accounts/${accountId}`, formData);
            router.push('/dashboard/accounts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update account');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;
        setLoading(true);
        setError('');
        try {
            await api.delete(`/accounts/${accountId}`);
            router.push('/dashboard/accounts');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete account');
            setLoading(false);
        }
    }

    if (initialLoading) {
        return <div className="p-8 text-center text-slate-500">Loading account details...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/accounts" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Account</h1>
                    <p className="text-sm text-slate-500">Update an existing organizational record</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 p-6 border-b border-slate-200 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-slate-400" />
                    <h2 className="text-lg font-medium text-slate-900">Account Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                placeholder="e.g. Acme Corporation"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                placeholder="e.g. Technology"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                placeholder="https://www.example.com"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 mt-6 mb-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                            Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                    placeholder="123 Main St"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                    placeholder="e.g. New York"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
                                <input
                                    type="text"
                                    value={formData.state_or_province}
                                    onChange={(e) => setFormData({ ...formData, state_or_province: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                    placeholder="e.g. NY"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP / Postal Code</label>
                                <input
                                    type="text"
                                    value={formData.zip_code}
                                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                    placeholder="10001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Country / Region</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-500 focus:border-crm-500 outline-none transition-all shadow-sm"
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex justify-between items-center gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || initialLoading}
                            className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                        </button>
                        <div className="flex gap-3">
                            <Link
                                href="/dashboard/accounts"
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || initialLoading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-crm-600 rounded-lg hover:bg-crm-700 focus:ring-2 focus:ring-offset-2 focus:ring-crm-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Account'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
