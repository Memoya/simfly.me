'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Printer } from 'lucide-react';
import Link from 'next/link';

export default function AGB() {
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
                            TERMS.
                        </h1>
                        <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                            ALLGEMEINE GESCHÄFTSBEDINGUNGEN
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-16">
                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">1. Geltungsbereich</h2>
                            <div className="text-black/60 font-bold leading-relaxed space-y-4">
                                <p>Die nachfolgenden Geschäftsbedingungen gelten für alle Verträge, die Sie mit uns als Anbieter über die Internetseite SIMFLY.ME schließen.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">2. Leistungsbeschreibung</h2>
                            <div className="text-black/60 font-bold leading-relaxed space-y-4">
                                <p>Simfly bietet digitale eSIM-Profile für mobile Datenverbindungen weltweit an. Da es sich um digitale Inhalte handelt, erfolgt die Lieferung unmittelbar nach Zahlungseingang per E-Mail oder App-QR-Code.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">3. Widerrufsrecht für digitale Inhalte</h2>
                            <div className="p-10 bg-black/5 rounded-[3rem] space-y-4 border border-black/5 shadow-soft">
                                <p className="font-black uppercase tracking-widest text-xs text-black">Besonderer Hinweis zum Erlöschen des Widerrufsrechts</p>
                                <p className="text-black/80 text-sm leading-relaxed font-black">
                                    Ihr Widerrufsrecht erlischt bei einem Vertrag über die Lieferung von nicht auf einem körperlichen Datenträger befindlichen digitalen Inhalten (hier: eSIM QR-Code) auch dann, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem Sie
                                </p>
                                <ol className="list-decimal pl-5 text-sm font-bold text-black/60 space-y-2">
                                    <li>ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und</li>
                                    <li>Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht verlieren.</li>
                                </ol>
                                <p className="text-black/80 text-sm leading-relaxed mt-4">
                                    Da die Bereitstellung des QR-Codes unmittelbar nach Kauf erfolgt, stimmen Sie beim Kauf ausdrücklich dem sofortigen Beginn der Vertragserfüllung und dem damit verbundenen Erlöschen des Widerrufsrechts zu.
                                </p>
                            </div>
                        </section>
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
                </motion.div>
            </main>
        </div>
    );
}
