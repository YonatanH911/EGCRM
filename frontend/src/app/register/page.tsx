'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Target, Loader2, ArrowRight, UserPlus } from 'lucide-react';

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
            await api.post('/users/', formData);
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

    const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
    const focusBorder = '1px solid rgba(99,102,241,0.5)';

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0d1117' }}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-4"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                        <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Create an account</h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Already have one?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3.5 text-sm text-red-400 rounded-xl flex items-center gap-2"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                            <input type="text" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.border = inputStyle.border; e.currentTarget.style.boxShadow = 'none'; }}
                                placeholder="Your full name" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email address</label>
                            <input type="email" required value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.border = inputStyle.border; e.currentTarget.style.boxShadow = 'none'; }}
                                placeholder="you@company.com" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                            <input type="password" required value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 text-sm rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.border = inputStyle.border; e.currentTarget.style.boxShadow = 'none'; }}
                                placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 mt-2"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
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
