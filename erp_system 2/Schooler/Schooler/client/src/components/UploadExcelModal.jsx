import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FaUpload, FaFileExcel, FaTimes } from 'react-icons/fa';
import { uploadExcel } from '../services/manageYearService';

const UploadExcelModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error('Please upload an Excel (.xlsx) file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadExcel(formData);
      
      toast.success(`Upload successful: ${response.insertedCount} inserted, ${response.updatedCount} updated, ${response.skippedCount} skipped`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Upload Excel File</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Upload an Excel file with the following columns: yearId, year, instituteId, academy, startDate, endDate, finalYear, active
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FaFileExcel className="text-green-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <button 
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <FaUpload className="mx-auto text-gray-400" size={24} />
                  <p className="mt-2 text-sm text-gray-500">Click to browse or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">Only .xlsx files are supported</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                className={file ? "hidden" : "absolute inset-0 w-full h-full opacity-0 cursor-pointer"}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadExcelModal;