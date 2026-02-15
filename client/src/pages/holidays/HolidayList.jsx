import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HolidayList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOn, setSearchOn] = useState('all');
  const [year, setYear] = useState('2025');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const holidays = [
    { id: 1, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '30-Sep-25', day: 'Tuesday', name: 'ASTHAMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 2, organization: 'BOMBAIM', location: 'Kolkata Good earth', date: '14-Mar-25', day: 'Friday', name: 'BENGALI HOLI DA...', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 3, organization: 'BOMBAIM', location: 'Kolkata_Frontend', date: '14-Mar-25', day: 'Friday', name: 'BENGALI HOLI DA...', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 4, organization: 'BOMBAIM', location: 'Kolkata_Frontend', date: '02-Oct-25', day: 'Thursday', name: 'DASHMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 5, organization: 'BOMBAIM', location: 'Kolkata Good earth', date: '02-Oct-25', day: 'Thursday', name: 'DASHMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 6, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '20-Oct-25', day: 'Monday', name: 'Diwali', insertedOn: '18-Oct-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 7, organization: 'BOMBAIM', location: 'Mumbai_Frontend', date: '20-Oct-25', day: 'Monday', name: 'Diwali', insertedOn: '18-Oct-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'Maharashtra' },
    { id: 8, organization: 'BOMBAIM', location: 'Mumbai_Frontend', date: '21-Oct-25', day: 'Tuesday', name: 'Diwali', insertedOn: '23-Oct-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'Maharashtra' },
    { id: 9, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '02-Oct-25', day: 'Thursday', name: 'Dussehra/Gandhi...', insertedOn: '31-Jul-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 10, organization: 'BOMBAIM', location: 'Mumbai_Frontend', date: '06-Sep-25', day: 'Saturday', name: 'GANPATI VISARJA...', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'Maharashtra' },
    { id: 11, organization: 'BOMBAIM', location: 'Mumbai_Frontend', date: '14-Mar-25', day: 'Friday', name: 'HOLI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'Maharashtra' },
    { id: 12, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '14-Mar-25', day: 'Friday', name: 'HOLI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 13, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '15-Aug-25', day: 'Friday', name: 'INDEPENDENCE DA...', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 14, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '01-Oct-25', day: 'Wednesday', name: 'NAVAMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 15, organization: 'BOMBAIM', location: 'Kolkata_Frontend', date: '01-Oct-25', day: 'Wednesday', name: 'NAVAMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 16, organization: 'BOMBAIM', location: 'Kolkata Good earth', date: '01-Oct-25', day: 'Wednesday', name: 'NAVAMI', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 17, organization: 'BOMBAIM', location: 'Kolkata Good earth', date: '01-Jan-25', day: 'Wednesday', name: 'New year', insertedOn: '01-Aug-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 18, organization: 'BOMBAIM', location: 'Kolkata_Frontend', date: '01-Jan-25', day: 'Wednesday', name: 'New Year', insertedOn: '01-Aug-25', insertedBy: 'admin', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 19, organization: 'BOMBAIM', location: 'Mumbai_Frontend', date: '01-Jan-25', day: 'Wednesday', name: 'NEW YEAR', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'Maharashtra' },
    { id: 20, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '26-Jan-25', day: 'Sunday', name: 'REPUBLIC DAY', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
    { id: 21, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '26-Jan-25', day: 'Sunday', name: 'REPUBLIC DAY', insertedOn: '31-Jul-25', insertedBy: 'Deepali', updatedOn: '', updatedBy: '', state: 'West Bengal' },
  ];

  const filteredHolidays = holidays.filter(holiday => {
    const searchTermLower = searchTerm.toLowerCase();
    if (searchOn === 'all') {
      return Object.values(holiday).some(val =>
        String(val).toLowerCase().includes(searchTermLower)
      );
    } else {
      return String(holiday[searchOn]).toLowerCase().includes(searchTermLower);
    }
  }).filter(holiday => holiday.date.endsWith(year.slice(-2)));

  const totalRecords = filteredHolidays.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const currentRecords = filteredHolidays.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleRowClick = (holiday) => {
    navigate(`/master/holiday-master/edit/${holiday.id}`);
  };

  const handleNew = () => {
    navigate('/master/holiday-master/new');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">HOME {'>'} ORG SET UP {'>'} HOLIDAY MASTER</h1>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <button className="bg-gray-200 px-4 py-2 rounded-md">Past Holidays</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-md">Future Holidays</button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded-md">Optional Holidays</button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <button onClick={handleNew} className="bg-blue-500 text-white px-4 py-2 rounded-md">New</button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded-md">Bulk Upload</button>
          <div>
            <label>Search On</label>
            <select value={searchOn} onChange={e => setSearchOn(e.target.value)} className="border p-1 rounded-md">
              <option value="all">All</option>
              <option value="organization">Organization</option>
              <option value="location">Location</option>
              <option value="name">Holiday Name</option>
              <option value="state">State</option>
            </select>
          </div>
          <div>
            <label>Search Text</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border p-1 rounded-md" />
          </div>
          <div>
            <label>Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="border p-1 rounded-md">
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
          <div className="flex items-center">
            <label>Page</label>
            <input type="number" value={currentPage} onChange={e => setCurrentPage(Number(e.target.value))} className="border w-16 p-1 rounded-md mx-2" />
            <span>out of {totalPages}</span>
            <button className="bg-green-500 text-white p-1 rounded-md">Q</button>
          </div>
        </div>
        <div className="text-right mb-2">Records Count: {totalRecords}</div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-yellow-200">
              <tr>
                {['SR.', 'ORGANIZATION', 'LOCATION', 'HOLIDAY DATE', 'DAY', 'HOLIDAY NAME', 'INSERTED ON', 'INSERTED BY', 'UPDATED ON', 'UPDATED BY', 'STATE'].map(header => (
                  <th key={header} className="py-2 px-4 border-b">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((holiday, index) => (
                <tr key={holiday.id} onClick={() => handleRowClick(holiday)} className="cursor-pointer hover:bg-gray-100">
                  <td className="py-2 px-4 border-b text-center">{(currentPage - 1) * recordsPerPage + index + 1}</td>
                  <td className="py-2 px-4 border-b">{holiday.organization}</td>
                  <td className="py-2 px-4 border-b">{holiday.location}</td>
                  <td className="py-2 px-4 border-b">{holiday.date}</td>
                  <td className="py-2 px-4 border-b">{holiday.day}</td>
                  <td className="py-2 px-4 border-b">{holiday.name}</td>
                  <td className="py-2 px-4 border-b">{holiday.insertedOn}</td>
                  <td className="py-2 px-4 border-b">{holiday.insertedBy}</td>
                  <td className="py-2 px-4 border-b">{holiday.updatedOn}</td>
                  <td className="py-2 px-4 border-b">{holiday.updatedBy}</td>
                  <td className="py-2 px-4 border-b">{holiday.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HolidayList;