import React, { useState, useEffect } from 'react';
import { Card, Select, Space, notification, Table, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ESSAttendanceYearly({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [year, setYear] = useState(dayjs().year());

    const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchYearlyAttendance();
        }
        if (employeeData?.holiday_list) {
            fetchHolidays();
        }
    }, [employeeData, year, holidays.length]);

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

    const fetchYearlyAttendance = async () => {
        setLoading(true);
        try {
            const startOfYear = `${year}-01-01`;
            const endOfYear = `${year}-12-31`;
            
            const [attRes, checkinRes] = await Promise.all([
                API.get(`/api/resource/Attendance?fields=["name","attendance_date","status","working_hours"]&filters=[["employee","=","${employeeData.name}"],["attendance_date",">=","${startOfYear}"],["attendance_date","<=","${endOfYear}"]]&limit_page_length=None`),
                API.get(`/api/resource/Employee Checkin?fields=["name","time","log_type"]&filters=[["employee","=","${employeeData.name}"],["time",">=","${startOfYear} 00:00:00"],["time","<=","${endOfYear} 23:59:59"]]&limit_page_length=None`)
            ]);
            
            const checkinDates = new Set(checkinRes.data.data.map(c => c.time.split(' ')[0]));

            // Process month-wise data
            const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
                month: dayjs().month(i).format('MMM'),
                present: 0,
                absent: 0,
                leave: 0,
                processedDates: new Set()
            }));

            // Priority 1: Checkins Always Mean Present
            checkinDates.forEach(dStr => {
                const dObj = dayjs(dStr);
                if (dObj.year() === year) {
                    const mIndex = dObj.month();
                    monthlyStats[mIndex].present++;
                    monthlyStats[mIndex].processedDates.add(dStr);
                }
            });

            // Priority 2: Formal Attendance Records for other statuses
            attRes.data.data.forEach(att => {
                if (monthlyStats[dayjs(att.attendance_date).month()].processedDates.has(att.attendance_date)) return;

                const dateObj = dayjs(att.attendance_date);
                const mIndex = dateObj.month();
                const isHoliday = holidays.includes(att.attendance_date);
                const isSunday = dateObj.day() === 0;

                // If formal record says Present, but we are here, there are no checkins. Override it.
                let effectiveStatus = att.status;
                if (att.status === 'Present') {
                    if (isSunday) effectiveStatus = 'Weekly Off';
                    else if (isHoliday) effectiveStatus = 'Holiday';
                    else effectiveStatus = 'Absent';
                }

                if (effectiveStatus === 'Present') {
                    monthlyStats[mIndex].present++;
                } else if (effectiveStatus === 'Absent') {
                    monthlyStats[mIndex].absent++;
                } else if (effectiveStatus === 'On Leave' || effectiveStatus === 'Half Day') {
                    monthlyStats[mIndex].leave++;
                }
                
                monthlyStats[mIndex].processedDates.add(att.attendance_date);
            });

            setData(monthlyStats);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load yearly analysis" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Month', dataIndex: 'month', key: 'month', className: 'font-bold' },
        { title: 'Present Days', dataIndex: 'present', key: 'present', render: (val) => <Tag color="green">{val}</Tag> },
        { title: 'Absent Days', dataIndex: 'absent', key: 'absent', render: (val) => <Tag color="red">{val}</Tag> },
        { title: 'Leave/Half Days', dataIndex: 'leave', key: 'leave', render: (val) => <Tag color="orange">{val}</Tag> },
        { 
            title: 'Attendance %', 
            key: 'percentage',
            render: (_, r) => {
                const total = r.present + r.absent + r.leave;
                if (total === 0) return '0%';
                return `${Math.round((r.present / total) * 100)}%`;
            }
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-500 uppercase italic tracking-widest">Attendance Analysis for {year}</div>
                <Select value={year} onChange={setYear} className="w-32">
                    {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card size="small" title="Attendance Trends" className="border shadow-none overflow-hidden">
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="leave" name="Leave/Half" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card size="small" title="Monthly Summary Table" className="border shadow-none">
                    <Table 
                        dataSource={data} 
                        columns={columns} 
                        pagination={false} 
                        size="small" 
                        loading={loading}
                        rowKey="month"
                        className="ess-mini-table"
                    />
                </Card>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-mini-table .ant-table-thead > tr > th { font-size: 10px; text-transform: uppercase; color: #9ca3af; }
                .ess-mini-table .ant-table-cell { font-size: 12px; }
            `}} />
        </div>
    );
}
