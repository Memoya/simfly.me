'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
    const [sessionId, setSessionId] = useState('');
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [userAgent, setUserAgent] = useState('');
    const [trackingStatus, setTrackingStatus] = useState('Initializing...');
    const [visitorCount, setVisitorCount] = useState(0);
    const [adminPassword, setAdminPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Get viewport size
        setViewport({ width: window.innerWidth, height: window.innerHeight });
        setUserAgent(navigator.userAgent);

        let sessionId = sessionStorage.getItem('simfly_visitor_session');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('simfly_visitor_session', sessionId);
        }
        setSessionId(sessionId);
        setTrackingStatus('Ready to track');
    }, []);

    const testTracking = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    page: '/debug',
                    lang: 'de',
                    screenWidth: viewport.width,
                    screenHeight: viewport.height
                }),
            });

            if (response.ok) {
                setTrackingStatus('✅ Tracking erfolgreich!');
            } else {
                const error = await response.json();
                setTrackingStatus(`❌ Fehler: ${error.error}`);
            }
        } catch (err) {
            setTrackingStatus(`❌ Netzwerkfehler: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchVisitorCount = async () => {
        if (!adminPassword) {
            alert('Bitte Admin-Password eingeben');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/analytics/visitors?timeRange=24h', {
                headers: { 'Authorization': `Bearer ${adminPassword}` }
            });

            if (response.ok) {
                const data = await response.json();
                setVisitorCount(data.visitors?.length || 0);
            } else {
                const error = await response.json();
                alert(`Fehler: ${error.error}`);
            }
        } catch (err) {
            alert(`Netzwerkfehler: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-black text-navy mb-8">🐛 Debug: Besucher-Tracking</h1>

                {/* Session Info */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-navy mb-4">Session Info</h2>
                    <div className="space-y-2 text-sm font-mono">
                        <p><span className="font-bold">Session ID:</span> {sessionId || 'Loading...'}</p>
                        <p><span className="font-bold">Viewport:</span> {viewport.width}x{viewport.height}</p>
                        <p><span className="font-bold">User Agent:</span> {userAgent || 'Loading...'}</p>
                    </div>
                </div>

                {/* Test Tracking */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-navy mb-4">Test: Tracking senden</h2>
                    <div className="mb-4 p-4 rounded-lg" style={{ 
                        backgroundColor: trackingStatus.includes('✅') ? '#d1fae5' : trackingStatus.includes('❌') ? '#fee2e2' : '#f0f9ff',
                        borderLeft: `4px solid ${trackingStatus.includes('✅') ? '#10b981' : trackingStatus.includes('❌') ? '#ef4444' : '#3b82f6'}`
                    }}>
                        {trackingStatus}
                    </div>
                    <button
                        onClick={testTracking}
                        disabled={loading}
                        className="px-6 py-3 bg-navy text-white font-bold rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Wird gesendet...' : 'Test Tracking senden'}
                    </button>
                </div>

                {/* Admin Check */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-navy mb-4">Admin: Besucher abrufen</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-navy mb-2">Admin Password:</label>
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Dein Admin-Password eingeben..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                    </div>
                    {visitorCount > 0 && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
                            ✅ <span className="font-bold text-green-700">{visitorCount} Besucher</span> gefunden!
                        </div>
                    )}
                    <button
                        onClick={fetchVisitorCount}
                        disabled={loading}
                        className="px-6 py-3 bg-electric text-white font-bold rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Wird geladen...' : 'Besucher abrufen (24h)'}
                    </button>
                </div>
            </div>
        </div>
    );
}
