'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users2, Plus, Search, User } from 'lucide-react';

export default function ContactsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterContact, setFilterContact] = useState('');

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await api.get('/contacts/');
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

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Users2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
                        <p className="text-sm text-slate-500">Manage individual people and key decision makers.</p>
                    </div>
                </div>

                <Link
                    href="/dashboard/contacts/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-lg text-white bg-crm-600 hover:bg-crm-700 shadow-sm transition-colors text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative max-w-sm w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search names or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm transition-all"
                        />
                    </div>

                    <div className="w-full sm:w-auto min-w-[200px]">
                        <select
                            value={filterContact}
                            onChange={(e) => setFilterContact(e.target.value)}
                            className="bg-white block w-full pl-3 pr-10 py-2 text-base border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-crm-500 focus:border-crm-500 sm:text-sm rounded-lg transition-all"
                        >
                            <option value="">All Contacts</option>
                            <option value="has_email">Has Email</option>
                            <option value="has_phone">Has Phone Number</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading contacts...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <User className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No contacts found</h3>
                            <p className="text-slate-500 mt-1 max-w-sm">Build your network by adding people you interact with.</p>
                            <Link href="/dashboard/contacts/new" className="mt-6 text-crm-600 font-medium hover:underline">
                                Create Contact &rarr;
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Job Title</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredContacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900">{contact.first_name} {contact.last_name}</div>
                                                    {contact.company_name && <div className="text-xs text-slate-400">{contact.company_name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">{contact.job_title || <span className="text-slate-300">—</span>}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-500">{contact.email || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {contact.phone || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {contact.account?.name || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
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
