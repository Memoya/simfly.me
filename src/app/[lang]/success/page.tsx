'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Download, Home, Loader2, X, Smartphone, Zap, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState<{
        qrCodeUrl: string,
        iccid: string,
        receiptUrl?: string,
        smdpAddress?: string,
        matchingId?: string
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
    const [copied, setCopied] = useState(false);

    const trackEvent = async (eventType: string, method: string) => {
        try {
            await fetch('/api/diag/activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    iccid: orderData?.iccid,
                    orderId: sessionId,
                    eventType,
                    platform: activeTab,
                    method
                })
            });
        } catch (e) {
            console.error('Telemetry failed');
        }
    };

    useEffect(() => {
        if (!sessionId) {
            setError('Keine Sitzungs-ID gefunden.');
            setLoading(false);
            return;
        }

        const wrapper = async () => {
            try {
                const res = await fetch(`/api/order?session_id=${sessionId}`);
                const data = await res.json();

                if (data.status === 'pending') {
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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

    const activationCode = `LPA:1$${orderData.smdpAddress || 'rsp.esim-go.com'}$${orderData.matchingId}`;

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
                                <span className="text-black/20 text-4xl md:text-6xl">DEINE eSIM IST BEREIT.</span>
                            </h1>
                            <p className="text-lg font-bold text-gray-600 max-w-md">
                                Wir haben alles vorbereitet. Scanne den Code oder nutze die One-Click Installation.
                            </p>
                            <div className="flex items-center gap-3">
                                <p className="text-black/30 font-bold uppercase tracking-[0.2em] text-[10px]">
                                    Referenz: {sessionId?.slice(-8).toUpperCase()}
                                </p>
                                <span className="w-1 h-1 bg-black/10 rounded-full" />
                                <p className="text-black/30 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-1">
                                    <Zap className="w-3 h-3 fill-black/30 stroke-none" /> Sofort Aktiv
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-auto bg-black p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative space-y-6 text-center">
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50 italic">QR-CODE SCANNEN</p>
                            <div className="bg-white p-4 rounded-[2rem] inline-block mx-auto group cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-inner">
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
                                <p className="text-xs font-black tracking-widest uppercase text-white/50">ICCID</p>
                                <p className="text-[10px] font-mono text-electric font-bold">{orderData.iccid}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Installation Guide & Actions */}
                <div className="grid md:grid-cols-2 gap-16">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                                <Smartphone className="w-8 h-8" /> Installation
                            </h3>
                            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl w-fit border border-gray-100">
                                <button
                                    onClick={() => setActiveTab('ios')}
                                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'ios' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Apple / iOS
                                </button>
                                <button
                                    onClick={() => setActiveTab('android')}
                                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'android' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Android / Google
                                </button>
                            </div>
                        </div>

                        {/* Method Selection */}
                        <div className="space-y-8">
                            {activeTab === 'ios' ? (
                                <div className="space-y-10">
                                    {/* One-Click iOS */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest italic">Option A: Schnellste Methode</p>
                                        <a
                                            href={`apple-esim://install?address=${orderData.smdpAddress || 'rsp.esim-go.com'}&matchingId=${orderData.matchingId}`}
                                            onClick={() => trackEvent('INSTALL_START', 'DEEP_LINK')}
                                            className="w-full bg-electric text-white p-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-100 group"
                                        >
                                            <Zap className="w-5 h-5 fill-white" />
                                            Direkt auf iPhone installieren
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                        <p className="text-[10px] text-center font-bold text-gray-400">Öffnet automatisch die Systemeinstellungen</p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-gray-300"><span className="bg-white px-2">ODER</span></div>
                                    </div>

                                    {/* Manual Steps iOS */}
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest italic">Option B: Manuelle Einrichtung</p>
                                        {[
                                            'QR-Code scannen (oben im schwarzen Kasten)',
                                            'Unter "Mobilfunk" > "eSIM hinzufügen"',
                                            'Daten-Roaming für die neue Leitung aktivieren'
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <span className="w-6 h-6 rounded-full bg-gray-100 text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {/* Manual Android Info */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest italic">Aktivierungscode (Zur manuellen Eingabe)</p>
                                        <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] space-y-4 shadow-inner">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SM-DP+ Adresse</p>
                                                <div className="flex items-center justify-between text-xs font-mono font-bold text-navy truncate">
                                                    {orderData.smdpAddress || 'rsp.esim-go.com'}
                                                    <button onClick={() => handleCopy(orderData.smdpAddress || 'rsp.esim-go.com')} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                        <Copy className="w-4 h-4 text-gray-400 hover:text-black" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pt-4 border-t border-gray-200/50">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matching ID</p>
                                                <div className="flex items-center justify-between text-xs font-mono font-bold text-navy">
                                                    {orderData.matchingId}
                                                    <button onClick={() => handleCopy(orderData.matchingId || '')} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                        <Copy className="w-4 h-4 text-gray-400 hover:text-black" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleCopy(activationCode);
                                                trackEvent('INSTALL_START', 'MANUAL_COPY');
                                            }}
                                            className="w-full bg-black text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'KOPIERT!' : 'KOMPLETTEN CODE KOPIEREN'}
                                        </button>
                                    </div>

                                    {/* Steps Android */}
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest italic">Einrichtung</p>
                                        {[
                                            'Verbindungen > SIM-Manager > eSIM hinzufügen',
                                            'Wähle "QR-Code scannen"',
                                            'Nutze den Code oben oder gib die Daten manuell ein',
                                            'Stelle sicher, dass Roaming auf EIN steht'
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <span className="w-6 h-6 rounded-full bg-gray-100 text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="bg-gray-50 rounded-[3rem] p-10 flex flex-col justify-between border border-gray-100 shadow-sm">
                        <div className="space-y-10">
                            <div className="space-y-3 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 italic">Support & Hilfe</p>
                                <p className="text-sm font-bold leading-relaxed text-gray-600">
                                    Probleme bei der Installation? Wir helfen dir sofort! <br />
                                    <strong>hello@simfly.me</strong>
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                {orderData.receiptUrl ? (
                                    <a
                                        href={orderData.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-6 bg-white rounded-[2rem] shadow-sm border border-gray-100 group hover:border-black/5 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Download className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
                                            <span className="text-xs font-black uppercase tracking-widest text-navy">Rechnung laden (PDF)</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-black/40 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </a>
                                ) : (
                                    <div className="p-6 bg-white/50 rounded-[2rem] border border-dashed border-gray-200 text-center">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Rechnung wird generiert...</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-black text-white rounded-[2.5rem] space-y-4">
                                <h4 className="text-xl font-black italic uppercase tracking-tight italic">🌍 Gute Reise!</h4>
                                <p className="text-xs font-bold text-white/50 leading-relaxed italic">
                                    Vergiss nicht: Mobile Daten müssen in deinem Zielgebiet aktiv sein. Schalte die Leitung erst ein, wenn du gelandet bist.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/"
                            className="mt-12 w-full py-6 bg-white border-2 border-black text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-center hover:bg-black hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 group"
                        >
                            <Home className="w-4 h-4 text-black/50 group-hover:text-white transition-colors" />
                            HAUPTMENÜ
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
