import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CourseOutcomeAccordion() {
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Define the course outcomes with their descriptions
  const courseOutcomes = [
    { id: 'CO1', description: 'Illustrate and solve linear programming pr[oblems K2& K3]' },
    { id: 'CO2', description: 'Solve transportation and assignment problems. [K2 &K3]' },
    { id: 'CO3', description: 'Select the suitable sequencing and solve waiting line theory problems [K2 & K3].' },
    { id: 'CO4', description: 'Solve network models and replacement problems[K3]' },
    { id: 'CO5', description: 'Analyze game theory & Dynamic programming [K2& K3]' },
  ];
  
  // Handle item click
  const handleItemClick = (item) => {
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null); // Toggle off if already selected
    } else {
      setSelectedItem(item); // Select new item
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
        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Course Outcomes</h2>
        
        {/* Horizontal Tabs for COs */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-blue-400 mb-2">Course Outcomes (COs)</h3>
          <div className="flex flex-wrap gap-2">
            {courseOutcomes.map((item) => (
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