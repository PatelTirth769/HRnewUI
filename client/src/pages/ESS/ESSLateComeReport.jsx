import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, notification, Tag, TimePicker } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSLateComeReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);
    const [expectedTime, setExpectedTime] = useState(dayjs('09:30', 'HH:mm'));

    useEffect(() => {
        if (employeeData?.name) fetchLateEntries();
    }, [employeeData]);

    const fetchLateEntries = async () => {
        setLoading(true);
        try {
            const fromDateStr = dates[0].format('YYYY-MM-DD');
            const toDateStr = dates[1].format('YYYY-MM-DD');
            const fromTime = `${fromDateStr} 00:00:00`;
            const toTime = `${toDateStr} 23:59:59`;

            // 1. Fetch raw Checkins instead of processed Attendance
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

            // 2. Group by date and find the FIRST checkin of the day
            const dailyFirstCheckins = {};
            checkins.forEach(c => {
                if (!c.time) return;
                const date = c.time.split(' ')[0];
                if (!dailyFirstCheckins[date]) {
                    dailyFirstCheckins[date] = c.time;
                }
            });

            // 3. Compare against Expected In-Time
            const targetHour = expectedTime.hour();
            const targetMin = expectedTime.minute();
            const lateRecords = [];

            Object.entries(dailyFirstCheckins).forEach(([dateStr, inTimeStr]) => {
                const inTime = dayjs(inTimeStr);
                const expectedObj = dayjs(dateStr).hour(targetHour).minute(targetMin).second(0);

                if (inTime.isAfter(expectedObj)) {
                    // Employee is late
                    const diffMins = inTime.diff(expectedObj, 'minute');
                    if (diffMins > 0) {
                        const hrs = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        const lateStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                        lateRecords.push({
                            id: dateStr,
                            date: dateStr,
                            in_time: inTime.format('hh:mm A'),
                            expected_time: expectedObj.format('hh:mm A'),
                            late_duration: lateStr,
                            diff_minutes: diffMins
                        });
                    }
                }
            });

            // Sort by date descending
            lateRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
            setData(lateRecords);

        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to calculate late entries' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Expected In-Time', dataIndex: 'expected_time', key: 'expected_time', render: (t) => <span className="text-gray-500">{t}</span> },
        { title: 'Actual In-Time', dataIndex: 'in_time', key: 'in_time', render: (t) => <span className="font-semibold text-gray-800">{t}</span> },
        { title: 'Late By', dataIndex: 'late_duration', key: 'late_duration', render: (l) => <Tag color="red">{l}</Tag> },
    ];

    return (
        <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 mb-6">
                <p className="text-sm text-orange-800 m-0">
                    <strong>Note:</strong> Since actual Attendance records lack In-Time data, this report dynamically calculates lateness based on raw <strong>Employee Checkins</strong>.
                </p>
            </div>
            
            <div className="flex flex-wrap items-end gap-5 mb-4 p-4 bg-white border rounded-lg">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Date Range</label>
                    <RangePicker value={dates} onChange={(d) => d && setDates(d)} className="w-64" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Expected Shift Start</label>
                    <TimePicker 
                        value={expectedTime} 
                        onChange={(t) => t && setExpectedTime(t)} 
                        format="HH:mm" 
                        allowClear={false}
                        className="w-32"
                    />
                </div>
                <Button type="primary" onClick={fetchLateEntries} className="bg-orange-500 border-none hover:bg-orange-600 h-8 px-6">
                    Generate Report
                </Button>
            </div>
            
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-700 font-semibold m-0">Late Entries</h3>
                <span className="text-sm border bg-red-50 text-red-600 px-3 py-1 rounded-full">{data.length} late days found</span>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={{ pageSize: 15 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );

}
