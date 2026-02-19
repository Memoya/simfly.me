'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function InstallContent() {
    const searchParams = useSearchParams();
    const address = searchParams.get('address');
    const matchingId = searchParams.get('matchingId');

    useEffect(() => {
        if (address && matchingId) {
            // Trigger iOS Deep Link
            const iosLink = `apple-esim://install?address=${address}&matchingId=${matchingId}`;
            window.location.href = iosLink;
        }
    }, [address, matchingId]);

    if (!address || !matchingId) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <XCircle className="w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-2xl font-black italic uppercase">Fehler</h1>
                <p className="text-gray-500">Ungültige Installations-Parameter.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center justify-center">
            <div className="max-w-md w-full space-y-12 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-electric/10 rounded-[2.5rem] flex items-center justify-center mx-auto"
                >
                    <Smartphone className="w-10 h-10 text-electric" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter italic uppercase leading-tight">
                        Aktivierung <br />
                        <span className="text-electric">gestartet.</span>
                    </h1>
                    <p className="text-gray-500 font-bold">
                        Wir haben versucht, das eSIM-Menü auf deinem Gerät zu öffnen.
                    </p>
                </div>

                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Falls nichts passiert ist:</p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                            <p className="text-xs font-bold text-gray-700">Prüfe, ob du ein eSIM-fähiges Gerät nutzt.</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                            <p className="text-xs font-bold text-gray-700">Klicke erneut auf: <a href={`apple-esim://install?address=${address}&matchingId=${matchingId}`} className="text-electric underline">eSIM Menü öffnen</a></p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                            <p className="text-xs font-bold text-gray-700">Oder nutze den QR-Code aus deiner Bestätigungs-Email.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Simfly.me Premium Connectivity</p>
                </div>
            </div>
        </div>
    );
}

export default function InstallPage() {
    return (
        <Suspense fallback={<div>Laden...</div>}>
            <InstallContent />
        </Suspense>
    );
}
