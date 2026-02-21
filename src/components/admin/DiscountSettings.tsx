import { AdminSettings } from '@/types';
import { Percent, Users, TrendingUp, Tag } from 'lucide-react';

interface DiscountSettingsProps {
    settings: AdminSettings;
    onChange: (settings: AdminSettings) => void;
}

export default function DiscountSettings({ settings, onChange }: DiscountSettingsProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <Tag className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Discount & Upselling</h3>
            </div>

            <div className="space-y-6">
                {/* Auto-Discount Settings */}
                <div className="border border-gray-200 rounded-lg p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">Auto-Mengenrabatt</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="font-medium text-gray-900 text-sm">Aktiviert</div>
                            <div className="text-xs text-gray-500">Automatischer Rabatt ab bestimmtem Warenwert</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.autoDiscountEnabled || false}
                                onChange={(e) => onChange({ 
                                    ...settings, 
                                    autoDiscountEnabled: e.target.checked 
                                })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {settings.autoDiscountEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Rabatt (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={settings.autoDiscountPercent || 10}
                                    onChange={(e) => onChange({
                                        ...settings,
                                        autoDiscountPercent: parseFloat(e.target.value) || 10
                                    })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Ab Warenwert (€)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.autoDiscountThreshold || 50}
                                    onChange={(e) => onChange({
                                        ...settings,
                                        autoDiscountThreshold: parseFloat(e.target.value) || 50
                                    })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Duo-Paket Settings */}
                <div className="border border-gray-200 rounded-lg p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Duo-Paket (Partner-Karte)</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="font-medium text-gray-900 text-sm">Aktiviert</div>
                            <div className="text-xs text-gray-500">Zweite Karte mit Rabatt anbieten</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.duoDiscountEnabled ?? true}
                                onChange={(e) => onChange({ 
                                    ...settings, 
                                    duoDiscountEnabled: e.target.checked 
                                })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    {settings.duoDiscountEnabled && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                Partner-Rabatt (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={settings.duoDiscountPercent || 10}
                                onChange={(e) => onChange({
                                    ...settings,
                                    duoDiscountPercent: parseFloat(e.target.value) || 10
                                })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-2.5"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Wird als "Wird oft dazu gekauft" im Warenkorb angezeigt
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
