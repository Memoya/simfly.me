'use client';

import { useState, useMemo } from 'react';
import { Search, Check, X, Smartphone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEVICES = [
    { brand: 'Apple', models: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 11', 'iPhone SE (2022)', 'iPad Pro (M2)', 'iPad Air (5th Gen)'] },
    { brand: 'Samsung', models: ['Galaxy S24', 'Galaxy S23', 'Galaxy S22', 'Galaxy S21', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy Note 20'] },
    { brand: 'Google', models: ['Pixel 8', 'Pixel 7', 'Pixel 6', 'Pixel 5', 'Pixel 4', 'Pixel 4a'] },
    { brand: 'Others', models: ['Xiaomi 13 Pro', 'Sony Xperia 1 V', 'Motorola Razr 40', 'Huawei P40'] }
];

export default function CompatibilityCheck() {
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const filteredDevices = useMemo(() => {
        if (!search) return [];
        return DEVICES.flatMap(d => d.models)
            .filter(m => m.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 8);
    }, [search]);

    const popularDevices = useMemo(() => {
        return ['iPhone 15', 'Galaxy S24', 'Pixel 8', 'iPhone 13', 'Galaxy S22'];
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
                            <p className="text-black/30 font-bold uppercase tracking-[0.3em] text-[10px]">Ready to fly?</p>
                        </div>

                        <div className="max-w-md mx-auto relative px-2">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-black transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Handymodell suchen..."
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
                                        animate={{ opacity: 1, maxHeight: 420 }}
                                        exit={{ opacity: 0, maxHeight: 0 }}
                                        className="mt-6 bg-white rounded-[2rem] p-4 shadow-xl border border-black/5 overflow-hidden"
                                    >
                                        <div className="space-y-4">
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
                                                        filteredDevices.map((model) => (
                                                            <div key={model} className="flex items-center justify-between p-4 hover:bg-black/5 rounded-2xl transition-colors group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center group-hover:bg-black transition-colors">
                                                                        <Smartphone className="w-4 h-4 group-hover:text-white" />
                                                                    </div>
                                                                    <span className="font-bold text-sm">{model}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest shrink-0">
                                                                    <span className="hidden xs:inline">Compatible</span>
                                                                    <Check className="w-4 h-4 stroke-[3px]" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-8 text-center space-y-4">
                                                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                                                <X className="w-6 h-6 text-red-500" />
                                                            </div>
                                                            <p className="text-sm font-bold opacity-40">Modell nicht gefunden.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 md:gap-8 opacity-20 px-4">
                            {['APPLE', 'SAMSUNG', 'GOOGLE', 'XIAOMI'].map(brand => (
                                <span key={brand} className="text-[9px] font-black tracking-[0.4em]">{brand}</span>
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
