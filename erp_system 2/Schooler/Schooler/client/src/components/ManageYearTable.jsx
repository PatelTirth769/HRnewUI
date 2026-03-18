import { useState } from 'react';
import { FaEdit, FaDownload, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { toggleYearStatus } from '../services/manageYearService';
import { exportToExcel } from '../utils/excelUtils';

const ManageYearTable = ({ years, loading, onEdit, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter years based on search term
  const filteredYears = years.filter(year => 
    year.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
    year.yearId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    year.academy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredYears.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredYears.length / itemsPerPage);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleYearStatus(id);
      toast.success(`Year ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      console.error('Error toggling status:', error);
    }
  };

  const handleExport = () => {
    try {
      const dataToExport = filteredYears.map(({ _id, isDeleted, createdAt, updatedAt, __v, ...rest }) => ({
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate).toLocaleDateString() : '',
        endDate: rest.endDate ? new Date(rest.endDate).toLocaleDateString() : '',
        finalYear: rest.finalYear ? 'Yes' : 'No',
        active: rest.active ? 'Yes' : 'No'
      }));
      
      exportToExcel(dataToExport, 'academic_years');
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Academic Years</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaDownload className="mr-1" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              currentItems.map((year) => (
                <tr key={year._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.yearId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.instituteId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.academy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(year.startDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(year.endDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {year.finalYear ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${year.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {year.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(year)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(year._id, year.active)}
                        className={year.active ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                        title={year.active ? "Deactivate" : "Activate"}
                      >
                        {year.active ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredYears.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredYears.length)}
                </span>{' '}
                of <span className="font-medium">{filteredYears.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Last
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageYearTable;