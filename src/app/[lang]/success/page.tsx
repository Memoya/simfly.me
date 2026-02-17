'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Download, Mail, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState<{ qrCodeUrl: string, iccid: string } | null>(null);
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
                setOrderData(data);
            } catch (err) {
                console.error(err);
                setError('Fehler beim Laden der Bestelldaten.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-4 border-black/5 border-t-black rounded-full"
                />
                <p className="mt-8 font-black text-black tracking-widest uppercase text-[10px]">Wird verarbeitet...</p>
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
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
                            <Check className="w-8 h-8 text-white stroke-[3px]" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic leading-[0.8]">
                                READY. <br />
                                <span className="text-black/10">SET. GO.</span>
                            </h1>
                            <p className="text-black/30 font-bold uppercase tracking-[0.4em] text-[10px] pt-4">
                                Bestätigung: {sessionId?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-auto bg-black p-10 rounded-[3rem] text-white space-y-8 shadow-card relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative space-y-6 text-center">
                            <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Dein eSIM QR-Code</p>
                            <div className="bg-white p-4 rounded-[2rem] inline-block mx-auto group">
                                <div className="relative w-48 h-48 md:w-56 md:h-56">
                                    <Image
                                        src={orderData.qrCodeUrl}
                                        alt="eSIM QR Code"
                                        fill
                                        className="object-contain select-none grayscale group-hover:grayscale-0 transition-all duration-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black tracking-widest uppercase">ICCID</p>
                                <p className="text-[10px] font-mono opacity-40">{orderData.iccid}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Installation Guide */}
                <div className="grid md:grid-cols-2 gap-16">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Installation.</h3>
                            <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('ios')}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ios' ? 'bg-white text-black shadow-sm' : 'text-black/30'}`}
                                >
                                    iOS / iPhone
                                </button>
                                <button
                                    onClick={() => setActiveTab('android')}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'android' ? 'bg-white text-black shadow-sm' : 'text-black/30'}`}
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
                                    <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm font-bold text-black/60">{step}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/5 rounded-[3rem] p-10 flex flex-col justify-between border border-black/5">
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-black/20 font-bold">Hilfe benötigt?</p>
                                <p className="text-sm font-bold leading-relaxed">
                                    Wir haben dir zudem eine detaillierte Anleitung und deine Rechnungsdetails per E-Mail gesendet.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-soft group hover:scale-[1.02] transition-all">
                                    <div className="flex items-center gap-4">
                                        <Download className="w-5 h-5 opacity-20" />
                                        <span className="text-xs font-black uppercase tracking-widest">Rechnung laden</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                                <button className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-soft group hover:scale-[1.02] transition-all">
                                    <div className="flex items-center gap-4">
                                        <Mail className="w-5 h-5 opacity-20" />
                                        <span className="text-xs font-black uppercase tracking-widest">Support kontaktieren</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            </div>
                        </div>

                        <Link
                            href="/"
                            className="mt-12 w-full py-6 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-center hover:opacity-90 transition-all shadow-xl"
                        >
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
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
