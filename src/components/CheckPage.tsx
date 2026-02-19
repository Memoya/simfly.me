'use client';

import React, { useState, Suspense } from 'react';
import { Search, Smartphone, Wifi, Calendar, CheckCircle, AlertCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface UsageData {
    iccid: string;
    totalData: number;
    remainingData: number;
    status: 'active' | 'expired' | 'queued' | 'inactive';
    expiryDate: string | null;
    error?: string;
}

function CheckUsageContent({ dictionary }: { dictionary: any }) {
    const searchParams = useSearchParams();
    const [iccid, setIccid] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<UsageData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auto-fill ICCID from URL and auto-submit
    React.useEffect(() => {
        const urlIccid = searchParams.get('iccid');
        if (urlIccid) {
            setIccid(urlIccid);
            // Trigger check automatically
            // We need to call the API directly here since handleCheck expects a FormEvent
            const performCheck = async (id: string) => {
                setLoading(true);
                setError(null);
                setData(null);
                try {
                    const res = await fetch(`/api/usage?iccid=${id}`);
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Fehler beim Abrufen der Daten');
                    setData(result);
                } catch (err: any) {
                    setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
                } finally {
                    setLoading(false);
                }
            };
            performCheck(urlIccid);
        }
    }, [searchParams]);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!iccid || iccid.length < 5) {
            setError('Bitte gib eine gültige ICCID ein.');
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch(`/api/usage?iccid=${iccid}`);
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Fehler beim Abrufen der Daten');
            }

            setData(result);
        } catch (err: any) {
            setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'queued': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'expired': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'active': dictionary.check.active,
            'expired': dictionary.check.expired,
            'queued': dictionary.check.queued,
            'inactive': 'Inactive'
        };
        return statusMap[status] || 'Inactive';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-black text-white py-12 px-6">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4 uppercase tracking-widest text-[10px] font-bold">
                        <Home className="w-3 h-3" /> Zurück zur Startseite
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic">{dictionary.check.title}</h1>
                    <p className="text-white/40 font-bold tracking-widest uppercase text-xs">{dictionary.check.subtitle}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-xl w-full mx-auto px-6 -mt-10 mb-20 relative z-10">
                <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-black/5">
                    <form onSubmit={handleCheck} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-black/40 ml-4">{dictionary.check.label}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <Smartphone className="w-5 h-5 text-black/20 group-focus-within:text-electric transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={dictionary.check.placeholder}
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-black/[0.03] focus:border-black/5 outline-none font-mono text-lg transition-all placeholder:text-black/20 font-bold text-black"
                                    value={iccid}
                                    onChange={(e) => setIccid(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                            </div>
                            <p className="text-[10px] text-black/30 font-bold px-4">
                                {dictionary.check.hint}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : dictionary.check.button}
                        </button>
                    </form>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-8 p-6 bg-red-50 text-red-500 rounded-2xl flex items-start gap-4"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="font-bold text-sm">{error}</span>
                            </motion.div>
                        )}

                        {data && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mt-10 space-y-8"
                            >
                                <div className="border-t border-dashed border-gray-200" />

                                {/* Status Badge */}
                                <div className="flex justify-center">
                                    <div className={`px-6 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(data.status)}`}>
                                        <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} />
                                        {getStatusText(data.status)}
                                    </div>
                                </div>

                                {/* Data Visualization */}
                                <div className="relative w-48 h-48 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="88"
                                            fill="transparent"
                                            stroke="#f3f4f6"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                        />
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="88"
                                            fill="transparent"
                                            stroke={data.status === 'active' ? '#000000' : '#d1d5db'}
                                            strokeWidth="12"
                                            strokeDasharray={2 * Math.PI * 88}
                                            strokeDashoffset={2 * Math.PI * 88 * (1 - (data.remainingData / data.totalData))}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-sm font-bold text-black/40 uppercase tracking-widest mb-1">{dictionary.check.remaining}</span>
                                        <span className="text-4xl font-black tracking-tighter">{data.remainingData}</span>
                                        <span className="text-xs font-bold text-black/40">GB</span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-black/30">Total</div>
                                        <div className="text-xl font-black">{data.totalData} GB</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-black/30">{dictionary.check.expiry}</div>
                                        <div className="text-lg font-black">{data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('de-DE') : '-'}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Main Export with Suspense for Client-Side Params
export default function CheckUsagePage({ dictionary }: { dictionary: any }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            </div>
        }>
            <CheckUsageContent dictionary={dictionary} />
        </Suspense>
    );
}
