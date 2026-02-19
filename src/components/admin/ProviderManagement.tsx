import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    RefreshCw, CheckCircle, XCircle, Settings, AlertTriangle,
    Activity, History, ShieldAlert, Power, Zap, Filter,
    TrendingUp, Clock, Search, Database, Coins, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProviderStats {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    priority: number;
    reliabilityScore: number;
    lastSync: string | null;
    failedOrders: number;
    config?: any;
    _count: {
        products: number;
        orders: number;
    }
}

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    details: string;
    createdAt: string;
}

interface ProviderManagementProps {
    token: string;
}

export default function ProviderManagement({ token }: ProviderManagementProps) {
    const [providers, setProviders] = useState<ProviderStats[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ results: { provider: string, success: boolean, count: number }[], error?: string } | null>(null);
    const [editingProvider, setEditingProvider] = useState<ProviderStats | null>(null);
    const [auditFilter, setAuditFilter] = useState<'all' | 'error' | 'sync' | 'price'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [scanConfig, setScanConfig] = useState({ country: 'US', data: 1000, days: 7 });
    const [scanResults, setScanResults] = useState<any>(null);
    const [scanning, setScanning] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [pRes, lRes] = await Promise.all([
                fetch('/api/admin/providers', { headers: { 'Authorization': token } }),
                fetch('/api/admin/audit?limit=50', { headers: { 'Authorization': token } })
            ]);

            if (pRes.ok) setProviders(await pRes.json());
            if (lRes.ok) setLogs(await lRes.json());
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchBalances = useCallback(async () => {
        providers.forEach(async (p) => {
            try {
                const res = await fetch(`/api/admin/providers/status?id=${p.id}`, { headers: { 'Authorization': token } });
                if (res.ok) {
                    const data = await res.json();
                    setBalances(prev => ({ ...prev, [p.id]: data.balance }));
                }
            } catch (e) {
                console.error('Balance check failed', e);
            }
        });
    }, [providers, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (providers.length > 0 && Object.keys(balances).length === 0) {
            fetchBalances();
        }
    }, [providers, fetchBalances, balances]);

    const runScanner = async () => {
        setScanning(true);
        try {
            const res = await fetch(`/api/admin/providers/scanner?country=${scanConfig.country}&data=${scanConfig.data}&days=${scanConfig.days}`, {
                headers: { 'Authorization': token }
            });
            if (res.ok) setScanResults(await res.json());
        } finally {
            setScanning(false);
        }
    };

    const handleSync = async (providerId?: string) => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch('/api/admin/sync', {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId })
            });
            const data = await res.json();
            setSyncResult(data);
            fetchData();
        } catch {
            setSyncResult({ results: [], error: 'Sync failed' });
        } finally {
            setSyncing(false);
        }
    };

    const toggleProvider = async (provider: ProviderStats) => {
        try {
            const res = await fetch('/api/admin/providers', {
                method: 'PATCH',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: provider.id,
                    isActive: !provider.isActive
                })
            });
            if (res.ok) fetchData();
        } catch {
            alert('Operation failed');
        }
    };

    const handleUpdateProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProvider) return;

        try {
            const res = await fetch('/api/admin/providers', {
                method: 'PATCH',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingProvider.id,
                    priority: editingProvider.priority,
                    reliabilityScore: editingProvider.reliabilityScore,
                    isActive: editingProvider.isActive,
                    config: editingProvider.config
                })
            });
            if (res.ok) {
                setEditingProvider(null);
                fetchData();
            }
        } catch {
            alert('Update failed');
        }
    };

    const alerts = providers.filter(p => p.reliabilityScore < 0.8 || p.failedOrders > 0);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (auditFilter === 'error') return log.action.toLowerCase().includes('error') || log.details?.toLowerCase().includes('fail');
            if (auditFilter === 'sync') return log.action.toLowerCase().includes('sync');
            if (auditFilter === 'price') return log.action.toLowerCase().includes('price');
            return true;
        });
    }, [logs, auditFilter]);

    const stats = useMemo(() => {
        const total = providers.length || 1;
        const avgReliability = providers.reduce((acc, p) => acc + (p.reliabilityScore || 0), 0) / total;
        const totalSkus = providers.reduce((acc, p) => acc + (p._count?.products || 0), 0);
        return { avgReliability, totalSkus };
    }, [providers]);

    if (loading && providers.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Activity className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Multi-Provider Core...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header section with Stats */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-navy tracking-tight flex items-center gap-3">
                        Infrastructure Control
                        {syncing && <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />}
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Monitoring {providers.length} Upstream Carriers</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-6 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Avg Health</p>
                            <p className="text-xl font-black text-navy">{(stats.avgReliability * 100).toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-6 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total SKUs</p>
                            <p className="text-xl font-black text-navy">{stats.totalSkus.toLocaleString()}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSync()}
                        disabled={syncing}
                        className={`px-8 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${syncing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-navy text-white hover:bg-black shadow-navy/20'
                            }`}
                    >
                        <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Global Force Sync'}
                    </button>
                </div>
            </div>

            {/* Price Scanner Tool */}
            <div className="bg-navy rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Globe className="w-8 h-8 text-blue-400" /> Carrier Price Scanner
                        </h3>
                        <p className="text-blue-200 text-sm font-medium mt-2">Compare real-time wholesale rates across your entire carrier matrix to optimize routing.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black text-blue-300 ml-2">Location</label>
                            <input
                                type="text"
                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white font-bold w-24 outline-none focus:ring-2 focus:ring-blue-500"
                                value={scanConfig.country}
                                onChange={e => setScanConfig({ ...scanConfig, country: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black text-blue-300 ml-2">Data (MB)</label>
                            <input
                                type="number"
                                className="bg-white/10 border-none rounded-xl px-4 py-2 text-white font-bold w-24 outline-none focus:ring-2 focus:ring-blue-500"
                                value={scanConfig.data}
                                onChange={e => setScanConfig({ ...scanConfig, data: parseInt(e.target.value) })}
                            />
                        </div>
                        <button
                            onClick={runScanner}
                            disabled={scanning}
                            className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 self-end shadow-lg shadow-blue-500/20 transition-all"
                        >
                            {scanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Run Pulse Scan
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {scanResults && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-8 border-t border-white/10 pt-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {scanResults.results.map((r: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-2xl border-2 transition-all ${i === 0 ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-blue-300">{r.provider.name}</p>
                                                <p className="font-black text-lg mt-1">{r.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-green-400">${r.price.toFixed(2)}</p>
                                                <p className="text-[9px] font-bold text-gray-400">Wholesale</p>
                                            </div>
                                        </div>
                                        {i === 0 && (
                                            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-300">
                                                <Zap className="w-3 h-3 fill-blue-300" /> Recommend for Routing Matrix
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4 text-red-600">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                <ShieldAlert className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight">System Outage Warning</h4>
                                <p className="text-xs font-bold opacity-70">{alerts.length} Providers reporting SLA violations</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {alerts.map(a => (
                                <span key={a.id} className="bg-white text-red-600 text-[10px] px-3 py-1.5 rounded-xl border border-red-100 uppercase font-black shadow-sm">
                                    {a.name}: {a.failedOrders > 0 ? 'Outage' : 'Low Reliability'}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Provider Area */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Search & Bulk Actions */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search providers or SKUs..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center px-4">Active Routing Matrix</span>
                        </div>
                    </div>

                    {/* Providers Grid/Table */}
                    <div className="grid grid-cols-1 gap-4">
                        {providers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => {
                            const brandColors: Record<string, string> = {
                                'esim-go': 'bg-blue-600',
                                'airalo': 'bg-orange-600',
                                'esim-access': 'bg-cyan-600'
                            };

                            const brandTags: Record<string, string[]> = {
                                'esim-go': ['Wholesale', 'Direct API', 'Global'],
                                'airalo': ['Market Leader', 'Travel Focus'],
                                'esim-access': ['High-Speed', 'Enterprise API']
                            };

                            return (
                                <motion.div
                                    layout
                                    key={p.id}
                                    className={`group bg-white rounded-3xl p-6 border-b-4 transition-all hover:shadow-xl hover:-translate-y-1 ${p.isActive ? 'border-blue-500 shadow-sm' : 'border-gray-200 grayscale opacity-60'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        {/* Logo & Info */}
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className={`w-16 h-16 rounded-[1.5rem] flex-shrink-0 flex items-center justify-center font-black text-xl text-white shadow-lg transition-transform group-hover:rotate-3 ${brandColors[p.slug] || 'bg-slate-400'}`}>
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-black text-navy truncate">
                                                        {p.name}
                                                    </h3>
                                                    {p.priority > 80 && <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 ${balances[p.id] < 10 ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-500'}`}>
                                                        <Coins className="w-3 h-3" />
                                                        {balances[p.id] !== undefined ? `$${balances[p.id].toFixed(2)}` : '---'}
                                                    </span>
                                                    {brandTags[p.slug]?.map(tag => (
                                                        <span key={tag} className="text-[8px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-black text-slate-400 uppercase tracking-widest">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${p.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                        {p.isActive ? 'Operational' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Routing Stats */}
                                        <div className="grid grid-cols-2 lg:flex items-center gap-8 px-6 border-x-0 md:border-x border-gray-100">
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Routing Weight</p>
                                                <p className="text-lg font-black text-amber-500">#{p.priority}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Health SLA</p>
                                                <div className="flex flex-col items-center">
                                                    <p className={`text-lg font-black ${p.reliabilityScore > 0.9 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                        {(p.reliabilityScore * 100).toFixed(0)}%
                                                    </p>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {[1, 1, 1, 1, 1].map((_, i) => (
                                                            <div key={i} className={`w-1 h-3 rounded-full ${i < p.reliabilityScore * 5 ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inventory Matrix */}
                                        <div className="hidden lg:block w-40">
                                            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase mb-2">
                                                <span>Live SKUs</span>
                                                <Database className="w-3 h-3" />
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-black text-navy">{p._count?.products || 0}</span>
                                                <span className="text-[10px] text-gray-400 font-bold mb-1 opacity-50 uppercase tracking-tighter">Packages</span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-2 font-bold italic">
                                                Intensity: {(p._count?.products || 0) > 500 ? 'High' : 'Moderate'}
                                            </p>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleProvider(p)}
                                                className={`p-3 rounded-2xl transition-all border-2 ${p.isActive
                                                    ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                                                    : 'bg-green-50 border-green-100 text-green-500 hover:bg-green-100'
                                                    }`}
                                                title={p.isActive ? "Deactivate" : "Activate"}
                                            >
                                                <Power className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setEditingProvider(p)}
                                                className="p-3 bg-white border-2 border-slate-100 text-navy hover:bg-slate-50 rounded-2xl transition-all"
                                                title="Configure"
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleSync(p.id)}
                                                disabled={syncing}
                                                className="p-3 bg-blue-50 border-2 border-blue-100 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all disabled:opacity-50"
                                                title="Sync This Provider"
                                            >
                                                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Sync Result Toast-like Notification */}
                    <AnimatePresence>
                        {syncResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-navy text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h4 className="text-lg font-black flex items-center gap-2">
                                            <CheckCircle className="text-green-400 w-5 h-5" /> Sync Operation Completed
                                        </h4>
                                        <p className="text-blue-300 text-xs font-bold mt-1">Pricing materialization and cache invalidation succeeded.</p>
                                    </div>
                                    <button onClick={() => setSyncResult(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(syncResult.results || []).map((r: any, i: number) => (
                                        <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 uppercase font-black mb-1">{r.provider}</p>
                                            <div className="flex justify-between items-center">
                                                <span className={r.success ? 'text-green-400 font-black' : 'text-red-400 font-black italic'}>
                                                    {r.success ? '✓ SUCCESS' : '✕ FAILED'}
                                                </span>
                                                <span className="text-white font-mono text-xs">{r.count || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Audit & Logs Sidebar */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-navy flex items-center gap-3">
                                    <History className="w-5 h-5 text-blue-500" /> Infrastructure Audit
                                </h3>
                                <button onClick={fetchData} className="p-2 hover:bg-blue-50 rounded-xl transition-all">
                                    <RefreshCw className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Audit Filters */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All', icon: Activity },
                                    { id: 'error', label: 'Errors', icon: AlertTriangle },
                                    { id: 'sync', label: 'Syncs', icon: RefreshCw },
                                    { id: 'price', label: 'Prices', icon: TrendingUp }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setAuditFilter(tab.id as any)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all border ${auditFilter === tab.id
                                            ? 'bg-navy text-white border-navy shadow-md'
                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <tab.icon className="w-3 h-3" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[700px] p-6 space-y-4 custom-scrollbar">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="group relative pl-4 border-l-2 border-gray-100 hover:border-blue-500 transition-colors py-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${log.action.toLowerCase().includes('error') ? 'bg-red-50 text-red-500' :
                                                log.action.toLowerCase().includes('sync') ? 'bg-blue-50 text-blue-500' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                                            <Clock className="w-2 h-2" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-navy mb-1">{log.entity}</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                        {log.details}
                                    </p>
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="text-center py-20">
                                    <Filter className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No entries found for this filter</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-navy hover:bg-navy hover:text-white transition-all">
                                Load Full Audit History
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingProvider && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-navy/20">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-gray-100 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-navy mb-2">Provider Profile</h3>
                                <p className="text-gray-400 text-sm font-bold mb-8 italic">Manual override for {editingProvider.name}</p>

                                <form onSubmit={handleUpdateProvider} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3" /> Routing Controls
                                        </h4>
                                        <div className="bg-gray-50 p-6 rounded-3xl space-y-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Priority</label>
                                                    <span className="text-xs font-black text-blue-600">Level {editingProvider.priority}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="100"
                                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    value={editingProvider.priority}
                                                    onChange={e => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) })}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">SLA Health Score</label>
                                                    <span className="font-mono font-black text-navy">{(editingProvider.reliabilityScore * 100).toFixed(0)}%</span>
                                                </div>
                                                <input
                                                    type="number" step="0.01" min="0" max="1"
                                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-navy font-black outline-none focus:border-blue-500 transition-colors shadow-sm"
                                                    value={editingProvider.reliabilityScore}
                                                    onChange={e => setEditingProvider({ ...editingProvider, reliabilityScore: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border-2 border-blue-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingProvider.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Power className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-black text-navy uppercase tracking-widest">State</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingProvider({ ...editingProvider, isActive: !editingProvider.isActive })}
                                                className={`w-14 h-7 rounded-full transition-all relative ${editingProvider.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${editingProvider.isActive ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="w-3 h-3" /> API Zugangsdaten
                                        </h4>
                                        <div className="bg-slate-900 p-6 rounded-3xl space-y-4 shadow-xl">
                                            <div>
                                                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">API Key / Token</label>
                                                <input
                                                    type="password"
                                                    placeholder="sk_live_..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors text-xs"
                                                    value={(editingProvider.config as any)?.apiKey || ''}
                                                    onChange={e => setEditingProvider({
                                                        ...editingProvider,
                                                        config: { ...(editingProvider.config as any || {}), apiKey: e.target.value }
                                                    })}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">API Base URL (Optional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://api..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors text-xs"
                                                    value={(editingProvider.config as any)?.baseUrl || ''}
                                                    onChange={e => setEditingProvider({
                                                        ...editingProvider,
                                                        config: { ...(editingProvider.config as any || {}), baseUrl: e.target.value }
                                                    })}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Advanced Config (JSON)</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder='{"region": "eu"}'
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500 transition-colors text-[10px]"
                                                    value={JSON.stringify((editingProvider.config as any)?.extra || {}, null, 2)}
                                                    onChange={e => {
                                                        try {
                                                            const extra = JSON.parse(e.target.value);
                                                            setEditingProvider({
                                                                ...editingProvider,
                                                                config: { ...(editingProvider.config as any || {}), extra }
                                                            });
                                                        } catch {
                                                            // Ignore invalid JSON while typing
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 flex gap-4 pt-4 border-t border-gray-50">
                                        <button
                                            type="button" onClick={() => setEditingProvider(null)}
                                            className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-4 rounded-2xl bg-navy text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-navy/20"
                                        >
                                            Speichern & Anwenden
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
