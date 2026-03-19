import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, notification, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSWorkingHrReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [summary, setSummary] = useState({ totalPresent: 0, totalHours: 0 });

    useEffect(() => {
        if (employeeData?.name) fetchWorkingHours();
    }, [employeeData]);

    const fetchWorkingHours = async () => {
        setLoading(true);
        try {
            const fromDateStr = dates[0].format('YYYY-MM-DD');
            const toDateStr = dates[1].format('YYYY-MM-DD');
            const fromTime = `${fromDateStr} 00:00:00`;
            const toTime = `${toDateStr} 23:59:59`;

            // 1. Fetch raw Checkins
            const res = await API.get('/api/resource/Employee Checkin', {
                params: {
                    fields: '["time","log_type"]',
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name],
                        ["time", ">=", fromTime],
                        ["time", "<=", toTime]
                    ]),
                    limit_page_length: 1000,
                    order_by: 'time asc'
                }
            });

            const checkins = res.data.data || [];

            // 2. Group by date and find FIRST and LAST checkin
            const dailyPunches = {};
            checkins.forEach(c => {
                if (!c.time) return;
                const date = c.time.split(' ')[0];
                if (!dailyPunches[date]) {
                    dailyPunches[date] = { first: c.time, last: c.time };
                } else {
                    dailyPunches[date].last = c.time;
                }
            });

            // 3. Calculate Hours per day
            const records = [];
            let totalHrs = 0;

            Object.entries(dailyPunches).forEach(([dateStr, punches]) => {
                const start = dayjs(punches.first);
                const end = dayjs(punches.last);
                const diffHours = end.diff(start, 'hour', true); // Floating point hours

                totalHrs += diffHours;
                
                records.push({
                    id: dateStr,
                    date: dateStr,
                    in_time: start.format('hh:mm A'),
                    out_time: end.format('hh:mm A'),
                    working_hours: diffHours.toFixed(2),
                    status: diffHours > 4 ? 'Present' : 'Half Day' // Simple heuristic
                });
            });

            // Sort by date descending
            records.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setData(records);
            setSummary({
                totalPresent: records.length,
                totalHours: totalHrs.toFixed(1)
            });

        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to calculate working hours' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time', render: (t) => <span className="text-gray-500">{t}</span> },
        { title: 'Out Time', dataIndex: 'out_time', key: 'out_time', render: (t) => <span className="text-gray-500">{t}</span> },
        { title: 'Working Hours', dataIndex: 'working_hours', key: 'working_hours', render: (h) => <span className="font-bold text-blue-600">{h} hrs</span>, align: 'right' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Present' ? 'green' : 'orange'}>{s}</Tag> },
    ];

    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                <p className="text-sm text-blue-800 m-0">
                    <strong>Note:</strong> Working hours are calculated based on the span between your <strong>First</strong> and <strong>Last</strong> check-in of each day.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} className="w-64" />
                <Button type="primary" onClick={fetchWorkingHours} className="bg-orange-500 border-none hover:bg-orange-600">
                    Search
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{summary.totalPresent}</div>
                    <div className="text-xs text-green-600 mt-1">Days with Punches</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.totalHours}</div>
                    <div className="text-xs text-blue-600 mt-1">Total Hours</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-700">{summary.totalPresent > 0 ? (summary.totalHours / summary.totalPresent).toFixed(1) : '0'}</div>
                    <div className="text-xs text-orange-600 mt-1">Avg Hours/Day</div>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 15 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}

