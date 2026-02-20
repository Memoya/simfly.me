'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, Eye, Clock, Globe, Smartphone, MapPin, BarChart3, Calendar, Filter, Download, Activity, RefreshCw, Zap, Target, TrendingDown } from 'lucide-react';

interface VisitorSession {
    id: string;
    sessionId: string;
    ip?: string;
    browser?: string;
    device?: string;
    os?: string;
    osVersion?: string;
    page: string;
    lang?: string;
    referrer?: string;
    screenWidth?: number;
    screenHeight?: number;
    createdAt: string;
    lastActive: string;
}

interface VisitorStats {
    activeNow: number;
    totalSessions: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    returningVisitors: number;
    topPages: { page: string; count: number; avgDuration: number }[];
    deviceBreakdown: { device: string; count: number; percentage: number }[];
    browserBreakdown: { browser: string; count: number; percentage: number }[];
    osBreakdown: { os: string; count: number; percentage: number }[];
    langBreakdown: { lang: string; count: number }[];
    trafficSources: { source: string; count: number; percentage: number }[];
    entryPages: { page: string; count: number }[];
    exitPages: { page: string; count: number }[];
    visitorTimeline: { hour: string; count: number }[];
}

interface VisitorAnalyticsProps {
    password: string;
}

export default function VisitorAnalytics({ password }: VisitorAnalyticsProps) {
    const [visitors, setVisitors] = useState<VisitorSession[]>([]);
    const [stats, setStats] = useState<VisitorStats>({
        activeNow: 0,
        totalSessions: 0,
        uniqueVisitors: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        returningVisitors: 0,
        topPages: [],
        deviceBreakdown: [],
        browserBreakdown: [],
        osBreakdown: [],
        langBreakdown: [],
        trafficSources: [],
        entryPages: [],
        exitPages: [],
        visitorTimeline: []
    });
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active'>('active');

    const fetchVisitorData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics/visitors?timeRange=${timeRange}`, {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVisitors(data.visitors || []);
                
                // Compute comprehensive stats
                const uniqueSessions = new Set(data.visitors?.map((v: any) => v.sessionId) || []).size;
                const topPagesMap = new Map<string, { count: number; durations: number[] }>();
                const deviceMap = new Map<string, number>();
                const browserMap = new Map<string, number>();
                const osMap = new Map<string, number>();
                const langMap = new Map<string, number>();
                const trafficSourceMap = new Map<string, number>();
                const entryPagesMap = new Map<string, number>();
                const exitPagesMap = new Map<string, number>();
                const timelineMap = new Map<string, number>();
                const sessionMap = new Map<string, VisitorSession[]>();

                data.visitors?.forEach((v: any) => {
                    // Group by session
                    if (!sessionMap.has(v.sessionId)) {
                        sessionMap.set(v.sessionId, []);
                    }
                    sessionMap.get(v.sessionId)!.push(v);

                    // Top pages with duration
                    if (!topPagesMap.has(v.page)) {
                        topPagesMap.set(v.page, { count: 0, durations: [] });
                    }
                    topPagesMap.get(v.page)!.count++;
                    
                    // Device breakdown
                    if (v.device) {
                        deviceMap.set(v.device, (deviceMap.get(v.device) || 0) + 1);
                    }
                    
                    // Browser breakdown
                    if (v.browser) {
                        browserMap.set(v.browser, (browserMap.get(v.browser) || 0) + 1);
                    }
                    
                    // OS breakdown
                    if (v.os) {
                        osMap.set(v.os, (osMap.get(v.os) || 0) + 1);
                    }
                    
                    // Language breakdown
                    if (v.lang) {
                        langMap.set(v.lang, (langMap.get(v.lang) || 0) + 1);
                    }

                    // Traffic sources
                    const source = v.referrer || 'Direct';
                    trafficSourceMap.set(source, (trafficSourceMap.get(source) || 0) + 1);

                    // Timeline by hour
                    const date = new Date(v.createdAt);
                    const hour = date.getHours();
                    const hourKey = `${hour}:00`;
                    timelineMap.set(hourKey, (timelineMap.get(hourKey) || 0) + 1);
                });

                // Calculate entry and exit pages
                sessionMap.forEach((pages) => {
                    if (pages.length > 0) {
                        const entryPage = pages[0].page;
                        const exitPage = pages[pages.length - 1].page;
                        entryPagesMap.set(entryPage, (entryPagesMap.get(entryPage) || 0) + 1);
                        exitPagesMap.set(exitPage, (exitPagesMap.get(exitPage) || 0) + 1);
                    }
                });

                // Calculate session durations and bounce rate
                let totalDuration = 0;
                let bounceCount = 0;
                const sessionDurations: number[] = [];

                sessionMap.forEach((pages) => {
                    if (pages.length > 0) {
                        const firstTime = new Date(pages[0].createdAt).getTime();
                        const lastTime = new Date(pages[pages.length - 1].lastActive).getTime();
                        const duration = (lastTime - firstTime) / 1000 / 60; // in minutes
                        sessionDurations.push(Math.max(0, duration));
                        totalDuration += Math.max(0, duration);

                        if (pages.length === 1) {
                            bounceCount++;
                        }
                    }
                });

                const avgSessionDuration = sessionDurations.length > 0 ? totalDuration / sessionDurations.length : 0;
                const bounceRate = uniqueSessions > 0 ? (bounceCount / uniqueSessions) * 100 : 0;

                // Identify returning visitors (sessions from same IP appearing 2+ times)
                const ipMap = new Map<string, number>();
                data.visitors?.forEach((v: any) => {
                    if (v.ip) {
                        ipMap.set(v.ip, (ipMap.get(v.ip) || 0) + 1);
                    }
                });
                const returningVisitors = Array.from(ipMap.values()).filter(count => count > 1).length;

                const totalSessions = data.visitors?.length || 0;

                const computedStats: VisitorStats = {
                    activeNow: data.stats?.activeNow || 0,
                    totalSessions: totalSessions,
                    uniqueVisitors: uniqueSessions,
                    avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
                    bounceRate: Math.round(bounceRate),
                    returningVisitors,
                    topPages: Array.from(topPagesMap.entries())
                        .map(([page, data]) => ({ page, count: data.count, avgDuration: Math.round((data.durations.reduce((a, b) => a + b, 0) / (data.durations.length || 1)) * 10) / 10 }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10),
                    deviceBreakdown: Array.from(deviceMap.entries())
                        .map(([device, count]) => ({ device, count, percentage: Math.round((count / totalSessions) * 100) }))
                        .sort((a, b) => b.count - a.count),
                    browserBreakdown: Array.from(browserMap.entries())
                        .map(([browser, count]) => ({ browser, count, percentage: Math.round((count / totalSessions) * 100) }))
                        .sort((a, b) => b.count - a.count),
                    osBreakdown: Array.from(osMap.entries())
                        .map(([os, count]) => ({ os, count, percentage: Math.round((count / totalSessions) * 100) }))
                        .sort((a, b) => b.count - a.count),
                    langBreakdown: Array.from(langMap.entries())
                        .map(([lang, count]) => ({ lang, count }))
                        .sort((a, b) => b.count - a.count),
                    trafficSources: Array.from(trafficSourceMap.entries())
                        .map(([source, count]) => ({ source, count, percentage: Math.round((count / totalSessions) * 100) }))
                        .sort((a, b) => b.count - a.count),
                    entryPages: Array.from(entryPagesMap.entries())
                        .map(([page, count]) => ({ page, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5),
                    exitPages: Array.from(exitPagesMap.entries())
                        .map(([page, count]) => ({ page, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5),
                    visitorTimeline: Array.from(timelineMap.entries())
                        .map(([hour, count]) => ({ hour, count }))
                        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
                };

                setStats(computedStats);
            } else {
                console.error('Failed to fetch visitor data');
            }
        } catch (error) {
            console.error('Error fetching visitor analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitorData();
        const interval = setInterval(fetchVisitorData, 30000);
        return () => clearInterval(interval);
    }, [timeRange, password]);

    const exportCSV = () => {
        const csv = `Session ID,IP,Browser,Device,OS,Page,Language,Referrer,Entry Time\n${
            visitors
                .map(v => `"${v.sessionId}","${v.ip || 'N/A'}","${v.browser || 'N/A'}","${v.device || 'N/A'}","${v.os || 'N/A'}","${v.page}","${v.lang || 'N/A'}","${v.referrer || 'Direct'}","${new Date(v.createdAt).toLocaleString()}"`)
                .join('\n')
        }`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredVisitors = activeFilter === 'active'
        ? visitors.filter(v => new Date(v.lastActive).getTime() > Date.now() - 15 * 60 * 1000)
        : visitors;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-navy mb-2">Besucher-Analyse</h2>
                    <p className="text-gray-500 text-sm">Umfassende Echtzeit-Besucherdaten und Verhaltensmuster</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={fetchVisitorData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Aktualisieren
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-electric text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        CSV Export
                    </button>
                </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex gap-2 flex-wrap">
                {(['1h', '24h', '7d', '30d'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                            timeRange === range
                                ? 'bg-navy text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {range === '1h' ? 'Letzte Stunde' : range === '24h' ? 'Heute' : range === '7d' ? '7 Tage' : '30 Tage'}
                    </button>
                ))}
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    icon={<Activity className="w-6 h-6 text-green-500" />}
                    label="Aktiv jetzt"
                    value={stats.activeNow.toString()}
                    color="bg-green-50"
                />
                <KPICard
                    icon={<Users className="w-6 h-6 text-blue-500" />}
                    label="Unique Sessions"
                    value={stats.uniqueVisitors.toString()}
                    color="bg-blue-50"
                />
                <KPICard
                    icon={<Clock className="w-6 h-6 text-purple-500" />}
                    label="Ø Session-Dauer (min)"
                    value={stats.avgSessionDuration.toFixed(1)}
                    color="bg-purple-50"
                />
                <KPICard
                    icon={<TrendingDown className="w-6 h-6 text-red-500" />}
                    label="Bounce Rate"
                    value={`${stats.bounceRate}%`}
                    color="bg-red-50"
                />
            </div>

            {/* Secondary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    icon={<Eye className="w-6 h-6 text-orange-500" />}
                    label="Gesamt Besuche"
                    value={stats.totalSessions.toString()}
                    color="bg-orange-50"
                />
                <KPICard
                    icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
                    label="Wiederkehrende Besucher"
                    value={stats.returningVisitors.toString()}
                    color="bg-emerald-50"
                />
                <KPICard
                    icon={<Target className="w-6 h-6 text-pink-500" />}
                    label="Traffic Quellen"
                    value={stats.trafficSources.length.toString()}
                    color="bg-pink-50"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <ChartCard title="Top Seiten" icon={<BarChart3 />}>
                    <div className="space-y-4">
                        {stats.topPages.length > 0 ? (
                            stats.topPages.map((page, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-1">
                                        <p className="text-sm font-bold text-navy truncate">{page.page}</p>
                                        <span className="text-xs font-bold text-gray-600">{page.count} Besuche (Ø {page.avgDuration}min)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="bg-electric h-full rounded-full"
                                            style={{ width: `${(page.count / (stats.topPages[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                {/* Traffic Sources */}
                <ChartCard title="Traffic Quellen" icon={<Zap />}>
                    <div className="space-y-3">
                        {stats.trafficSources.length > 0 ? (
                            stats.trafficSources.map((source, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-navy truncate text-sm">{source.source}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-600">{source.count}</span>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">{source.percentage}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                {/* Device Breakdown */}
                <ChartCard title="Geräte" icon={<Smartphone />}>
                    <div className="space-y-3">
                        {stats.deviceBreakdown.length > 0 ? (
                            stats.deviceBreakdown.map((device, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-navy text-sm">{device.device}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-600">{device.count}</span>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">{device.percentage}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                {/* OS Breakdown */}
                <ChartCard title="Betriebssystem" icon={<Globe />}>
                    <div className="space-y-3">
                        {stats.osBreakdown.length > 0 ? (
                            stats.osBreakdown.map((os, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-navy text-sm">{os.os || 'Unbekannt'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-600">{os.count}</span>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">{os.percentage}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                {/* Browser Breakdown */}
                <ChartCard title="Browser" icon={<Globe />}>
                    <div className="space-y-3">
                        {stats.browserBreakdown.length > 0 ? (
                            stats.browserBreakdown.map((browser, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-navy text-sm">{browser.browser}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-600">{browser.count}</span>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">{browser.percentage}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                {/* Languages */}
                <ChartCard title="Sprachen" icon={<MapPin />}>
                    <div className="space-y-3">
                        {stats.langBreakdown.length > 0 ? (
                            stats.langBreakdown.map((lang, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-navy text-sm uppercase">{lang.lang}</span>
                                    <span className="text-sm font-bold text-gray-600">{lang.count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Entry/Exit Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Einstiegsseiten" icon={<TrendingUp />}>
                    <div className="space-y-2">
                        {stats.entryPages.length > 0 ? (
                            stats.entryPages.map((page, i) => (
                                <div key={i} className="flex justify-between items-center p-2 text-sm">
                                    <span className="font-bold text-navy truncate">{page.page}</span>
                                    <span className="text-gray-600">{page.count}x</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>

                <ChartCard title="Ausstiegsseiten" icon={<TrendingDown />}>
                    <div className="space-y-2">
                        {stats.exitPages.length > 0 ? (
                            stats.exitPages.map((page, i) => (
                                <div key={i} className="flex justify-between items-center p-2 text-sm">
                                    <span className="font-bold text-navy truncate">{page.page}</span>
                                    <span className="text-gray-600">{page.count}x</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Visitor Timeline */}
            <ChartCard title="Besucher-Zeitstrahl (nach Stunde)" icon={<Calendar />}>
                <div className="space-y-2">
                    {stats.visitorTimeline.length > 0 ? (
                        stats.visitorTimeline.map((item, i) => {
                            const maxCount = Math.max(...stats.visitorTimeline.map(t => t.count));
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-12 text-xs font-bold text-gray-600">{item.hour}</span>
                                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-electric to-blue-600"
                                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-xs font-bold text-gray-600">{item.count}</span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-400 text-sm">Keine Daten verfügbar</p>
                    )}
                </div>
            </ChartCard>

            {/* Sessions Details Table */}
            <ChartCard title="Sitzungsdetails" icon={<Clock />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Session ID</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Seite</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Gerät/OS</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Quelle</th>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Zeit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredVisitors.length > 0 ? (
                                filteredVisitors.slice(0, 30).map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{v.sessionId.slice(0, 8)}</code>
                                        </td>
                                        <td className="px-4 py-3 text-navy font-bold">{v.page}</td>
                                        <td className="px-4 py-3 text-sm">{v.device} / {v.os}</td>
                                        <td className="px-4 py-3 text-sm">{v.referrer || 'Direct'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {new Date(v.createdAt).toLocaleString('de-DE')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Keine Besucher gefunden
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredVisitors.length > 30 && (
                    <p className="text-xs text-gray-400 mt-4 text-center">
                        Zeige die ersten 30 von {filteredVisitors.length} Sitzungen
                    </p>
                )}
            </ChartCard>
        </div>
    );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className={`${color} p-6 rounded-2xl border border-gray-100 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
                {icon}
                <Activity className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-navy">{value}</p>
        </div>
    );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-navy mb-6 flex items-center gap-2">
                {icon && <span className="w-5 h-5 text-electric">{icon}</span>}
                {title}
            </h3>
            {children}
        </div>
    );
}
