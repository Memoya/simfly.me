'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { AdminSettings, FAQItem } from '@/types';

const INITIAL_FAQS = [
    { question: 'Wie funktioniert die Aktivierung?', answer: 'Nach dem Kauf erhältst du einen QR-Code per E-Mail. Scanne diesen einfach in den Einstellungen deines Handys unter "Mobilfunk" ein. Die eSIM ist sofort aktiv.' },
    { question: 'Wann beginnen die Tage zu zählen?', answer: 'Die Laufzeit startet erst, wenn sich die eSIM zum ersten Mal mit einem unterstützten Netzwerk im Zielland verbindet.' },
    { question: 'Kann ich mein WhatsApp behalten?', answer: 'Ja! Deine physische SIM bleibt aktiv oder kann deaktiviert werden. Deine WhatsApp-Nummer bleibt unverändert.' },
    { question: 'Ist mein Handy kompatibel?', answer: 'Die meisten Smartphones ab Baujahr 2019 (iPhone 11+, Google Pixel 3+, Samsung S20+) unterstützen eSIM. Nutze unseren Check auf der Startseite für Details.' }
];

export default function HelpPage() {
    const [settings, setSettings] = useState<AdminSettings | null>(null);

    useEffect(() => {
        fetch('/api/admin/settings').then(res => res.json()).then(data => setSettings(data)).catch(err => console.error(err));
    }, []);

    const faqs = (settings?.faq && settings.faq.length > 0) ? settings.faq : INITIAL_FAQS;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-black text-white py-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4 uppercase tracking-widest text-xs font-bold">
                        <Home className="w-4 h-4" /> Zurück zur Startseite
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic">HELP CENTER.</h1>
                    <p className="text-white/40 font-bold tracking-widest uppercase text-sm">Häufig gestellte Fragen & Support</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-20">
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <details key={i} className="group border-b border-black/5 py-6 cursor-pointer list-none">
                            <summary className="flex items-center justify-between list-none font-bold text-lg text-navy group-hover:text-electric transition-colors">
                                {faq.question || (faq as any).q}
                                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-open:rotate-180 transition-transform">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </summary>
                            <div className="mt-4 text-gray-600 leading-relaxed pl-4 border-l-2 border-electric/20">
                                {faq.answer || (faq as any).a}
                            </div>
                        </details>
                    ))}
                </div>

                <div className="mt-20 p-8 bg-gray-50 rounded-2xl text-center">
                    <h3 className="font-bold text-xl mb-2">Noch Fragen?</h3>
                    <p className="text-gray-500 mb-6">Unser Support-Team hilft dir gerne weiter.</p>
                    <a href="mailto:support@simfly.me" className="inline-block bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-electric transition-colors">
                        Kontakt aufnehmen
                    </a>
                </div>
            </div>
        </div>
    );
}
