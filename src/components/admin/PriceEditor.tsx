import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

interface PriceEditorProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // The raw product object with price (COGS) and sellPrice
    onSave: (sku: string, newPrice: number) => Promise<void>;
}

export default function PriceEditor({ isOpen, onClose, product, onSave }: PriceEditorProps) {
    const [price, setPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (product) {
            setPrice(product.sellPrice?.toFixed(2) || '');
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const cogs = product.price || 0;
    const currentPrice = parseFloat(price) || 0;
    const margin = currentPrice - cogs;
    const marginPercent = cogs > 0 ? (margin / cogs) * 100 : 0;
    const isValid = currentPrice >= cogs;

    const handleSave = async () => {
        if (!isValid) {
            setError('Verkaufspreis darf nicht unter Einkaufspreis liegen.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onSave(product.name, currentPrice);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Speichern fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                    <h3 className="text-xl font-bold text-navy">Preis bearbeiten</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-navy mb-1">{product.data} - {product.name}</h4>
                        <p className="text-sm text-gray-500">{product.region}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <p className="text-xs font-bold text-blue-800 uppercase mb-1">Einkauf (Netto)</p>
                            <p className="text-lg font-mono text-navy">{cogs.toFixed(2)}€</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-800 uppercase mb-1">Aktuell (Brutto)</p>
                            <p className="text-lg font-mono text-navy">{(product.sellPrice || 0).toFixed(2)}€</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Neuer Verkaufspreis (€)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                className={`w-full p-3 border-2 rounded-xl text-lg font-bold outline-none focus:ring-2 ${isValid ? 'border-gray-200 focus:border-electric focus:ring-electric' : 'border-red-300 focus:border-red-500 focus:ring-red-200'}`}
                                value={price}
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                    setError('');
                                }}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                        </div>

                        {!isValid && (
                            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm font-bold animate-pulse">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Preis unter Einkaufspreis!</span>
                            </div>
                        )}

                        {isValid && (
                            <div className="flex justify-between items-center mt-2 text-sm">
                                <span className="text-gray-500">Marge:</span>
                                <span className={`font-bold ${margin > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                    {margin.toFixed(2)}€ ({marginPercent.toFixed(1)}%)
                                </span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isValid || loading}
                            className="flex-1 bg-electric text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                            Speichern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
