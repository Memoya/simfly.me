'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Printer } from 'lucide-react';
import Link from 'next/link';

export default function Datenschutz() {
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
                            PRIVACY.
                        </h1>
                        <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                            DATENSCHUTZERKLÄRUNG
                        </p>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-16">
                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">1. Datenschutz auf einen Blick</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p className="text-lg font-black text-black">Allgemeine Hinweise</p>
                                <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">2. Datenerfassung auf dieser Website</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p className="text-lg font-black text-black">Wer ist verantwortlich für die Datenerfassung?</p>
                                <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
                                <p className="text-lg font-black text-black mt-8">Wie erfassen wir Ihre Daten?</p>
                                <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular oder bei der Bestellung eingeben (z.B. E-Mail-Adresse für die eSIM Zustellung).</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">3. Hosting</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p className="text-lg font-black text-black">Vercel</p>
                                <p>Wir hosten unsere Website bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
                                <p>Der Anbieter ist ein amerikanisches Unternehmen. Es wurde ein Vertrag über Auftragsverarbeitung (AVV) bzw. Standardvertragsklauseln (SCC) geschlossen, um die Einhaltung des europäischen Datenschutzniveaus zu gewährleisten.</p>
                                <p>Beim Besuch unserer Website erfasst Vercel verschiedene Logfiles inklusive Ihrer IP-Adressen.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">4. Zahlungsabwicklung</h2>
                            <div className="space-y-8">
                                <div className="p-10 bg-black/[0.03] rounded-[3rem] space-y-4">
                                    <p className="font-black uppercase tracking-widest text-xs">Stripe Payments</p>
                                    <p className="text-black/60 text-sm leading-relaxed font-bold">
                                        Wir bieten die Möglichkeit an, den Zahlungsvorgang über den Zahlungsdienstleister Stripe (Stripe Payments Europe Ltd, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland) abzuwickeln. Dies entspricht unserem berechtigten Interesse, eine effiziente und sichere Zahlungsmethode anzubieten (Art. 6 Abs. 1 lit. b DSGVO).
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">5. Server-Log-Dateien</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Browsertyp und Browserversion</li>
                                    <li>Verwendetes Betriebssystem</li>
                                    <li>Referrer URL</li>
                                    <li>Hostname des zugreifenden Rechners</li>
                                    <li>Uhrzeit der Serveranfrage</li>
                                    <li>IP-Adresse</li>
                                </ul>
                                <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.</p>
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
