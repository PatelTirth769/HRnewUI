import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, notification, Select, Space } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ESSAttendanceLeaveLedger({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [year, setYear] = useState(dayjs().year());
    const [leaveType, setLeaveType] = useState('All');
    const [leaveTypes, setLeaveTypes] = useState([]);

    const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

    useEffect(() => {
        if (employeeData?.name) {
            fetchLeaveTypes();
            fetchLedger();
        }
    }, [employeeData, year, leaveType]);

    const fetchLeaveTypes = async () => {
        try {
            const res = await API.get('/api/resource/Leave Type?fields=["name"]');
            setLeaveTypes(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLedger = async () => {
        setLoading(true);
        try {
            // Leave Ledger Entry doctype in ERPNext
            let filters = [["employee", "=", employeeData.name]];
            if (leaveType !== 'All') filters.push(["leave_type", "=", leaveType]);
            
            // Filter by transaction date if year is selected? Usually it's better to show all recent or filter by fiscal year.
            
            const res = await API.get(`/api/resource/Leave Ledger Entry?fields=["name","transaction_type","leaves","leave_type","transaction_date","is_expired","is_carry_forward"]&filters=${JSON.stringify(filters)}&order_by=transaction_date desc`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load leave ledger" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { 
            title: 'Date', 
            dataIndex: 'transaction_date', 
            key: 'transaction_date',
            render: (d) => dayjs(d).format('DD MMM YYYY')
        },
        { 
            title: 'Type', 
            dataIndex: 'leave_type', 
            key: 'leave_type',
            render: (t) => <span className="font-medium">{t}</span>
        },
        { 
            title: 'Transaction', 
            dataIndex: 'transaction_type', 
            key: 'transaction_type',
            render: (type) => (
                <Tag color={type === 'Leave Allocation' ? 'green' : 'orange'}>
                    {type}
                </Tag>
            )
        },
        { 
            title: 'Leaves', 
            dataIndex: 'leaves', 
            key: 'leaves',
            render: (l) => (
                <span className={`font-bold ${l > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {l > 0 ? `+${l}` : l}
                </span>
            )
        },
        { 
            title: 'Flags', 
            key: 'flags',
            render: (_, r) => (
                <Space>
                    {r.is_carry_forward === 1 && <Tag color="blue" size="small">CF</Tag>}
                    {r.is_expired === 1 && <Tag color="volcano" size="small">Expired</Tag>}
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Leave Type</div>
                    <Select value={leaveType} onChange={setLeaveType} className="w-full">
                        <Option value="All">All Types</Option>
                        {leaveTypes.map(t => <Option key={t.name} value={t.name}>{t.name}</Option>)}
                    </Select>
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Fiscal Year</div>
                    <Select value={year} onChange={setYear} className="w-full">
                        {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                    </Select>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    dataSource={data} 
                    columns={columns} 
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 15 }}
                    size="middle"
                />
            </div>
        </div>
    );
}
