import React from 'react';
import { Row, Col, Card, Input, Button, notification, Tag } from 'antd';
import { BankOutlined, CreditCardOutlined } from '@ant-design/icons';

export default function ESSProfileBank({ employeeData }) {
    if (!employeeData) return null;

    return (
        <Card size="small" className="border-none shadow-none">
            <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <BankOutlined className="text-3xl text-blue-600 bg-blue-50 p-3 rounded-full" />
                <div>
                    <h3 className="text-lg font-bold text-gray-800 m-0">Salary Bank Account</h3>
                    <p className="text-xs text-gray-500 m-0 italic">Primary account used for monthly payroll disbursements.</p>
                </div>
            </div>

            <Row gutter={[32, 24]}>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                        <CreditCardOutlined className="text-xs" /> Account Name
                    </div>
                    <Input defaultValue={employeeData.employee_name} readOnly className="bg-gray-50 font-medium" />
                </Col>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Bank Name</div>
                    <Input defaultValue={employeeData.bank_name} readOnly className="bg-gray-50 font-medium" />
                </Col>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Account Number</div>
                    <Input defaultValue={employeeData.bank_ac_no} readOnly className="bg-gray-50 font-medium tracking-widest" />
                </Col>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">IFSC Code</div>
                    <Input defaultValue={employeeData.ifsc_code} readOnly className="bg-gray-50 font-medium" />
                </Col>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Bank Branch</div>
                    <Input defaultValue={employeeData.bank_branch} readOnly className="bg-gray-50" />
                </Col>
                <Col span={12}>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Payment Mode</div>
                    <Tag color="blue">{employeeData.salary_mode || 'Bank Transfer'}</Tag>
                </Col>
            </Row>

            <div className="mt-12 pt-6 border-t">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex items-start gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-[10px]">!</div>
                    <div>
                        <div className="text-xs font-bold text-orange-900 mb-1">Account Modification Policy</div>
                        <p className="text-xs text-orange-800 m-0 italic leading-relaxed">
                            For security purposes, bank account changes cannot be done directly. 
                            Please submit a <strong>"Bank Account Change Request"</strong> along with a cancelled cheque copy to higher management.
                        </p>
                    </div>
                </div>
                <Button className="mt-6" onClick={() => notification.warning({ message: "Modification restricted.", description: "Please submit physical documents for bank details update." })}>
                    Request Change
                </Button>
            </div>
        </Card>
    );
}
