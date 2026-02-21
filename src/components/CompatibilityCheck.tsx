'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import devicesData from '@/data/esim-devices.json';

// Helper function to detect device from user agent
function detectDevice(): string | null {
    if (typeof navigator === 'undefined') return null;
    
    const ua = navigator.userAgent;
    
    // iPhone detection
    const iphoneMatch = ua.match(/iPhone(\d+[,\d]*)/);
    if (iphoneMatch || ua.includes('iPhone')) {
        // Try to detect specific model
        if (ua.includes('iPhone16,')) return 'iPhone 15 Pro';
        if (ua.includes('iPhone15,')) return 'iPhone 14';
        if (ua.includes('iPhone14,')) return 'iPhone 13';
        if (ua.includes('iPhone13,')) return 'iPhone 12';
        if (ua.includes('iPhone12,')) return 'iPhone 11';
        return 'iPhone'; // Generic iPhone
    }
    
    // iPad detection
    if (ua.includes('iPad')) {
        return 'iPad Pro';
    }
    
    // Samsung Galaxy detection
    if (ua.includes('SM-S')) {
        if (ua.includes('SM-S926') || ua.includes('SM-S928')) return 'Galaxy S24';
        if (ua.includes('SM-S916') || ua.includes('SM-S918')) return 'Galaxy S23';
        if (ua.includes('SM-S906') || ua.includes('SM-S908')) return 'Galaxy S22';
        return 'Galaxy S';
    }
    
    // Google Pixel detection
    if (ua.includes('Pixel')) {
        if (ua.includes('Pixel 9')) return 'Pixel 9';
        if (ua.includes('Pixel 8')) return 'Pixel 8';
        if (ua.includes('Pixel 7')) return 'Pixel 7';
        if (ua.includes('Pixel 6')) return 'Pixel 6';
        return 'Pixel';
    }
    
    // Xiaomi detection
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
    
    return null;
}

export default function CompatibilityCheck() {
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [detectedDevice, setDetectedDevice] = useState<string | null>(null);
    const [showDetection, setShowDetection] = useState(false);

    // Detect device on mount
    useEffect(() => {
        const device = detectDevice();
        if (device) {
            setDetectedDevice(device);
            setShowDetection(true);
            // Auto-hide after 5 seconds
            setTimeout(() => setShowDetection(false), 5000);
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
            .slice(0, 12); // Show more results
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
                    {/* Auto-detected device notification */}
                    <AnimatePresence>
                        {showDetection && detectedDevice && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 z-20 text-xs font-bold"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{detectedDevice} erkannt ✓</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                    className="w-full bg-white border border-black/5 rounded-3xl py-6 pl-16 pr-8 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-soft"
                                />
                            </div>

                            <AnimatePresence>
                                {(search || isFocused) && (
                                    <motion.div
                                        initial={{ opacity: 0, maxHeight: 0 }}
                                        animate={{ opacity: 1, maxHeight: 480 }}
                                        exit={{ opacity: 0, maxHeight: 0 }}
                                        className="mt-6 bg-white rounded-[2rem] p-4 shadow-xl border border-black/5 overflow-hidden"
                                    >
                                        <div className="space-y-4 max-h-[420px] overflow-y-auto">
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
                                                            {filteredDevices.length >= 12 && (
                                                                <p className="text-center text-[10px] text-black/30 font-bold pt-2">
                                                                    ...und viele weitere Modelle
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="p-8 text-center space-y-4">
                                                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                                                <X className="w-6 h-6 text-red-500" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-bold opacity-40">Modell nicht gefunden.</p>
                                                                <p className="text-[10px] text-black/30">
                                                                    Versuche es mit Marke + Modellnummer<br />
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
                    </div>

                    {/* Background Orbs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </motion.div>
            </div>
        </section>
    );
}
