'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import devicesData from '@/data/esim-devices.json';

// Helper function to detect device from user agent - simplified for better UX
function detectDevice(): string | null {
    if (typeof navigator === 'undefined') {
        return null;
    }
    
    const ua = navigator.userAgent;
    
    // iPhone detection - alle iPhones ab 11 (2019) sind eSIM-fähig
    if (ua.includes('iPhone')) {
        return 'iPhone';
    }
    
    // iPad detection - alle iPads mit eSIM
    if (ua.includes('iPad') || (ua.includes('Macintosh') && 'ontouchend' in document)) {
        return 'iPad';
    }
    
    // Samsung Galaxy detection
    if (ua.includes('Samsung') || ua.includes('SM-')) {
        return 'Galaxy';
    }
    
    // Google Pixel detection
    if (ua.includes('Pixel')) {
        return 'Pixel';
    }
    
    // Xiaomi/Redmi detection
    if (ua.includes('Xiaomi') || ua.includes('Redmi')) {
        return 'Xiaomi';
    }
    
    // Oppo detection
    if (ua.includes('OPPO')) {
        return 'Oppo';
    }
    
    // OnePlus detection  
    if (ua.includes('OnePlus')) {
        return 'OnePlus';
    }
    
    // Motorola detection
    if (ua.includes('Motorola') || ua.includes('moto')) {
        return 'Motorola';
    }
    
    return null;
}

