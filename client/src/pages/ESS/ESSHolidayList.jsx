import React, { useState, useEffect } from 'react';
import { Table, notification, Spin } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSHolidayList({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [holidayListName, setHolidayListName] = useState(employeeData?.holiday_list || '');

    useEffect(() => {
        if (holidayListName) {
            fetchHolidays();
        }
    }, [holidayListName]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            // In ERPNext, Holiday List is a document with a 'holidays' child table.
            // We fetch the document to get the holidays.
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(holidayListName)}`);
            const data = res.data.data;
            if (data && data.holidays) {
                // Filter for current year if needed, or show all. Usually Holiday List is for a specific year.
                setHolidays(data.holidays || []);
            }
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load holiday list" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'holiday_date',
            key: 'holiday_date',
            render: (date) => dayjs(date).format('DD MMM YYYY (ddd)'),
            sorter: (a, b) => dayjs(a.holiday_date).unix() - dayjs(b.holiday_date).unix(),
            defaultSortOrder: 'ascend',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        }
    ];

    if (!holidayListName && !loading) {
        return <div className="p-8 text-center text-gray-500 bg-white border rounded-lg">No holiday list assigned to your profile.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 m-0">{holidayListName}</h2>
                <span className="text-xs text-gray-500">Total Holidays: {holidays.length}</span>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={holidays}
                    loading={loading}
                    rowKey={(record) => record.name || record.holiday_date}
                    pagination={false}
                    size="middle"
                    className="ess-holiday-table"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-holiday-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-holiday-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
