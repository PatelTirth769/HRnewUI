import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import dayjs from 'dayjs';
import CheckInLocationModal from './CheckInLocationModal';

const ESSCheckInWidget = ({ employeeData, onCheckinSuccess }) => {
    const [lastCheckin, setLastCheckin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (employeeData?.name) {
            fetchLastCheckin();
        }
    }, [employeeData]);

    const fetchLastCheckin = async () => {
        setLoading(true);
        try {
            const today = dayjs().format('YYYY-MM-DD');
            const res = await API.get('/api/resource/Employee Checkin', {
                params: {
                    fields: '["time","log_type"]',
                    filters: JSON.stringify([["employee", "=", employeeData.name], ["time", ">=", `${today} 00:00:00`]]),
                    limit_page_length: 1,
                    order_by: 'time desc'
                }
            });
            if (res.data && res.data.data && res.data.data.length > 0) {
                setLastCheckin(res.data.data[0]);
            } else {
                setLastCheckin(null);
            }
        } catch (err) {
            console.error("Failed to fetch last checkin:", err);
        } finally {
            setLoading(false);
        }
    };

    const getNextLogType = () => {
        if (!lastCheckin) return 'IN';
        return lastCheckin.log_type === 'IN' ? 'OUT' : 'IN';
    };

    const handleSuccess = () => {
        setModalOpen(false);
        fetchLastCheckin();
        if (onCheckinSuccess) onCheckinSuccess();
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return dayjs(timeStr).format('hh:mm A').toLowerCase();
    };

    const firstName = employeeData?.employee_name ? employeeData.employee_name.split(' ')[0] : 'Employee';
    const nextAction = getNextLogType();

    return (
        <>
            <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all .2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>Hey, {firstName}</h3>
                    <span style={{ fontSize: 18 }}>👋</span>
                </div>
                
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, minHeight: 18 }}>
                    {loading ? (
                        'Loading details...'
                    ) : lastCheckin ? (
                        <span>Last check-{lastCheckin.log_type.toLowerCase()} was at {formatTime(lastCheckin.time)}</span>
                    ) : (
                        'No check-ins today yet'
                    )}
                </div>

                <button
                    onClick={() => setModalOpen(true)}
                    disabled={loading}
                    style={{
                        width: '100%', background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0',
                        padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s', opacity: loading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => { if(!loading) e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseOut={(e) => { if(!loading) e.currentTarget.style.background = '#f1f5f9'; }}
                >
                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {nextAction === 'IN' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        )}
                    </svg>
                    Check {nextAction === 'IN' ? 'In' : 'Out'}
                </button>
            </div>

            <CheckInLocationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                employeeId={employeeData?.name}
                logType={nextAction}
                onSuccess={handleSuccess}
            />
        </>
    );
};

export default ESSCheckInWidget;
