'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Target, ArrowRight, Loader2, Shield, TrendingUp, Users } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            const response = await api.post('/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            localStorage.setItem('token', response.data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d: any) => d.msg || String(d)).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background-main">

            {/* ── Left brand panel ── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-surface border-r border-border-subtle">

                {/* Decorative orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

                {/* Logo */}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-crm-500 to-blue-500">
                        <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold text-foreground tracking-tight">
                        EG<span className="gradient-text">CRM</span>
                    </span>
                </div>

                {/* Middle content */}
                <div className="relative z-10 space-y-10">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground leading-tight">
                            Your pipeline,<br />
                            <span className="gradient-text">beautifully managed</span>
                        </h1>
                        <p className="mt-4 text-muted-text text-base leading-relaxed max-w-xs">
                            A powerful CRM built for modern teams — track accounts, leads, contracts, and more from one place.
                        </p>
                    </div>

                    {/* Feature chips */}
                    <div className="space-y-3">
                        {[
                            { icon: Shield, label: 'Secure vault management' },
                            { icon: TrendingUp, label: 'Visual sales pipeline' },
                            { icon: Users, label: 'Full contact & account tracking' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                    <Icon className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <span className="text-sm text-muted-text">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-text relative z-10">© 2026 EGCRM. All rights reserved.</p>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile logo */}
                <div className="flex items-center gap-3 mb-10 lg:hidden">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-crm-500 to-blue-500">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-foreground">EG<span className="gradient-text">CRM</span></span>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="mt-1 text-sm text-muted-text">
                            Sign in to your account or{' '}
                            <Link href="/register" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                                create a new one
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3.5 text-sm text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-muted-text uppercase tracking-wider">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all duration-200 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-muted-text uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all duration-200 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 mt-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>Sign in <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
