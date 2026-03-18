import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OutcomeAccordion from './OutcomeAccordion';

export default function PEOPSOPOBlock() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  
  // Define the categories and their items
  const outcomes = [
    { id: 'PEO1', type: 'PEO', description: 'Excel in profession with sound knowledge in mathematics and applied sciences.' },
    { id: 'PEO2', type: 'PEO', description: 'Demonstrate leadership qualities and team spirit in achieving goals.' },
    { id: 'PEO3', type: 'PEO', description: 'Pursue higher studies to ace in research and develop as entrepreneurs.' },
    { id: 'PSO1', type: 'PSO', description: 'Apply knowledge of modern tools in manufacturing enabling to conquer the challenges of modern industry.' },
    { id: 'PSO2', type: 'PSO', description: 'Design various thermal engineering systems by applying the principles of thermal sciences.' },
    { id: 'PSO3', type: 'PSO', description: 'Design different mechanisms and machine components for transmission of power and automation in modern industry.' },
    { id: 'PO1', type: 'PO', description: 'Apply knowledge of math, science, and engineering fundamentals to solve complex problems.' },
    { id: 'PO2', type: 'PO', description: 'Identify, analyze, and conclude on complex problems using first principles.' },
    { id: 'PO3', type: 'PO', description: 'Design solutions and systems considering public health, safety, and environment.' },
    { id: 'PO4', type: 'PO', description: 'Conduct investigations using research-based methods and valid conclusions.' },
    { id: 'PO5', type: 'PO', description: 'Use modern engineering tools, software, and equipment with understanding of limitations.' },
    { id: 'PO6', type: 'PO', description: 'Apply contextual knowledge to assess societal, legal, and cultural issues.' },
    { id: 'PO7', type: 'PO', description: 'Understand and demonstrate sustainable development practices.' },
    { id: 'PO8', type: 'PO', description: 'Apply ethical principles and fulfill engineering responsibilities.' },
    { id: 'PO9', type: 'PO', description: 'Work individually and in teams, including multidisciplinary settings.' },
    { id: 'PO10', type: 'PO', description: 'Communicate effectively through reports, design docs, presentations.' },
    { id: 'PO11', type: 'PO', description: 'Apply project and financial management knowledge in team projects.' },
    { id: 'PO12', type: 'PO', description: 'Pursue lifelong learning amidst technological changes.' }
  ];
  
  // Filter outcomes by type
  const peos = outcomes.filter(item => item.type === 'PEO');
  const psos = outcomes.filter(item => item.type === 'PSO');
  const pos = outcomes.filter(item => item.type === 'PO');
  
  // Handle item click
  const handleItemClick = (item) => {
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null); // Toggle off if already selected
      setSelectedType(null);
    } else {
      setSelectedItem(item); // Select new item
      setSelectedType(item.type);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full px-2 py-3 sm:px-0 mb-4"
    >
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Program Outcomes Management</h2>
        
        {/* Horizontal Tabs for PEOs */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-blue-400 mb-2">Program Educational Outcomes (PEOs)</h3>
          <div className="flex flex-wrap gap-2">
            {peos.map((item) => (
              <div key={item.id} className="w-full sm:w-auto">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 w-full ${selectedItem && selectedItem.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                >
                  {item.id}
                </button>
                <AnimatePresence>
                  {selectedItem && selectedItem.id === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-1"
                    >
                      <div className="p-3 bg-gray-800 rounded-b-md text-sm text-gray-300 border-l-2 border-blue-500">
                        {item.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        
        {/* Horizontal Tabs for PSOs */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-blue-400 mb-2">Program Specific Outcomes (PSOs)</h3>
          <div className="flex flex-wrap gap-2">
            {psos.map((item) => (
              <div key={item.id} className="w-full sm:w-auto">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 w-full ${selectedItem && selectedItem.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                >
                  {item.id}
                </button>
                <AnimatePresence>
                  {selectedItem && selectedItem.id === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-1"
                    >
                      <div className="p-3 bg-gray-800 rounded-b-md text-sm text-gray-300 border-l-2 border-blue-500">
                        {item.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        
        {/* Horizontal Tabs for POs */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-blue-400 mb-2">Program Outcomes (POs)</h3>
          <div className="flex flex-wrap gap-2">
            {pos.map((item) => (
              <div key={item.id} className="w-full sm:w-auto">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 w-full ${selectedItem && selectedItem.id === item.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                >
                  {item.id}
                </button>
                <AnimatePresence>
                  {selectedItem && selectedItem.id === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-1"
                    >
                      <div className="p-3 bg-gray-800 rounded-b-md text-sm text-gray-300 border-l-2 border-blue-500">
                        {item.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}