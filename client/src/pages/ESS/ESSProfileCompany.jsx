import React from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function ESSProfileCompany({ employeeData }) {
    if (!employeeData) return null;

    const renderDetail = (label, value) => (
        <Col span={12} className="mb-4">
            <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-medium text-gray-800">{value !== undefined && value !== null ? value : '-'}</div>
        </Col>
    );

    return (
        <Card size="small" className="border-none shadow-none">
            <Row gutter={[24, 16]}>
                <Col span={24}>
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Job Information</h3>
                </Col>
                {renderDetail('Employee ID', employeeData.name)}
                {renderDetail('Status', <Tag color={employeeData.status === 'Active' ? 'green' : 'red'}>{employeeData.status}</Tag>)}
                {renderDetail('Company', employeeData.company)}
                {renderDetail('Branch', employeeData.branch)}
                {renderDetail('Department', employeeData.department)}
                {renderDetail('Designation', employeeData.designation)}
                {renderDetail('Grade', employeeData.grade)}
                {renderDetail('Employment Type', employeeData.employment_type)}
                
                <Col span={24} className="mt-4">
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Important Dates</h3>
                </Col>
                {renderDetail('Date of Joining', employeeData.date_of_joining ? dayjs(employeeData.date_of_joining).format('DD MMM YYYY') : '-')}
                {renderDetail('Offer Date', employeeData.offer_date ? dayjs(employeeData.offer_date).format('DD MMM YYYY') : '-')}
                {renderDetail('Confirmation Date', employeeData.confirmation_date ? dayjs(employeeData.confirmation_date).format('DD MMM YYYY') : '-')}
                {renderDetail('Contract End Date', employeeData.contract_end_date ? dayjs(employeeData.contract_end_date).format('DD MMM YYYY') : '-')}
                {renderDetail('Retirement Date', employeeData.date_of_retirement ? dayjs(employeeData.date_of_retirement).format('DD MMM YYYY') : '-')}
                {renderDetail('Notice Period (Days)', employeeData.notice_number_of_days)}

                <Col span={24} className="mt-4">
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Reporting</h3>
                </Col>
                {renderDetail('Reports To', employeeData.reports_to)}
                {renderDetail('Leave Approver', employeeData.leave_approver)}
                {renderDetail('Expense Approver', employeeData.expense_approver)}
            </Row>
        </Card>
    );
}
