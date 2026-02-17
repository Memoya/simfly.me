'use client';

import { useState, useEffect } from 'react';
import { Lock, Save, DollarSign, Percent, Tag, Globe, ShoppingCart, RefreshCw, Trash2, Plus, Calculator, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText, ChevronRight, X, Mail, Users, ShieldAlert, Download } from 'lucide-react';
import { AdminSettings, DiscountCode, FAQItem, FeaturedDeal } from '@/types';
import { applyMargin } from '@/lib/settings-shared';
import PackageModal from '@/components/PackageModal';
import AlertSettings from '@/components/admin/AlertSettings';
import PriceEditor from '@/components/admin/PriceEditor';

type Tab = 'overview' | 'general' | 'countries' | 'discounts' | 'orders' | 'calculator' | 'content' | 'customers' | 'audit';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [settings, setSettings] = useState<AdminSettings>({
        globalMarginPercent: 0,
        globalMarginFixed: 0,
        discountCodes: [],
        countryMargins: {},
        banner: { active: false, text: '', link: '' },
        faq: []
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [rawProducts, setRawProducts] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]); // All products for dropdown
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Stats & Balance
    const [stats, setStats] = useState({ revenue: 0, orders: 0, averageOrderValue: 0, topProducts: [] });
    const [balance, setBalance] = useState({ balance: 0, currency: 'USD' });

    // Order Details Modal
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [orderDetail, setOrderDetail] = useState<any | null>(null);
    const [resendingEmail, setResendingEmail] = useState(false);

    // Pagination & Sort
    const [pagination, setPagination] = useState({ page: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Forms
    const [newDiscount, setNewDiscount] = useState<Partial<DiscountCode>>({ type: 'percent', active: true });
    const [newCountryOverride, setNewCountryOverride] = useState({ region: '', percent: 0, fixed: 0 });
    const [newFAQ, setNewFAQ] = useState<Partial<FAQItem>>({ question: '', answer: '' });

    // Package Modal for Featured Deals
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [selectedCountryForModal, setSelectedCountryForModal] = useState<{ country: string; iso: string; packages: any[] } | null>(null);

    // Price Editor Modal
    const [isPriceEditorOpen, setIsPriceEditorOpen] = useState(false);
    const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);

    const handleSavePrice = async (sku: string, newPrice: number) => {
        const res = await fetch('/api/admin/prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${password}`
            },
            body: JSON.stringify({ sku, price: newPrice })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Fehler beim Speichern');
        }

        // Refresh calculator
        await fetchRawProducts(pagination.page);
        await fetchSettings(); // Update cache
    };

    const login = () => {
        if (password) {
            setIsAuthenticated(true);
            fetchSettings();
        }
    };

    const fetchSettings = async () => {
        const res = await fetch('/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Ensure new fields exist
            setSettings({
                banner: { active: false, text: '', link: '' },
                faq: [],
                featuredDeals: [],
                ...data
            });
        }
    };

    const fetchOrders = async () => {
        const res = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) {
            const data = await res.json();
            setOrders(data);
        }
    };

    const fetchCustomers = async () => {
        const res = await fetch('/api/admin/customers', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) setCustomers(await res.json());
    };

    const fetchAuditLogs = async () => {
        const res = await fetch('/api/admin/audit', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) setAuditLogs(await res.json());
    };

    const fetchStats = async () => {
        const res = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) setStats(await res.json());
    };

    const fetchBalance = async () => {
        const res = await fetch('/api/admin/balance', {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) setBalance(await res.json());
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const fetchRawProducts = async (page: number) => {
        // Calculator needs cost/sell price breakdown, so use admin API
        let url = `/api/admin/catalogue?page=${page}&limit=30`;
        if (search) url += `&search=${search}`;
        if (sortConfig) url += `&sort=${sortConfig.key}&order=${sortConfig.direction}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setRawProducts(data);
            } else {
                setRawProducts(data.products || []);
                setPagination({ page: data.page, totalPages: data.totalPages || 10 });
            }
        }
    };

    const fetchProductsForDeals = async () => {
        try {
            // Use the same API as homepage to get ALL products
            const res = await fetch('/api/catalogue?region=');
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'overview') {
                fetchStats();
                fetchBalance();
            }
            if (activeTab === 'orders') fetchOrders();
            if (activeTab === 'customers') fetchCustomers();
            if (activeTab === 'audit') fetchAuditLogs();
            if (activeTab === 'content') fetchProductsForDeals();
            if (activeTab === 'calculator') {
                const timer = setTimeout(() => {
                    fetchRawProducts(0);
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [activeTab, isAuthenticated, search, sortConfig]);

    useEffect(() => {
        if (selectedOrder) {
            setOrderDetail(null);
            fetch(`/api/admin/orders/${selectedOrder.id}`, {
                headers: { 'Authorization': `Bearer ${password}` }
            })
                .then(res => res.json())
                .then(data => setOrderDetail(data))
                .catch(err => console.error('Failed to fetch order details:', err));
        }
    }, [selectedOrder, password]);



    const save = async () => {
        setLoading(true);
        setMessage('');
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${password}`
            },
            body: JSON.stringify({ ...settings, password })
        });

        if (res.ok) {
            setMessage('Gespeichert! ✅');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage('Fehler! ❌');
        }
        setLoading(false);
    };

    const addDiscount = () => {
        if (!newDiscount.code || !newDiscount.value) return;
        setSettings({
            ...settings,
            discountCodes: [...(settings.discountCodes || []), {
                code: newDiscount.code,
                type: newDiscount.type || 'percent',
                value: Number(newDiscount.value),
                active: true
            } as DiscountCode]
        });
        setNewDiscount({ type: 'percent', active: true, code: '', value: 0 });
    };

    const removeDiscount = (code: string) => {
        setSettings({
            ...settings,
            discountCodes: settings.discountCodes.filter(d => d.code !== code)
        });
    };

    const addCountryOverride = () => {
        if (!newCountryOverride.region) return;
        setSettings({
            ...settings,
            countryMargins: {
                ...settings.countryMargins,
                [newCountryOverride.region]: {
                    percent: Number(newCountryOverride.percent),
                    fixed: Number(newCountryOverride.fixed)
                }
            }
        });
        setNewCountryOverride({ region: '', percent: 0, fixed: 0 });
    };

    const removeCountryOverride = (region: string) => {
        const newMargins = { ...settings.countryMargins };
        delete newMargins[region];
        setSettings({ ...settings, countryMargins: newMargins });
    };

    const addFAQ = () => {
        if (!newFAQ.question || !newFAQ.answer) return;
        setSettings({
            ...settings,
            faq: [...(settings.faq || []), { question: newFAQ.question, answer: newFAQ.answer } as FAQItem]
        });
        setNewFAQ({ question: '', answer: '' });
    };

    const removeFAQ = (index: number) => {
        setSettings({
            ...settings,
            faq: (settings.faq || []).filter((_, i) => i !== index)
        });
    };


    const addDealFromProduct = (product: any) => {
        if (!product) return;

        const newDeal: FeaturedDeal = {
            id: crypto.randomUUID(),
            productId: product.id || product.name,
            country: product.region,
            iso: product.iso || '',
            data: product.data || 'N/A',
            days: typeof product.durationRaw === 'number' ? product.durationRaw : 7,
            price: product.price || 0, // Use price instead of sellPrice
            region: product.regionGroup || 'Global'
        };

        setSettings({
            ...settings,
            featuredDeals: [...(settings.featuredDeals || []), newDeal]
        });

        // Close modal
        setIsPackageModalOpen(false);
        setSelectedCountryForModal(null);

        // Show success message
        setMessage('Deal erfolgreich hinzugefügt!');
        setTimeout(() => setMessage(''), 3000);
    };

    const removeDeal = (id: string) => {
        setSettings({
            ...settings,
            featuredDeals: (settings.featuredDeals || []).filter(d => d.id !== id)
        });
    };

    const resendOrderEmail = async () => {
        if (!selectedOrder) return;
        setResendingEmail(true);
        try {
            const res = await fetch('/api/admin/orders/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}`
                },
                body: JSON.stringify({ orderId: selectedOrder.id, email: selectedOrder.customer_email })
            });
            if (res.ok) {
                alert('E-Mail erneut gesendet!');
            } else {
                alert('Fehler beim Senden.');
            }
        } catch (e) {
            alert('Fehler beim Senden.');
        }
        setResendingEmail(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-navy flex items-center gap-2">
                        <Lock className="text-electric" /> Admin Login
                    </h1>
                    <input
                        type="password"
                        placeholder="Passwort"
                        className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-electric outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && login()}
                    />
                    <button onClick={login} className="w-full bg-electric text-white py-3 rounded-lg font-bold">Einloggen</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-6">
                    <h1 className="text-2xl font-bold text-navy mb-6 px-4">Admin</h1>
                    <nav className="space-y-2">
                        {[
                            { id: 'overview', icon: RefreshCw, label: 'Übersicht' },
                            { id: 'general', icon: DollarSign, label: 'Preise & Marge' },
                            { id: 'countries', icon: Globe, label: 'Länder-Preise' },
                            { id: 'discounts', icon: Tag, label: 'Gutscheine' },
                            { id: 'content', icon: FileText, label: 'CMS / Inhalte' },
                            { id: 'customers', icon: Users, label: 'Kunden (CRM)' },
                            { id: 'orders', icon: ShoppingCart, label: 'Bestellungen' },
                            { id: 'audit', icon: ShieldAlert, label: 'Audit Log' },
                            { id: 'calculator', icon: Calculator, label: 'Gewinn-Rechner' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as Tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-electric text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="mt-8 pt-6 border-t border-gray-100 px-4">
                        <button onClick={save} disabled={loading} className="w-full bg-navy text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50">
                            {loading ? <RefreshCw className="animate-spin" /> : <Save />}
                            Speichern
                        </button>
                        {message && <p className="text-center mt-2 text-sm font-bold text-green-500">{message}</p>}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-white rounded-2xl shadow-sm p-6 md:p-8 min-h-[500px]">
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-navy">Dashboard Übersicht</h2>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                                <p className="text-sm font-bold text-blue-800 mb-1">Gesamtumsatz</p>
                                <p className="text-3xl font-bold text-navy">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.revenue)}
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                                <p className="text-sm font-bold text-purple-800 mb-1">Bestellungen</p>
                                <p className="text-3xl font-bold text-navy">{stats.orders}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                                <p className="text-sm font-bold text-green-800 mb-1">Ø Bestellwert</p>
                                <p className="text-3xl font-bold text-navy">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.averageOrderValue)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Top Products */}
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-navy mb-4">🔥 Top Seller</h3>
                                <div className="space-y-3">
                                    {stats.topProducts.map((p: any, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                            <span className="font-medium text-gray-700">{p.name || 'Unbekannt'}</span>
                                            <span className="bg-electric text-white px-2 py-1 rounded-full text-xs font-bold">{p.count}x</span>
                                        </div>
                                    ))}
                                    {stats.topProducts.length === 0 && <p className="text-gray-400 text-sm">Keine Daten verfügbar.</p>}
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-navy mb-4">⚙️ System Status</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                                        <div>
                                            <p className="font-bold text-navy">eSIM-Go API Guthaben</p>
                                            <p className="text-xs text-gray-500">Guthaben für Einkauf</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xl font-bold ${balance.balance < 50 ? 'text-red-500' : 'text-green-600'}`}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: balance.currency }).format(balance.balance)}
                                            </p>
                                            {balance.balance < 50 && <span className="text-xs text-red-500 font-bold">⚠️ Bitte aufladen!</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                                        <div>
                                            <p className="font-bold text-navy">Katalog Status</p>
                                            <p className="text-xs text-gray-500">
                                                {settings.catalogueLastUpdated
                                                    ? `Zuletzt: ${new Date(settings.catalogueLastUpdated).toLocaleString()}`
                                                    : 'Noch nie aktualisiert'}
                                            </p>
                                            {settings.catalogueLastChangeCount !== undefined && (
                                                <p className="text-xs text-green-600 font-bold">
                                                    {settings.catalogueLastChangeCount} Änderungen
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const res = await fetch('/api/admin/catalogue/refresh', {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${password}` }
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(`Update erfolgreich! ${data.changes} Änderungen.`);
                                                        fetchSettings(); // Reload to see new timestamp
                                                    } else {
                                                        alert('Update fehlgeschlagen.');
                                                    }
                                                } catch (e) {
                                                    alert('Fehler beim Update.');
                                                }
                                                setLoading(false);
                                            }}
                                            disabled={loading}
                                            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                            {loading ? 'Lädt...' : 'Refresh'}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                                        <div>
                                            <p className="font-bold text-navy">Stripe Status</p>
                                            <p className="text-xs text-gray-500">Zahlungsabwicklung</p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Aktiv</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <AlertSettings settings={settings} onChange={setSettings} />
                        </div>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="max-w-xl">
                        <h2 className="text-2xl font-bold mb-6 text-navy">Globale Preiseinstellungen</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Marge in Prozent (%)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-electric outline-none text-lg"
                                    value={settings.globalMarginPercent}
                                    onChange={(e) => setSettings({ ...settings, globalMarginPercent: Number(e.target.value) })}
                                />
                                <p className="text-sm text-gray-400 mt-2">Beispiel: Einkauf 5€ + 20% = 6€ Verkaufspreis</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Fester Aufschlag (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-electric outline-none text-lg"
                                    value={settings.globalMarginFixed}
                                    onChange={(e) => setSettings({ ...settings, globalMarginFixed: Number(e.target.value) })}
                                />
                                <p className="text-sm text-gray-400 mt-2">Wird zusätzlich zum Prozent-Aufschlag addiert.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'discounts' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-navy">Gutscheine & Rabatte</h2>

                        {/* Add Form */}
                        <div className="bg-gray-50 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-end border border-gray-100">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Code</label>
                                <input
                                    placeholder="z.B. SUMMER20"
                                    className="w-full p-2 border rounded-lg uppercase"
                                    value={newDiscount.code || ''}
                                    onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-gray-500 uppercase">Wert</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={newDiscount.value || ''}
                                    onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-gray-500 uppercase">Typ</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={newDiscount.type}
                                    onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value as any })}
                                >
                                    <option value="percent">% Prozent</option>
                                    <option value="fixed">€ Euro</option>
                                </select>
                            </div>
                            <button onClick={addDiscount} className="bg-electric text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                                <Plus />
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {settings.discountCodes?.map((code) => (
                                <div key={code.code} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-lg bg-gray-200 px-3 py-1 rounded">{code.code}</span>
                                        <span className="text-gray-600 font-medium">
                                            -{code.value}{code.type === 'percent' ? '%' : '€'}
                                        </span>
                                        {code.active ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktiv</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Inaktiv</span>}
                                    </div>
                                    <button onClick={() => removeDiscount(code.code)} className="text-gray-400 hover:text-red-500 p-2">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {(!settings.discountCodes || settings.discountCodes.length === 0) && (
                                <p className="text-gray-400 text-center py-8">Keine Gutscheine aktiv.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'countries' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-navy">Länderspezifische Preise</h2>
                        <p className="text-gray-500 mb-6">Hier kannst du abweichende Margen für bestimmte Länder festlegen.</p>

                        {/* Add Form */}
                        <div className="bg-gray-50 p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-end border border-gray-100">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Land / Region</label>
                                <input
                                    placeholder="z.B. Turkey"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCountryOverride.region}
                                    onChange={e => setNewCountryOverride({ ...newCountryOverride, region: e.target.value })}
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-gray-500 uppercase">Fix (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCountryOverride.fixed}
                                    onChange={e => setNewCountryOverride({ ...newCountryOverride, fixed: Number(e.target.value) })}
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-gray-500 uppercase">Marge (%)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={newCountryOverride.percent}
                                    onChange={e => setNewCountryOverride({ ...newCountryOverride, percent: Number(e.target.value) })}
                                />
                            </div>
                            <button onClick={addCountryOverride} className="bg-electric text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                                <Plus />
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {Object.entries(settings.countryMargins || {}).map(([region, margin]) => (
                                <div key={region} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-lg text-navy">{region}</span>
                                        <div className="text-gray-600 text-sm">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded mr-2">Fix: +{margin.fixed}€</span>
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Marge: +{margin.percent}%</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeCountryOverride(region)} className="text-gray-400 hover:text-red-500 p-2">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-navy">Content Management System (CMS)</h2>

                        {/* Banner Config */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-navy mb-4 border-b pb-2">📢 Startseite Banner</h3>
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded text-electric focus:ring-electric"
                                            checked={settings.banner?.active}
                                            onChange={(e) => setSettings({ ...settings, banner: { ...settings.banner!, active: e.target.checked } })}
                                        />
                                        <span className="font-bold text-gray-700">Banner aktivieren</span>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Text</label>
                                        <input
                                            className="w-full p-3 border rounded-lg"
                                            placeholder="z.B. 50% Rabatt auf alle USA Pläne! Code: SUMMER50"
                                            value={settings.banner?.text || ''}
                                            onChange={(e) => setSettings({ ...settings, banner: { ...settings.banner!, text: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Link (Optional)</label>
                                        <input
                                            className="w-full p-3 border rounded-lg"
                                            placeholder="z.B. /plans/usa"
                                            value={settings.banner?.link || ''}
                                            onChange={(e) => setSettings({ ...settings, banner: { ...settings.banner!, link: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Config */}
                        <div>
                            <h3 className="text-lg font-bold text-navy mb-4 border-b pb-2">❓ Häufige Fragen (FAQ)</h3>

                            {/* Add FAQ */}
                            <div className="bg-white p-4 border rounded-xl mb-6 shadow-sm">
                                <div className="space-y-3">
                                    <input
                                        className="w-full p-3 border rounded-lg font-bold"
                                        placeholder="Frage eingeben..."
                                        value={newFAQ.question}
                                        onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                                    />
                                    <textarea
                                        className="w-full p-3 border rounded-lg h-24"
                                        placeholder="Antwort eingeben..."
                                        value={newFAQ.answer}
                                        onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                                    />
                                    <button
                                        onClick={addFAQ}
                                        className="bg-navy text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> FAQ hinzufügen
                                    </button>
                                </div>
                            </div>

                            {/* FAQ List */}
                            <div className="space-y-4">
                                {settings.faq?.map((item, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-navy mb-1">{item.question}</p>
                                            <p className="text-sm text-gray-600">{item.answer}</p>
                                        </div>
                                        <button onClick={() => removeFAQ(index)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {(!settings.faq || settings.faq.length === 0) && (
                                    <p className="text-gray-400 text-center">Keine FAQs vorhanden.</p>
                                )}
                            </div>
                        </div>

                        {/* Featured Deals Config */}
                        <div className="mt-10 pt-10 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-navy mb-4 border-b pb-2">🔥 Featured Deals (Startseite)</h3>

                            {/* Add Deal - Country Selection */}
                            <div className="bg-white p-6 border rounded-xl mb-6 shadow-sm">
                                <p className="text-sm text-gray-600 mb-4">
                                    Wählen Sie ein Land aus, um Produkte zu durchsuchen und als Featured Deal hinzuzufügen.
                                </p>

                                {/* Country Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                                    {[...new Map(products.map(p => [p.region, p])).values()]
                                        .filter(p => p.region)
                                        .sort((a, b) => (a.region || '').localeCompare(b.region || ''))
                                        .map((product) => (
                                            <button
                                                key={product.region}
                                                onClick={() => {
                                                    const countryPackages = products.filter(p => p.region === product.region);
                                                    setSelectedCountryForModal({
                                                        country: product.region,
                                                        iso: product.iso || '',
                                                        packages: countryPackages
                                                    });
                                                    setIsPackageModalOpen(true);
                                                }}
                                                className="flex items-center gap-3 p-3 border rounded-lg hover:border-electric hover:bg-electric/5 transition-all text-left"
                                            >
                                                <img
                                                    src={`https://flagcdn.com/w40/${(product.iso || '').toLowerCase()}.png`}
                                                    alt={product.region}
                                                    className="w-8 h-6 object-cover rounded"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <span className="text-sm font-medium text-navy">{product.region}</span>
                                            </button>
                                        ))}
                                </div>
                            </div>

                            {/* Deals List */}
                            <div className="space-y-3">
                                {settings.featuredDeals?.map((deal) => (
                                    <div key={deal.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                                {deal.iso && (
                                                    <img
                                                        src={`https://flagcdn.com/w80/${deal.iso.toLowerCase()}.png`}
                                                        alt={deal.country}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-sm">${deal.iso.toUpperCase()}</div>`;
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy">{deal.country}</p>
                                                <p className="text-xs text-gray-600">{deal.data} • {deal.days} Tage • <span className="text-electric font-bold">{deal.price.toFixed(2)}€</span></p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeDeal(deal.id)} className="text-gray-400 hover:text-red-500 p-2">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {(!settings.featuredDeals || settings.featuredDeals.length === 0) && (
                                    <p className="text-gray-400 text-center">Keine Featured Deals aktiv.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }
                {
                    activeTab === 'orders' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-navy">Letzte Bestellungen</h2>
                                <button onClick={fetchOrders} className="text-electric hover:bg-blue-50 p-2 rounded-full">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left">
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm">Datum</th>
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm">Kunde</th>
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm">Betrag</th>
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm">Pakete</th>
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm">Status</th>
                                            <th className="py-3 px-4 text-gray-500 font-bold text-sm"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-navy">{order.customer_email}</td>
                                                <td className="py-3 px-4 font-bold text-navy">
                                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: order.currency }).format(order.amount)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{order.items}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="text-electric hover:bg-blue-50 p-2 rounded-lg text-sm font-bold flex items-center gap-1"
                                                    >
                                                        Details <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-400">Keine Bestellungen gefunden.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                {activeTab === 'calculator' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-navy">Gewinn-Kalkulator</h2>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        placeholder="Suchen..."
                                        className="pl-10 pr-4 py-2 border rounded-full text-sm outline-none focus:ring-2 focus:ring-electric"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => fetchRawProducts(pagination.page)} className="text-electric hover:bg-blue-50 p-2 rounded-full">
                                    <RefreshCw className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left">
                                        {[
                                            { label: 'Daten', key: 'data' },
                                            { label: 'Produkt', key: 'name' },
                                            { label: 'Dauer', key: 'duration' },
                                            { label: 'Region', key: 'region' },
                                            { label: 'Einkauf (Netto)', key: 'price' },
                                            { label: 'Verkauf (Brutto)', key: 'sellPrice' },
                                            { label: 'Gewinn (ca.)', key: 'profit' }
                                        ].map((h) => (
                                            <th
                                                key={h.key}
                                                className="py-3 px-4 text-gray-500 font-bold text-sm cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                                onClick={() => handleSort(h.key)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {h.label}
                                                    {sortConfig?.key === h.key ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 opacity-20" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawProducts.map((p, i) => {
                                        // Use backend values if available, else fallback to local calc
                                        const sellPrice = p.sellPrice ?? applyMargin(p.price, settings, p.region);
                                        const profit = p.profit ?? (sellPrice - p.price);

                                        return (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-electric">
                                                        {p.data || 'N/A'}
                                                    </div>
                                                    {p.unlimitedDetails && (
                                                        <div className="text-[10px] text-gray-500 leading-tight mt-1">
                                                            {p.unlimitedDetails.highSpeed} HighSpeed,<br />
                                                            danach {p.unlimitedDetails.throttle}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-navy text-xs">{p.name}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.duration || 'N/A'}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.region}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{Number(p.price).toFixed(2)}€</td>
                                                <td className="py-3 px-4 font-bold text-navy flex items-center gap-2">
                                                    {Number(sellPrice).toFixed(2)}€
                                                    <button
                                                        onClick={() => { setSelectedProductForEdit(p); setIsPriceEditorOpen(true); }}
                                                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-electric transition-colors"
                                                        title="Preis bearbeiten"
                                                    >
                                                        <Tag className="w-4 h-4" />
                                                    </button>
                                                </td>
                                                <td className={`py-3 px-4 font-bold ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    +{Number(profit).toFixed(2)}€
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
                            <button
                                onClick={() => fetchRawProducts(pagination.page - 1)}
                                disabled={pagination.page <= 0}
                                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Zurück
                            </button>
                            <span className="text-sm text-gray-500">
                                Seite {pagination.page + 1}
                            </span>
                            <button
                                onClick={() => fetchRawProducts(pagination.page + 1)}
                                disabled={rawProducts.length < 30}
                                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Weiter
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mt-4 text-center">
                            * Hinweis: Dies ist eine Brutto-Kalkulation. Stripe-Gebühren (ca. 1.5% + 0.25€) und MwSt. sind noch abzuziehen.
                        </p>
                    </div>
                )}
            </main >


            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-navy">Bestellung Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {!orderDetail ? (
                            <div className="flex justify-center p-8">
                                <RefreshCw className="animate-spin w-8 h-8 text-electric" />
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                    <div>
                                        <p className="text-gray-500 mb-1">Bestellnummer</p>
                                        <p className="font-mono font-bold bg-gray-100 p-2 rounded text-xs select-all">{orderDetail.local?.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Stripe Session</p>
                                        <p className="font-mono text-xs text-gray-600 select-all truncate">{selectedOrder.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Datum</p>
                                        <p className="font-medium">{new Date(selectedOrder.date).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Kunde</p>
                                        <p className="font-bold text-navy">{selectedOrder.customer_email}</p>
                                    </div>
                                </div>

                                {/* Status Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Stripe card */}
                                    <div className={`p-4 rounded-xl border ${orderDetail.stripe?.payment_status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" /> Zahlung (Stripe)
                                        </h4>
                                        <p className="text-lg font-bold">
                                            {orderDetail.stripe?.payment_status === 'paid' ? 'Bezahlt' : 'Offen'}
                                        </p>
                                        <p className="text-xs text-gray-500 break-all">{orderDetail.stripe?.payment_intent?.id || 'No Intent'}</p>
                                    </div>

                                    {/* eSIM card */}
                                    <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                            <Tag className="w-4 h-4" /> eSIM Status
                                        </h4>
                                        {orderDetail.esim && orderDetail.esim.length > 0 ? (
                                            orderDetail.esim.map((e: any, i: number) => (
                                                <div key={i} className="mb-2 last:mb-0">
                                                    <p className="font-bold text-sm">{e.status || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-600 font-mono">{e.iccid}</p>
                                                    <p className="text-xs text-blue-600">{e.bundle}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">Keine eSIM Daten gefunden.</p>
                                        )}
                                    </div>

                                    {/* Email card */}
                                    <div className="p-4 rounded-xl border bg-purple-50 border-purple-200">
                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> E-Mail Status
                                        </h4>
                                        <p className="font-bold text-lg">
                                            {orderDetail.email?.last_event || orderDetail.local?.providerSync?.emailStatus || 'Pending'}
                                        </p>
                                        <p className="text-xs text-gray-500 break-all">ID: {orderDetail.local?.providerSync?.resendMessageId || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h3 className="font-bold text-navy mb-3">Gekaufte Artikel</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                                        {orderDetail.local?.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <span className="font-bold">{item.productName} (x{item.quantity})</span>
                                                <span className="font-mono text-xs">{item.iccid || 'No ICCID'}</span>
                                            </div>
                                        ))}
                                        {!orderDetail.local?.items.length && <p className="text-sm">{selectedOrder.items}</p>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t pt-6">
                                    <h3 className="font-bold text-navy mb-4">Aktionen</h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={resendOrderEmail}
                                            disabled={resendingEmail}
                                            className="bg-electric text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Mail className="w-4 h-4" />
                                            {resendingEmail ? 'Wird gesendet...' : 'Bestätigungs-Email senden'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Package Modal for Featured Deals */}
            {selectedCountryForModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => {
                    setIsPackageModalOpen(false);
                    setSelectedCountryForModal(null);
                }}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://flagcdn.com/w80/${selectedCountryForModal.iso.toLowerCase()}.png`}
                                    alt={selectedCountryForModal.country}
                                    className="w-12 h-9 object-cover rounded"
                                />
                                <h2 className="text-2xl font-bold text-navy">{selectedCountryForModal.country}</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPackageModalOpen(false);
                                    setSelectedCountryForModal(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Wählen Sie ein Paket aus, um es als Featured Deal hinzuzufügen:</p>
                            {selectedCountryForModal.packages.map((pkg) => (
                                <button
                                    key={pkg.name}
                                    onClick={() => addDealFromProduct(pkg)}
                                    className="w-full p-4 border-2 rounded-xl hover:border-electric hover:bg-electric/5 transition-all text-left flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold text-lg text-navy">{pkg.data || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">{pkg.duration || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-electric">{(pkg.price || 0).toFixed(2)}€</p>
                                        <p className="text-xs text-gray-500">Als Deal hinzufügen</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'customers' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-navy">Kunden (CRM)</h2>
                        <button
                            onClick={() => {
                                const csv = 'Email,Total Spend,Orders,Last Order\n' + customers.map(c => `${c.email},${c.totalSpend},${c.orders},${c.lastOrderDate}`).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'customers.csv';
                                a.click();
                            }}
                            className="bg-electric text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-600"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Anzahl Bestellungen</th>
                                    <th className="p-4">Gesamtwert (LTV)</th>
                                    <th className="p-4">Letzte Bestellung</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((c, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-navy">{c.email}</td>
                                        <td className="p-4">{c.orders}x</td>
                                        <td className="p-4 font-bold text-green-600">
                                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: c.currency || 'EUR' }).format(c.totalSpend)}
                                        </td>
                                        <td className="p-4 text-gray-500">{new Date(c.lastOrderDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {customers.length === 0 && <p className="p-8 text-center text-gray-400">Keine Kunden gefunden.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-navy">Audit Log</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Zeitpunkt</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Aktion</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-medium">{log.userId}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 truncate max-w-xs" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {auditLogs.length === 0 && <p className="p-8 text-center text-gray-400">Keine Logs vorhanden.</p>}
                    </div>
                </div>
            )}

            <PriceEditor
                isOpen={isPriceEditorOpen}
                onClose={() => setIsPriceEditorOpen(false)}
                product={selectedProductForEdit}
                onSave={handleSavePrice}
            />
        </div >
    );
}

