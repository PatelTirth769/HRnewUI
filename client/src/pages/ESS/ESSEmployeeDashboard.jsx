import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import API from '../../services/api';
import ESSCheckInWidget from './ESSCheckInWidget';

export default function ESSEmployeeDashboard({ employeeData }) {
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, halfDay: 0, onLeave: 0, totalHours: 0 });
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [upcomingHolidays, setUpcomingHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeData?.name) loadDashboardData();
    }, [employeeData]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchAttendanceStats(), fetchLeaveBalances(), fetchRecentLeaves(), fetchUpcomingHolidays()]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchAttendanceStats = async () => {
        try {
            const fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
            const toDate = dayjs().format('YYYY-MM-DD');

            // 1. Fetch formal Attendance records and raw Checkins in parallel
            const [attRes, checkinRes] = await Promise.all([
                API.get('/api/resource/Attendance', {
                    params: {
                        fields: '["status","working_hours","attendance_date"]',
                        filters: JSON.stringify([["employee", "=", employeeData.name], ["attendance_date", ">=", fromDate], ["attendance_date", "<=", toDate]]),
                        limit_page_length: 100
                    }
                }),
                API.get('/api/resource/Employee Checkin', {
                    params: {
                        fields: '["time"]',
                        filters: JSON.stringify([["employee", "=", employeeData.name], ["time", ">=", `${fromDate} 00:00:00`], ["time", "<=", `${toDate} 23:59:59`]]),
                        limit_page_length: 1000,
                        order_by: 'time asc'
                    }
                })
            ]);

            const records = attRes.data.data || [];
            const checkins = checkinRes.data.data || [];

            // 2. Process checkins to find daily durations
            const dailyPunches = {};
            checkins.forEach(c => {
                const date = c.time.split(' ')[0];
                if (!dailyPunches[date]) dailyPunches[date] = { first: c.time, last: c.time };
                else dailyPunches[date].last = c.time;
            });

            let calculatedTotalHours = 0;
            Object.values(dailyPunches).forEach(p => {
                const diff = dayjs(p.last).diff(dayjs(p.first), 'hour', true);
                calculatedTotalHours += diff;
            });

            // 3. Determine counts from Attendance records if they exist
            if (records.length > 0) {
                let present = 0, absent = 0, halfDay = 0, onLeave = 0, formalTotalHours = 0;
                records.forEach(r => {
                    if (r.status === 'Present') present++;
                    else if (r.status === 'Absent') absent++;
                    else if (r.status === 'Half Day') halfDay++;
                    else if (r.status === 'On Leave') onLeave++;
                    formalTotalHours += (parseFloat(r.working_hours) || 0);
                });

                // Use calculated hours if formal ones are missing
                setAttendanceStats({
                    present, absent, halfDay, onLeave,
                    totalHours: (formalTotalHours > 0 ? formalTotalHours : calculatedTotalHours).toFixed(1)
                });
            } else if (checkins.length > 0) {
                // Fallback: If NO formal attendance records, use checkin days as "Present"
                setAttendanceStats({
                    present: Object.keys(dailyPunches).length,
                    absent: 0,
                    halfDay: 0,
                    onLeave: 0,
                    totalHours: calculatedTotalHours.toFixed(1)
                });
            }

        } catch (err) {
            console.error("Attendance stats error:", err);
        }
    };

    const fetchLeaveBalances = async () => {
        try {
            // Try Leave Allocation first
            const res = await API.get('/api/resource/Leave Allocation', {
                params: {
                    fields: '["leave_type","total_leaves_allocated"]',
                    filters: JSON.stringify([["employee","=",employeeData.name],["to_date",">=",dayjs().format('YYYY-MM-DD')]]),
                    limit_page_length: 20
                }
            });
            const res2 = await API.get('/api/resource/Leave Application', {
                params: {
                    fields: '["leave_type","total_leave_days"]',
                    filters: JSON.stringify([["employee","=",employeeData.name],["status","=","Approved"],["from_date",">=",dayjs().startOf('year').format('YYYY-MM-DD')]]),
                    limit_page_length: 100
                }
            });
            const usedMap = {};
            (res2.data.data||[]).forEach(a => { usedMap[a.leave_type] = (usedMap[a.leave_type]||0) + (a.total_leave_days||0); });
            setLeaveBalances((res.data.data||[]).map(a => ({
                leave_type: a.leave_type, allocated: a.total_leaves_allocated||0,
                used: usedMap[a.leave_type]||0, balance: (a.total_leaves_allocated||0)-(usedMap[a.leave_type]||0)
            })));
        } catch(err) {
            // Fallback: if no permission for Leave Allocation, try to get leave data from Leave Application only
            console.warn("Leave Allocation not accessible, using Leave Application data only", err);
            try {
                const res2 = await API.get('/api/resource/Leave Application', {
                    params: {
                        fields: '["leave_type","total_leave_days","status"]',
                        filters: JSON.stringify([["employee","=",employeeData.name],["from_date",">=",dayjs().startOf('year').format('YYYY-MM-DD')]]),
                        limit_page_length: 100
                    }
                });
                const typeMap = {};
                (res2.data.data||[]).forEach(a => {
                    if (!typeMap[a.leave_type]) typeMap[a.leave_type] = { used: 0 };
                    if (a.status === 'Approved') typeMap[a.leave_type].used += (a.total_leave_days||0);
                });
                setLeaveBalances(Object.entries(typeMap).map(([type, info]) => ({
                    leave_type: type, allocated: '—', used: info.used, balance: '—'
                })));
            } catch(err2) { console.error(err2); }
        }
    };

    const fetchRecentLeaves = async () => {
        try {
            const res = await API.get('/api/resource/Leave Application', {
                params: {
                    fields: '["name","leave_type","from_date","to_date","total_leave_days","status"]',
                    filters: JSON.stringify([["employee","=",employeeData.name]]),
                    limit_page_length: 5, order_by: 'creation desc'
                }
            });
            setRecentLeaves(res.data.data||[]);
        } catch(err) { console.error(err); }
    };

    const fetchUpcomingHolidays = async () => {
        try {
            if (!employeeData.holiday_list) return;
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`);
            const data = res.data.data;
            if (data?.holidays) {
                const today = dayjs().format('YYYY-MM-DD');
                setUpcomingHolidays(data.holidays.filter(h => h.holiday_date >= today).sort((a,b) => a.holiday_date.localeCompare(b.holiday_date)).slice(0,5));
            }
        } catch(err) { console.error(err); }
    };

    const statusBadge = (status) => {
        const map = { Approved: '#dcfce7 #166534', Open: '#fef9c3 #854d0e', Rejected: '#fee2e2 #991b1b' };
        const [bg, color] = (map[status] || '#f3f4f6 #374151').split(' ');
        return <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{status}</span>;
    };

    const initials = employeeData?.employee_name ? employeeData.employee_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
    const monthName = dayjs().format('MMMM YYYY');

    return (
        <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .emp-dash-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
                .emp-dash-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
                .emp-dash-card-header { padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:10px; }
                .emp-dash-card-header h3 { margin:0; font-size:15px; font-weight:600; color:#111827; }
                .emp-dash-card-body { padding:20px; }
                .stat-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; display:flex; align-items:center; gap:14px; transition: all .2s; }
                .stat-card:hover { transform:translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
                .stat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
                .stat-value { font-size:26px; font-weight:700; color:#111827; line-height:1; }
                .stat-label { font-size:11px; color:#6b7280; margin-top:2px; font-weight:500; letter-spacing:.3px; text-transform:uppercase; }
                .leave-row { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f9fafb; }
                .leave-row:last-child { border-bottom:none; }
                .holiday-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#fafafa; border-radius:8px; margin-bottom:8px; }
                .holiday-row:last-child { margin-bottom:0; }
                .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
                .detail-item label { font-size:11px; color:#9ca3af; font-weight:500; text-transform:uppercase; letter-spacing:.4px; display:block; margin-bottom:2px; }
                .detail-item span { font-size:13px; color:#1f2937; font-weight:500; }
                .recent-leave-item { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#fafafa; border-radius:10px; margin-bottom:8px; }
                .recent-leave-item:last-child { margin-bottom:0; }
            `}} />

            {/* ── Welcome Banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                borderRadius: 16, padding: '28px 32px', color: '#fff', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20,
                boxShadow: '0 8px 32px rgba(249,115,22,0.25)'
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700, flexShrink: 0
                }}>{initials}</div>
                <div style={{ flex:1 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                        Welcome back, {employeeData?.employee_name || 'Employee'}
                    </div>
                    <div style={{ fontSize: 13, opacity: .85 }}>
                        {employeeData?.designation || ''}{employeeData?.department ? ` · ${employeeData.department}` : ''}{employeeData?.company ? ` · ${employeeData.company}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, opacity: .8, flexWrap: 'wrap' }}>
                        {employeeData?.company_email && <span>✉️ {employeeData.company_email}</span>}
                        {employeeData?.branch && <span>📍 {employeeData.branch}</span>}
                        {employeeData?.date_of_joining && <span>📅 Joined {dayjs(employeeData.date_of_joining).format('DD MMM YYYY')}</span>}
                    </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize: 12, opacity: .7, marginBottom: 2 }}>Today</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{dayjs().format('DD MMM')}</div>
                    <div style={{ fontSize: 11, opacity: .7 }}>{dayjs().format('dddd')}</div>
                </div>
            </div>

            {/* ── Attendance Stats ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Attendance · {monthName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                    {[
                        { label: 'Present', value: attendanceStats.present, bg: '#dcfce7', color: '#166534', icon: '✓' },
                        { label: 'Absent', value: attendanceStats.absent, bg: '#fee2e2', color: '#991b1b', icon: '✕' },
                        { label: 'Half Day', value: attendanceStats.halfDay, bg: '#fef3c7', color: '#92400e', icon: '½' },
                        { label: 'Hours Worked', value: attendanceStats.totalHours, bg: '#dbeafe', color: '#1e40af', icon: '⏱' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.bg, color: s.color, fontWeight: 700 }}>{s.icon}</div>
                            <div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                    
                    <ESSCheckInWidget 
                        employeeData={employeeData} 
                        onCheckinSuccess={loadDashboardData} 
                    />
                </div>
            </div>

            {/* ── Main Grid: Leave Balances + My Details ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Leave Balances */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16 }}>🌴</span>
                        <h3>Leave Balances</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        {leaveBalances.length > 0 ? leaveBalances.map((lb, idx) => (
                            <div key={idx} className="leave-row">
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{lb.leave_type}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                        {lb.allocated} allocated · {lb.used} used
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: 18, fontWeight: 700,
                                    color: lb.balance > 0 ? '#16a34a' : lb.balance === 0 ? '#9ca3af' : '#dc2626',
                                    minWidth: 36, textAlign: 'right'
                                }}>{lb.balance}</div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
                                No leave allocations found
                            </div>
                        )}
                    </div>
                </div>

                {/* My Details */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16 }}>👤</span>
                        <h3>My Details</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        <div className="detail-grid">
                            {[
                                { label: 'Employee ID', value: employeeData?.name },
                                { label: 'Full Name', value: employeeData?.employee_name },
                                { label: 'Gender', value: employeeData?.gender },
                                { label: 'Date of Birth', value: employeeData?.date_of_birth ? dayjs(employeeData.date_of_birth).format('DD MMM YYYY') : '—' },
                                { label: 'Department', value: employeeData?.department },
                                { label: 'Designation', value: employeeData?.designation },
                                { label: 'Reports To', value: employeeData?.reports_to || '—' },
                                { label: 'Status', value: employeeData?.status },
                            ].map((item, idx) => (
                                <div key={idx} className="detail-item">
                                    <label>{item.label}</label>
                                    <span>{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Grid: Recent Leaves + Upcoming Holidays ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                {/* Recent Leave Applications */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16 }}>📋</span>
                        <h3>Recent Leave Applications</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        {recentLeaves.length > 0 ? recentLeaves.map((leave, idx) => (
                            <div key={idx} className="recent-leave-item">
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{leave.leave_type}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                        {dayjs(leave.from_date).format('DD MMM')} → {dayjs(leave.to_date).format('DD MMM YY')} · {leave.total_leave_days} day{leave.total_leave_days > 1 ? 's' : ''}
                                    </div>
                                </div>
                                {statusBadge(leave.status)}
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
                                No recent leave applications
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Holidays */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16 }}>🗓️</span>
                        <h3>Upcoming Holidays</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        {upcomingHolidays.length > 0 ? upcomingHolidays.map((h, idx) => (
                            <div key={idx} className="holiday-row">
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{h.description}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{dayjs(h.holiday_date).format('dddd')}</div>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#ea580c' }}>
                                    {dayjs(h.holiday_date).format('DD MMM YYYY')}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
                                No upcoming holidays
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
