import { AdminSettings } from '@/types';
import { Bell, AlertTriangle } from 'lucide-react';

interface AlertSettingsProps {
    settings: AdminSettings;
    onChange: (settings: AdminSettings) => void;
}

export default function AlertSettings({ settings, onChange }: AlertSettingsProps) {
    const handleToggle = () => {
        onChange({
            ...settings,
            lowBalanceAlertEnabled: !settings.lowBalanceAlertEnabled
        });
    };

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        onChange({
            ...settings,
            lowBalanceThreshold: isNaN(val) ? 0 : val
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Auto-Alerts</h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <div className="font-medium text-gray-900">Low Balance Warning</div>
                        <div className="text-sm text-gray-500">Receive email alerts when eSIM Go balance drops.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.lowBalanceAlertEnabled || false}
                            onChange={handleToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {settings.lowBalanceAlertEnabled && (
                    <div className="flex items-center gap-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-indigo-500" />
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alert Threshold (USD)
                            </label>
                            <input
                                type="number"
                                value={settings.lowBalanceThreshold || 50}
                                onChange={handleThresholdChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                placeholder="50.00"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
