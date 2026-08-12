'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, Plus, Search } from 'lucide-react';
import SortControl from '@/components/SortControl';
import ScrollableTable from '@/components/ScrollableTable';
import CopyButton from '@/components/CopyButton';
import ColumnFilter from '@/components/ColumnFilter';
import { ColumnFilters, matchesColumnFilters } from '@/lib/columnFilters';
import { compareSortValues, dateSortValue, SortDirection } from '@/lib/sorting';

const thCls = "px-6 py-3.5 ltr:text-left rtl:text-right text-base font-bold text-muted-text uppercase tracking-widest";
const tdCls = "px-6 py-4 whitespace-nowrap";
const dash = '-';

export default function ContactsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const [contactsRes, accountsRes] = await Promise.all([
                    api.get('/contacts'),
                    api.get('/accounts'),
                ]);
                setContacts(contactsRes.data);
                setAccounts(accountsRes.data);
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const accountNamesById = accounts.reduce((map, account) => {
        map[String(account.id)] = account.name;
        return map;
    }, {} as Record<string, string>);

    const getAccountNames = (contact: any) => {
        const accountIds = contact.account_ids?.length ? contact.account_ids : (contact.account_id ? [contact.account_id] : []);
        const names = accountIds
            .map((accountId: number | string) => accountNamesById[String(accountId)])
            .filter(Boolean);

        if (names.length > 0) return names.join(', ');
        return contact.account?.name || dash;
    };

    const filteredContacts = contacts.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchesSearch = fullName.includes(query) ||
            (contact.email && contact.email.toLowerCase().includes(query)) ||
            getAccountNames(contact).toLowerCase().includes(query);
        const isIsraeli = contact.is_israeli === null || contact.is_israeli === undefined
            ? dash
            : (contact.is_israeli ? 'Yes' : 'No');
        const matchesColumns = matchesColumnFilters(columnFilters, {
            name: `${contact.first_name || ''} ${contact.last_name || ''}`,
            account: getAccountNames(contact),
            email: contact.email,
            phone: contact.phone,
            isIsraeli,
            created: new Date(contact.created_at).toLocaleDateString(),
        });
        return matchesSearch && matchesColumns;
    });

    const sortedContacts = [...filteredContacts].sort((a, b) => {
        if (sortBy === 'active') {
            return compareSortValues(a.is_active !== false, b.is_active !== false, sortDirection);
        }
        if (sortBy === 'name') {
            const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim();
            const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim();
            return compareSortValues(aName, bName, sortDirection);
        }
        return compareSortValues(dateSortValue(a.created_at), dateSortValue(b.created_at), sortDirection);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold text-foreground">Contacts</h1>
                        <p className="text-lg text-muted-text">Manage all your customer relationships.</p>
                    </div>
                </div>
                <Link href="/dashboard/contacts/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xl font-semibold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                    <Plus className="w-4 h-4" /> Add Contact
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden glass-card">
                <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-text" />
                        <input type="text" placeholder="Search contacts..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xl rounded-xl text-foreground placeholder-muted-text focus:outline-none transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 focus:border-crm-500 focus:ring-4 focus:ring-crm-500/10"
                        />
                    </div>
                    <SortControl
                        value={sortBy}
                        onChange={setSortBy}
                        direction={sortDirection}
                        onDirectionChange={setSortDirection}
                        options={[
                            { value: 'created_at', label: 'Date Created' },
                            { value: 'active', label: 'Active' },
                            { value: 'name', label: 'Contact Name' },
                        ]}
                    />
                </div>

                <ScrollableTable>
                    {loading ? (
                        <div className="p-12 text-center text-muted-text text-xl">Loading contacts...</div>
                    ) : sortedContacts.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <Users className="w-10 h-10 text-muted-text mb-3 opacity-50" />
                            <h3 className="text-2xl font-semibold text-foreground">No contacts found</h3>
                            <p className="text-muted-text mt-1 text-xl">Start building your network.</p>
                            <Link href="/dashboard/contacts/new" className="mt-5 text-indigo-500 font-medium text-xl hover:text-indigo-400 transition-colors">
                                Create Contact
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="border-b border-border-subtle bg-black/5 dark:bg-white/5">
                                <tr>
                                    {[
                                        { key: 'name', label: 'Name' },
                                        { key: 'account', label: 'Account' },
                                        { key: 'email', label: 'Email' },
                                        { key: 'phone', label: 'Phone' },
                                        { key: 'isIsraeli', label: 'Is Israeli?' },
                                        { key: 'created', label: 'Created' },
                                    ].map(column => (
                                        <th key={column.key} scope="col" className={thCls}>
                                            <div className="flex items-center gap-1.5">
                                                <span>{column.label}</span>
                                                <ColumnFilter
                                                    label={column.label}
                                                    value={columnFilters[column.key] || ''}
                                                    onChange={value => setColumnFilters(current => ({ ...current, [column.key]: value }))}
                                                />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {sortedContacts.map((contact) => (
                                    <tr key={contact.id}
                                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                                        className="cursor-pointer group transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg uppercase shadow-sm bg-gradient-to-br from-indigo-500 to-purple-500">
                                                    {(contact.first_name || '?').charAt(0)}{(contact.last_name || '').charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xl font-medium text-foreground">{contact.first_name} {contact.last_name}</span>
                                                    {contact.job_title && <span className="text-lg text-muted-text">{contact.job_title}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-xl text-muted-text">{getAccountNames(contact)}</span></td>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xl text-muted-text">{contact.email || dash}</span>
                                                <CopyButton value={contact.email} label="Copy email" />
                                            </div>
                                        </td>
                                        <td className={tdCls}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xl text-foreground">{contact.phone || dash}</span>
                                                <CopyButton value={contact.phone} label="Copy phone number" />
                                            </div>
                                        </td>
                                        <td className={tdCls}><span className="text-xl text-muted-text">{contact.is_israeli === null || contact.is_israeli === undefined ? dash : (contact.is_israeli ? 'Yes' : 'No')}</span></td>
                                        <td className={`${tdCls} ltr:text-right rtl:text-left text-xl text-muted-text`}>
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </ScrollableTable>
            </div>
        </div>
    );
}
