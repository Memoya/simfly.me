'use client';

import { useCartStore } from '@/store/cart';
import { X, Trash2, ShoppingBag, ChevronRight, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { getCountryFlag } from '@/lib/flags';

export default function CartSidebar() {
    const { items, isOpen, closeCart, removeItem } = useCartStore();
    const [loading, setLoading] = useState(false);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-card z-[70] flex flex-col sm:border-l border-black/5"
                    >
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
                                    <div key={item.id} className="group relative bg-white rounded-[2rem] p-6 border border-black/5 shadow-soft hover:border-black/10 transition-all flex items-center gap-5">
                                        <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center shrink-0 text-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                                            {getCountryFlag(item.iso)}
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
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-black/10 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                                                aria-label="Entfernen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
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
                                    <div className="flex gap-2">
                                        <div className="w-8 h-5 bg-black/5 rounded border border-black/5" />
                                        <div className="w-8 h-5 bg-black/5 rounded border border-black/5" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className="w-full bg-black text-white font-black py-5 md:py-7 rounded-[2rem] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span className="tracking-widest">WIRD GELADEN...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <span className="tracking-widest">ZUR KASSE</span>
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 opacity-40">
                                    <div className="flex items-center gap-2">
                                        {/* Visa */}
                                        <svg className="h-4" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="48" height="16" rx="2" fill="#1434CB" />
                                            <path d="M20.5 4L18 12H16L14.5 6.5C14.4 6.2 14.3 6 14 5.9C13.5 5.7 12.8 5.5 12 5.3L12.1 5H15.5C16 5 16.4 5.3 16.5 5.8L17.3 9.5L19.3 5H20.9L20.5 4ZM26 9.5C26 7.8 23.5 7.7 23.5 7C23.5 6.7 23.8 6.4 24.4 6.3C24.7 6.3 25.5 6.2 26.4 6.6L26.8 5.3C26.3 5.1 25.6 5 24.8 5C23.3 5 22.2 5.8 22.2 7C22.2 7.9 23 8.4 23.6 8.7C24.2 9 24.4 9.2 24.4 9.5C24.4 10 23.8 10.2 23.3 10.2C22.5 10.2 22.1 10.1 21.4 9.8L21 11.1C21.7 11.4 22.9 11.6 23.4 11.6C25.1 11.6 26.1 10.8 26 9.5ZM31 12H32.4L31.1 5H29.8C29.4 5 29.1 5.2 28.9 5.5L26.5 12H28.1L28.5 10.8H30.5L30.7 12H31ZM29 9.5L29.8 7L30.2 9.5H29ZM22 5L20.7 12H19.2L20.5 5H22Z" fill="white" />
                                        </svg>
                                        {/* Mastercard */}
                                        <svg className="h-4" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="16" rx="2" fill="#EB001B" />
                                            <circle cx="12" cy="8" r="5" fill="#FF5F00" />
                                            <circle cx="20" cy="8" r="5" fill="#F79E1B" />
                                        </svg>
                                        {/* Apple Pay */}
                                        <svg className="h-4" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="16" rx="2" fill="black" />
                                            <path d="M10.5 5.5C10.8 5.1 11 4.6 10.9 4C10.5 4 10 4.3 9.7 4.7C9.4 5 9.2 5.6 9.3 6.1C9.7 6.1 10.2 5.9 10.5 5.5ZM10.9 6.2C10.3 6.2 9.8 6.5 9.5 6.5C9.2 6.5 8.7 6.2 8.2 6.2C7.5 6.2 6.9 6.6 6.6 7.2C5.9 8.4 6.4 10.2 7.1 11.2C7.4 11.7 7.8 12.2 8.3 12.2C8.8 12.2 9 11.9 9.6 11.9C10.2 11.9 10.3 12.2 10.9 12.2C11.4 12.2 11.8 11.7 12.1 11.2C12.5 10.6 12.6 10.1 12.6 10.1C12.6 10.1 11.7 9.7 11.7 8.7C11.7 7.8 12.4 7.4 12.4 7.4C12 6.7 11.3 6.2 10.9 6.2Z" fill="white" />
                                            <text x="14" y="11" fill="white" fontSize="5" fontWeight="bold">Pay</text>
                                        </svg>
                                        {/* Google Pay */}
                                        <svg className="h-4" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="16" rx="2" fill="white" stroke="#E8E8E8" />
                                            <path d="M15 8V11H14V5H16.5C17.1 5 17.6 5.2 18 5.6C18.4 6 18.6 6.5 18.6 7C18.6 7.5 18.4 8 18 8.4C17.6 8.8 17.1 9 16.5 9H15V8ZM15 6V8H16.5C16.8 8 17.1 7.9 17.3 7.7C17.5 7.5 17.6 7.3 17.6 7C17.6 6.7 17.5 6.5 17.3 6.3C17.1 6.1 16.8 6 16.5 6H15Z" fill="#5F6368" />
                                            <path d="M21.5 8C21.9 8 22.2 8.1 22.5 8.4C22.8 8.7 22.9 9 22.9 9.5V11H22V10.5C21.8 10.8 21.5 11 21 11C20.6 11 20.3 10.9 20 10.7C19.7 10.5 19.6 10.2 19.6 9.9C19.6 9.6 19.7 9.3 20 9.1C20.3 8.9 20.6 8.8 21 8.8C21.4 8.8 21.7 8.9 22 9V8.9C22 8.7 21.9 8.5 21.7 8.4C21.5 8.3 21.3 8.2 21 8.2C20.6 8.2 20.3 8.3 20 8.5L19.8 7.8C20.2 7.6 20.8 7.5 21.5 7.5V8ZM21.2 10.3C21.5 10.3 21.7 10.2 21.9 10C22 9.8 22 9.6 22 9.4C21.8 9.3 21.5 9.2 21.2 9.2C21 9.2 20.8 9.3 20.7 9.4C20.6 9.5 20.5 9.6 20.5 9.8C20.5 10 20.6 10.1 20.7 10.2C20.8 10.3 21 10.3 21.2 10.3Z" fill="#5F6368" />
                                            <path d="M26 8.5L23.5 13.5H22.6L23.5 11.5L22 8.5H23L24 10.8L25 8.5H26Z" fill="#5F6368" />
                                        </svg>
                                        {/* Klarna */}
                                        <svg className="h-4" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="16" rx="2" fill="#FFB3C7" />
                                            <text x="4" y="11" fill="black" fontSize="6" fontWeight="bold">klarna</text>
                                        </svg>
                                        {/* PayPal */}
                                        <svg className="h-4" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="32" height="16" rx="2" fill="#003087" />
                                            <path d="M10 5C10.5 5 10.9 5.1 11.2 5.4C11.5 5.7 11.6 6.1 11.6 6.6C11.6 7.4 11.3 8 10.7 8.4C10.1 8.8 9.3 9 8.3 9H7.5L7 11H6L7.5 5H10ZM9.8 6H8L7.6 8H8.4C9 8 9.5 7.9 9.8 7.7C10.1 7.5 10.3 7.1 10.3 6.6C10.3 6.3 10.2 6.1 10 6C9.9 6 9.8 6 9.8 6Z" fill="white" />
                                            <path d="M14 8C14.4 8 14.7 8.1 15 8.4C15.3 8.7 15.4 9 15.4 9.5V11H14.5V10.5C14.3 10.8 14 11 13.5 11C13.1 11 12.8 10.9 12.5 10.7C12.2 10.5 12.1 10.2 12.1 9.9C12.1 9.6 12.2 9.3 12.5 9.1C12.8 8.9 13.1 8.8 13.5 8.8C13.9 8.8 14.2 8.9 14.5 9V8.9C14.5 8.7 14.4 8.5 14.2 8.4C14 8.3 13.8 8.2 13.5 8.2C13.1 8.2 12.8 8.3 12.5 8.5L12.3 7.8C12.7 7.6 13.3 7.5 14 7.5V8ZM13.7 10.3C14 10.3 14.2 10.2 14.4 10C14.5 9.8 14.5 9.6 14.5 9.4C14.3 9.3 14 9.2 13.7 9.2C13.5 9.2 13.3 9.3 13.2 9.4C13.1 9.5 13 9.6 13 9.8C13 10 13.1 10.1 13.2 10.2C13.3 10.3 13.5 10.3 13.7 10.3Z" fill="#009CDE" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 opacity-20">
                                    <CreditCard className="w-3 h-3 text-black" />
                                    <span className="text-[8px] font-black tracking-[0.3em] text-black uppercase">Secure Checkout</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