export default function CompatibilityCheck() {
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [detectedDevice, setDetectedDevice] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Detect device on mount and set it in search field
    useEffect(() => {
        const device = detectDevice();
        if (device) {
            setDetectedDevice(device);
            setSearch(device); // Direkt ins Suchfeld
            setIsFocused(true); // Zeige Ergebnisse an
        }
    }, []);

    // Flatten all devices into a single searchable list
    const allDevices = useMemo(() => {
        return devicesData.devices.flatMap(d => 
            d.models.map(model => ({ brand: d.brand, model }))
        );
    }, []);

    const filteredDevices = useMemo(() => {
        if (!search) return [];
        const searchLower = search.toLowerCase();
        return allDevices
            .filter(d => 
                d.model.toLowerCase().includes(searchLower) || 
                d.brand.toLowerCase().includes(searchLower)
            )
            .slice(0, 50); // Zeige bis zu 50 Ergebnisse
    }, [search, allDevices]);
    
    const totalMatchingDevices = useMemo(() => {
        if (!search) return 0;
        const searchLower = search.toLowerCase();
        return allDevices.filter(d => 
            d.model.toLowerCase().includes(searchLower) || 
            d.brand.toLowerCase().includes(searchLower)
        ).length;
    }, [search, allDevices]);

    const popularDevices = useMemo(() => {
        return ['iPhone 15', 'Galaxy S24', 'Pixel 8', 'iPhone 14', 'Xiaomi 14', 'OnePlus 12'];
    }, []);

    const brandLogos = useMemo(() => {
        return ['APPLE', 'SAMSUNG', 'GOOGLE', 'XIAOMI', 'OPPO', 'ONEPLUS', 'MOTOROLA', 'SONY'];
    }, []);

    return (
        <section className="py-12 md:py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    animate={{
                        padding: (search || isFocused) ? '2.5rem 1.5rem' : '3rem 1.5rem',
                        maxHeight: (search || isFocused) ? 640 : 360,
                    }}
                    className="bg-black/5 rounded-[3rem] md:rounded-[4rem] relative overflow-hidden border border-black/5 transition-all duration-500"
                >
                    <div className="relative z-10 space-y-8 md:space-y-12">
                        <div className="space-y-4 text-center px-4">
                            <h2 className="text-xl sm:text-3xl md:text-6xl font-black tracking-tighter italic uppercase leading-tight break-words">
                                Kompatibilitäts-Check
                            </h2>
                            <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">
                                {allDevices.length}+ eSIM-fähige Geräte
                            </p>
                        </div>

                        <div className="max-w-md mx-auto relative px-2">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-black transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Handymodell oder Marke suchen..."
                                    value={search}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white border border-black/5 rounded-3xl py-6 pl-16 pr-14 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-soft"
                                />
                                {/* Green checkmark if device was auto-detected */}
                                {detectedDevice && search.toLowerCase().includes(detectedDevice.toLowerCase()) && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider hidden sm:inline">
                                            Erkannt
                                        </span>
                                        <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {(search || isFocused) && (
                                    <motion.div
                                        initial={{ opacity: 0, maxHeight: 0 }}
                                        animate={{ opacity: 1, maxHeight: 600 }}
                                        exit={{ opacity: 0, maxHeight: 0 }}
                                        className="mt-6 bg-white rounded-[2rem] p-4 shadow-xl border border-black/5 overflow-hidden"
                                    >
                                        <div className="space-y-4 max-h-[540px] overflow-y-auto scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent">{
                                            {!search && (
                                                <div className="px-2 pt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-4">Beliebte Modelle</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {popularDevices.map(model => (
                                                            <button
                                                                key={model}
                                                                onClick={() => setSearch(model)}
                                                                className="px-4 py-2 bg-black/5 rounded-full text-[11px] font-bold hover:bg-black hover:text-white transition-all"
                                                            >
                                                                {model}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {search && (
                                                <div className="space-y-2">
                                                    {/* Anzahl der Ergebnisse */}
                                                    {filteredDevices.length > 0 && (
                                                        <div className="px-2 pb-2 flex items-center justify-between">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                                                {totalMatchingDevices} {totalMatchingDevices === 1 ? 'Gerät' : 'Geräte'} gefunden
                                                            </p>
                                                            {totalMatchingDevices > 50 && (
                                                                <p className="text-[9px] text-black/40">
                                                                    Top 50 angezeigt
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {filteredDevices.length > 0 ? (
                                                        <>
                                                            {filteredDevices.map((device) => (
                                                                <div key={`${device.brand}-${device.model}`} className="flex items-center justify-between p-4 hover:bg-black/5 rounded-2xl transition-colors group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center group-hover:bg-black transition-colors">
                                                                            <Smartphone className="w-4 h-4 group-hover:text-white" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-sm">{device.model}</span>
                                                                            <span className="text-[10px] text-black/30 font-bold">{device.brand}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest shrink-0">
                                                                        <span className="hidden xs:inline">Compatible</span>
                                                                        <Check className="w-4 h-4 stroke-[3px]" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="p-8 text-center space-y-4">
                                                            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                                                                <Smartphone className="w-6 h-6 text-yellow-600" />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <p className="text-sm font-bold text-black/60 mb-1">
                                                                        Gerät nicht in unserer Liste?
                                                                    </p>
                                                                    <p className="text-[11px] text-black/40 leading-relaxed">
                                                                        Kein Problem! Die meisten Smartphones ab 2020 unterstützen eSIM.
                                                                    </p>
                                                                </div>
                                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                                    <p className="text-[10px] font-bold text-blue-900 mb-1">
                                                                        💡 So prüfen Sie es selbst:
                                                                    </p>
                                                                    <ul className="text-[10px] text-blue-800 text-left space-y-1 leading-relaxed">
                                                                        <li>• Einstellungen → Mobilfunk/Netzwerk</li>
                                                                        <li>• Suchen Sie nach "eSIM hinzufügen"</li>
                                                                        <li>• Oder scannen Sie einen QR-Code</li>
                                                                    </ul>
                                                                </div>
                                                                <p className="text-[9px] text-black/30 pt-2">
                                                                    Versuchen Sie es mit: Marke + Modellnummer<br />
                                                                    (z.B. "Samsung S24" oder "iPhone 15")
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 opacity-20 px-4">
                            {brandLogos.map(brand => (
                                <span key={brand} className="text-[8px] md:text-[9px] font-black tracking-[0.3em] md:tracking-[0.4em]">{brand}</span>
                            ))}
                        </div>

                        {/* Debug Button - Shows device info */}
                        <div className="text-center">
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className="text-[8px] text-black/20 hover:text-black/40 font-bold uppercase tracking-widest transition-colors"
                            >
                                {showDebug ? '▼ Debug schließen' : '▶ Gerät wird nicht erkannt?'}
                            </button>
                            <AnimatePresence>
                                {showDebug && typeof navigator !== 'undefined' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 mx-4 p-4 bg-white rounded-2xl border border-black/5 text-left overflow-hidden"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">
                                            Device Info (für Support)
                                        </p>
                                        <div className="space-y-1 text-[10px] font-mono text-black/60">
                                            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                                            <p><strong>Platform:</strong> {navigator.platform}</p>
                                            {typeof window !== 'undefined' && (
                                                <>
                                                    <p><strong>Screen:</strong> {window.screen?.width}x{window.screen?.height}</p>
                                                    <p><strong>Pixel Ratio:</strong> {window.devicePixelRatio}</p>
                                                </>
                                            )}
                                            {detectedDevice && (
                                                <p className="mt-2 pt-2 border-t border-black/5">
                                                    <strong>Erkannt als:</strong> {detectedDevice}
                                                    <span className="ml-2 px-2 py-0.5 rounded text-[8px] bg-green-500 text-white">
                                                        ✓ Auto-erkannt
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Background Orbs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </motion.div>
            </div>
        </section>
    );
}
