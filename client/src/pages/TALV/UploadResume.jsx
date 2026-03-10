import React, { useState } from 'react';
import { Upload, message, Button, Progress, Card, Alert, Typography } from 'antd';
import { InboxOutlined, FileZipOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

export default function UploadResume() {
    const navigate = useNavigate();
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning("Please select a ZIP file first.");
            return;
        }

        const formData = new FormData();
        formData.append('zipFile', fileList[0]);

        setUploading(true);
        setProgress(10);
        setResult(null);

        try {
            // Fake progress for UI feedback since extraction can take a minute
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const { data } = await api.post('/local-api/api/resumes/bulk-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (data.success) {
                message.success('Resumes processed successfully!');
                setResult(data.stats);
                setFileList([]); // Clear file
            } else {
                message.error('Failed to process resumes.');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setProgress(0);
            message.error('An error occurred during upload or extraction.');
        } finally {
            setUploading(false);
        }
    };

    const props = {
        onRemove: () => {
            setFileList([]);
            setResult(null);
        },
        beforeUpload: (file) => {
            const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip');
            if (!isZip) {
                message.error('You can only upload ZIP files!');
                return Upload.LIST_IGNORE;
            }
            const isLt50M = file.size / 1024 / 1024 < 50;
            if (!isLt50M) {
                message.error('File must be smaller than 50MB!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            setResult(null);
            return false; // Prevent default auto-upload
        },
        fileList,
        maxCount: 1,
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 border-b pb-4">
                        Bulk Resume Upload
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Upload a ZIP file containing candidate resumes (PDF, DOCX) to automatically extract, parse, and store them in the Resume Database.
                    </p>
                </div>

                <Card className="shadow-sm border-gray-200 rounded-lg overflow-hidden">
                    <Dragger {...props} className="p-8 bg-gray-50 hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 rounded-lg" disabled={uploading}>
                        <p className="ant-upload-drag-icon text-blue-500">
                            <FileZipOutlined style={{ fontSize: '48px' }} />
                        </p>
                        <p className="ant-upload-text text-lg font-medium text-gray-700 mt-4">Click or drag a ZIP file to this area to upload</p>
                        <p className="ant-upload-hint text-gray-500 mt-2">
                            Support for a single or bulk upload. Max file size: 50MB.
                        </p>
                    </Dragger>

                    {uploading && (
                        <div className="mt-8 px-4">
                            <Text className="text-gray-600 mb-2 block">Processing resumes...</Text>
                            <Progress percent={progress} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
                        </div>
                    )}

                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleUpload}
                            disabled={fileList.length === 0}
                            loading={uploading}
                            className="bg-blue-600 hover:bg-blue-700 border-none px-8 font-medium"
                        >
                            {uploading ? 'Processing ZIP...' : 'Process Upload'}
                        </Button>
                        <Button
                            size="large"
                            onClick={() => navigate('/talv/resume-database')}
                            className="px-6 border-gray-300 text-gray-700 font-medium"
                        >
                            View Resume Database
                        </Button>
                    </div>
                </Card>

                {result && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                        <Title level={4} className="flex items-center gap-2 text-green-700 !mb-4 border-b border-green-50 pb-2">
                            <CheckCircleOutlined /> Processing Complete
                        </Title>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-md text-center border border-gray-100">
                                <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider block mb-1">Total Found</Text>
                                <Text className="text-2xl font-bold text-gray-800">{result.totalFilesFound}</Text>
                            </div>
                            <div className="bg-green-50 p-4 rounded-md text-center border border-green-100">
                                <Text className="text-green-600 text-sm font-medium uppercase tracking-wider block mb-1">Successfully Parsed</Text>
                                <Text className="text-2xl font-bold text-green-700">{result.success}</Text>
                            </div>
                            <div className="bg-red-50 p-4 rounded-md text-center border border-red-100">
                                <Text className="text-red-500 text-sm font-medium uppercase tracking-wider block mb-1">Failed</Text>
                                <Text className="text-2xl font-bold text-red-600">{result.failed}</Text>
                            </div>
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <div className="mt-4">
                                <Text type="danger" className="font-medium mb-2 block">Errors encountered:</Text>
                                <ul className="list-disc pl-5 text-sm text-red-600 bg-red-50/50 p-4 rounded-md max-h-40 overflow-y-auto">
                                    {result.errors.map((err, idx) => (
                                        <li key={idx} className="mb-1">
                                            <span className="font-semibold">{err.file}:</span> {err.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
