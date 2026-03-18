import { useState } from 'react';
import { motion } from 'framer-motion';
import PEOPSOPOBlock from './PEOPSOPOBlock';
import CourseOutcomeBlock from './CourseOutcomeBlock';
import MappingTable from './MappingTable';
import DepartmentTab from '../DepartmentTab';
import StatementTabs from '../StatementTabs';

export default function MappingPage() {
  // Department state
  const [selected, setSelected] = useState({ id: 1, name: 'Department of Mechanical Engineering' });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('mapping');
  
  // Handle filter changes from DepartmentTab
  const handleFilterChange = (filters) => {
    if (filters.department) {
      setSelected({ id: 1, name: `Department of ${filters.department}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto"
      >

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'co' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('co')}
            >
              Course Outcomes
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'peo' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('peo')}
            >
              PEO/PO/PSO
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'mapping' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setActiveTab('mapping')}
            >
              Mapping
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'co' && <CourseOutcomeBlock />}
          {activeTab === 'peo' && <PEOPSOPOBlock />}
          {activeTab === 'mapping' && <MappingTable />}
        </div>

        <footer className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>© Logixicaschooler.com - Interactive Outcome Board</p>
        </footer>
      </motion.div>
    </div>
  );
}