import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaFileExcel, FaSync, FaLink, FaUnlink } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SynchronizeSubject = () => {
  const [examSubjects, setExamSubjects] = useState([]);
  const [academicSubjects, setAcademicSubjects] = useState([]);
  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [unmappedSubjects, setUnmappedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamSubject, setSelectedExamSubject] = useState('');
  const [selectedAcademicSubject, setSelectedAcademicSubject] = useState('');
  const [file, setFile] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchExamSubjects();
    fetchAcademicSubjects();
    fetchMappedSubjects();
    fetchUnmappedSubjects();
  }, []);

  // Fetch exam subjects from old system
  const fetchExamSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects/exam-subjects');
      if (Array.isArray(response.data)) {
        setExamSubjects(response.data);
      } else {
        setExamSubjects([]);
        console.error('Exam subjects data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching exam subjects:', error);
      toast.error('Failed to fetch exam subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch academic subjects from old system
  const fetchAcademicSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects/academic-subjects');
      if (Array.isArray(response.data)) {
        setAcademicSubjects(response.data);
      } else {
        setAcademicSubjects([]);
        console.error('Academic subjects data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching academic subjects:', error);
      toast.error('Failed to fetch academic subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch mapped subjects
  const fetchMappedSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects');
      if (Array.isArray(response.data)) {
        setMappedSubjects(response.data.filter(subject => subject.isMapped));
      } else {
        setMappedSubjects([]);
        console.error('Mapped subjects data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching mapped subjects:', error);
      toast.error('Failed to fetch mapped subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unmapped subjects
  const fetchUnmappedSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subjects/unmapped');
      if (Array.isArray(response.data)) {
        setUnmappedSubjects(response.data);
      } else {
        setUnmappedSubjects([]);
        console.error('Unmapped subjects data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching unmapped subjects:', error);
      toast.error('Failed to fetch unmapped subjects');
    } finally {
      setLoading(false);
    }
  };

  // Handle mapping of subjects
  const handleMapSubjects = async () => {
    if (!selectedExamSubject || !selectedAcademicSubject) {
      toast.error('Please select both exam subject and academic subject');
      return;
    }

    try {
      setLoading(true);
      
      const examSubject = examSubjects.find(subject => subject.id === selectedExamSubject);
      const academicSubject = academicSubjects.find(subject => subject.id === selectedAcademicSubject);
      
      if (!examSubject || !academicSubject) {
        toast.error('Invalid subject selection');
        return;
      }
      
      await axios.post('/api/subjects/map', {
        examSubjectId: examSubject.id,
        examSubjectName: examSubject.name,
        academicSubjectId: academicSubject.id,
        academicSubjectName: academicSubject.name
      });
      
      toast.success('Subjects mapped successfully');
      
      // Reset selections
      setSelectedExamSubject('');
      setSelectedAcademicSubject('');
      
      // Refresh data
      fetchMappedSubjects();
      fetchUnmappedSubjects();
    } catch (error) {
      console.error('Error mapping subjects:', error);
      toast.error('Failed to map subjects');
    } finally {
      setLoading(false);
    }
  };

  // Handle unmapping of subjects
  const handleUnmapSubjects = async (id) => {
    try {
      setLoading(true);
      await axios.patch(`/api/subjects/unmap/${id}`);
      toast.success('Subject unmapped successfully');
      
      // Refresh data
      fetchMappedSubjects();
      fetchUnmappedSubjects();
    } catch (error) {
      console.error('Error unmapping subject:', error);
      toast.error('Failed to unmap subject');
      
    } finally {
      setLoading(false);
    }
  };

  // Handle file change for Excel upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle Excel file upload
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      await axios.post('/api/subjects/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      setFile(null);
      
      // Refresh data
      fetchMappedSubjects();
      fetchUnmappedSubjects();
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setLoading(false);
    }
  };

  // Handle download of Excel template
  const handleDownloadTemplate = async () => {
    try {
      window.open('/api/subjects/download-template', '_blank');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  // Handle download of all subject mappings
  const handleDownloadMappings = async () => {
    try {
      window.open('/api/subjects/download', '_blank');
    } catch (error) {
      console.error('Error downloading mappings:', error);
      toast.error('Failed to download mappings');
    }
  };

  // Filter mapped subjects based on search term
  const filteredMappedSubjects = mappedSubjects.filter(subject => 
    subject.examSubjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.academicSubjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter unmapped subjects based on search term
  const filteredUnmappedSubjects = unmappedSubjects.filter(subject => 
    (subject.examSubjectName && subject.examSubjectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (subject.academicSubjectName && subject.academicSubjectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Synchronize Subject (From Academic Portal)</h1>
      
      {/* Mapping Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Map Subjects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Subject</label>
            <select
              value={selectedExamSubject}
              onChange={(e) => setSelectedExamSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Exam Subject</option>
              {examSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Subject</label>
            <select
              value={selectedAcademicSubject}
              onChange={(e) => setSelectedAcademicSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Academic Subject</option>
              {academicSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleMapSubjects}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            <FaLink className="mr-2" />
            {loading ? 'Mapping...' : 'Map Subjects'}
          </button>
        </div>
      </div>
      
      {/* Excel Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Excel Upload/Download</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <form onSubmit={handleUploadExcel} className="flex items-center space-x-4">
              <input
                type="file"
                onChange={handleFileChange}
                className="flex-grow p-2 border border-gray-300 rounded-md"
                accept=".xlsx, .xls"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                disabled={loading || !file}
              >
                <FaFileExcel className="mr-2" />
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <FaFileExcel className="mr-2" />
              Download Template
            </button>
            
            <button
              onClick={handleDownloadMappings}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <FaFileExcel className="mr-2" />
              Download Mappings
            </button>
          </div>
        </div>
      </div>
      
      {/* Mapped Subjects Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mapped Subjects</h2>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 p-2 border border-gray-300 rounded-md"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              onClick={() => {
                fetchMappedSubjects();
                fetchUnmappedSubjects();
              }}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Subject ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Subject ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMappedSubjects.length > 0 ? (
                  filteredMappedSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.examSubjectId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.examSubjectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.academicSubjectId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.academicSubjectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUnmapSubjects(subject._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Unmap"
                        >
                          <FaUnlink />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">No mapped subjects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Unmapped Subjects Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Unmapped Subjects</h2>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUnmappedSubjects.length > 0 ? (
                  filteredUnmappedSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subject.examSubjectId || subject.academicSubjectId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subject.examSubjectName || subject.academicSubjectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subject.examSubjectId ? 'Exam Subject' : 'Academic Subject'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">No unmapped subjects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SynchronizeSubject;