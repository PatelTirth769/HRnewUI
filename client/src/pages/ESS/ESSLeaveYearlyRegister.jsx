import React, { useState, useEffect } from 'react';
import { Table, Select, Button, notification, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ESSLeaveYearlyRegister({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [year, setYear] = useState(dayjs().year());

    useEffect(() => {
        if (employeeData?.name) fetchData();
    }, [employeeData, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fromDate = `${year}-01-01`;
            const toDate = `${year}-12-31`;
            let allocations = [];
            let applications = [];

            // 1. Fetch Leave Applications (Historical)
            try {
                const appRes = await API.get(`/api/resource/Leave Application`, {
                    params: {
                        fields: JSON.stringify(["leave_type", "total_leave_days", "status"]),
                        filters: JSON.stringify([
                            ["employee", "=", employeeData.name],
                            ["from_date", ">=", fromDate],
                            ["to_date", "<=", toDate],
                            ["status", "=", "Approved"]
                        ]),
                        limit_page_length: "None"
                    }
                });
                applications = appRes.data.data || [];
            } catch (err) {
                console.warn("Leave Application fetch failed:", err);
            }

            // 2. Fetch Leave Allocations (Balances)
            try {
                const allocRes = await API.get(`/api/resource/Leave Allocation`, {
                    params: {
                        fields: JSON.stringify(["name", "leave_type", "total_leaves_allocated", "new_leaves_allocated", "unused_leaves", "from_date", "to_date"]),
                        filters: JSON.stringify([
                            ["employee", "=", employeeData.name],
                            ["docstatus", "=", 1],
                            ["from_date", ">=", fromDate],
                            ["to_date", "<=", toDate]
                        ]),
                        limit_page_length: "None"
                    }
                });
                allocations = allocRes.data.data || [];
            } catch (err) {
                console.warn("Leave Allocation access denied or failed:", err);
            }

            // Group availed by leave type
            const availedByType = {};
            applications.forEach(app => {
                availedByType[app.leave_type] = (availedByType[app.leave_type] || 0) + (app.total_leave_days || 0);
            });

            // Merge data
            let merged = [];
            if (allocations.length > 0) {
                merged = allocations.map(alloc => ({
                    ...alloc,
                    availed: availedByType[alloc.leave_type] || 0,
                    balance: (alloc.total_leaves_allocated || 0) - (availedByType[alloc.leave_type] || 0),
                }));
            } else {
                // Fallback: Show only what we found in applications
                merged = Object.entries(availedByType).map(([type, total]) => ({
                    leave_type: type,
                    from_date: fromDate,
                    to_date: toDate,
                    total_leaves_allocated: '—',
                    availed: total,
                    balance: '—',
                    name: `fallback-${type}`
                }));
            }

            setData(merged);
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch leave yearly register' });
        } finally {
            setLoading(false);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Leave Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'Period', key: 'period', render: (_, r) => `${dayjs(r.from_date).format('DD MMM')} - ${dayjs(r.to_date).format('DD MMM YYYY')}` },
        { title: 'Allocated', dataIndex: 'total_leaves_allocated', key: 'total_leaves_allocated', align: 'right' },
        { title: 'Availed', dataIndex: 'availed', key: 'availed', align: 'right', render: (v) => <span className="text-orange-600 font-medium">{v}</span> },
        { title: 'Balance', dataIndex: 'balance', key: 'balance', align: 'right', render: (v) => (
            v === '—' ? '—' : <span className={`font-bold ${v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : 'text-gray-600'}`}>{v}</span>
        )},
    ];

    const totalAllocated = data.reduce((s, r) => s + (typeof r.total_leaves_allocated === 'number' ? r.total_leaves_allocated : 0), 0);
    const totalAvailed = data.reduce((s, r) => s + (r.availed || 0), 0);
    const totalBalance = data.reduce((s, r) => s + (typeof r.balance === 'number' ? r.balance : 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Select value={year} onChange={setYear} style={{ minWidth: 120 }}>
                    {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                </Select>
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Search</Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-700">{totalAllocated || '—'}</div>
                    <div className="text-xs text-blue-600">Total Allocated</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-700">{totalAvailed}</div>
                    <div className="text-xs text-orange-600">Total Availed</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{totalBalance || '—'}</div>
                    <div className="text-xs text-green-600">Total Balance</div>
                </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={data} loading={loading} rowKey="name" pagination={false} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
