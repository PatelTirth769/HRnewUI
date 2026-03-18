import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaDownload, FaPrint, FaBarcode, FaFilter, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const GenerateBarcodeSticker = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [examCenters, setExamCenters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({
    examCenterId: '',
    programId: '',
    yearId: '',
    examBlockNo: '',
    examRoomNo: '',
    examSeatNo: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [stickerSize, setStickerSize] = useState('SMALL'); // SMALL, MEDIUM, LARGE
  const [includeQR, setIncludeQR] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch dropdown data
      const [centersRes, programsRes, yearsRes] = await Promise.all([
        axios.get('/api/exam-centers'),
        axios.get('/api/programs'),
        axios.get('/api/years')
      ]);
      
      setExamCenters(Array.isArray(centersRes.data) ? centersRes.data : []);
      setPrograms(Array.isArray(programsRes.data) ? programsRes.data : []);
      setYears(Array.isArray(yearsRes.data) ? yearsRes.data : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch dropdown data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`/api/students/barcode-data?${params.toString()}`);
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student data');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student._id));
    }
  };

  const generateBarcode = async (type = 'preview') => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        studentIds: selectedStudents,
        stickerSize,
        includeQR,
        type
      };

      if (type === 'preview') {
        const response = await axios.post('/api/barcodes/generate-preview', payload);
        setPreviewData(response.data);
        setShowPreview(true);
      } else {
        const response = await axios.post('/api/barcodes/generate', payload, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `barcode-stickers-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Barcode stickers generated successfully');
      }
    } catch (error) {
      console.error('Error generating barcodes:', error);
      toast.error('Failed to generate barcodes');
    } finally {
      setLoading(false);
    }
  };

  const printBarcodes = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    // Open print window with selected students
    const printWindow = window.open('/print-barcodes', '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.postMessage({
          type: 'PRINT_BARCODES',
          studentIds: selectedStudents,
          stickerSize,
          includeQR
        }, '*');
      };
    }
  };

  const clearFilters = () => {
    setFilters({
      examCenterId: '',
      programId: '',
      yearId: '',
      examBlockNo: '',
      examRoomNo: '',
      examSeatNo: ''
    });
    setSearchTerm('');
  };

  const filteredStudents = students.filter(student => 
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExamCenterName = (centerId) => {
    const center = examCenters.find(c => c.examCenterId === centerId);
    return center ? center.examCenterName : centerId;
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.programId === programId);
    return program ? program.programName : programId;
  };

  const getYearName = (yearId) => {
    const year = years.find(y => y.yearId === yearId);
    return year ? year.yearName : yearId;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Generate Barcode Sticker</h1>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sticker Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sticker Size</label>
            <select
              value={stickerSize}
              onChange={(e) => setStickerSize(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="SMALL">Small (2x1 inch)</option>
              <option value="MEDIUM">Medium (3x2 inch)</option>
              <option value="LARGE">Large (4x3 inch)</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeQR}
                onChange={(e) => setIncludeQR(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Include QR Code</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => generateBarcode('preview')}
              disabled={selectedStudents.length === 0}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaEye className="mr-2" /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center</label>
            <select
              value={filters.examCenterId}
              onChange={(e) => handleFilterChange('examCenterId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Centers</option>
              {examCenters.map(center => (
                <option key={center.examCenterId} value={center.examCenterId}>
                  {center.examCenterName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={filters.programId}
              onChange={(e) => handleFilterChange('programId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.programId} value={program.programId}>
                  {program.programName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.yearId}
              onChange={(e) => handleFilterChange('yearId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year.yearId} value={year.yearId}>
                  {year.yearName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block No</label>
            <input
              type="text"
              value={filters.examBlockNo}
              onChange={(e) => handleFilterChange('examBlockNo', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Block No"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room No</label>
            <input
              type="text"
              value={filters.examRoomNo}
              onChange={(e) => handleFilterChange('examRoomNo', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Room No"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seat No</label>
            <input
              type="text"
              value={filters.examSeatNo}
              onChange={(e) => handleFilterChange('examSeatNo', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Seat No"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchStudents}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <FaSearch className="mr-2" /> Search Students
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
              onChange={handleSelectAll}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({selectedStudents.length} selected)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generateBarcode('download')}
              disabled={selectedStudents.length === 0 || loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Download PDF
            </button>
            <button
              onClick={printBarcodes}
              disabled={selectedStudents.length === 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Students ({filteredStudents.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" onChange={handleSelectAll} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentSelect(student._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getProgramName(student.programId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getYearName(student.yearId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getExamCenterName(student.examCenterId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.examBlockNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.examRoomNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.examSeatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaBarcode className="text-gray-400 mr-2" />
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {student.barcode || 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-6 py-4 text-center text-gray-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Barcode Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {previewData.barcodes?.map((barcode, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="mb-2">
                      <img src={barcode.barcodeImage} alt="Barcode" className="mx-auto" />
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>{barcode.studentName}</div>
                      <div>{barcode.studentId}</div>
                      <div className="font-mono">{barcode.barcodeValue}</div>
                    </div>
                    {includeQR && barcode.qrCode && (
                      <div className="mt-2">
                        <img src={barcode.qrCode} alt="QR Code" className="mx-auto w-16 h-16" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => generateBarcode('download')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateBarcodeSticker;