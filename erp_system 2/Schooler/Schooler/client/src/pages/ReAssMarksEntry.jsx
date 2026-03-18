import React, { useState } from 'react';
import { FaEdit, FaCheck, FaShare, FaRedo, FaFileExcel, FaDownload, FaUpload } from 'react-icons/fa';

const ReAssMarksEntry = () => {
  const [filters, setFilters] = useState({
    institute: '',
    year: '',
    semester: '',
    program: '',
    student: '',
    subject: ''
  });
  const [marksData, setMarksData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log('Searching with filters:', filters);
  };

  const handleAction = (action, studentId) => {
    // Placeholder for action buttons
    console.log(action, 'for student', studentId);
  };

  const handleResultAction = (action) => {
    // Placeholder for result action buttons
    console.log(action);
  };

  const handleExcelAction = (action) => {
    // Placeholder for Excel action buttons
    console.log(action);
  };

  // Dummy data for the table
  const dummyData = [
    { id: 1, student: 'John Doe', semester: '3', subject: 'Mathematics', type: 'Re-evaluation', marks: 75 },
    { id: 2, student: 'Jane Smith', semester: '3', subject: 'Physics', type: 'Re-evaluation', marks: 80 },
  ];

  React.useEffect(() => {
    setMarksData(dummyData);
  }, []);

  const filteredData = marksData.filter(item =>
    item.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Re-assessment Marks Entry</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="institute" placeholder="Institute" value={filters.institute} onChange={handleFilterChange} className="p-2 border rounded" />
          <input type="text" name="year" placeholder="Year" value={filters.year} onChange={handleFilterChange} className="p-2 border rounded" />
          <input type="text" name="semester" placeholder="Semester" value={filters.semester} onChange={handleFilterChange} className="p-2 border rounded" />
          <input type="text" name="program" placeholder="Program" value={filters.program} onChange={handleFilterChange} className="p-2 border rounded" />
          <input type="text" name="student" placeholder="Student" value={filters.student} onChange={handleFilterChange} className="p-2 border rounded" />
          <input type="text" name="subject" placeholder="Subject" value={filters.subject} onChange={handleFilterChange} className="p-2 border rounded" />
        </div>
        <div className="flex justify-end mb-4">
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
        </div>

        {/* Table */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Student</th>
                <th className="py-2 px-4 border-b">Semester</th>
                <th className="py-2 px-4 border-b">Subject</th>
                <th className="py-2 px-4 border-b">Type (Reason)</th>
                <th className="py-2 px-4 border-b">Marks</th>
                <th className="py-2 px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id}>
                  <td className="py-2 px-4 border-b">{item.student}</td>
                  <td className="py-2 px-4 border-b">{item.semester}</td>
                  <td className="py-2 px-4 border-b">{item.subject}</td>
                  <td className="py-2 px-4 border-b">{item.type}</td>
                  <td className="py-2 px-4 border-b">{item.marks}</td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => handleAction('edit', item.id)} className="text-blue-500 mr-2"><FaEdit /></button>
                    <button onClick={() => handleAction('approve', item.id)} className="text-green-500 mr-2"><FaCheck /></button>
                    <button onClick={() => handleAction('publish', item.id)} className="text-purple-500 mr-2"><FaShare /></button>
                    <button onClick={() => handleAction('re-evaluate', item.id)} className="text-red-500"><FaRedo /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Result Actions */}
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={() => handleResultAction('publish')} className="bg-green-500 text-white px-4 py-2 rounded">Publish Result</button>
          <button onClick={() => handleResultAction('communicate')} className="bg-yellow-500 text-white px-4 py-2 rounded">Communicate Result</button>
          <button onClick={() => handleResultAction('print')} className="bg-blue-500 text-white px-4 py-2 rounded">Print Result</button>
        </div>
      </div>

      {/* Excel Actions */}
      <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
        <h2 className="text-xl font-bold mb-4">Excel Operations</h2>
        <div className="flex space-x-2">
          <button onClick={() => handleExcelAction('upload')} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"><FaUpload className="mr-2" /> Upload</button>
          <button onClick={() => handleExcelAction('download_template')} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center"><FaDownload className="mr-2" /> Download Template</button>
          <button onClick={() => handleExcelAction('export')} className="bg-green-500 text-white px-4 py-2 rounded flex items-center"><FaFileExcel className="mr-2" /> Export</button>
        </div>
      </div>
    </div>
  );
};

export default ReAssMarksEntry;
''