import React, { useState, useEffect } from 'react';
import { Table, notification, Tag, Space, DatePicker } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ESSAttendanceReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchAttendance();
        }
        if (employeeData?.holiday_list) {
            fetchHolidays();
        }
    }, [employeeData, dates, holidays.length]);

    const fetchHolidays = async () => {
        try {
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`);
            if (res.data.data && res.data.data.holidays) {
                setHolidays(res.data.data.holidays.map(h => h.holiday_date));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const fromDate = dates[0].format('YYYY-MM-DD');
            const toDate = dates[1].format('YYYY-MM-DD');
            const res = await API.get(`/api/resource/Attendance?fields=["name","attendance_date","status","in_time","out_time","working_hours","shift","late_entry","early_exit"]&filters=[["employee","=","${employeeData.name}"],["attendance_date",">=","${fromDate}"],["attendance_date","<=","${toDate}"]]&order_by=attendance_date desc`);
            
            const processed = (res.data.data || []).map(att => {
                const date = dayjs(att.attendance_date);
                const isHoliday = holidays.includes(att.attendance_date);
                const isSunday = date.day() === 0;

                if (att.status === 'Present' && parseFloat(att.working_hours || 0) === 0 && (isSunday || isHoliday)) {
                    return { ...att, status: isSunday ? 'Weekly Off' : 'Holiday' };
                }
                return att;
            });
            setData(processed);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load attendance report" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'attendance_date',
            key: 'attendance_date',
            render: (d) => dayjs(d).format('DD MMM YYYY (ddd)'),
            sorter: (a, b) => dayjs(a.attendance_date).unix() - dayjs(b.attendance_date).unix(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s) => {
                let color = 'blue';
                if (s === 'Present') color = 'green';
                else if (s === 'Absent') color = 'red';
                else if (s === 'Half Day') color = 'orange';
                else if (s === 'Weekly Off' || s === 'Holiday') color = 'default';
                
                return (
                    <Tag color={color}>
                        {s}
                    </Tag>
                );
            }
        },
        { title: 'In Time', dataIndex: 'in_time', key: 'in_time', render: (t) => t ? dayjs(t).format('HH:mm') : '-' },
        { title: 'Out Time', dataIndex: 'out_time', key: 'out_time', render: (t) => t ? dayjs(t).format('HH:mm') : '-' },
        { title: 'Hours', dataIndex: 'working_hours', key: 'working_hours', render: (h) => h ? parseFloat(h).toFixed(2) : '-' },
        { 
            title: 'Late/Early', 
            key: 'late_early', 
            render: (_, r) => (
                <Space>
                    {r.late_entry === 1 && <Tag color="orange">Late</Tag>}
                    {r.early_exit === 1 && <Tag color="magenta">Early</Tag>}
                    {!r.late_entry && !r.early_exit && <span className="text-gray-300">-</span>}
                </Space>
            )
        },
        { title: 'Shift', dataIndex: 'shift', key: 'shift' },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Attendance Report</h2>
                <RangePicker 
                    value={dates} 
                    onChange={setDates} 
                    allowClear={false}
                    className="ess-range-picker"
                />
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 15 }}
                    size="middle"
                    className="ess-table"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-range-picker { border-radius: 6px; }
                .ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
