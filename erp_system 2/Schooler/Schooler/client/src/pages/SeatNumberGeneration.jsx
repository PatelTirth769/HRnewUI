import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaUpload, FaSearch, FaTrash, FaEdit, FaQrcode } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const SeatNumberGeneration = () => {
  const [seatNumbers, setSeatNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    instituteId: '',
    yearId: '',
    examFacultyId: '',
    examBlockNo: '',
    examRoomNo: ''
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState({});

  useEffect(() => {
    fetchSeatNumbers();
  }, []);

  const fetchSeatNumbers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/seat-numbers');
      setSeatNumbers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching seat numbers:', error);
      toast.error('Failed to fetch seat numbers');
      setSeatNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await axios.get(`/api/seat-numbers/filter?${queryParams}`);
      setSeatNumbers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/seat-numbers/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(response.data.message || 'Seat numbers uploaded successfully');
      fetchSeatNumbers();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        instituteId: 'INST001',
        yearId: '2024',
        examFacultyId: 'FAC001',
        examBlockNo: 'A',
        examRoomNo: '101',
        examSeatNo: 'A101-001',
        studentId: 'STU001',
        studentName: 'John Doe',
        enrollmentNo: 'ENR001',
        programId: 'PROG001',
        programName: 'Computer Science'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'SeatNumbers');
    xlsx.writeFile(workbook, 'seat_number_template.xlsx');
  };

  const handleShowQRCode = (seatNumber) => {
    setSelectedStudent({
      name: seatNumber.studentName,
      seatNo: seatNumber.examSeatNo,
      enrollment: seatNumber.enrollmentNo
    });
    setSelectedQRCode(seatNumber.qrCode);
    setShowQRModal(true);
  };

  const filteredSeatNumbers = seatNumbers.filter(seat =>
    seat.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seat.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seat.examSeatNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seat.programName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seat Number Generation</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institute ID</label>
            <input
              type="text"
              name="instituteId"
              value={filters.instituteId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter Institute ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year ID</label>
            <input
              type="text"
              name="yearId"
              value={filters.yearId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter Year ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID</label>
            <input
              type="text"
              name="examFacultyId"
              value={filters.examFacultyId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter Faculty ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block No</label>
            <input
              type="text"
              name="examBlockNo"
              value={filters.examBlockNo}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter Block No"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room No</label>
            <input
              type="text"
              name="examRoomNo"
              value={filters.examRoomNo}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter Room No"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <FaSearch className="mr-2" /> Apply Filters
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Seat Numbers</h2>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Template</label>
            <button
              onClick={handleDownloadTemplate}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Template
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Upload an Excel file with columns: instituteId, yearId, examFacultyId, examBlockNo, examRoomNo, examSeatNo, studentId, studentName, enrollmentNo, programId, programName
        </p>
      </div>

      {/* Seat Numbers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generated Seat Numbers</h2>
          <input
            type="text"
            placeholder="Search by student name, enrollment, seat number, or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seat No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredSeatNumbers.length > 0 ? (
                filteredSeatNumbers.map((seat) => (
                  <tr key={seat._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{seat.examSeatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{seat.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{seat.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{seat.programName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{seat.examBlockNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{seat.examRoomNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {seat.qrCode ? (
                        <button
                          onClick={() => handleShowQRCode(seat)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <FaQrcode className="mr-1" /> View QR
                        </button>
                      ) : (
                        <span className="text-gray-400">No QR</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No seat numbers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code for {selectedStudent.name}</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Seat No: {selectedStudent.seatNo}</p>
                <p className="text-sm text-gray-600">Enrollment: {selectedStudent.enrollment}</p>
              </div>
              {selectedQRCode && (
                <div className="flex justify-center mb-4">
                  <img src={selectedQRCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatNumberGeneration;