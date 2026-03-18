import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, notification, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSLateComeReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

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
                    fields: JSON.stringify(["name","attendance_date","status","in_time","late_entry","shift"]),
                    filters: JSON.stringify([
                        ["employee","=",employeeData.name],
                        ["attendance_date",">=",fromDate],
                        ["attendance_date","<=",toDate],
                        ["late_entry","=",1]
                    ]),
                    order_by: "attendance_date desc",
                    limit_page_length: "None"
                }
            });
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch late come report' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Date', dataIndex: 'attendance_date', key: 'attendance_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time', render: (t) => t ? dayjs(t).format('hh:mm A') : '-' },
        { title: 'Shift', dataIndex: 'shift', key: 'shift', render: (s) => s || '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Present' ? 'green' : s === 'Half Day' ? 'orange' : 'red'}>{s}</Tag> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} />
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Search</Button>
                <span className="text-sm text-gray-500">{data.length} late entries found</span>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="name" pagination={{ pageSize: 15 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
