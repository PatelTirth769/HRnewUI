import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload, FaPrint, FaBarcode, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const GenerateFacultyDummyId = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [examCenters, setExamCenters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({
    examCenterId: '',
    programId: '',
    yearId: '',
    facultyType: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch dropdown data - using mock data for now
      setExamCenters([
        { examCenterId: 'EC001', examCenterName: 'Center 1' },
        { examCenterId: 'EC002', examCenterName: 'Center 2' }
      ]);
      setPrograms([
        { programId: 'PR001', programName: 'Computer Science' },
        { programId: 'PR002', programName: 'Information Technology' }
      ]);
      setYears([
        { yearId: 'Y2023', yearName: '2023-2024' },
        { yearId: 'Y2024', yearName: '2024-2025' }
      ]);
      
      // Fetch mock faculty data
      setFacultyList([
        { _id: '1', facultyId: 'F001', facultyName: 'Dr. Smith', enrollmentNo: 'EMP001', programId: 'PR001', yearId: 'Y2023', examCenterId: 'EC001', facultyType: 'Internal' },
        { _id: '2', facultyId: 'F002', facultyName: 'Dr. Johnson', enrollmentNo: 'EMP002', programId: 'PR002', yearId: 'Y2023', examCenterId: 'EC002', facultyType: 'External' },
        { _id: '3', facultyId: 'F003', facultyName: 'Dr. Brown', enrollmentNo: 'EMP003', programId: 'PR001', yearId: 'Y2024', examCenterId: 'EC001', facultyType: 'Internal' }
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFacultySelect = (facultyId) => {
    setSelectedFaculty(prev => 
      prev.includes(facultyId) 
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFaculty.length === filteredFaculty.length) {
      setSelectedFaculty([]);
    } else {
      setSelectedFaculty(filteredFaculty.map(faculty => faculty._id));
    }
  };

  const generateDummyIds = async (type = 'preview') => {
    if (selectedFaculty.length === 0) {
      toast.error('Please select at least one faculty member');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (type === 'download') {
        // Create mock PDF download
        const link = document.createElement('a');
        link.href = '#';
        link.setAttribute('download', `faculty-dummy-ids-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Faculty dummy IDs generated successfully');
      } else {
        toast.success('Faculty dummy IDs preview generated');
      }
    } catch (error) {
      console.error('Error generating dummy IDs:', error);
      toast.error('Failed to generate dummy IDs');
    } finally {
      setLoading(false);
    }
  };

  const printDummyIds = () => {
    if (selectedFaculty.length === 0) {
      toast.error('Please select at least one faculty member');
      return;
    }

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Faculty Dummy IDs</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .faculty-card { border: 1px solid #ccc; padding: 10px; margin: 10px 0; page-break-inside: avoid; }
              .dummy-id { font-size: 18px; font-weight: bold; color: #333; }
            </style>
          </head>
          <body>
            <h1>Faculty Dummy IDs</h1>
            ${selectedFaculty.map(id => {
              const faculty = facultyList.find(f => f._id === id);
              return faculty ? `
                <div class="faculty-card">
                  <div><strong>Name:</strong> ${faculty.facultyName}</div>
                  <div><strong>Original ID:</strong> ${faculty.facultyId}</div>
                  <div class="dummy-id"><strong>Dummy ID:</strong> DUMMY-${Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                </div>
              ` : '';
            }).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const clearFilters = () => {
    setFilters({
      examCenterId: '',
      programId: '',
      yearId: '',
      facultyType: ''
    });
    setSearchTerm('');
  };

  const filteredFaculty = facultyList.filter(faculty => {
    const matchesSearch = 
      faculty.facultyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.facultyId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (!filters.examCenterId || faculty.examCenterId === filters.examCenterId) &&
      (!filters.programId || faculty.programId === filters.programId) &&
      (!filters.yearId || faculty.yearId === filters.yearId) &&
      (!filters.facultyType || faculty.facultyType === filters.facultyType);
    
    return matchesSearch && matchesFilters;
  });

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
        <h1 className="text-2xl font-bold">Generate Faculty Dummy ID Sticker</h1>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaFilter className="mr-2" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center</label>
            <select
              value={filters.examCenterId}
              onChange={(e) => handleFilterChange('examCenterId', e.target.value)}
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Type</label>
            <select
              value={filters.facultyType}
              onChange={(e) => handleFilterChange('facultyType', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by faculty name, enrollment no, or faculty ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generateDummyIds('download')}
              disabled={selectedFaculty.length === 0 || loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Download PDF
            </button>
            <button
              onClick={printDummyIds}
              disabled={selectedFaculty.length === 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Faculty List ({filteredFaculty.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    checked={selectedFaculty.length === filteredFaculty.length && filteredFaculty.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredFaculty.length > 0 ? (
                filteredFaculty.map((faculty) => (
                  <tr key={faculty._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFaculty.includes(faculty._id)}
                        onChange={() => handleFacultySelect(faculty._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{faculty.facultyId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{faculty.facultyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{faculty.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getProgramName(faculty.programId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getYearName(faculty.yearId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getExamCenterName(faculty.examCenterId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        faculty.facultyType === 'Internal' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {faculty.facultyType}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No faculty found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GenerateFacultyDummyId;