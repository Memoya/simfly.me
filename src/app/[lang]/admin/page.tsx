'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Lock, Save, DollarSign, Percent, Tag, Globe, ShoppingCart, RefreshCw, Trash2, Plus, Calculator, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, X, Mail, Users, ShieldAlert, Download, Zap, Smartphone, Activity, TrendingUp, Clock, Apple, ShieldCheck, LayoutDashboard, Settings as SettingsIcon, BarChart3, Database, Shield, Box } from 'lucide-react';
import { AdminSettings, DiscountCode, FAQItem, FeaturedDeal } from '@/types';
import { applyMargin } from '@/lib/settings-shared';
import PackageModal from '@/components/PackageModal';
import AlertSettings from '@/components/admin/AlertSettings';
import PriceEditor from '@/components/admin/PriceEditor';
import ProviderManagement from '@/components/admin/ProviderManagement';
import EnterpriseAnalytics from '@/components/admin/EnterpriseAnalytics';
import VisitorAnalytics from '@/components/admin/VisitorAnalytics';

type Tab = 'overview' | 'general' | 'countries' | 'discounts' | 'orders' | 'calculator' | 'content' | 'customers' | 'audit' | 'providers' | 'analytics' | 'visitors';

export default function AdminPage() {
    const params = useParams();
    const lang = params.lang as string || 'de';
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [settings, setSettings] = useState<AdminSettings>({
        globalMarginPercent: 0,
        globalMarginFixed: 0,
        discountCodes: [],
        countryMargins: {},
        banner: { active: false, text: '', link: '' },
        faq: [],
        autoDiscountEnabled: false,
        autoDiscountPercent: 10,
        autoDiscountThreshold: 50,
        minMarginFixed: 1.0,
        minMarginPercent: 5.0
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
    const [stats, setStats] = useState<any>({ revenue: 0, orders: 0, averageOrderValue: 0, topProducts: [], activationStats: { starts: 0, failures: 0, ios: 0, android: 0 } });
    const [balance, setBalance] = useState({ balance: 0, currency: 'USD' });

    // Order Details Modal
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [orderDetail, setOrderDetail] = useState<any | null>(null);
    const [resendingEmail, setResendingEmail] = useState(false);

    // Pagination & Sort
    const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalItems: 0 });
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
    const [esimDetails, setEsimDetails] = useState<Record<string, any>>({});
    const [loadingEsimAction, setLoadingEsimAction] = useState<string | null>(null);

    const checkEsimStatus = async (iccid: string) => {
        setLoadingEsimAction(iccid);
        try {
            const res = await fetch(`/api/admin/esim/status?iccid=${iccid}`, {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            const data = await res.json();
            setEsimDetails(prev => ({ ...prev, [iccid]: data }));
        } catch (e) {
            console.error(e);
            alert('Fehler beim Abrufen des Status');
        } finally {
            setLoadingEsimAction(null);
        }
    };

    const topupEsim = async (iccid: string, bundle: string) => {
        if (!confirm(`Soll das Paket ${bundle} wirklich erneut auf ${iccid} gebucht werden? (Kostenpflichtig!)`)) return;

        setLoadingEsimAction(iccid + '_topup');
        try {
            const res = await fetch(`/api/admin/esim/topup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${password}`
                },
                body: JSON.stringify({ iccid, bundle })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Aufladung erfolgreich!');
                checkEsimStatus(iccid); // Refresh status
            } else {
                alert('Fehler: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Fehler bei der Aufladung');
        } finally {
            setLoadingEsimAction(null);
        }
    };

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

    const refreshCatalogue = async () => {
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
        } catch {
            alert('Fehler beim Update.');
        }
        setLoading(false);
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
                setPagination({
                    page: data.page,
                    totalPages: data.totalPages || 10,
                    totalItems: data.total || 0
                });
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
            if (activeTab === 'visitors') {
                // VisitorAnalytics component handles data fetching internally
            }
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
        <div className="min-h-screen bg-gray-50 flex flex-col xl:flex-row max-w-[1600px] mx-auto overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full xl:w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-40 hidden xl:flex">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-navy tracking-tighter">SIMFLY<span className="text-electric">.ME</span></h1>
                    </div>

                    <nav className="space-y-1.5">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', group: 'Analytics' },
                            { id: 'analytics', icon: BarChart3, label: 'Financial BI', group: 'Analytics' },
                            { id: 'visitors', icon: Users, label: 'Visitor Analytics', group: 'Analytics' },
                            { id: 'providers', icon: Database, label: 'Carrier Matrix', group: 'Infrastructure' },
                            { id: 'general', icon: SettingsIcon, label: 'Pricing Guard', group: 'Infrastructure' },
                            { id: 'countries', icon: Globe, label: 'Regional Margins', group: 'Infrastructure' },
                            { id: 'discounts', icon: Tag, label: 'Promotions', group: 'Marketing' },
                            { id: 'content', icon: Box, label: 'CMS Engine', group: 'Marketing' },
                            { id: 'customers', icon: Users, label: 'CRM / Customers', group: 'Operations' },
                            { id: 'orders', icon: ShoppingCart, label: 'Local Orders', group: 'Operations' },
                            { id: 'audit', icon: Shield, label: 'Audit Engine', group: 'Security' },
                            { id: 'calculator', icon: Calculator, label: 'Profit Simulator', group: 'Security' },
                        ].reduce((acc: any[], item, idx, arr) => {
                            const prevItem = arr[idx - 1];
                            if (!prevItem || prevItem.group !== item.group) {
                                acc.push({ type: 'header', label: item.group });
                            }
                            acc.push({ ...item, type: 'item' });
                            return acc;
                        }, []).map((item: any, i: number) => item.type === 'header' ? (
                            <p key={`header-${i}`} className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 mb-2 ml-4">
                                {item.label}
                            </p>
                        ) : (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as Tab)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${activeTab === item.id
                                    ? 'bg-navy text-white shadow-xl shadow-navy/20 translate-x-1'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-electric shadow-[0_0_8px_#3b82f6]" />}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-gray-50 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">System Status</span>
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                        <p className="text-xs font-bold text-navy">All Systems Nominal</p>
                    </div>

                    <button
                        onClick={save}
                        disabled={loading}
                        className="w-full bg-navy text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Commit Changes
                    </button>
                    {message && <p className="text-center mt-3 text-xs font-black text-emerald-500">{message}</p>}
                </div>
            </aside>

            {/* Mobile Header (Sticky) */}
            <div className="xl:hidden sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-navy" />
                    <span className="font-black text-navy tracking-tighter text-lg uppercase">Simfly Admin</span>
                </div>
                <select
                    className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold outline-none"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as Tab)}
                >
                    <option value="overview">Dashboard</option>
                    <option value="analytics">Financial BI</option>
                    <option value="providers">Carrier Matrix</option>
                    <option value="general">Pricing Guard</option>
                    <option value="orders">Orders</option>
                </select>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50/30 custom-scrollbar h-screen relative">
                {/* Top System Status Bar (Enterprise Header) */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-navy">Engine v4.2 Online</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 border-l border-gray-100 pl-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-400 font-black uppercase">Live Yield</span>
                                <span className="text-xs font-black text-navy">{settings.minMarginPercent}% Floor</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-400 font-black uppercase">Active Carriers</span>
                                <span className="text-xs font-black text-navy">4 Upstream</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600">AI</div>
                            <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-purple-600">SY</div>
                        </div>
                        <button className="relative p-2 text-gray-400 hover:text-navy transition-colors">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <div className="p-6 md:p-10 max-w-7xl mx-auto">

                    {activeTab === 'overview' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Mission Critical KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full translate-x-16 -translate-y-16 blur-3xl group-hover:bg-blue-500/20 transition-colors" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aggregate Revenue</p>
                                    <p className="text-4xl font-black tracking-tight mb-2">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.revenue)}
                                    </p>
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                        <TrendingUp className="w-4 h-4" /> +12.4% vs Prev. Month
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Yield Strength</p>
                                    <p className="text-4xl font-black text-navy tracking-tight mb-2">
                                        {(stats.revenue > 0 ? (stats.revenue * 0.22).toFixed(2) : '0.00')}€
                                    </p>
                                    <div className="flex items-center gap-2 text-indigo-500 text-xs font-black uppercase tracking-tighter">
                                        <Zap className="w-3 h-3 fill-indigo-500" /> 22.1% Gross Margin
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Frequency</p>
                                    <p className="text-4xl font-black text-navy tracking-tight mb-2">{stats.orders}</p>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%]" />
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avg Deal Velocity</p>
                                    <p className="text-4xl font-black text-navy tracking-tight mb-2">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.averageOrderValue)}
                                    </p>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-3">
                                        <Clock className="w-3 h-3" /> Real-time materialization
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* System Intelligence Feed */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-xl font-black text-navy flex items-center gap-3">
                                                <Activity className="w-6 h-6 text-blue-500" /> Carrier Performance Matrix
                                            </h3>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">All Nodes Operational</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-blue-500 transition-colors cursor-pointer">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Upstream Liquidity</p>
                                                        <p className={`text-2xl font-black ${balance.balance < 50 ? 'text-red-500 animate-pulse' : 'text-navy'}`}>
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: balance.currency }).format(balance.balance)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[8px] font-black text-blue-500 uppercase mb-1">eSIM Go Wallet</div>
                                                        <div className="flex gap-1">
                                                            {[1, 1, 1, 1, 0].map((b, i) => <div key={i} className={`w-1 h-3 rounded-full ${b ? 'bg-blue-500' : 'bg-gray-200'}`} />)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-slate-50 rounded-3xl border border-gray-100">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Catalogue</span>
                                                        <button
                                                            onClick={refreshCatalogue}
                                                            className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
                                                            disabled={loading}
                                                        >
                                                            <RefreshCw className={`w-4 h-4 text-electric ${loading ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm font-black text-navy mb-1">{settings.catalogueLastChangeCount || 0} New SKUs synchronized</p>
                                                    <p className="text-[10px] text-gray-400 font-bold italic">Last materialization: {new Date(settings.catalogueLastUpdated || Date.now()).toLocaleTimeString()}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {stats.topProducts.slice(0, 4).map((p: any, i: number) => (
                                                    <div key={i} className="bg-white border-2 border-gray-50 p-4 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-transform">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">#{i + 1}</div>
                                                            <span className="text-[10px] font-black text-emerald-500">+{p.count}x</span>
                                                        </div>
                                                        <p className="text-xs font-black text-navy truncate">{p.name || 'Unbekannt'}</p>
                                                        <div className="w-full bg-gray-100 h-1 rounded-full mt-2">
                                                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(p.count / (stats.orders || 1)) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activation Intensity Funnel */}
                                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-black text-navy mb-8 flex items-center gap-3">
                                            <Plus className="w-6 h-6 text-purple-500" /> End-User Fulfillment Funnel
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Starts</p>
                                                <p className="text-3xl font-black text-navy">{stats.activationStats?.starts || 0}</p>
                                            </div>
                                            <div className="space-y-1 border-l border-gray-100 pl-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Failures</p>
                                                <p className="text-3xl font-black text-red-500">{stats.activationStats?.failures || 0}</p>
                                            </div>
                                            <div className="space-y-1 border-l border-gray-100 pl-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion</p>
                                                <p className="text-3xl font-black text-emerald-500">
                                                    {stats.activationStats?.starts ? ((1 - (stats.activationStats.failures / stats.activationStats.starts)) * 100).toFixed(0) : 100}%
                                                </p>
                                            </div>
                                            <div className="space-y-1 border-l border-gray-100 pl-6">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Reach</p>
                                                <div className="flex gap-2 items-center mt-2">
                                                    <div className="flex flex-col items-center">
                                                        <Apple className="w-3 h-3 text-gray-400 mb-1" />
                                                        <span className="text-[8px] font-black">{stats.activationStats?.ios || 0}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-gray-100" />
                                                    <div className="flex flex-col items-center">
                                                        <Smartphone className="w-3 h-3 text-gray-400 mb-1" />
                                                        <span className="text-[8px] font-black">{stats.activationStats?.android || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Control Panel */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="bg-navy p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden h-full">
                                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                                        <h3 className="text-lg font-black mb-8 flex items-center gap-3 relative z-10">
                                            <ShieldCheck className="w-5 h-5 text-electric" /> Command & Control
                                        </h3>

                                        <div className="space-y-6 relative z-10">
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group cursor-default">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Security Core</span>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">System is strictly enforcing Pricing Guard v3.0 logic.</p>
                                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-blue-200">Hard Floor</span>
                                                    <span className="text-xs font-black text-electric">{settings.minMarginFixed}€</span>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-4">Force Refresh Sequence</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={fetchStats} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl flex flex-col items-center transition-all border border-white/5">
                                                        <TrendingUp className="w-4 h-4 mb-2 text-emerald-400" />
                                                        <span className="text-[8px] font-black uppercase">KPIs</span>
                                                    </button>
                                                    <button onClick={fetchOrders} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl flex flex-col items-center transition-all border border-white/5">
                                                        <RefreshCw className="w-4 h-4 mb-2 text-blue-400" />
                                                        <span className="text-[8px] font-black uppercase">Orders</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-8 mt-8 border-t border-white/10 italic text-[10px] text-slate-400 font-medium">
                                                Connected as Admin Root via Vercel Edge.
                                                <br />Latency: 14ms
                                            </div>
                                        </div>
                                    </div>
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

                            {/* Enterprise Auto-Discounts */}
                            <div className="mt-12 border-t pt-10">
                                <h3 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-electric" /> Automatischer Warenkorb-Rabatt
                                </h3>
                                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-[2rem] border border-blue-100 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="flex flex-col justify-center">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settings.autoDiscountEnabled}
                                                        onChange={(e) => setSettings({ ...settings, autoDiscountEnabled: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric"></div>
                                                </div>
                                                <span className="font-bold text-navy group-hover:text-electric transition-colors">Rabatt-Automatik aktiv</span>
                                            </label>
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-black italic">Wird ohne Code angewendet</p>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Rabatt-Höhe (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-electric outline-none font-black text-navy"
                                                    value={settings.autoDiscountPercent}
                                                    onChange={(e) => setSettings({ ...settings, autoDiscountPercent: Number(e.target.value) })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-300">%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ab Warenwert (€)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-electric outline-none font-black text-navy"
                                                    value={settings.autoDiscountThreshold}
                                                    onChange={(e) => setSettings({ ...settings, autoDiscountThreshold: Number(e.target.value) })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-300">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-white/50 rounded-xl border border-blue-50 text-xs text-blue-600 font-medium leading-relaxed">
                                        ℹ️ <strong>Logik:</strong> Wenn der Warenkorb-Wert (Brutto) den Schwellenwert erreicht, wird der Rabatt automatisch auf alle Artikel angewendet.
                                        Dies geschieht unabhängig von weiteren Gutscheincodes und wird dem Kunden direkt im Warenkorb als Fortschrittsbalken visualisiert.
                                    </div>
                                </div>
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
                                                <th className="py-3 px-4 text-gray-500 font-bold text-sm">Laufzeit</th>
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
                                                    <td className="py-3 px-4 text-sm text-gray-500">{order.duration || '-'}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-navy">{order.name}</span>
                                                            <span className="text-[10px] font-bold text-electric px-1.5 py-0.5 bg-blue-50 rounded w-fit mt-1">
                                                                {order.providerName || 'eSIMAccess'}
                                                            </span>
                                                            {order.speed && <span className="text-[10px] text-gray-500 mt-1">Speed: {order.speed}</span>}
                                                        </div>
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
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-navy">Gewinn-Kalkulator</h2>
                                    <span className="text-sm font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                        {pagination.totalItems} Produkte
                                    </span>
                                </div>
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
                                                { label: 'Speed', key: 'speed' },
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
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-navy">{p.name}</span>
                                                            <span className="text-[10px] font-bold text-electric px-1.5 py-0.5 bg-blue-50 rounded w-fit mt-1">
                                                                {p.providerName || 'eSIMAccess'}
                                                            </span>
                                                        </div>
                                                    </td>
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
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-600">
                                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{p.speed || '4G/5G'}</span>
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
                    {activeTab === 'providers' && (
                        <ProviderManagement token={`Bearer ${password}`} />
                    )}

                    {activeTab === 'analytics' && (
                        <EnterpriseAnalytics token={`Bearer ${password}`} />
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-10">
                            <div>
                                <h2 className="text-3xl font-black text-navy tracking-tight">Pricing Engine</h2>
                                <p className="text-gray-400 font-bold text-sm italic underline decoration-electric/30">Global Revenue Guard & Default Margin Sets</p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {/* Profit Guard Card */}
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-orange-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full translate-x-16 -translate-y-16 blur-2xl group-hover:bg-orange-100 transition-colors" />
                                    <h3 className="text-xl font-black text-navy mb-8 flex items-center gap-3">
                                        <ShieldAlert className="text-orange-500 w-6 h-6" /> Price Guard Protection
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hard Floor (€)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input
                                                    type="number" step="0.01"
                                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-electric rounded-2xl outline-none font-black text-navy transition-all"
                                                    value={settings.minMarginFixed || 1.0}
                                                    onChange={(e) => setSettings({ ...settings, minMarginFixed: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hard Margin (%)</label>
                                            <div className="relative">
                                                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input
                                                    type="number" step="0.1"
                                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-electric rounded-2xl outline-none font-black text-navy transition-all"
                                                    value={settings.minMarginPercent || 5.0}
                                                    onChange={(e) => setSettings({ ...settings, minMarginPercent: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                                        <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
                                            ⚠️ CRITICAL OVERRIDE: The system materializes final sell prices using
                                            <span className="font-black px-1">GREATEST(Base + Margin, Cost + Min Guard)</span>.
                                            This protects your bottom line against extreme discount combos.
                                        </p>
                                    </div>
                                </div>

                                {/* Global Margin Card */}
                                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-electric/10 rounded-full translate-x-24 translate-y-24 blur-3xl" />
                                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                        <Zap className="text-electric w-6 h-6" /> Standard Yield Optimization
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield (%)</label>
                                            <input
                                                type="number" className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 focus:border-electric rounded-2xl outline-none font-black text-white transition-all placeholder:text-slate-700"
                                                value={settings.globalMarginPercent}
                                                onChange={(e) => setSettings({ ...settings, globalMarginPercent: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Static Fee (€)</label>
                                            <input
                                                type="number" className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 focus:border-electric rounded-2xl outline-none font-black text-white transition-all"
                                                value={settings.globalMarginFixed}
                                                onChange={(e) => setSettings({ ...settings, globalMarginFixed: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <p className="mt-8 text-[10px] text-slate-400 font-bold italic tracking-tight">
                                        Applicable to all standard routing paths. Regional overrides will take precedence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}



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

                                                <div className="mt-3 pt-2 border-t border-gray-200/50 space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Summe:</span>
                                                        <span className="font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: orderDetail.local.currency }).format(orderDetail.local.amount)}</span>
                                                    </div>

                                                    {/* Calculations */}
                                                    {(() => {
                                                        const totalCost = orderDetail.local.items.reduce((sum: number, item: any) => sum + ((orderDetail.productCosts?.[item.productName] || 0) * item.quantity), 0);
                                                        const profit = orderDetail.local.amount - totalCost;
                                                        return (
                                                            <>
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span>EK (eSIM):</span>
                                                                    <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalCost)}</span>
                                                                </div>
                                                                <div className={`flex justify-between text-sm font-bold ${profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                    <span>Gewinn:</span>
                                                                    <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(profit)}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <p className="text-[10px] text-gray-400 mt-2 break-all font-mono">{orderDetail.stripe?.payment_intent?.id || 'No Intent'}</p>
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
                                                            <a
                                                                href={`/${lang}/install?address=rsp.esim-go.com&matchingId=${orderDetail.local?.items[0]?.matchingId}`}
                                                                className="text-[10px] text-electric hover:underline font-bold mt-1 inline-block mr-3"
                                                                target="_blank"
                                                            >
                                                                iOS Deep Link Testen
                                                            </a>

                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    onClick={() => checkEsimStatus(e.iccid)}
                                                                    disabled={loadingEsimAction === e.iccid}
                                                                    className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded font-bold"
                                                                >
                                                                    {loadingEsimAction === e.iccid ? 'Laden...' : 'Status Check'}
                                                                </button>
                                                                <button
                                                                    onClick={() => topupEsim(e.iccid, e.bundle)}
                                                                    disabled={loadingEsimAction === e.iccid + '_topup'}
                                                                    className="text-[10px] bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded font-bold"
                                                                >
                                                                    {loadingEsimAction === e.iccid + '_topup' ? 'Wird gebucht...' : '1x Nachladen'}
                                                                </button>
                                                            </div>

                                                            {esimDetails[e.iccid] && (
                                                                <div className="mt-2 p-2 bg-white rounded border text-xs">
                                                                    <p><strong>Status:</strong> {esimDetails[e.iccid].status}</p>
                                                                    <div className="mt-1">
                                                                        <strong>Bundles:</strong>
                                                                        {esimDetails[e.iccid].bundles?.map((b: any, bi: number) => (
                                                                            <div key={bi} className="pl-1 border-l-2 border-gray-300 mt-1">
                                                                                <div className="flex justify-between">
                                                                                    <span>{b.name}</span>
                                                                                    <span className={b.status === 'active' ? 'text-green-600 font-bold' : ''}>{b.status}</span>
                                                                                </div>
                                                                                <div className="text-[10px] text-gray-500">
                                                                                    {(b.remainingQuantity / 1024 / 1024 / 1024).toFixed(2)} GB verbleibend
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                                {orderDetail.email?.created_at && (
                                                    <p className="text-xs font-bold text-navy mt-1">
                                                        {new Date(orderDetail.email.created_at).toLocaleDateString()} {new Date(orderDetail.email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-500 mt-1 break-all font-mono">ID: {orderDetail.email?.id || orderDetail.local?.providerSync?.resendMessageId || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {orderDetail.local?.items.some((i: any) => i.matchingId) && (
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <h3 className="font-bold text-sm text-blue-800 mb-2 flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4" /> Technische Details (Fulfillment)
                                                </h3>
                                                {orderDetail.local.items.map((item: any, i: number) => item.matchingId ? (
                                                    <div key={i} className="space-y-3 text-xs">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-500">SM-DP+ Adresse:</span>
                                                            <span className="font-mono font-bold">{item.smdpAddress || 'rsp.esim-go.com'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-500">Matching ID:</span>
                                                            <span className="font-mono font-bold select-all bg-white px-1 border rounded">{item.matchingId}</span>
                                                        </div>
                                                        <div className="pt-2">
                                                            <a
                                                                href={`/${lang}/install?address=${item.smdpAddress || 'rsp.esim-go.com'}&matchingId=${item.matchingId}`}
                                                                className="block text-center bg-navy text-white py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                                                                target="_blank"
                                                            >
                                                                iOS Direct Link testen
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : null)}
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div>
                                            <h3 className="font-bold text-navy mb-3">Gekaufte Artikel</h3>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                                {orderDetail.local?.items && orderDetail.local.items.length > 0 ? (
                                                    orderDetail.local.items.map((item: any) => (
                                                        <div key={item.id} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-navy">{item.productName} (x{item.quantity})</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                                                                <span className="text-[10px] uppercase text-gray-400 font-bold">ICCID</span>
                                                                <span className="font-mono text-sm font-bold text-electric select-all">{item.iccid || 'No ICCID'}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 bg-white rounded border border-dashed border-gray-300">
                                                        <p className="text-sm font-bold text-gray-700 mb-1">{selectedOrder.items}</p>
                                                        <p className="text-[10px] text-red-500 uppercase font-bold">In DB nicht gefunden - Prüfe Webhook!</p>
                                                    </div>
                                                )}
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

                    {activeTab === 'visitors' && (
                        <VisitorAnalytics password={password} />
                    )}

                    <PriceEditor
                        isOpen={isPriceEditorOpen}
                        onClose={() => setIsPriceEditorOpen(false)}
                        product={selectedProductForEdit}
                        onSave={handleSavePrice}
                    />
                </div>
            </main>
        </div>
    );
}

