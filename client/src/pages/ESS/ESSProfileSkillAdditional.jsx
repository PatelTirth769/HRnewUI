import React, { useState } from 'react';
import { Row, Col, Card, Input, Select, Button, notification, Table, Tag } from 'antd';
import API from '../../services/api';

const { Option } = Select;

export default function ESSProfileSkillAdditional({ employeeData }) {
    if (!employeeData) return null;

    const [loading, setLoading] = useState(false);
    
    // Skill table usually: skills
    const skillData = employeeData.skills || [];

    const columns = [
        { title: 'Skill', dataIndex: 'skill', key: 'skill' },
        { 
            title: 'Proficiency', 
            dataIndex: 'proficiency', 
            key: 'proficiency',
            render: (p) => <Tag color="blue">{p || 'N/A'}</Tag>
        }
    ];

    return (
        <Card size="small" className="border-none shadow-none">
            <Row gutter={[24, 16]}>
                <Col span={24}>
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Additional Information</h3>
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Nationality</div>
                    <Input defaultValue={employeeData.nationality} readOnly />
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Religion</div>
                    <Input defaultValue={employeeData.religion} readOnly />
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Place of Birth</div>
                    <Input defaultValue={employeeData.place_of_birth} readOnly />
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Mother Tongue</div>
                    <Input defaultValue={employeeData.mother_tongue} readOnly />
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Passport Number</div>
                    <Input defaultValue={employeeData.passport_number} readOnly />
                </Col>
                <Col span={8}>
                    <div className="text-gray-500 text-xs mb-1">Driving License Number</div>
                    <Input defaultValue={employeeData.driving_license} readOnly />
                </Col>
                <Col span={24}>
                    <div className="text-gray-500 text-xs mb-1">Hobbies</div>
                    <Input.TextArea rows={2} defaultValue={employeeData.hobbies} readOnly />
                </Col>
            </Row>

            <div className="mt-8">
                <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Key Skills</h3>
                <Table 
                    dataSource={skillData} 
                    columns={columns} 
                    pagination={false} 
                    size="small" 
                    rowKey="name"
                    className="border"
                    locale={{ emptyText: <Empty description="No skills listed." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
            </div>
            
            <div className="mt-6">
                <Button type="primary" onClick={() => notification.info({ message: "Contact HR to update skills/additional information." })}>
                    Request Update
                </Button>
            </div>
        </Card>
    );
}

function Empty({ description, image }) {
    return <div className="p-8 text-center text-gray-400">{description}</div>;
}
