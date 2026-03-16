import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Table, Tag, Space, notification, Badge, Calendar } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSAttendanceMonthly({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [month, setMonth] = useState(dayjs());

    const [holidays, setHolidays] = useState([]);
    const [checkins, setCheckins] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchMonthlyAttendance();
            if (employeeData.holiday_list) {
                fetchHolidays();
            }
        }
    }, [employeeData, month]);

    const fetchHolidays = async () => {
        try {
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`);
            if (res.data.data && res.data.data.holidays) {
                setHolidays(res.data.data.holidays.map(h => h.holiday_date));
            }
        } catch (err) {
            console.error("Failed to load holidays", err);
        }
    };

    const fetchMonthlyAttendance = async () => {
        setLoading(true);
        try {
            const startOfMonth = month.startOf('month').format('YYYY-MM-DD');
            const endOfMonth = month.endOf('month').format('YYYY-MM-DD');
            
            const [attRes, checkinRes] = await Promise.all([
                API.get(`/api/resource/Attendance?fields=["name","attendance_date","status","working_hours"]&filters=[["employee","=","${employeeData.name}"],["attendance_date",">=","${startOfMonth}"],["attendance_date","<=","${endOfMonth}"]]`),
                API.get(`/api/resource/Employee Checkin?fields=["name","time","log_type"]&filters=[["employee","=","${employeeData.name}"],["time",">=","${startOfMonth} 00:00:00"],["time","<=","${endOfMonth} 23:59:59"]]&limit_page_length=None`)
            ]);

            setData(attRes.data.data || []);
            setCheckins(checkinRes.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load monthly attendance" });
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (date) => {
        // Ignore dates that do not belong to the currently selected month
        if (date.month() !== month.month() || date.year() !== month.year()) {
            return null;
        }

        const dateStr = date.format('YYYY-MM-DD');
        const record = data.find(att => att.attendance_date === dateStr);
        const hasCheckins = checkins.some(c => c.time.startsWith(dateStr));
        const isHoliday = holidays.includes(dateStr);
        const isSunday = date.day() === 0;

        // Priority 1: Checkins Always Mean Present
        if (hasCheckins) {
            return { status: 'Present', color: 'success', badge: 'success' };
        }

        // Priority 2: Formal Attendance Records
        if (record) {
            if (record.status === 'Present') {
                // Handle false positive "Present" when there are NO checkins
                if (isSunday) return { status: 'Weekly Off', color: 'default', badge: 'default' };
                if (isHoliday) return { status: 'Holiday', color: 'default', badge: 'default' };
                return { status: 'Absent', color: 'error', badge: 'error' };
            }
            if (record.status === 'Absent') return { status: 'Absent', color: 'error', badge: 'error' };
            if (record.status === 'Half Day') return { status: 'Half Day', color: 'warning', badge: 'warning' };
            if (record.status === 'On Leave') return { status: 'On Leave', color: 'processing', badge: 'processing' };
        }

        // Priority 3: Non-Working Days
        if (isHoliday) return { status: 'Holiday', color: 'default', badge: 'default' };
        if (isSunday) return { status: 'Weekly Off', color: 'default', badge: 'default' };

        // Priority 4: Past working days without any records are Absent
        if (date.isBefore(dayjs(), 'day') || date.isSame(dayjs(), 'day')) {
            return { status: 'Absent', color: 'error', badge: 'error' };
        }

        return null;
    };

    const dateCellRender = (value) => {
        const info = getStatus(value);
        if (!info) return null;

        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Badge status={info.badge} text={info.status} className="text-[10px]" />
            </div>
        );
    };

    const stats = (() => {
        const days = Array.from({ length: month.daysInMonth() }, (_, i) => month.date(i + 1));
        const res = { present: 0, absent: 0, halfDay: 0, onLeave: 0 };
        
        days.forEach(d => {
            const info = getStatus(d);
            if (!info) return;
            if (info.status === 'Present') res.present++;
            else if (info.status === 'Absent') res.absent++;
            else if (info.status === 'Half Day') res.halfDay++;
            else if (info.status === 'On Leave') res.onLeave++;
        });
        
        return res;
    })();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card size="small" className="bg-green-50">
                    <div className="text-xs text-green-600 font-bold uppercase mb-1">Present</div>
                    <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                </Card>
                <Card size="small" className="bg-red-50">
                    <div className="text-xs text-red-600 font-bold uppercase mb-1">Absent</div>
                    <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                </Card>
                <Card size="small" className="bg-orange-50">
                    <div className="text-xs text-orange-600 font-bold uppercase mb-1">Half Day</div>
                    <div className="text-2xl font-bold text-orange-700">{stats.halfDay}</div>
                </Card>
                <Card size="small" className="bg-blue-50">
                    <div className="text-xs text-blue-600 font-bold uppercase mb-1">On Leave</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.onLeave}</div>
                </Card>
            </div>

            <div className="bg-white p-4 rounded-lg border">
                <Calendar 
                    value={month} 
                    onSelect={setMonth}
                    headerRender={({ value, onChange }) => {
                        return (
                            <div className="p-2 flex justify-between items-center bg-gray-50 rounded mb-4">
                                <h3 className="m-0 font-bold text-gray-700 uppercase tracking-widest italic">{value.format('MMMM YYYY')}</h3>
                                <div className="flex gap-2">
                                    <DatePicker.MonthPicker 
                                        value={value} 
                                        onChange={(v) => onChange(v || dayjs())} 
                                        allowClear={false}
                                        size="small"
                                    />
                                </div>
                            </div>
                        );
                    }}
                    dateCellRender={dateCellRender} 
                />
            </div>
        </div>
    );
}
