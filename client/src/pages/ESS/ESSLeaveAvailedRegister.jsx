import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select, Button, notification, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ESSLeaveAvailedRegister({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [dates, setDates] = useState([dayjs().startOf('year'), dayjs()]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchLeaveTypes();
            fetchData();
        }
    }, [employeeData]);

    const fetchLeaveTypes = async () => {
        try {
            const res = await API.get(`/api/resource/Leave Type?fields=["name"]&limit_page_length=None`);
            setLeaveTypes((res.data.data || []).map(i => i.name));
        } catch (err) { console.warn(err); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const fromDate = dates[0].format('YYYY-MM-DD');
            const toDate = dates[1].format('YYYY-MM-DD');
            const filters = [
                ["employee","=",employeeData.name],
                ["from_date",">=",fromDate],
                ["to_date","<=",toDate],
                ["docstatus","!=","2"]
            ];
            if (selectedType) filters.push(["leave_type","=",selectedType]);
            
            const res = await API.get(`/api/resource/Leave Application`, {
                params: {
                    fields: JSON.stringify(["name","leave_type","from_date","to_date","total_leave_days","status","posting_date"]),
                    filters: JSON.stringify(filters),
                    order_by: "from_date desc",
                    limit_page_length: "None"
                }
            });
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch leave availed register' });
        } finally {
            setLoading(false);
        }
    };

    const totalDays = data.reduce((s, r) => s + (r.total_leave_days || 0), 0);

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Application ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Leave Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'From', dataIndex: 'from_date', key: 'from_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'To', dataIndex: 'to_date', key: 'to_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Days', dataIndex: 'total_leave_days', key: 'total_leave_days', align: 'right' },
        { title: 'Applied On', dataIndex: 'posting_date', key: 'posting_date', render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (
            <Tag color={s === 'Approved' ? 'green' : s === 'Open' ? 'blue' : s === 'Rejected' ? 'red' : 'orange'}>{s}</Tag>
        )},
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <RangePicker value={dates} onChange={(d) => d && setDates(d)} />
                <Select value={selectedType} onChange={setSelectedType} allowClear placeholder="All Leave Types" style={{ minWidth: 200 }}>
                    {leaveTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Search</Button>
                <span className="text-sm text-gray-500">Total: <strong>{totalDays}</strong> days availed ({data.length} applications)</span>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="name" pagination={{ pageSize: 15 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
