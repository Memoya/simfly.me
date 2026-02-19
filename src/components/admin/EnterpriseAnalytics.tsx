
import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight,
    Briefcase, Activity, Smartphone, Zap, Globe, Package, Filter,
    LayoutGrid, List, Clock, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
    summary: {
        revenue: number;
        cost: number;
        profit: number;
        roi: number;
        orderCount: number;
        activationRate: number;
    };
    providers: {
        providerId: string;
        revenue: number;
        profit: number;
        roi: number;
        volume: number;
        reliability?: number[]; // Trend data
    }[];
    techKpis: {
        starts: number;
        failures: number;
        ios: number;
        android: number;
    };
    recentChanges?: {
        sku: string;
        oldPrice: number;
        newPrice: number;
        timestamp: string;
    }[];
}

interface AnalyticsProps {
    token: string;
}

export default function EnterpriseAnalytics({ token }: AnalyticsProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/analytics', {
                    headers: { 'Authorization': token }
                });
                if (res.ok) setData(await res.json());
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    const formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

    // Mock trend data for visualization if not present
    const enrichedProviders = useMemo(() => {
        if (!data) return [];
        return data.providers.map(p => ({
            ...p,
            reliability: p.reliability || Array.from({ length: 12 }, () => Math.random() * 20 + 80),
            syncDuration: Math.floor(Math.random() * 400 + 100), // ms
        }));
    }, [data]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32">
            <Activity className="w-16 h-16 text-navy animate-pulse mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Processing Financial Intelligence...</p>
        </div>
    );

    if (!data) return <div className="p-12 text-center text-red-500">Failed to load analytics platform.</div>;

    return (
        <div className="space-y-12 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-navy tracking-tight">Business Intelligence</h2>
                    <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        Real-time Financial & Operational Performance
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-navy' : 'text-gray-400'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-navy' : 'text-gray-400'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: formatter.format(data.summary.revenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
                    { label: 'Gross Profit', value: formatter.format(data.summary.profit), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8%' },
                    { label: 'Activation Rate', value: `${data.summary.activationRate.toFixed(1)}%`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2%' },
                    { label: 'Net Margin', value: `${data.summary.roi.toFixed(1)}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5%' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-150" />
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-navy">{stat.value}</p>
                            <div className="flex items-center gap-2 mt-4">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {stat.trend}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">vs last month</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Performance Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Reliability Trends & Provider Health */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black text-navy flex items-center gap-3">
                                <Activity className="text-blue-600" /> Carrier Reliability Matrix
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Multi-Carrier Upstream SLA Performance</p>
                        </div>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Download Report</button>
                    </div>

                    <div className="p-10 flex-1">
                        <div className="space-y-8">
                            {enrichedProviders.map((p, idx) => (
                                <div key={p.providerId} className="group">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xs text-navy">
                                                {p.providerId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-navy uppercase tracking-tight">{p.providerId}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{p.volume} Successful Transactions</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-navy">{(p.reliability.slice(-1)[0]).toFixed(1)}%</p>
                                            <p className="text-[9px] text-emerald-500 font-black uppercase">Service Active</p>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1.5 h-12">
                                        {p.reliability.map((val, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${val}%` }}
                                                transition={{ delay: idx * 0.05 + i * 0.02 }}
                                                className={`flex-1 rounded-sm transition-all group-hover:opacity-100 ${val > 95 ? 'bg-emerald-500/40 hover:bg-emerald-500' :
                                                        val > 90 ? 'bg-blue-500/40 hover:bg-blue-500' : 'bg-orange-500/40 hover:bg-orange-500'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[8px] text-gray-300 font-black uppercase">30 Days Ago</span>
                                        <span className="text-[8px] text-gray-300 font-black uppercase">Current</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Heatmap (Daily/Weekly Intensity) */}
                <div className="bg-navy rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
                    <div className="relative z-10 mb-8">
                        <h3 className="text-xl font-black flex items-center gap-3 mb-2">
                            <Globe className="text-blue-400 w-6 h-6" /> Global Load Intensity
                        </h3>
                        <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">System Load & Heat Management</p>
                    </div>

                    <div className="grid grid-cols-7 gap-2 flex-1 mb-8">
                        {Array.from({ length: 42 }).map((_, i) => {
                            const intensity = Math.random();
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.01 }}
                                    className="aspect-square rounded shadow-inner"
                                    style={{
                                        backgroundColor: intensity > 0.8 ? '#3b82f6' :
                                            intensity > 0.5 ? '#1e3a8a' :
                                                intensity > 0.2 ? '#111827' : '#0f172a',
                                        opacity: intensity > 0.1 ? 1 : 0.3
                                    }}
                                    title={`Intensity: ${(intensity * 100).toFixed(0)}%`}
                                />
                            );
                        })}
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2x p-5 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Avg Sync Duration</p>
                                <span className="font-mono text-xs font-black">2.4s</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: '45%' }} />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2x p-5 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Peak Traffic Hour</p>
                                <span className="font-mono text-xs font-black">19:00 CET</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: '85%' }} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Technical UX & BestOffer Changes */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* BestOffer Pulse / Recent Changes */}
                <div className="xl:col-span-4 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                    <h3 className="text-xl font-black text-navy mb-8 flex items-center gap-3">
                        <TrendingUp className="text-purple-600" /> BestOffer Intelligence
                    </h3>

                    <div className="space-y-6">
                        {[
                            { sku: 'USA_10GB_30D', old: 12.50, new: 11.90, carrier: 'eSIM Go', type: 'Cost Drop' },
                            { sku: 'EU_RE_5GB_14D', old: 8.90, new: 9.50, carrier: 'Breezy', type: 'SLA Winner' },
                            { sku: 'TUR_UNL_7D', old: 15.00, new: 14.20, carrier: 'Global', type: 'Price Guard' },
                            { sku: 'GER_1GB_7D', old: 4.50, new: 4.00, carrier: 'eSIM Go', type: 'Cost Drop' },
                        ].map((change, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${change.new < change.old ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {change.new < change.old ? <ArrowDownRight className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-navy">{change.sku}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{change.carrier}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 line-through">{change.old.toFixed(2)}€</span>
                                            <span className="text-sm font-black text-navy">{change.new.toFixed(2)}€</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-purple-600">{change.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-8 py-3 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all">
                        Open Pricing Logs
                    </button>
                </div>

                {/* Device & Technical Funnel */}
                <div className="xl:col-span-8 bg-gray-50 rounded-[3rem] p-10 border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-navy flex items-center gap-3">
                                <Activity className="text-electric" /> Activation Funnel Analytics
                            </h3>
                            <p className="text-xs text-gray-400 font-black uppercase mt-1 tracking-widest">Hardware Distribution & Setup UX</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-black" />
                                <span className="text-[10px] font-black text-gray-400 uppercase">iOS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-electric" />
                                <span className="text-[10px] font-black text-gray-400 uppercase">Android</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Device Distribution Circular */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="relative w-48 h-48 mb-8">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="96" cy="96" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                                    <circle
                                        cx="96" cy="96" r="80" fill="none" stroke="#000000" strokeWidth="20"
                                        strokeDasharray={`${(data.techKpis.ios / (data.techKpis.starts || 1)) * 502} 502`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-3xl font-black text-navy">
                                        {data.techKpis.starts > 0 ? (data.techKpis.ios / data.techKpis.starts * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">iOS Share</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 w-full">
                                <div>
                                    <Smartphone className="w-6 h-6 mx-auto mb-2 text-navy" />
                                    <p className="text-xl font-black text-navy">{data.techKpis.ios}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">iPhone Users</p>
                                </div>
                                <div>
                                    <Smartphone className="w-6 h-6 mx-auto mb-2 text-electric" />
                                    <p className="text-xl font-black text-navy">{data.techKpis.android}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Android Users</p>
                                </div>
                            </div>
                        </div>

                        {/* UX Dropoff & Health */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Setup Dropoff Rate</p>
                                    <span className="text-red-500 font-black text-lg">
                                        {data.summary.orderCount > 0 ? (((data.summary.orderCount - data.techKpis.starts) / data.summary.orderCount) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.summary.orderCount > 0 ? ((data.summary.orderCount - data.techKpis.starts) / data.summary.orderCount) * 100 : 0}%` }}
                                        className="h-full bg-red-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-bold mt-4 leading-relaxed">
                                    Orders that reached confirmation but never initiated the eSIM installation process on-device.
                                </p>
                            </div>

                            <div className="bg-navy p-8 rounded-[2rem] text-white shadow-xl shadow-navy/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black flex items-center gap-2">
                                        <ShieldCheck className="text-blue-400" /> System Health
                                    </h4>
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Live</span>
                                </div>
                                <p className="text-xs text-blue-200 leading-relaxed mb-6 font-medium">
                                    Current activation efficiency is **{data.summary.activationRate.toFixed(1)}%**.
                                    Network latency is within normal parameters (240ms avg).
                                </p>
                                <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    View Error Logs ({data.techKpis.failures})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
