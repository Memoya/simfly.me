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
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">5. Email & Service-Provider</h2>
                            <div className="space-y-6">
                                <div className="p-6 bg-black/[0.03] rounded-2xl space-y-3">
                                    <p className="font-black uppercase tracking-widest text-xs">Resend (Email Service)</p>
                                    <p className="text-black/60 text-sm leading-relaxed font-bold">
                                        Wir nutzen Resend für den Versand von QR-Codes und Bestellbestätigungen per E-Mail. Ihre E-Mail-Adresse wird an Resend übermittelt. Resend ist GDPR-konform und speichert Ihre Daten nur für die notwendige Zeit (siehe Speicherdauer).
                                    </p>
                                </div>
                                <div className="p-6 bg-black/[0.03] rounded-2xl space-y-3">
                                    <p className="font-black uppercase tracking-widest text-xs">eSIMAccess API</p>
                                    <p className="text-black/60 text-sm leading-relaxed font-bold">
                                        Für eSIM-Aktivierung und Datenverwaltung nutzen wir die eSIMAccess API (eSIMAccess LLC). Ihre Bestelldaten (Name, ICCID, Netzwerknutzung) werden übergeben. Ein Vertrag über Auftragsverarbeitung ist geschlossen.
                                    </p>
                                </div>
                                <div className="p-6 bg-black/[0.03] rounded-2xl space-y-3">
                                    <p className="font-black uppercase tracking-widest text-xs">FlagCDN (Flaggen-Bilder)</p>
                                    <p className="text-black/60 text-sm leading-relaxed font-bold">
                                        Flag-Icons werden über flagcdn.com geladen. Dies erfolgt nur zur Anzeige, ohne dass personenbezogene Daten übermittelt werden (Bilder sind öffentlich).
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">6. Speicherdauer Ihrer Daten</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p>Wir speichern Ihre Daten nur solange, wie erforderlich:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Bestelldaten (Name, E-Mail, ICCID):</strong> 7 Jahre (für Geschäftsabwicklung und steuerliche Anforderungen)</li>
                                    <li><strong>Zahlungsdaten (Stripe):</strong> Wird von Stripe verwahrt; wir haben keinen Zugriff auf Kartendaten</li>
                                    <li><strong>Server-Logs:</strong> Maximal 30 Tage</li>
                                    <li><strong>Cookies & Tracking:</strong> Maximal 12 Monate (je nach Einstellung)</li>
                                    <li><strong>E-Mail-Liste (Resend):</strong> Solange Sie Kunde sind; nach Opt-Out sofort gelöscht</li>
                                </ul>
                                <p className="text-lg font-black text-black mt-8">Datenlöschung</p>
                                <p>Nach Ende des Geschäftsverhältnisses werden Ihre Daten nach Ablauf der gesetzlichen Aufbewahrungsfrist gelöscht, sofern Sie nicht widersprochen haben.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">7. Cookies</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p>Unsere Website verwendet Cookies, um die Benutzerfreundlichkeit zu verbessern. Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden.</p>
                                <p className="text-lg font-black text-black mt-8">Arten von Cookies</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Essenzielle Cookies:</strong> Notwendig für die Funktion der Website (Warenkorb, Zahlungsabwicklung). Diese werden immer gespeichert.</li>
                                    <li><strong>Analytics-Cookies:</strong> Helfen uns, die Website zu analysieren und zu verbessern. Nur mit Ihrer Einwilligung.</li>
                                    <li><strong>Marketing-Cookies:</strong> Für personalisierte Werbung. Nur mit Ihrer Einwilligung.</li>
                                </ul>
                                <p className="text-lg font-black text-black mt-8">Ihre Rechte</p>
                                <p>Sie können Ihre Cookie-Einstellungen jederzeit über unser Cookie-Banner am unteren Bildschirmrand anpassen. Cookies können Sie auch in Ihren Browsereinstellungen löschen oder deaktivieren.</p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase text-black border-b border-black/5 pb-4">8. Ihre Datenschutzrechte</h2>
                            <div className="space-y-4 text-black/60 font-medium leading-relaxed">
                                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Auskunftsrecht:</strong> Sie können jederzeit erfragen, welche Daten wir über Sie speichern.</li>
                                    <li><strong>Recht auf Berichtigung:</strong> Sie können fehlerhafte Daten korrigieren lassen.</li>
                                    <li><strong>Recht auf Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen (Recht auf Vergessenwerden).</li>
                                    <li><strong>Recht auf Datenportabilität:</strong> Sie können Ihre Daten in strukturierter Form exportieren.</li>
                                    <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen.</li>
                                    <li><strong>Beschwerderecht:</strong> Sie können sich bei einer Aufsichtsbehörde beschweren.</li>
                                </ul>
                                <p className="text-lg font-black text-black mt-8">Kontakt</p>
                                <p>Für Anfragen zu Ihren Datenschutzrechten kontaktieren Sie uns unter: <a href="mailto:hello@simfly.me" className="underline hover:opacity-70">hello@simfly.me</a></p>
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
