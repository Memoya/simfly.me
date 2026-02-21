'use client';

import { useCartStore } from '@/store/cart';
import { X, Trash2, ShoppingBag, ChevronRight, Zap, ShieldCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getCountryFlagUrl } from '@/lib/flags';
import { VisaLogo, MastercardLogo, ApplePayLogo, GooglePayLogo, KlarnaLogo } from './PaymentIcons';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function CartSidebar() {
    const { items, isOpen, closeCart, removeItem, addItem } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const params = useParams();
    const lang = params.lang as string || 'de';

    const [adminSettings, setAdminSettings] = useState<{
        autoDiscountEnabled: boolean;
        autoDiscountPercent: number;
        autoDiscountThreshold: number;
        duoDiscountEnabled: boolean;
        duoDiscountPercent: number;
    }>({
        autoDiscountEnabled: false,
        autoDiscountPercent: 10,
        autoDiscountThreshold: 50,
        duoDiscountEnabled: true,
        duoDiscountPercent: 10
    });

    useEffect(() => {
        if (isOpen) {
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => {
                    setAdminSettings({
                        autoDiscountEnabled: data.autoDiscountEnabled ?? false,
                        autoDiscountPercent: data.autoDiscountPercent ?? 10,
                        autoDiscountThreshold: data.autoDiscountThreshold ?? 50,
                        duoDiscountEnabled: data.duoDiscountEnabled ?? true,
                        duoDiscountPercent: data.duoDiscountPercent ?? 10
                    });
                })
                .catch(err => console.error('Failed to fetch settings:', err));
        }
    }, [isOpen]);

    const handleAddDuoCard = () => {
        if (items.length > 0) {
            const firstItem = items[0];
            const discountedPrice = firstItem.price * (1 - adminSettings.duoDiscountPercent / 100);
            const { quantity, ...itemWithoutQuantity } = firstItem;
            addItem({
                ...itemWithoutQuantity,
                id: `${firstItem.id}-duo`,
                price: discountedPrice,
            });
        }
    };

    const hasDuoCard = items.some(item => item.id.includes('-duo'));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang,
                    items: items.map(item => ({
                        id: item.id,
                        productName: item.name,
                        amount: Math.round(item.price * 100),
                        currency: 'eur',
                        quantity: item.quantity,
                        metadata: { region: item.region, data: item.data }
                    }))
                }),
            });

            const session = await response.json();
            if (session.url) {
                window.location.href = session.url;
            } else {
                console.error('Checkout error:', session);
                alert(session.error || session.message || 'Checkout failed');
            }
        } catch (error) {
            console.error(error);
            alert('Checkout konnte nicht gestartet werden. Bitte versuche es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Minimalist Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-white/60 backdrop-blur-md z-[60]"
                    />

                    {/* Sidebar / Bottom Sheet - Mobile Optimized */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.1, right: 0.5 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100) closeCart();
                        }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-card z-[70] flex flex-col sm:border-l border-black/5"
                    >
                        {/* Drag Indicator for Mobile */}
                        <div className="w-1.5 h-12 bg-black/10 rounded-full absolute left-2 top-1/2 -translate-y-1/2 sm:hidden" />
                        {/* Drag Indicator for Mobile */}
                        <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mt-4 sm:hidden" />

                        {/* Header */}
                        <div className="px-6 md:px-8 pt-6 md:pt-10 pb-6 flex justify-between items-center bg-white z-10">
                            <h2 className="text-2xl font-black text-black tracking-tighter flex items-center">
                                <ShoppingBag className="w-6 h-6 mr-3 stroke-[3px]" /> WARENKORB
                            </h2>
                            <button
                                onClick={closeCart}
                                className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all"
                            >
                                <X className="w-6 h-6 text-black" />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto px-6 md:px-8 space-y-4 pb-8 scrollbar-hide">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <div className="w-24 h-24 bg-black/5 rounded-[2.5rem] flex items-center justify-center">
                                        <ShoppingBag className="w-10 h-10 text-black/10 stroke-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-black tracking-tight">Dein Korb ist leer</p>
                                        <p className="text-sm text-black/30 font-medium">Bereit für dein nächstes Abenteuer?</p>
                                    </div>
                                    <button
                                        onClick={closeCart}
                                        className="text-black font-black text-xs uppercase tracking-[0.2em] border-b-2 border-black pb-1 hover:opacity-60 transition-all"
                                    >
                                        JETZT ENTDECKEN
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="group relative bg-white rounded-[2rem] p-6 border border-black/5 shadow-soft hover:border-black/10 transition-all flex items-center gap-5 cursor-pointer"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                                            <Image 
                                                src={getCountryFlagUrl(item.iso, 'w80') || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23e5e7eb" width="56" height="56"/%3E%3C/svg%3E'} 
                                                alt={item.name}
                                                width={56}
                                                height={56}
                                                className="object-cover rounded-xl"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-black text-sm tracking-tight truncate leading-none mb-1">
                                                {item.name}
                                            </h3>
                                            <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-relaxed">
                                                {item.data} • {item.duration}
                                                {item.unlimitedDetails && (
                                                    <div className="text-[9px] lowercase opacity-70">
                                                        ({item.unlimitedDetails.highSpeed} HighSpeed, danach {item.unlimitedDetails.throttle})
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm font-black text-black mt-2">
                                                {item.quantity} × {item.price.toFixed(2).replace('.', ',')}€
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeItem(item.id);
                                                }}
                                                className="p-2 text-black/10 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                                                aria-label="Entfernen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Duo-Paket (Partner-Karte) */}
                            {items.length > 0 && !hasDuoCard && adminSettings.duoDiscountEnabled && (
                                <div className="pt-6 border-t border-black/5">
                                    <h4 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-4">Wird oft dazu gekauft</h4>
                                    <div className="space-y-3">
                                        <div 
                                            onClick={handleAddDuoCard}
                                            className="bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all rounded-2xl p-4 flex items-center justify-between border-2 border-green-200/50 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-green-900 flex items-center gap-2">
                                                        Partner-Karte (Duo-Paket)
                                                        <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider">{adminSettings.duoDiscountPercent}% OFF</span>
                                                    </p>
                                                    <p className="text-[10px] text-green-700 font-medium">Zweite Karte mit {adminSettings.duoDiscountPercent}% Rabatt</p>
                                                </div>
                                            </div>
                                            <div className="text-[13px] font-black text-green-600 group-hover:scale-110 transition-transform">
                                                +{(items[0].price * (1 - adminSettings.duoDiscountPercent / 100)).toFixed(2)}€
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Minimalist Footer */}
                        {items.length > 0 && (
                            <div className="px-6 md:px-8 pt-6 pb-6 md:pb-10 bg-white border-t border-black/5 space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Gesamtbetrag</p>
                                        <p className="text-4xl font-black text-black tracking-tighter">
                                            {total.toFixed(2).replace('.', ',')}€
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {/* Upselling Progress Bar */}
                                        {adminSettings.autoDiscountEnabled && total < adminSettings.autoDiscountThreshold && (
                                            <div className="w-48 space-y-2">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-black/40">Noch {(adminSettings.autoDiscountThreshold - total).toFixed(2)}€ bis {adminSettings.autoDiscountPercent}% Rabatt</span>
                                                    <span className="text-electric">{adminSettings.autoDiscountPercent}% OFF</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(total / adminSettings.autoDiscountThreshold) * 100}%` }}
                                                        className="h-full bg-electric rounded-full shadow-[0_0_10px_rgba(0,102,255,0.3)]"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {adminSettings.autoDiscountEnabled && total >= adminSettings.autoDiscountThreshold && (
                                            <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full border border-green-500/20">
                                                <Zap className="w-3 h-3 fill-green-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{adminSettings.autoDiscountPercent}% Rabatt aktiviert</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Social Proof Badges */}
                                <div className="p-4 bg-gray-50 rounded-2xl border border-black/5 flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden flex items-center justify-center text-[8px] font-bold text-gray-500 italic">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-black/50 leading-tight">
                                        🔥 <span className="text-black">32 Personen</span> haben heute USA eSIM gekauft. <br />
                                        <span className="text-[9px] opacity-60">Zertifizierter Premium Provider</span>
                                    </p>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className="w-full bg-black text-white text-sm font-black py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-lg relative overflow-hidden"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="tracking-[0.1em] uppercase">SICHER ZUR KASSE</span>
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </button>

                                {/* Trust Elements */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-center gap-4 text-black/20">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 stroke-[2.5px]" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3 h-3 md:w-4 md:h-4 stroke-[2.5px]" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Instant Delivery</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center items-center gap-4 pt-4 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                                        <div className="h-5 w-8 relative flex items-center justify-center">
                                            <VisaLogo className="h-full w-full object-contain" />
                                        </div>
                                        <div className="h-6 w-9 relative flex items-center justify-center">
                                            <MastercardLogo className="h-full w-full object-contain" />
                                        </div>
                                        <div className="h-5 w-10 relative flex items-center justify-center">
                                            <ApplePayLogo className="h-full w-full object-contain" />
                                        </div>
                                        <div className="h-5 w-10 relative flex items-center justify-center">
                                            <GooglePayLogo className="h-full w-full object-contain" />
                                        </div>
                                        <div className="h-5 w-10 relative flex items-center justify-center">
                                            <KlarnaLogo className="h-full w-full object-contain" />
                                        </div>
                                    </div>
                                </div>

                                <span className="text-[8px] font-black tracking-[0.3em] text-black uppercase text-center block w-full opacity-40">Sicherer Checkout</span>

                                <div className="p-5 bg-black/[0.02] rounded-[1.5rem] border border-black/5">
                                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest text-center leading-relaxed">
                                        🌍 Bereit für die Reise? <br />
                                        <span className="text-black/60">QR-Code wird nach dem Kauf sofort per E-Mail zugestellt.</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
