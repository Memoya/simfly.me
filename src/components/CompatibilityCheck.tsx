'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import devicesData from '@/data/esim-devices.json';

// Helper function to detect device from user agent and features
function detectDevice(): { device: string | null; confidence: 'high' | 'medium' | 'low' } {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return { device: null, confidence: 'low' };
    }
    
    const ua = navigator.userAgent;
    const platform = navigator.platform || '';
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Debug: Log User Agent (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Device Detection Debug:', {
            userAgent: ua,
            platform,
            screenWidth,
            screenHeight,
            pixelRatio
        });
    }
    
    // iPhone detection with screen size verification
    if (ua.includes('iPhone') || (platform.includes('iPhone'))) {
        // Try to detect model by identifier
        const modelMatch = ua.match(/iPhone(\d+[,\d]*)/);
        if (modelMatch) {
            const identifier = modelMatch[1];
            // iPhone model identifiers (these are rare in modern browsers)
            if (identifier.startsWith('16')) return { device: 'iPhone 15 Pro', confidence: 'high' };
            if (identifier.startsWith('15')) return { device: 'iPhone 14', confidence: 'high' };
            if (identifier.startsWith('14')) return { device: 'iPhone 13', confidence: 'high' };
            if (identifier.startsWith('13')) return { device: 'iPhone 12', confidence: 'high' };
            if (identifier.startsWith('12')) return { device: 'iPhone 11', confidence: 'high' };
        }
        
        // Fallback: Use screen dimensions to guess iPhone model
        // All iPhones since iPhone 11 support eSIM
        const screenSize = Math.max(screenWidth, screenHeight) * pixelRatio;
        
        if (screenSize >= 2796) return { device: 'iPhone 15 Pro Max', confidence: 'medium' }; // 6.7"
        if (screenSize >= 2556) return { device: 'iPhone 15 Pro', confidence: 'medium' }; // 6.1"
        if (screenSize >= 2532) return { device: 'iPhone 14 Pro', confidence: 'medium' }; // 6.1"
        if (screenSize >= 2436) return { device: 'iPhone 13', confidence: 'medium' }; // 6.1"
        
        // Generic iPhone (all iPhones from 2018+ support eSIM)
        return { device: 'iPhone (eSIM kompatibel)', confidence: 'medium' };
    }
    
    // iPad detection
    if (ua.includes('iPad') || (platform.includes('iPad')) || 
        (ua.includes('Macintosh') && 'ontouchend' in document)) { // iPadOS 13+ identifies as Mac
        // Check screen size for iPad Pro
        const diagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight) / pixelRatio;
        if (diagonal > 11) {
            return { device: 'iPad Pro (eSIM kompatibel)', confidence: 'medium' };
        }
        return { device: 'iPad (eSIM kompatibel)', confidence: 'medium' };
    }
    
    // Samsung Galaxy detection
    if (ua.includes('Samsung') || ua.includes('SM-')) {
        // Try to extract model number
        const modelMatch = ua.match(/SM-([A-Z]\d+)/);
        if (modelMatch) {
            const model = modelMatch[1];
            if (model.startsWith('S93')) return { device: 'Galaxy S24', confidence: 'high' };
            if (model.startsWith('S92')) return { device: 'Galaxy S23', confidence: 'high' };
            if (model.startsWith('S91')) return { device: 'Galaxy S22', confidence: 'high' };
            if (model.startsWith('S90')) return { device: 'Galaxy S21', confidence: 'high' };
            if (model.startsWith('F')) return { device: 'Galaxy Z Fold/Flip', confidence: 'medium' };
        }
        return { device: 'Samsung Galaxy (eSIM kompatibel)', confidence: 'medium' };
    }
    
    // Google Pixel detection
    if (ua.includes('Pixel')) {
        if (ua.includes('Pixel 9')) return { device: 'Google Pixel 9', confidence: 'high' };
        if (ua.includes('Pixel 8')) return { device: 'Google Pixel 8', confidence: 'high' };
        if (ua.includes('Pixel 7')) return { device: 'Google Pixel 7', confidence: 'high' };
        if (ua.includes('Pixel 6')) return { device: 'Google Pixel 6', confidence: 'high' };
        if (ua.includes('Pixel 5')) return { device: 'Google Pixel 5', confidence: 'high' };
        if (ua.includes('Pixel 4')) return { device: 'Google Pixel 4', confidence: 'high' };
        return { device: 'Google Pixel (eSIM kompatibel)', confidence: 'medium' };
    }
    
    // Xiaomi detection
    if (ua.includes('Xiaomi') || ua.includes('Redmi') || ua.includes('MI ')) {
        return { device: 'Xiaomi (neuere Modelle eSIM-fähig)', confidence: 'low' };
    }
    
    // Oppo detection
    if (ua.includes('OPPO') || ua.includes('CPH')) {
        return { device: 'Oppo (neuere Modelle eSIM-fähig)', confidence: 'low' };
    }
    
    // OnePlus detection  
    if (ua.includes('OnePlus')) {
        return { device: 'OnePlus (neuere Modelle eSIM-fähig)', confidence: 'low' };
    }
    
    // Motorola detection
    if (ua.includes('Motorola') || ua.includes('moto')) {
        return { device: 'Motorola (neuere Modelle eSIM-fähig)', confidence: 'low' };
    }
    
    return { device: null, confidence: 'low' };
}

export default function CompatibilityCheck() {
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [detectedDevice, setDetectedDevice] = useState<string | null>(null);
    const [deviceConfidence, setDeviceConfidence] = useState<'high' | 'medium' | 'low'>('low');
    const [showDetection, setShowDetection] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // Detect device on mount
    useEffect(() => {
        const detection = detectDevice();
        if (detection.device) {
            setDetectedDevice(detection.device);
            setDeviceConfidence(detection.confidence);
            setShowDetection(true);
            // Auto-hide after 8 seconds
            setTimeout(() => setShowDetection(false), 8000);
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
                                className={`absolute top-4 right-4 px-4 py-3 rounded-2xl shadow-lg flex flex-col gap-1 z-20 text-xs font-bold max-w-xs ${
                                    deviceConfidence === 'high' ? 'bg-green-500 text-white' :
                                    deviceConfidence === 'medium' ? 'bg-blue-500 text-white' :
                                    'bg-yellow-500 text-black'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span className="font-black">{detectedDevice}</span>
                                </div>
                                {deviceConfidence !== 'high' && (
                                    <span className="text-[9px] opacity-80 leading-tight">
                                        {deviceConfidence === 'medium' 
                                            ? 'Wahrscheinlich eSIM-kompatibel'
                                            : 'Bitte manuell prüfen'}
                                    </span>
                                )}
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
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-[8px] ${
                                                        deviceConfidence === 'high' ? 'bg-green-500 text-white' :
                                                        deviceConfidence === 'medium' ? 'bg-blue-500 text-white' :
                                                        'bg-yellow-500 text-black'
                                                    }`}>
                                                        {deviceConfidence}
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
