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
        if (employeeData?.name) fetchData();
    }, [employeeData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fromDate = dates[0].format('YYYY-MM-DD');
            const toDate = dates[1].format('YYYY-MM-DD');
            const res = await API.get(`/api/resource/Attendance`, {
                params: {
                    fields: JSON.stringify(["name","attendance_date","status","working_hours","in_time","out_time","shift"]),
                    filters: JSON.stringify([
                        ["employee","=",employeeData.name],
                        ["attendance_date",">=",fromDate],
                        ["attendance_date","<=",toDate],
                        ["status","in",["Present","Half Day"]]
                    ]),
                    order_by: "attendance_date desc",
                    limit_page_length: "None"
                }
            });
            const records = res.data.data || [];
            setData(records);
            const totalPresent = records.length;
            const totalHours = records.reduce((sum, r) => sum + (r.working_hours || 0), 0);
            setSummary({ totalPresent, totalHours: totalHours.toFixed(1) });
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch working hours report' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Date', dataIndex: 'attendance_date', key: 'attendance_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time', render: (t) => t ? dayjs(t).format('hh:mm A') : '-' },
        { title: 'Out Time', dataIndex: 'out_time', key: 'out_time', render: (t) => t ? dayjs(t).format('hh:mm A') : '-' },
        { title: 'Working Hours', dataIndex: 'working_hours', key: 'working_hours', render: (h) => h ? `${Number(h).toFixed(1)} hrs` : '-', align: 'right' },
        { title: 'Shift', dataIndex: 'shift', key: 'shift', render: (s) => s || '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Present' ? 'green' : 'orange'}>{s}</Tag> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} />
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Search</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{summary.totalPresent}</div>
                    <div className="text-xs text-green-600 mt-1">Present Days</div>
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
                <Table columns={columns} dataSource={data} loading={loading} rowKey="name" pagination={{ pageSize: 15 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
