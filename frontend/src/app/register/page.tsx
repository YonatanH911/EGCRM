'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Target, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Sales' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/users', formData);
            const loginData = new URLSearchParams();
            loginData.append('username', formData.email);
            loginData.append('password', formData.password);
            const response = await api.post('/token', loginData);
            localStorage.setItem('token', response.data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d: any) => d.msg || String(d)).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background-main">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-4 bg-gradient-to-br from-crm-500 to-blue-500">
                        <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Create an account</h2>
                    <p className="mt-1.5 text-sm text-muted-text">
                        Already have one?{' '}
                        <Link href="/login" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8 glass-card">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3.5 text-sm text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider">Full Name</label>
                            <input type="text" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all duration-200 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                                placeholder="Your full name" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider">Email address</label>
                            <input type="email" required value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all duration-200 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                                placeholder="you@company.com" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider">Password</label>
                            <input type="password" required value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all duration-200 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                                placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 mt-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><UserPlus className="w-4 h-4" /> Create Account</>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
