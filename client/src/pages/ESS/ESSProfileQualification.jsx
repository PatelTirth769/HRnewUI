import React from 'react';
import { Card, Table, Empty, Tag } from 'antd';

export default function ESSProfileQualification({ employeeData }) {
    if (!employeeData) return null;

    // Child table: education
    const educationData = employeeData.education || [];

    const columns = [
        { title: 'School / University', dataIndex: 'school_university', key: 'school_university' },
        { title: 'Qualification', dataIndex: 'qualification', key: 'qualification' },
        { title: 'Level', dataIndex: 'level', key: 'level', render: (l) => l && <Tag>{l}</Tag> },
        { title: 'Year of Passing', dataIndex: 'year_of_passing', key: 'year_of_passing' },
        { title: 'Percentage / GPA', dataIndex: 'percentage_gpa', key: 'percentage_gpa' }
    ];

    return (
        <Card size="small" className="border-none shadow-none">
            <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Education Details</h3>
            {educationData.length > 0 ? (
                <Table 
                    dataSource={educationData} 
                    columns={columns} 
                    pagination={false} 
                    size="small" 
                    rowKey="name"
                    className="border"
                />
            ) : (
                <Empty description="No education records listed." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>
    );
}
