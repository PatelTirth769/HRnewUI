import React from 'react';
import { Card, Table, Empty } from 'antd';
import dayjs from 'dayjs';

export default function ESSProfileWorkExperience({ employeeData }) {
    if (!employeeData) return null;

    // Child table: external_work_history
    const experienceData = employeeData.external_work_history || [];

    const columns = [
        { title: 'Company', dataIndex: 'company_name', key: 'company_name' },
        { title: 'Designation', dataIndex: 'designation', key: 'designation' },
        { 
            title: 'From', 
            dataIndex: 'from_date', 
            key: 'from_date',
            render: (d) => d ? dayjs(d).format('MMM YYYY') : '-'
        },
        { 
            title: 'To', 
            dataIndex: 'to_date', 
            key: 'to_date',
            render: (d) => d ? dayjs(d).format('MMM YYYY') : '-'
        },
        { title: 'Total Exp', dataIndex: 'total_experience', key: 'total_experience' },
        { title: 'Salary', dataIndex: 'salary', key: 'salary' }
    ];

    return (
        <Card size="small" className="border-none shadow-none">
            <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Work History</h3>
            {experienceData.length > 0 ? (
                <Table 
                    dataSource={experienceData} 
                    columns={columns} 
                    pagination={false} 
                    size="small" 
                    rowKey="name"
                    className="border"
                />
            ) : (
                <Empty description="No previous work experience listed." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>
    );
}
