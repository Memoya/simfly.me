'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Mail, MapPin, Printer } from 'lucide-react';
import Link from 'next/link';

export default function Impressum() {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Header / Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 py-6">
                <div className="max-w-4xl mx-auto px-8 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-xl bg-black/5 group-hover:bg-black group-hover:text-white transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Back</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" />
                        <span className="text-xl font-black italic tracking-tighter">SIMFLY.ME</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-8 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-20"
                >
                    {/* Hero Title */}
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none italic">
                            IMPRESSUM.
                        </h1>
                        <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                            Angaben gemäß § 5 TMG
                        </p>
                    </div>

                    {/* Content Grid */}
                    <div className="grid md:grid-cols-2 gap-16">
                        <div className="space-y-12">
                            <section className="space-y-6">
                                <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">Betreiber</h2>
                                <div className="space-y-1 font-bold text-lg leading-tight">
                                    <p>[Dein Vorname] [Dein Nachname]</p>
                                    <p>[Deine Straße HouseNR]</p>
                                    <p>[PLZ] [Deine Stadt]</p>
                                    <p>Deutschland</p>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">Kontakt</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold">hello@simfly.me</p>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold">[Telefonnummer / Optional]</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-12">
                            <section className="space-y-6">
                                <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">Rechtlich</h2>
                                <div className="space-y-4 font-bold text-sm text-black/40">
                                    <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [DE XXXXXXXXX]</p>
                                    <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: [Dein Name]</p>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">Streitschlichtung</h2>
                                <p className="text-sm font-bold leading-relaxed text-black/40">
                                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                                    <br /><br />
                                    <a href="https://ec.europa.eu/consumers/odr" className="text-black hover:opacity-50 underline decoration-2 underline-offset-4">https://ec.europa.eu/consumers/odr</a>.
                                    <br /><br />
                                    Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                                </p>
                            </section>
                        </div>
                    </div>

                    <footer className="pt-24 border-t border-black/5">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase opacity-20 hover:opacity-100 transition-all"
                        >
                            <Printer className="w-3 h-3" />
                            Seite drucken
                        </button>
                    </footer>
                </motion.div >
            </main >
        </div >
    );
}
