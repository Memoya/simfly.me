'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, Globe, MessageSquare, MonitorPlay, Star } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { getCountryFlagUrl } from '@/lib/flags';
import { Product } from '@/types';

interface PackageModalProps {
    country: string;
    iso: string;
    packages: Product[];
    isOpen: boolean;
    onClose: () => void;
    initialPackage?: Product | null;
}

export default function PackageModal({ country, iso, packages, isOpen, onClose, initialPackage }: PackageModalProps) {
    const { addItem } = useCartStore();

    // -- STATE & LOGIC --

    // 1. Durations
    const durations = useMemo(() =>
        Array.from(new Set(packages.map(pkg => pkg.durationRaw)))
            .filter((d): d is number => typeof d === 'number')
            .sort((a, b) => a - b),
        [packages]);

    const [selectedDuration, setSelectedDuration] = useState<number>(7);

    // Reset to default (30 days) when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (durations.includes(30)) {
                setSelectedDuration(30);
            } else if (initialPackage?.durationRaw && typeof initialPackage.durationRaw === 'number') {
                setSelectedDuration(initialPackage.durationRaw);
            } else if (durations.length > 0) {
                setSelectedDuration(durations[0]);
            }
            // Also reset selection modes
            setIsUnlimitedSelected(!!initialPackage?.data.startsWith('Unlimited'));
            if (initialPackage?.data.startsWith('Unlimited')) {
                setSelectedUnlimitedId(initialPackage.id);
            }
        }
    }, [isOpen, durations, initialPackage]);

    // 2. Filtered & Sorted Packages for current Duration
    const durationPackages = useMemo(() => {
        return packages.filter(pkg => pkg.durationRaw === selectedDuration);
    }, [packages, selectedDuration]);

    const fixedPackages = useMemo(() => {
        return durationPackages
            .filter(p => !p.data.startsWith('Unlimited'))
            .sort((a, b) => {
                const aVal = parseFloat(a.data) || 0;
                const bVal = parseFloat(b.data) || 0;
                return aVal - bVal;
            });
    }, [durationPackages]);

    const unlimitedPackages = useMemo(() => {
        return durationPackages
            .filter(p => p.data.startsWith('Unlimited'))
            .sort((a, b) => (a.price || 0) - (b.price || 0));
    }, [durationPackages]);

    // 3. Selection State
    const [sliderIndex, setSliderIndex] = useState(() => {
        if (initialPackage && !initialPackage.data.startsWith('Unlimited') && initialPackage.durationRaw === selectedDuration) {
            const idx = fixedPackages.findIndex(p => p.id === initialPackage.id);
            return idx !== -1 ? idx : Math.floor(fixedPackages.length / 2);
        }
        return Math.floor(fixedPackages.length / 2);
    });

    const [isUnlimitedSelected, setIsUnlimitedSelected] = useState(() => {
        return !!(initialPackage?.data.startsWith('Unlimited'));
    });

    const [selectedUnlimitedId, setSelectedUnlimitedId] = useState<string | null>(() => {
        return initialPackage?.data.startsWith('Unlimited') ? initialPackage.id : null;
    });

    // Final selected package
    const selectedPkg = useMemo(() => {
        if (isUnlimitedSelected && selectedUnlimitedId) {
            return unlimitedPackages.find(p => p.id === selectedUnlimitedId) || unlimitedPackages[0];
        }
        return fixedPackages[sliderIndex] || fixedPackages[0];
    }, [isUnlimitedSelected, selectedUnlimitedId, unlimitedPackages, fixedPackages, sliderIndex]);

    // -- HANDLERS --

    const handleAddToCart = () => {
        if (selectedPkg) {
            addItem(selectedPkg);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-white/60 backdrop-blur-xl z-[-1]"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-white w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center relative overflow-hidden">
                                <Image
                                    src={getCountryFlagUrl(iso, 'w160')}
                                    alt={country}
                                    fill
                                    className="object-cover p-2.5"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-black tracking-tight leading-none mb-1">{country}</h2>
                                <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Wähle dein Datenpaket</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-black/5 hover:bg-black/10 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide space-y-12">

                        {/* SCHRITT 1: Laufzeit */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">1. Laufzeit wählen</span>
                            </div>
                            <div className="-mx-8 px-8 flex gap-2 overflow-x-auto scrollbar-hide snap-x select-none">
                                <div className="flex gap-2 pb-2">
                                    {durations.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => {
                                                setSelectedDuration(d);
                                                setIsUnlimitedSelected(false);
                                            }}
                                            className={cn(
                                                "shrink-0 min-w-[80px] py-3 rounded-2xl font-bold text-[11px] transition-all tracking-wider relative snap-center",
                                                selectedDuration === d
                                                    ? "text-black shadow-lg bg-white border border-black/5"
                                                    : "text-black/30 bg-black/[0.03] hover:bg-black/[0.05]"
                                            )}
                                        >
                                            {selectedDuration === d && (
                                                <motion.div
                                                    layoutId="duration-active"
                                                    className="absolute inset-0 bg-white rounded-2xl border border-black/5"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                                />
                                            )}
                                            <span className="relative z-10">{d} {d === 1 ? 'Tag' : 'Tage'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SCHRITT 2A: Fixed Data Slider */}
                        {fixedPackages.length > 0 && (
                            <div className={cn(
                                "space-y-8 transition-opacity duration-300",
                                isUnlimitedSelected ? "opacity-40" : "opacity-100"
                            )}>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black block">2. Datenvolumen wählen</span>

                                <div className="text-center space-y-2">
                                    <motion.h1
                                        key={selectedPkg?.id}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-7xl font-black text-black tracking-tighter"
                                    >
                                        {!isUnlimitedSelected ? selectedPkg?.data : fixedPackages[sliderIndex]?.data}
                                    </motion.h1>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-2xl font-bold text-electric">
                                            {!isUnlimitedSelected ? selectedPkg?.price.toFixed(2).replace('.', ',') : fixedPackages[sliderIndex]?.price.toFixed(2).replace('.', ',')}€
                                        </span>
                                        <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest italic">
                                            {selectedDuration} Tage gültig
                                        </span>
                                    </div>
                                </div>

                                <div className="relative px-6 pt-4 pb-12">
                                    <div className="relative h-20 flex items-center">
                                        {/* Slider Track */}
                                        <div className="absolute inset-x-0 h-1.5 bg-black/[0.05] rounded-full" />

                                        {/* Tick Marks */}
                                        <div className="absolute inset-x-0 flex justify-between px-1">
                                            {fixedPackages.map((p, i) => (
                                                <div key={p.id} className="relative flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-1 h-3 rounded-full transition-all",
                                                        i <= sliderIndex ? "bg-black" : "bg-black/10"
                                                    )} />
                                                    <span className={cn(
                                                        "absolute top-6 whitespace-nowrap text-[9px] font-black tracking-tighter transition-all",
                                                        i === sliderIndex ? "text-black scale-110" : "text-black/20"
                                                    )}>
                                                        {p.data}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Slider Input */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={fixedPackages.length - 1}
                                            step="1"
                                            value={sliderIndex}
                                            onChange={(e) => {
                                                setSliderIndex(parseInt(e.target.value));
                                                setIsUnlimitedSelected(false);
                                            }}
                                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {/* Animated Knob */}
                                        <motion.div
                                            animate={{ left: `calc(${(sliderIndex / (fixedPackages.length - 1)) * 100}% - 16px)` }}
                                            transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                                            className="absolute w-8 h-8 bg-black rounded-full shadow-lg pointer-events-none flex items-center justify-center"
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SCHRITT 2B: Unlimited Options */}
                        {unlimitedPackages.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-black/[0.05] flex-1" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">Oder unbegrenzt surfen</span>
                                    <div className="h-px bg-black/[0.05] flex-1" />
                                </div>

                                <div className="grid gap-4">
                                    {unlimitedPackages.map((p) => {
                                        const isSelected = isUnlimitedSelected && selectedUnlimitedId === p.id;
                                        const isEssential = p.unlimitedDetails?.tier === 'Essential';

                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setIsUnlimitedSelected(true);
                                                    setSelectedUnlimitedId(p.id);
                                                }}
                                                className={cn(
                                                    "relative w-full text-left p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden",
                                                    isSelected
                                                        ? "bg-black text-white border-black shadow-xl scale-[1.02]"
                                                        : "bg-black/[0.02] text-black border-black/5 hover:border-black/20"
                                                )}
                                            >
                                                {isEssential && (
                                                    <div className="absolute top-0 right-8 px-4 py-1 bg-electric text-white text-[8px] font-black uppercase tracking-widest rounded-b-xl flex items-center gap-1 shadow-sm">
                                                        <Star className="w-2.5 h-2.5 fill-current" />
                                                        Beliebteste Wahl
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black tracking-tight">{p.data}</h3>
                                                            <div className={cn(
                                                                "text-[10px] font-bold uppercase tracking-widest",
                                                                isSelected ? "text-white/50" : "text-black/30"
                                                            )}>
                                                                {p.duration} Laufzeit
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className={cn("w-3 h-3", isSelected ? "text-electric" : "text-electric")} />
                                                                <span className="text-[11px] font-bold tracking-tight">{p.unlimitedDetails?.highSpeed} HighSpeed Daten</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MonitorPlay className={cn("w-3 h-3", isSelected ? "text-white/40" : "text-black/20")} />
                                                                <span className={cn("text-[10px] font-medium opacity-60")}>
                                                                    Danach unlimitiert mit {p.unlimitedDetails?.throttle}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-3xl font-black tracking-tighter">
                                                            {p.price.toFixed(2).replace('.', ',')}€
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer / CTA */}
                    <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none shrink-0">
                        <div className="max-w-xl mx-auto pointer-events-auto">
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-black text-white text-sm md:text-lg font-black py-4 md:py-6 rounded-[2rem] md:rounded-[2.25rem] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group shadow-2xl"
                            >
                                <span className="tracking-[0.1em] md:tracking-[0.2em] font-black uppercase">Weiter zur Bestellung</span>
                                <ChevronRight className="w-5 h-5 md:w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
