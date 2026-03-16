import React from 'react';
import { Row, Col, Card, Typography, Table, Empty } from 'antd';

const { Text } = Typography;

export default function ESSProfileFamily({ employeeData }) {
    if (!employeeData) return null;

    // Standard Frappe/ERPNext Employee Family details field is often 'family_background' or a table 'family_members'
    // Based on previous research, it seems 'family_background' was used as a text field, but we can check for child tables.
    const familyData = employeeData.family_members || [];

    const columns = [
        { title: 'Member Name', dataIndex: 'member_name', key: 'member_name' },
        { title: 'Relationship', dataIndex: 'relationship', key: 'relationship' },
        { title: 'Date of Birth', dataIndex: 'date_of_birth', key: 'date_of_birth' },
        { title: 'Occupation', dataIndex: 'occupation', key: 'occupation' }
    ];

    return (
        <Card size="small" className="border-none shadow-none">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Family Background</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {employeeData.family_background || 'No additional family background details provided.'}
                </div>
            </div>

            <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Family Members</h3>
            {familyData.length > 0 ? (
                <Table 
                    dataSource={familyData} 
                    columns={columns} 
                    pagination={false} 
                    size="small" 
                    rowKey="name" 
                    className="border"
                />
            ) : (
                <Empty description="No family members listed." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Card>
    );
}
