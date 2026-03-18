import { useState, useEffect } from 'react';
import DepartmentTab from './DepartmentTab';
import OutcomeTabs from './OutcomeTabs';
import StatementTabs from './StatementTabs';
import PEOPSOPOBlock from './Mapping/PEOPSOPOBlock';
import CourseOutcomeBlock from './Mapping/CourseOutcomeBlock';
import CourseOutcomeAccordion from './Mapping/CourseOutcomeAccordion';
import { SubjectList } from '../MasterData';

const MastersSection = ({ section = 'all' }) => {
  const [filters, setFilters] = useState({
    co: '',
    department: '',
    course: ''
  });
  
  const [activeSection, setActiveSection] = useState(section);
  
  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Get section title based on active section
  const getSectionTitle = () => {
    switch(activeSection) {
      case 'department':
        return 'Department Management';
      case 'vision':
        return 'Vision Statements';
      case 'mission':
        return 'Mission Statements';
      case 'po':
        return 'Program Outcomes (PO)';
      case 'co':
        return 'Course Outcomes (CO)';
      default:
        return 'Outcome Based Learning - Masters';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-4 md:p-6">
      <div className="container mx-auto px-2 sm:px-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-white text-center sm:text-left">{getSectionTitle()}</h1>
        
        {activeSection === 'all' || activeSection === 'department' ? (
          <div className="mb-8">
            {/* Department Management Section */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Department Management</h2>
              <p className="text-gray-300 mb-4">Select institute and department to view related content.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DepartmentTab onFilterChange={handleFilterChange} />
                
                {/* Department Content Section - Shows based on selected filters */}
                <div className="bg-gray-700 rounded-lg p-4 shadow-md">
                  {!filters.institute && !filters.department ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-center">Please select an institute and department to view details</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-400">
                        {filters.institute ? filters.institute : 'All Institutes'} {filters.department ? ' - ' + filters.department : ''}
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gray-800 p-3 rounded">
                          <h4 className="font-medium text-white mb-2">Department Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-400">Department Code:</div>
                            <div className="text-white">
                              {filters.department === 'Computer Science' && 'CSE01'}
                              {filters.department === 'Electrical Engineering' && 'EEE01'}
                              {filters.department === 'Mechanical Engineering' && 'MEC01'}
                              {filters.department === 'Civil Engineering' && 'CIV01'}
                              {!filters.department && '-'}
                            </div>
                            <div className="text-gray-400">Established:</div>
                            <div className="text-white">
                              {filters.department === 'Computer Science' && '2010'}
                              {filters.department === 'Electrical Engineering' && '2008'}
                              {filters.department === 'Mechanical Engineering' && '2005'}
                              {filters.department === 'Civil Engineering' && '2003'}
                              {!filters.department && '-'}
                            </div>
                            <div className="text-gray-400">Faculty Count:</div>
                            <div className="text-white">
                              {filters.department === 'Computer Science' && '32'}
                              {filters.department === 'Electrical Engineering' && '28'}
                              {filters.department === 'Mechanical Engineering' && '24'}
                              {filters.department === 'Civil Engineering' && '20'}
                              {!filters.department && '-'}
                            </div>
                            <div className="text-gray-400">Student Count:</div>
                            <div className="text-white">
                              {filters.department === 'Computer Science' && '520'}
                              {filters.department === 'Electrical Engineering' && '450'}
                              {filters.department === 'Mechanical Engineering' && '380'}
                              {filters.department === 'Civil Engineering' && '320'}
                              {!filters.department && '-'}
                            </div>
                            <div className="text-gray-400">HOD:</div>
                            <div className="text-white">
                              {filters.department === 'Computer Science' && 'Dr. Rajesh Kumar'}
                              {filters.department === 'Electrical Engineering' && 'Dr. Sunil Sharma'}
                              {filters.department === 'Mechanical Engineering' && 'Dr. Amit Patel'}
                              {filters.department === 'Civil Engineering' && 'Dr. Priya Singh'}
                              {!filters.department && '-'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-3 rounded">
                          <h4 className="font-medium text-white mb-2">Programs Offered</h4>
                          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                            {filters.department === 'Computer Science' && (
                              <>
                                <li>B.Tech in Computer Science & Engineering</li>
                                <li>M.Tech in Computer Science & Engineering</li>
                                <li>M.Tech in Artificial Intelligence</li>
                                <li>M.Tech in Data Science</li>
                                <li>PhD in Computer Science</li>
                              </>
                            )}
                            {filters.department === 'Electrical Engineering' && (
                              <>
                                <li>B.Tech in Electrical Engineering</li>
                                <li>B.Tech in Electronics & Communication</li>
                                <li>M.Tech in Power Systems</li>
                                <li>M.Tech in Control Systems</li>
                                <li>PhD in Electrical Engineering</li>
                              </>
                            )}
                            {filters.department === 'Mechanical Engineering' && (
                              <>
                                <li>B.Tech in Mechanical Engineering</li>
                                <li>M.Tech in Thermal Engineering</li>
                                <li>M.Tech in Manufacturing Technology</li>
                                <li>M.Tech in CAD/CAM</li>
                                <li>PhD in Mechanical Engineering</li>
                              </>
                            )}
                            {filters.department === 'Civil Engineering' && (
                              <>
                                <li>B.Tech in Civil Engineering</li>
                                <li>M.Tech in Structural Engineering</li>
                                <li>M.Tech in Environmental Engineering</li>
                                <li>M.Tech in Transportation Engineering</li>
                                <li>PhD in Civil Engineering</li>
                              </>
                            )}
                            {!filters.department && (
                              <>
                                <li>B.Tech Programs</li>
                                <li>M.Tech Programs</li>
                                <li>PhD Programs</li>
                              </>
                            )}
                          </ul>
                        </div>
                        
                        {filters.institute && (
                          <div className="bg-gray-800 p-3 rounded">
                            <h4 className="font-medium text-white mb-2">Accreditation Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-400">Accredited By:</div>
                              <div className="text-white">{filters.institute}</div>
                              <div className="text-gray-400">Status:</div>
                              <div className="text-white">Approved</div>
                              <div className="text-gray-400">Valid Till:</div>
                              <div className="text-white">2025</div>
                              <div className="text-gray-400">Grade:</div>
                              <div className="text-white">
                                {filters.institute === 'NAAC' && 'A+'}
                                {filters.institute === 'NBA' && 'Tier 1'}
                                {filters.institute === 'AICTE' && 'Approved'}
                                {filters.institute === 'UGC' && 'Recognized'}
                                {filters.institute === 'NIRF' && 'Rank 15'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {activeSection === 'all' || activeSection === 'vision' || activeSection === 'mission' ? (
          <div className="mb-8">
            {/* Vision & Mission Statements Section */}
            <StatementTabs initialTab={activeSection === 'mission' ? 1 : 0} />
          </div>
        ) : null}
        
        {activeSection === 'all' || activeSection === 'po' ? (
          <div className="mb-8">
            {/* Program Outcomes (PO) Section */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Program Outcomes (PO)</h2>
              <p className="text-gray-300 mb-4">Manage Program Outcomes, Program Educational Outcomes, and Program Specific Outcomes.</p>
              <PEOPSOPOBlock />
            </div>
          </div>
        ) : null}
        
        {activeSection === 'all' || activeSection === 'co' ? (
          <div className="mb-8">
            {/* Course Outcomes (CO) Section */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Course Outcomes (CO)</h2>
              <p className="text-gray-300 mb-4">Manage Course Information and Course Outcomes.</p>
              <CourseOutcomeAccordion />
              <div className="mt-6">
                <CourseOutcomeBlock />
              </div>
            </div>
          </div>
        ) : null}
        
        {activeSection === 'all' || activeSection === 'course' ? (
          <div className="mb-8">
            {/* Course Management Section */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Course Management</h2>
              <p className="text-gray-300 mb-4">Manage courses, their details, and associated outcomes.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Course Filters</h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="department-filter" className="block text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2">Department</label>
                      <select
                        id="department-filter"
                        value={filters.department}
                        onChange={(e) => handleFilterChange({...filters, department: e.target.value})}
                        className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-600 bg-gray-700 text-white shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-xs sm:text-sm transition-all duration-200"
                        style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')" , backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
                      >
                        <option value="">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="course-type-filter" className="block text-xs sm:text-sm font-medium text-blue-400 mb-1 sm:mb-2">Course Type</label>
                      <select
                        id="course-type-filter"
                        value={filters.course}
                        onChange={(e) => handleFilterChange({...filters, course: e.target.value})}
                        className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-600 bg-gray-700 text-white shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-xs sm:text-sm transition-all duration-200"
                        style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')" , backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
                      >
                        <option value="">All Course Types</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="MCA">MCA</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => handleFilterChange({...filters})}
                        className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 shadow-md">
                  {!filters.department && !filters.course ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-gray-400 text-center">Please select department and course type to view courses</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-blue-400">
                        {filters.department ? filters.department : 'All Departments'} {filters.course ? ' - ' + filters.course : ''}
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gray-800 p-3 rounded">
                          <h4 className="font-medium text-white mb-2">Available Courses</h4>
                          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                            {filters.department === 'Computer Science' && (
                              <>
                                <li>Introduction to Programming</li>
                                <li>Data Structures and Algorithms</li>
                                <li>Database Management Systems</li>
                                <li>Computer Networks</li>
                                <li>Operating Systems</li>
                              </>
                            )}
                            {filters.department === 'Electrical Engineering' && (
                              <>
                                <li>Circuit Theory</li>
                                <li>Digital Electronics</li>
                                <li>Power Systems</li>
                                <li>Control Systems</li>
                                <li>Microprocessors</li>
                              </>
                            )}
                            {filters.department === 'Mechanical Engineering' && (
                              <>
                                <li>Engineering Mechanics</li>
                                <li>Thermodynamics</li>
                                <li>Fluid Mechanics</li>
                                <li>Machine Design</li>
                                <li>Manufacturing Processes</li>
                              </>
                            )}
                            {filters.department === 'Civil Engineering' && (
                              <>
                                <li>Structural Analysis</li>
                                <li>Geotechnical Engineering</li>
                                <li>Transportation Engineering</li>
                                <li>Environmental Engineering</li>
                                <li>Surveying</li>
                              </>
                            )}
                            {!filters.department && (
                              <>
                                <li>Introduction to Engineering</li>
                                <li>Engineering Mathematics</li>
                                <li>Engineering Physics</li>
                                <li>Engineering Chemistry</li>
                                <li>Communication Skills</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
      </div>
    </div>
  );
};

export default MastersSection;