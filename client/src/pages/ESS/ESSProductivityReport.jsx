import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, notification, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSProductivityReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, onLeave: 0, totalHrs: 0 });

    useEffect(() => {
        if (employeeData?.name) fetchProductivityData();
    }, [employeeData]);

    const fetchProductivityData = async () => {
        setLoading(true);
        try {
            const fromDateStr = dates[0].format('YYYY-MM-DD');
            const toDateStr = dates[1].format('YYYY-MM-DD');

            // 1. Fetch Attendance (Base for Status)
            const attRes = await API.get('/api/resource/Attendance', {
                params: {
                    fields: '["attendance_date","status"]',
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name],
                        ["attendance_date", ">=", fromDateStr],
                        ["attendance_date", "<=", toDateStr]
                    ]),
                    limit_page_length: "None"
                }
            });

            // 2. Fetch raw Checkins (Source of Truth for Time)
            const checkRes = await API.get('/api/resource/Employee Checkin', {
                params: {
                    fields: '["time"]',
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name],
                        ["time", ">=", `${fromDateStr} 00:00:00`],
                        ["time", "<=", `${toDateStr} 23:59:59`]
                    ]),
                    limit_page_length: 1000,
                    order_by: 'time asc'
                }
            });

            const attendance = attRes.data.data || [];
            const checkins = checkRes.data.data || [];

            // 3. Process Checkins into daily records
            const dailyTimes = {};
            checkins.forEach(c => {
                const date = c.time.split(' ')[0];
                if (!dailyTimes[date]) {
                    dailyTimes[date] = { first: c.time, last: c.time };
                } else {
                    dailyTimes[date].last = c.time;
                }
            });

            // 4. Merge Attendance and Times
            const mergedMap = {};
            
            // Start with attendance records
            attendance.forEach(a => {
                mergedMap[a.attendance_date] = {
                    date: a.attendance_date,
                    status: a.status,
                    in_time: '-',
                    out_time: '-',
                    working_hours: 0,
                    late_entry: 0,
                    early_exit: 0
                };
            });

            // Overlay with actual times (and add missing days if they have checkins)
            Object.entries(dailyTimes).forEach(([date, times]) => {
                const start = dayjs(times.first);
                const end = dayjs(times.last);
                const diffHrs = end.diff(start, 'hour', true);

                if (!mergedMap[date]) {
                    mergedMap[date] = { date, status: 'Present', late_entry: 0, early_exit: 0 };
                }
                
                mergedMap[date].in_time = start.format('hh:mm A');
                mergedMap[date].out_time = end.format('hh:mm A');
                mergedMap[date].working_hours = diffHrs;
            });

            const finalRecords = Object.values(mergedMap).sort((a, b) => new Date(b.date) - new Date(a.date));
            setData(finalRecords);

            // 5. Update Summary
            const stats = { present: 0, absent: 0, halfDay: 0, onLeave: 0, totalHrs: 0 };
            finalRecords.forEach(r => {
                if (r.status === 'Present') stats.present++;
                else if (r.status === 'Half Day') stats.halfDay++;
                else if (r.status === 'Absent') stats.absent++;
                else if (r.status === 'On Leave') stats.onLeave++;
                stats.totalHrs += (r.working_hours || 0);
            });
            setSummary({ ...stats, totalHrs: stats.totalHrs.toFixed(1) });

        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to calculate productivity data' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('DD MMM YYYY (ddd)') },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time' },
        { title: 'Out Time', dataIndex: 'out_time', key: 'out_time' },
        { title: 'Working Hrs', dataIndex: 'working_hours', key: 'working_hours', render: (h) => h > 0 ? h.toFixed(2) : '-', align: 'right' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (
            <Tag color={s === 'Present' ? 'green' : s === 'Half Day' ? 'orange' : s === 'Absent' ? 'red' : 'blue'}>{s}</Tag>
        )},
    ];

    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 mb-6">
                <p className="text-sm text-purple-800 m-0">
                    <strong>Report Logic:</strong> Status is pulled from <i>Attendance</i> records, while actual times and hours are calculated from raw <i>Employee Checkins</i>.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} className="w-64" />
                <Button type="primary" onClick={fetchProductivityData} className="bg-orange-500 border-none hover:bg-orange-600">
                    Search
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{summary.present}</div>
                    <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">Present</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-700">{summary.halfDay}</div>
                    <div className="text-xs text-orange-600 uppercase tracking-wider font-semibold">Half Day</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{summary.absent}</div>
                    <div className="text-xs text-red-600 uppercase tracking-wider font-semibold">Absent</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-700">{summary.onLeave}</div>
                    <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">On Leave</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-700">{summary.totalHrs}</div>
                    <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold">Total Hours</div>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="date" pagination={{ pageSize: 20 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}

