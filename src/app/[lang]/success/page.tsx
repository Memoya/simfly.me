'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Download, Home, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState<{ qrCodeUrl: string, iccid: string, receiptUrl?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');

    useEffect(() => {
        if (!sessionId) {
            setError('Keine Sitzungs-ID gefunden.');
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/order?session_id=${sessionId}`);
                if (!res.ok) throw new Error('Bestellung konnte nicht geladen werden');
                const data = await res.json();

                if (data.status === 'pending') {
                    // Retry after 2 seconds if pending
                    setTimeout(fetchOrder, 2000);
                    return;
                }

                setOrderData(data);
            } catch (err) {
                console.error(err);
                setError('Fehler beim Laden der Bestelldaten.');
            } finally {
                // Only stop loading if we have data or error (and not pending retry)
                // Actually, the retry logic above creates a loop. If pending, we return early.
                // We should handle loading state carefully. 
                // Let's simplfy: if pending, we don't set loading false yet.
                // But if we catch error, we set loading false.
                // If success, set loading false.
            }
        };

        const wrapper = async () => {
            try {
                const res = await fetch(`/api/order?session_id=${sessionId}`);
                const data = await res.json();

                if (data.status === 'pending') {
                    // Simple retry logic
                    setTimeout(wrapper, 3000);
                } else if (res.ok) {
                    setOrderData(data);
                    setLoading(false);
                } else {
                    throw new Error(data.error || 'Fehler');
                }
            } catch (e) {
                setError('Fehler beim Laden.');
                setLoading(false);
            }
        };

        wrapper();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-4 border-black/5 border-t-black rounded-full"
                />
                <p className="mt-8 font-black text-black tracking-widest uppercase text-[10px]">Deine Bestellung wird finalisiert...</p>
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8">
                    <X className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black mb-4 tracking-tighter uppercase italic">Ups!</h2>
                <p className="text-black/40 font-bold text-sm mb-8">{error || 'Etwas ist schief gelaufen.'}</p>
                <Link href="/" className="px-8 py-4 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest">
                    ZURÜCK ZUM START
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-green-200">
                            <Check className="w-8 h-8 stroke-[3px]" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic leading-tight">
                                VIELEN DANK <br />
                                <span className="text-black/20">FÜR DEINE BESTELLUNG.</span>
                            </h1>
                            <p className="text-lg font-bold text-gray-600 max-w-md">
                                Deine eSIM ist bereit! Hier erfährst du, wie es jetzt weitergeht.
                            </p>
                            <p className="text-black/30 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Referenz: {sessionId?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-auto bg-black p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative space-y-6 text-center">
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Dein eSIM QR-Code</p>
                            <div className="bg-white p-4 rounded-[2rem] inline-block mx-auto group cursor-pointer transition-transform hover:scale-105 active:scale-95">
                                <div className="relative w-48 h-48 md:w-56 md:h-56">
                                    <Image
                                        src={orderData.qrCodeUrl}
                                        alt="eSIM QR Code"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black tracking-widest uppercase text-white/60">ICCID</p>
                                <p className="text-[10px] font-mono text-electric">{orderData.iccid}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Installation Guide & Actions */}
                <div className="grid md:grid-cols-2 gap-16">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">So geht es weiter.</h3>
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('ios')}
                                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'ios' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    iOS / iPhone
                                </button>
                                <button
                                    onClick={() => setActiveTab('android')}
                                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'android' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Android
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(activeTab === 'ios' ? [
                                'Öffne die Einstellungen > Mobilfunk',
                                'Tippe auf "eSIM hinzufügen"',
                                'Wähle "QR-Code verwenden" & scanne den Code',
                                'Aktiviere das "Daten-Roaming" für diese Leitung'
                            ] : [
                                'Einstellungen > Verbindungen > SIM-Verwaltung',
                                'Tippe auf "eSIM hinzufügen"',
                                'Scanne den QR-Code ein',
                                'Stelle sicher, dass "Roaming" aktiviert ist'
                            ]).map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <span className="w-8 h-8 rounded-full bg-black text-white text-xs font-black flex items-center justify-center shrink-0 mt-[-2px] shadow-lg">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{step}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-[3rem] p-10 flex flex-col justify-between border border-gray-100">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Rechnungsdetails</p>
                                <p className="text-sm font-bold leading-relaxed text-gray-600">
                                    Wir haben dir die Rechnung und alle Details auch per E-Mail gesendet.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                {orderData.receiptUrl ? (
                                    <a
                                        href={orderData.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-gray-100 group hover:border-black/5 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Download className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
                                            <span className="text-xs font-black uppercase tracking-widest text-black">Rechnung laden</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </a>
                                ) : (
                                    <div className="p-6 bg-white/50 rounded-2xl border border-dashed border-gray-200 text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rechnung wird per E-Mail gesendet</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/"
                            className="mt-12 w-full py-6 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 group"
                        >
                            <Home className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            ZURÜCK ZUR WELTREISE
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
