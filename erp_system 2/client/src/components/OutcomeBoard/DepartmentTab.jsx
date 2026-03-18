import { useState } from 'react';
import { motion } from 'framer-motion';

const DepartmentTab = ({ onFilterChange }) => {
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  // Sample data - in a real app, this would come from an API
  const institutes = ['AICTE', 'UGC', 'NBA', 'NAAC', 'NIRF'];
  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];

  const handleInstituteChange = (e) => {
    setSelectedInstitute(e.target.value);
    setIsApplied(false);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setIsApplied(false);
  };
  
  const handleApply = () => {
    if (selectedInstitute || selectedDepartment) {
      onFilterChange({ institute: selectedInstitute, department: selectedDepartment });
      setIsApplied(true);
    }
  };
  
  const clearInstitute = () => {
    setSelectedInstitute('');
    setIsApplied(false);
    onFilterChange({ institute: '', department: selectedDepartment });
  };
  
  const clearDepartment = () => {
    setSelectedDepartment('');
    setIsApplied(false);
    onFilterChange({ institute: selectedInstitute, department: '' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 sm:p-4 rounded-lg shadow-md"
    >
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white border-b border-gray-700 pb-2 text-center sm:text-left">Department Selection</h2>
      
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="institute-select" className="block text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2 text-center sm:text-left">Institute</label>
          <select
            id="institute-select"
            value={selectedInstitute}
            onChange={handleInstituteChange}
            className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-600 bg-gray-700 text-white shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-xs sm:text-sm transition-all duration-200"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
          >
            <option value="">Select Institute</option>
            {institutes.map((institute) => (
              <option key={institute} value={institute}>{institute}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department-select" className="block text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2 text-center sm:text-left">Department (DE)</label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-600 bg-gray-700 text-white shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-xs sm:text-sm transition-all duration-200"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <button
            onClick={handleApply}
            disabled={!selectedInstitute && !selectedDepartment}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${(!selectedInstitute && !selectedDepartment) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
          >
            Apply Filters
          </button>
        </div>
        
        {isApplied && (
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800">
            <h3 className="text-xs sm:text-sm font-medium text-blue-400 mb-2 text-center sm:text-left">Applied Filters:</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {selectedInstitute && (
                <div className="flex items-center bg-blue-900/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm">
                  <span>Institute: {selectedInstitute}</span>
                  <button 
                    onClick={clearInstitute}
                    className="ml-1 sm:ml-2 text-blue-200 hover:text-white focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {selectedDepartment && (
                <div className="flex items-center bg-blue-900/40 text-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm">
                  <span>Department: {selectedDepartment}</span>
                  <button 
                    onClick={clearDepartment}
                    className="ml-1 sm:ml-2 text-blue-200 hover:text-white focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>  
        )}
      </div>
    </motion.div>
  );
};

export default DepartmentTab;