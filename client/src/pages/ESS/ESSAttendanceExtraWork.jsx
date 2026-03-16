import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, notification, Button, Space, DatePicker, Input } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSAttendanceExtraWork({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchExtraWork();
        }
    }, [employeeData, dates]);

    const fetchExtraWork = async () => {
        setLoading(true);
        try {
            const fromDate = dates[0].format('YYYY-MM-DD');
            const toDate = dates[1].format('YYYY-MM-DD');
            
            // Often stored in a custom doctype like "Comp Off Request" or "Extra Work Request"
            // Let's assume a generic Attendance request filter for now or check for "Comp Off"
            const res = await API.get(`/api/resource/Comp Off Request?fields=["name","work_date","reason","status","halfdays","company"]&filters=[["employee","=","${employeeData.name}"],["work_date",">=","${fromDate}"],["work_date","<=","${toDate}"]]&order_by=work_date desc`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            // Fallback to empty instead of error if doctype doesn't exist
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Work Date', dataIndex: 'work_date', key: 'work_date', render: d => dayjs(d).format('DD MMM YYYY') },
        { title: 'Reason', dataIndex: 'reason', key: 'reason' },
        { title: 'Type', dataIndex: 'halfdays', key: 'halfdays', render: h => h ? 'Half Day' : 'Full Day' },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: s => (
                <Tag color={s === 'Approved' ? 'green' : s === 'Pending' ? 'orange' : 'gray'}>
                    {s}
                </Tag>
            )
        },
        { title: 'ID', dataIndex: 'name', key: 'name', className: 'text-xs text-gray-400' }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Period:</span>
                    <RangePicker value={dates} onChange={setDates} size="small" />
                </div>
                <Button type="primary" size="small" className="bg-orange-500 border-none">New Comp Off Request</Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[300px]">
                <Table 
                    dataSource={data} 
                    columns={columns} 
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    locale={{ emptyText: 'No extra work or comp-off requests found.' }}
                />
            </div>
        </div>
    );
}
