import React, { useState, useEffect } from 'react';
import { Table, Tag, notification, Space, Button, Select, Input, Card } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ESSActivityUpdate({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [selectedProcess, setSelectedProcess] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        if (employeeData?.name) {
            fetchProcesses();
            fetchActivities();
        }
    }, [employeeData]);

    const fetchProcesses = async () => {
        try {
            const res = await API.get('/api/resource/Process Master?fields=["name"]');
            setProcesses(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch processes:", err);
        }
    };

    const fetchActivities = async () => {
        setLoading(true);
        try {
            let filters = [["employee", "=", employeeData.name]];
            if (selectedProcess) filters.push(["process", "=", selectedProcess]);
            if (filterStatus !== 'All') filters.push(["status", "=", filterStatus]);

            const res = await API.get(`/api/resource/Employee Process Master?fields=["name","process","status","date","remarks"]&filters=${JSON.stringify(filters)}&order_by=date desc`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load activity updates" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '-',
        },
        {
            title: 'Process',
            dataIndex: 'process',
            key: 'process',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'Completed') color = 'green';
                if (status === 'Assigned') color = 'blue';
                if (status === 'Request Cancelled') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
        },
        {
            title: 'ID',
            dataIndex: 'name',
            key: 'name',
            className: 'text-xs text-gray-400',
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Process</div>
                        <Select 
                            className="w-full" 
                            placeholder="Select Process" 
                            allowClear 
                            onChange={setSelectedProcess}
                            value={selectedProcess}
                        >
                            {processes.map(p => <Option key={p.name} value={p.name}>{p.name}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Search Text</div>
                        <Input 
                            placeholder="Search remarks..." 
                            value={searchText} 
                            onChange={e => setSearchText(e.target.value)} 
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="primary" onClick={fetchActivities} loading={loading}>Search</Button>
                        <Button onClick={() => { setSelectedProcess(null); setSearchText(''); setFilterStatus('All'); fetchActivities(); }}>Reset</Button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {['All', 'Assigned', 'Completed', 'Request Cancelled'].map(s => (
                        <Button 
                            key={s} 
                            size="small" 
                            type={filterStatus === s ? 'primary' : 'default'}
                            onClick={() => { setFilterStatus(s); }}
                            className={filterStatus === s ? 'bg-blue-600' : ''}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    columns={columns}
                    dataSource={data.filter(item => 
                        !searchText || 
                        (item.remarks && item.remarks.toLowerCase().includes(searchText.toLowerCase())) ||
                        (item.process && item.process.toLowerCase().includes(searchText.toLowerCase()))
                    )}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
            `}} />
        </div>
    );
}
