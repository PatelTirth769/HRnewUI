import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Table, Tag, Space, notification, Empty } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSAttendanceDaily({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [date, setDate] = useState(dayjs());

    const [holidayList, setHolidayList] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchDailyAttendance();
        }
        if (employeeData?.holiday_list) {
            fetchHolidays();
        } else {
            // Even if no holiday list, we might still want to show Sundays
            checkVirtualStatus();
        }
    }, [employeeData, date, holidayList.length]);

    const checkVirtualStatus = () => {
        const dateStr = date.format('YYYY-MM-DD');
        const isSunday = date.day() === 0;
        const isHoliday = holidayList.includes(dateStr);
        if ((isSunday || isHoliday) && !data) {
            setData({
                status: isSunday ? 'Weekly Off' : 'Holiday',
                attendance_date: dateStr,
                in_time: null,
                out_time: null,
                working_hours: 0,
                shift: 'N/A'
            });
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`);
            if (res.data.data && res.data.data.holidays) {
                setHolidayList(res.data.data.holidays.map(h => h.holiday_date));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDailyAttendance = async () => {
        if (!employeeData?.name) return;
        setLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const res = await API.get(`/api/resource/Attendance?fields=["name","attendance_date","status","in_time","out_time","working_hours","shift","late_entry","early_exit"]&filters=[["employee","=","${employeeData.name}"],["attendance_date","=","${dateStr}"]]`);
            
            if (res.data.data && res.data.data.length > 0) {
                let rec = res.data.data[0];
                const isHoliday = holidayList.includes(dateStr);
                const isSunday = date.day() === 0;

                // Handle false positive "Present" on Sundays/Holidays
                if (rec.status === 'Present' && parseFloat(rec.working_hours || 0) === 0 && (isSunday || isHoliday)) {
                    rec.status = isSunday ? 'Weekly Off' : 'Holiday';
                }
                setData(rec);
            } else {
                const isHoliday = holidayList.includes(dateStr);
                const isSunday = date.day() === 0;
                if (isHoliday || isSunday) {
                    setData({
                        status: isSunday ? 'Weekly Off' : 'Holiday',
                        attendance_date: dateStr,
                        in_time: null,
                        out_time: null,
                        working_hours: 0,
                        shift: 'N/A'
                    });
                } else {
                    setData(null);
                }
            }
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load daily attendance" });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'Present') return 'green';
        if (status === 'Absent') return 'red';
        if (status === 'Half Day') return 'orange';
        if (status === 'On Leave') return 'blue';
        if (status === 'Weekly Off' || status === 'Holiday') return 'default';
        return 'orange';
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex gap-4 items-center">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Date:</div>
                <DatePicker 
                    value={date} 
                    onChange={setDate} 
                    allowClear={false} 
                    format="DD MMM YYYY"
                    className="w-48"
                />
            </div>

            {loading ? (
                <div className="bg-white p-12 text-center rounded-lg border text-gray-400">Loading daily status...</div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card size="small" title="Attendance Status" className="shadow-sm">
                        <Tag color={getStatusColor(data.status)} className="text-sm px-3 py-1">
                            {data.status}
                        </Tag>
                        <div className="mt-4 text-xs text-gray-500 italic">Marked for {dayjs(data.attendance_date).format('dddd')}</div>
                    </Card>
                    
                    <Card size="small" title="Punch Timing" className="shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-400">IN:</span>
                            <span className="font-medium">{data.in_time ? dayjs(data.in_time).format('HH:mm') : '--:--'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">OUT:</span>
                            <span className="font-medium">{data.out_time ? dayjs(data.out_time).format('HH:mm') : '--:--'}</span>
                        </div>
                    </Card>

                    <Card size="small" title="Work Details" className="shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-400">Hours:</span>
                            <span className="font-bold text-blue-600">{data.working_hours ? parseFloat(data.working_hours).toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Shift:</span>
                            <span className="text-xs font-medium text-gray-600">{data.shift || 'N/A'}</span>
                        </div>
                    </Card>

                    <Card size="small" title="Punctuality" className="shadow-sm">
                        <Space direction="vertical" size={2}>
                            {data.late_entry === 1 ? <Tag color="orange">Late Entry</Tag> : <Tag color="gray" className="opacity-50">On Time</Tag>}
                            {data.early_exit === 1 ? <Tag color="magenta">Early Exit</Tag> : <Tag color="gray" className="opacity-50">Full Duration</Tag>}
                        </Space>
                    </Card>
                </div>
            ) : (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-dashed text-gray-400 italic">
                    <Empty description={`No attendance record found for ${date.format('DD MMM YYYY')}`} />
                </div>
            )}
        </div>
    );
}
