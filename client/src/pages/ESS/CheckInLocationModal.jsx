import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const CheckInLocationModal = ({ isOpen, onClose, employeeId, logType, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!isOpen) return;
        
        // Reset state on open
        setLocation(null);
        setError(null);
        setLoading(true);

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setLoading(false);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setError("Unable to retrieve your location. Please ensure location services are enabled.");
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
        }

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!location && !error) return; // Still resolving location
        
        setLoading(true);
        try {
            // standard ISO without Z to preserve local time or format manually
            const pad = (n) => n < 10 ? '0'+n : n;
            const now = new Date();
            const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            const checkinData = {
                employee: employeeId,
                log_type: logType,
                time: timeStr,
                device_id: 'ESS Web Portal',
                latitude: location ? location.latitude : null,
                longitude: location ? location.longitude : null
            };

            await API.post('/api/resource/Employee Checkin', checkinData);
            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to submit check-in record.');
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#f8fafc', width: '100%', maxWidth: 500, borderRadius: 16,
                padding: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column', gap: 20
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
                        fontSize: 24, color: '#9ca3af', cursor: 'pointer'
                    }}
                >&times;</button>

                <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <div style={{ width: 40, height: 4, background: '#cbd5e1', borderRadius: 2, margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                        {formatTime(currentTime)}
                    </h2>
                    <p style={{ fontSize: 15, color: '#6b7280', margin: '4px 0 0 0', fontWeight: 500 }}>
                        {formatDate(currentTime)}
                    </p>
                </div>

                <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', minHeight: 20 }}>
                    {location && `Latitude: ${location.latitude.toFixed(5)}°, Longitude: ${location.longitude.toFixed(5)}°`}
                    {loading && !location && !error && "Detecting location..."}
                </div>

                {location ? (
                    <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
                        ></iframe>
                    </div>
                ) : (
                    <div style={{ 
                        height: 200, borderRadius: 12, border: '1px dashed #cbd5e1', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f1f5f9', color: '#64748b', fontSize: 14, textAlign: 'center', padding: 20
                    }}>
                        {error ? (
                            <div style={{ color: '#ef4444' }}>
                                <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
                                {error}
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontSize: 24, marginBottom: 8, animation: 'pulse 2s infinite' }}>📍</div>
                                Locating you on the map...
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={loading || (!location && !error)}
                    style={{
                        background: '#111827', color: 'white', padding: '16px', borderRadius: 12,
                        fontSize: 16, fontWeight: 600, border: 'none', cursor: (loading || (!location && !error)) ? 'not-allowed' : 'pointer',
                        opacity: (loading || (!location && !error)) ? 0.7 : 1, width: '100%',
                        transition: 'all 0.2s', marginTop: 10
                    }}
                >
                    {loading && location ? "Confirming..." : `Confirm Check ${logType === 'IN' ? 'In' : 'Out'}`}
                </button>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default CheckInLocationModal;
