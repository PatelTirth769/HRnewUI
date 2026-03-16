import React from 'react';
import { Card, Upload, Button, Avatar, Typography, notification } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ESSProfilePhoto({ employeeData }) {
    if (!employeeData) return null;

    // Standard field: image
    const imageUrl = employeeData.image;

    const handleUploadChange = (info) => {
        if (info.file.status === 'done') {
            notification.success({ message: "Photo uploaded successfully (Simulation)" });
        } else if (info.file.status === 'error') {
            notification.error({ message: "Photo upload failed." });
        }
    };

    return (
        <Card size="small" className="border-none shadow-none flex flex-col items-center">
            <h3 className="text-sm font-bold text-blue-600 mb-8 border-b pb-2 uppercase italic tracking-widest w-full text-center">Profile Picture</h3>
            
            <div className="relative group">
                <Avatar 
                    size={200} 
                    src={imageUrl} 
                    icon={<UserOutlined />} 
                    className="border-4 border-gray-100 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="mt-8 text-center">
                    <Upload
                        name="avatar"
                        showUploadList={false}
                        action="/api/method/frappe.handler.upload_file"
                        onChange={handleUploadChange}
                    >
                        <Button icon={<UploadOutlined />} type="primary">Change Photo</Button>
                    </Upload>
                </div>
            </div>

            <div className="mt-12 max-w-md text-center">
                <div className="text-xs text-blue-600 font-medium bg-blue-50 p-4 rounded-lg border border-blue-100 italic">
                    <p className="mb-2"><strong>Tip:</strong> A clear, professional headshot improves your presence in the company directory.</p>
                    <p className="m-0 opacity-70">Accepted formats: JPG, PNG. Max size: 2MB.</p>
                </div>
            </div>
        </Card>
    );
}
