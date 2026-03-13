'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, Plus, Search } from 'lucide-react'; /* ── shared dark-table helpers ── */
const thCls = "px-6 py-3.5 ltr:text-left rtl:text-right text-[10px] font-bold text-muted-text uppercase tracking-widest";
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
                        <p className="text-xs text-muted-text">Manage all your customer relationships.</p>
                    </div>
                </div>
                <Link href="/dashboard/contacts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> Add Contact
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search contacts…"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-sm rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                    <select value={filterContact} onChange={(e) => setFilterContact(e.target.value)}
                        className="px-3 py-2 text-sm rounded-xl text-slate-300 focus:outline-none sm:w-44 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10">
                        <option value="">All Contacts</option>
                        <option value="has_email">Has Email</option>
                        <option value="has_phone">Has Phone Number</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-muted-text text-sm">Loading contacts…</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <Users className="w-10 h-10 text-muted-text mb-3 opacity-50" />
                            <h3 className="text-base font-semibold text-foreground">No contacts found</h3>
                            <p className="text-muted-text mt-1 text-sm">Start building your network.</p>
                            <Link href="/dashboard/contacts/new" className="mt-5 text-indigo-500 font-medium text-sm hover:text-indigo-400 transition-colors">
                                Create Contact →
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                                <tr>
                                    {['Name', 'Email', 'Phone', 'Created'].map(h => (
                                        <th key={h} scope="col" className={thCls}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id}
                                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                                        className="cursor-pointer group transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm bg-gradient-to-br from-indigo-500 to-purple-500">
                                                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{contact.first_name} {contact.last_name}</span>
                                                    {contact.job_title && <span className="text-xs text-muted-text">{contact.job_title}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-sm text-muted-text">{contact.email || '—'}</span></td>
                                        <td className={tdCls}><span className="text-sm text-foreground">{contact.phone || '—'}</span></td>
                                        <td className={`${tdCls} ltr:text-right rtl:text-left text-sm text-muted-text`}>
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
