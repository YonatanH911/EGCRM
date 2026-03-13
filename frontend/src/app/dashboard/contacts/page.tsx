'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users2, Plus, Search, User } from 'lucide-react';

const thCls = "px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest";
const tdCls = "px-6 py-4 whitespace-nowrap";

export default function ContactsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterContact, setFilterContact] = useState('');

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await api.get('/contacts');
                setContacts(response.data);
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const filteredContacts = contacts.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
            (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
        let matchesFilter = true;
        if (filterContact === 'has_email') matchesFilter = !!contact.email;
        if (filterContact === 'has_phone') matchesFilter = !!contact.phone;
        return matchesSearch && matchesFilter;
    });

    const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
    const focusBorder = '1px solid rgba(99,102,241,0.5)';

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                        <Users2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Contacts</h1>
                        <p className="text-xs text-slate-500">Manage individual people and key decision makers.</p>
                    </div>
                </div>
                <Link href="/dashboard/contacts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> Add Contact
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-white/5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                        <input type="text" placeholder="Search names or email…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                            style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.border = focusBorder; }}
                            onBlur={(e) => { e.currentTarget.style.border = inputStyle.border; }} />
                    </div>
                    <select value={filterContact} onChange={(e) => setFilterContact(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-slate-300 focus:outline-none sm:w-44"
                        style={inputStyle}>
                        <option value="">All Contacts</option>
                        <option value="has_email">Has Email</option>
                        <option value="has_phone">Has Phone Number</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 text-sm">Loading contacts…</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <User className="w-10 h-10 text-slate-700 mb-3" />
                            <h3 className="text-base font-semibold text-slate-400">No contacts found</h3>
                            <p className="text-slate-600 mt-1 text-sm">Build your network by adding people you interact with.</p>
                            <Link href="/dashboard/contacts/new" className="mt-5 text-indigo-400 font-medium text-sm hover:text-indigo-300 transition-colors">
                                Create Contact →
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    {['Name', 'Job Title', 'Email', 'Phone', 'Account', 'Created'].map(h => (
                                        <th key={h} scope="col" className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id}
                                        className="cursor-pointer transition-all duration-150"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.07)'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow"
                                                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                                                    {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-200">{contact.first_name} {contact.last_name}</div>
                                                    {contact.company_name && <div className="text-xs text-slate-500">{contact.company_name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{contact.job_title || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{contact.email || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{contact.phone || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-slate-400">{contact.account?.name || '—'}</span></td>
                                        <td className={`${tdCls} text-right text-sm text-slate-500`}>
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
