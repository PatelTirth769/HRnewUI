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
        if (employeeData?.name) fetchData();
    }, [employeeData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fromDate = dates[0].format('YYYY-MM-DD');
            const toDate = dates[1].format('YYYY-MM-DD');
            const res = await API.get(`/api/resource/Attendance`, {
                params: {
                    fields: JSON.stringify(["name","attendance_date","status","working_hours","in_time","out_time","late_entry","early_exit"]),
                    filters: JSON.stringify([
                        ["employee","=",employeeData.name],
                        ["attendance_date",">=",fromDate],
                        ["attendance_date","<=",toDate]
                    ]),
                    order_by: "attendance_date desc",
                    limit_page_length: "None"
                }
            });
            const records = res.data.data || [];
            setData(records);
            const present = records.filter(r => r.status === 'Present').length;
            const halfDay = records.filter(r => r.status === 'Half Day').length;
            const absent = records.filter(r => r.status === 'Absent').length;
            const onLeave = records.filter(r => r.status === 'On Leave').length;
            const totalHrs = records.reduce((s, r) => s + (r.working_hours || 0), 0);
            setSummary({ present, absent, halfDay, onLeave, totalHrs: totalHrs.toFixed(1) });
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch productivity report' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Date', dataIndex: 'attendance_date', key: 'attendance_date', render: (d) => dayjs(d).format('DD MMM YYYY (ddd)') },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time', render: (t) => t ? dayjs(t).format('hh:mm A') : '-' },
        { title: 'Out Time', dataIndex: 'out_time', key: 'out_time', render: (t) => t ? dayjs(t).format('hh:mm A') : '-' },
        { title: 'Working Hrs', dataIndex: 'working_hours', key: 'working_hours', render: (h) => h ? `${Number(h).toFixed(1)}` : '-', align: 'right' },
        { title: 'Late', dataIndex: 'late_entry', key: 'late_entry', render: (v) => v ? <Tag color="red">Yes</Tag> : '-', align: 'center' },
        { title: 'Early Exit', dataIndex: 'early_exit', key: 'early_exit', render: (v) => v ? <Tag color="orange">Yes</Tag> : '-', align: 'center' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (
            <Tag color={s === 'Present' ? 'green' : s === 'Half Day' ? 'orange' : s === 'Absent' ? 'red' : 'blue'}>{s}</Tag>
        )},
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} />
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Search</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{summary.present}</div>
                    <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-700">{summary.halfDay}</div>
                    <div className="text-xs text-orange-600">Half Day</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{summary.absent}</div>
                    <div className="text-xs text-red-600">Absent</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-700">{summary.onLeave}</div>
                    <div className="text-xs text-blue-600">On Leave</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-700">{summary.totalHrs}</div>
                    <div className="text-xs text-purple-600">Total Hours</div>
                </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="name" pagination={{ pageSize: 20 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
