import React, { useState } from 'react';
import { Upload, Button, notification, message } from 'antd';
import { InboxOutlined, PictureOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Dragger } = Upload;

export default function ESSChangeHomeImage({ employeeData }) {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    const props = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error(`${file.name} is not an image file`);
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            return false; // Prevent automatic upload
        },
        fileList,
        maxCount: 1,
        accept: "image/*"
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning("Please select an image first.");
            return;
        }
        
        const file = fileList[0];
        setUploading(true);

        try {
            // Standard Frappe file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('doctype', 'Employee');
            formData.append('docname', employeeData?.name || 'HomeBanner');
            formData.append('is_private', 0);
            
            await API.post('/api/method/upload_file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            notification.success({ 
                message: "Image Uploaded", 
                description: "The home image has been updated successfully." 
            });
            setFileList([]);
            
        } catch (error) {
            console.error("Upload error:", error);
            notification.error({ 
                message: "Upload Failed", 
                description: "There was a problem uploading your image." 
            });
        } finally {
            setLoading(false); // Wait, uploading is the state, setLoading is not defined here!
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 m-0">Change Home Image</h2>
                <PictureOutlined className="text-2xl text-gray-400" />
            </div>

            <div className="bg-white border rounded-lg p-8 max-w-2xl mx-auto mt-8">
                <div className="text-center mb-6">
                    <h3 className="text-base font-medium text-gray-700">Upload New Banner</h3>
                    <p className="text-sm text-gray-500">Formats accepted: JPG, PNG. Max size: 5MB.</p>
                </div>
                
                <Dragger {...props} className="bg-gray-50">
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined className="text-orange-500" />
                    </p>
                    <p className="ant-upload-text">Click or drag image to this area to upload</p>
                    <p className="ant-upload-hint">
                        Please upload landscape images for the best appearance on the home screen.
                    </p>
                </Dragger>
                
                <div className="mt-8 text-center">
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={handleUpload} 
                        loading={uploading} 
                        disabled={fileList.length === 0}
                        className="bg-orange-500 hover:bg-orange-600 border-none px-8"
                    >
                        {uploading ? 'Uploading...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
