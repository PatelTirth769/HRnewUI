import React from 'react';
import { Card, Table, Empty, Button, Tag, notification } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';

export default function ESSProfileDocuments({ employeeData }) {
    if (!employeeData) return null;

    // Standard child table: personal_documents or similar
    // Often documents are just individual fields or managed via Attachments
    const documentData = employeeData.personal_documents || [];

    const columns = [
        { 
            title: 'Document Type', 
            dataIndex: 'document_type', 
            key: 'document_type',
            render: (text) => <span className="font-medium text-gray-700">{text}</span>
        },
        { 
            title: 'File', 
            dataIndex: 'attachment', 
            key: 'attachment',
            render: (file) => file ? (
                <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => window.open(file)}>
                    Download
                </Button>
            ) : <Tag color="default">N/A</Tag>
        },
        { title: 'Reference Number', dataIndex: 'reference_number', key: 'reference_number' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Verified' ? 'green' : 'orange'}>{s}</Tag> }
    ];

    return (
        <Card size="small" className="border-none shadow-none">
            <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">KYC & Personal Documents</h3>
            {documentData.length > 0 ? (
                <Table 
                    dataSource={documentData} 
                    columns={columns} 
                    pagination={false} 
                    size="middle" 
                    rowKey="name"
                    className="border"
                />
            ) : (
                <div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed">
                    <FileTextOutlined className="text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500 italic">No formal documents have been registered in your profile.</p>
                    <Button type="primary" className="mt-4" onClick={() => notification.info({ message: "Upload utility coming soon!" })}>
                        Register New Document
                    </Button>
                </div>
            )}

            <div className="mt-8">
                <h3 className="text-sm font-bold text-blue-600 mb-4 border-b pb-2 uppercase italic tracking-widest">Signed Agreements</h3>
                <div className="p-4 bg-blue-50 text-blue-800 rounded border border-blue-100 text-sm italic">
                    Your signed employment contracts and NDAs are securely stored. Contact HR for copies.
                </div>
            </div>
        </Card>
    );
}
