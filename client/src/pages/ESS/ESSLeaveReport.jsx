import React, { useState, useEffect } from 'react';
import { Table, notification, Tabs, Tag } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

export default function ESSLeaveReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [balances, setBalances] = useState([]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchLeaveData();
        }
    }, [employeeData]);

    const fetchLeaveData = async () => {
        setLoading(true);
        try {
            let allocationData = [];
            let applicationData = [];

            // 1. Fetch Leave Application (History) - Employees generally have access to this
            try {
                const histRes = await API.get('/api/resource/Leave Application', {
                    params: {
                        fields: '["name","leave_type","from_date","to_date","total_leave_days","status"]',
                        filters: JSON.stringify([["employee", "=", employeeData.name], ["docstatus", "!=", 2]]),
                        order_by: 'from_date desc'
                    }
                });
                applicationData = histRes.data.data || [];
            } catch (err) {
                console.error("Leave Application fetch failed:", err);
            }
            
            setHistory(applicationData);

            // 2. Fetch Leave Allocation (Balances) - Often restricted by ERPNext HR permissions
            try {
                const balRes = await API.get('/api/resource/Leave Allocation', {
                    params: {
                        fields: '["leave_type","total_leaves_allocated","unused_leaves"]',
                        filters: JSON.stringify([["employee", "=", employeeData.name], ["docstatus", "=", 1]])
                    }
                });
                allocationData = balRes.data.data || [];
            } catch (err) {
                console.warn("Leave Allocation access denied or failed. Attempting fallback calculation.", err);
            }

            if (allocationData.length > 0) {
                // Calculate "Used" based on total vs unused
                const enhancedBalances = allocationData.map(bal => ({
                    ...bal,
                    used_calculated: (bal.total_leaves_allocated || 0) - (bal.unused_leaves || 0)
                }));
                setBalances(enhancedBalances);
            } else {
                // Fallback: If no allocation data, calculate used leaves directly from applications
                const typeMap = {};
                applicationData.forEach(a => {
                    if (!typeMap[a.leave_type]) typeMap[a.leave_type] = { used: 0 };
                    if (a.status === 'Approved') typeMap[a.leave_type].used += (a.total_leave_days || 0);
                });
                
                const fallbackBalances = Object.entries(typeMap).map(([type, info]) => ({
                    name: `fallback-${type}`,
                    leave_type: type,
                    total_leaves_allocated: '—',
                    used_calculated: info.used,
                    unused_leaves: '—'
                }));
                setBalances(fallbackBalances);
            }

        } catch (err) {
            console.error("General error loading leave data:", err);
            notification.error({ message: "Failed to load leave data" });
        } finally {
            setLoading(false);
        }
    };

    const balanceCols = [
        { title: 'Leave Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'Allocated', dataIndex: 'total_leaves_allocated', key: 'total_leaves_allocated', align: 'right', render: (val) => val ?? '—' },
        { title: 'Used', dataIndex: 'used_calculated', key: 'used_calculated', align: 'right', render: (val) => val ?? '—' },
        { title: 'Unused (Balance)', dataIndex: 'unused_leaves', key: 'unused_leaves', align: 'right', render: (val) => <span className="font-bold text-green-600">{val ?? '—'}</span> },
    ];

    const historyCols = [
        { title: 'Application ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600">{id}</span> },
        { title: 'Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'From', dataIndex: 'from_date', key: 'from_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'To', dataIndex: 'to_date', key: 'to_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Days', dataIndex: 'total_leave_days', key: 'total_leave_days', align: 'right' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (
            <Tag color={s === 'Approved' ? 'green' : s === 'Open' ? 'blue' : 'orange'}>{s}</Tag>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Leave Details</h2>
            </div>

            <Tabs defaultActiveKey="1" className="ess-tabs">
                <TabPane tab="Leave Balance" key="1">
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <Table 
                            columns={balanceCols}
                            dataSource={balances}
                            loading={loading}
                            rowKey="name"
                            pagination={false}
                            size="middle"
                            className="ess-table"
                        />
                    </div>
                </TabPane>
                <TabPane tab="Leave History" key="2">
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <Table 
                            columns={historyCols}
                            dataSource={history}
                            loading={loading}
                            rowKey="name"
                            pagination={{ pageSize: 10 }}
                            size="middle"
                            className="ess-table"
                        />
                    </div>
                </TabPane>
            </Tabs>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-tabs .ant-tabs-nav { margin-bottom: 16px; background: white; padding: 0 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
                .ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
