import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getStorageData, setStorageData } from '../../services/storageService';

const StatementTabs = ({ initialTab = 0 }) => {
  // Convert initialTab index to tab ID
  const getInitialTabId = () => {
    const tabs = ['vision', 'mission', 'advisory'];
    return tabs[initialTab] || 'vision';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTabId());
  const [newStatement, setNewStatement] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');

  const tabs = [
    { id: 'mission', label: 'Mission', tooltip: 'Click to view Mission details...' },
    { id: 'vision', label: 'Vision', tooltip: 'Click to view Vision details...' },
    { id: 'advisory', label: 'Advisory', tooltip: 'Click to view Advisory details...' },
  ];

  // Default content to use if nothing is in localStorage
  const defaultContent = {
    mission: [
      { id: 1, text: 'M1: To provide inclusive and quality education.' },
      { id: 2, text: 'M2: To develop ethically sound professionals.' },
      { id: 3, text: 'M3: To foster innovation and lifelong learning.' },
    ],
    vision: [
      { id: 1, text: 'V1: To be a global leader in higher education.' },
      { id: 2, text: 'V2: To integrate innovation, research, and development.' },
    ],
    advisory: [
      { id: 1, text: 'A1: Industry expert panel involvement.' },
      { id: 2, text: 'A2: Faculty and mentor advisory boards.' },
    ],
  };
  
  // Initialize with empty arrays that will be populated from localStorage
  const [tabContent, setTabContent] = useState(defaultContent);

  const toggleTab = (tabId) => {
    setActiveTab(activeTab === tabId ? null : tabId);
  };

  const handleAddStatement = () => {
    if (newStatement.trim() === '') return;
    
    try {
      setTabContent(prevContent => {
        const currentTabItems = [...prevContent[activeTab]];
        const newId = currentTabItems.length > 0 ? Math.max(...currentTabItems.map(item => item.id)) + 1 : 1;
        
        // Create prefix based on active tab (M for Mission, V for Vision, A for Advisory)
        const prefix = activeTab === 'mission' ? 'M' : activeTab === 'vision' ? 'V' : 'A';
        const newItem = { 
          id: newId, 
          text: `${prefix}${newId}: ${newStatement}` 
        };
        
        const updatedContent = {
          ...prevContent,
          [activeTab]: [...currentTabItems, newItem]
        };
        
        // Save to localStorage using the storage service
        setStorageData('statementTabsContent', updatedContent);
        
        // Show success message
        if (typeof toast !== 'undefined') {
          toast.success(`${prefix}${newId} added successfully!`);
        }
        
        return updatedContent;
      });
      
      setNewStatement('');
    } catch (error) {
      console.error('Error adding statement:', error);
      if (typeof toast !== 'undefined') {
        toast.error('Failed to add statement. Please try again.');
      }
    }
  };

  const handleDeleteStatement = (id) => {
    try {
      setTabContent(prevContent => {
        // Find the item to be deleted (for the success message)
        const itemToDelete = prevContent[activeTab].find(item => item.id === id);
        
        const updatedItems = prevContent[activeTab].filter(item => item.id !== id);
        const updatedContent = {
          ...prevContent,
          [activeTab]: updatedItems
        };
        
        // Save to localStorage using the storage service
        setStorageData('statementTabsContent', updatedContent);
        
        // Show success message
        if (typeof toast !== 'undefined' && itemToDelete) {
          const prefix = itemToDelete.text.split(':')[0];
          toast.success(`${prefix} deleted successfully!`);
        }
        
        return updatedContent;
      });
    } catch (error) {
      console.error('Error deleting statement:', error);
      if (typeof toast !== 'undefined') {
        toast.error('Failed to delete statement. Please try again.');
      }
    }
  };

  const startEditing = (item) => {
    setEditingItem(item.id);
    // Extract the content part after the prefix (e.g., "M1: ")
    const contentPart = item.text.split(': ')[1] || '';
    setEditText(contentPart);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditText('');
  };

  const saveEdit = (id) => {
    if (editText.trim() === '') return;

    try {
      setTabContent(prevContent => {
        const updatedItems = prevContent[activeTab].map(item => {
          if (item.id === id) {
            // Preserve the prefix part (e.g., "M1: ")
            const prefix = item.text.split(': ')[0] + ': ';
            return { ...item, text: prefix + editText };
          }
          return item;
        });

        const updatedContent = {
          ...prevContent,
          [activeTab]: updatedItems
        };
        
        // Save to localStorage using the storage service
        setStorageData('statementTabsContent', updatedContent);
        
        // Show success message
        if (typeof toast !== 'undefined') {
          const updatedItem = updatedItems.find(item => item.id === id);
          if (updatedItem) {
            const prefix = updatedItem.text.split(':')[0];
            toast.success(`${prefix} updated successfully!`);
          }
        }
        
        return updatedContent;
      });

      setEditingItem(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating statement:', error);
      if (typeof toast !== 'undefined') {
        toast.error('Failed to update statement. Please try again.');
      }
    }
  };

  // Load saved content from localStorage when component mounts
  useEffect(() => {
    // Use the storage service to get data
    const savedContent = getStorageData('statementTabsContent', defaultContent);
    setTabContent(savedContent);
  }, []);

  return (
    <div className="mt-6 sm:mt-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white text-center sm:text-left">Statements</h2>
      
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:space-x-1 mb-4">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative group">
            <button
              onClick={() => toggleTab(tab.id)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {tab.label}
            </button>
            
            {/* Tooltip - Hidden on mobile, visible on larger screens */}
            <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {tab.tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeTab && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-white text-center sm:text-left">{tabs.find(tab => tab.id === activeTab)?.label} Statement</h3>
              <ul className="space-y-2">
                {tabContent[activeTab].map((item) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: item.id * 0.1 }}
                    className="flex flex-col sm:flex-row items-start group bg-gray-700/30 p-2 sm:p-3 rounded-md"
                  >
                    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-600 text-white text-xs font-medium mr-2 sm:mr-3 mt-1">
                      {item.id}
                    </span>
                    
                    {editingItem === item.id ? (
                      <div className="flex-1 w-full mt-2 sm:mt-0">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none mb-2"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row w-full flex-1 items-start justify-between">
                        <span className="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">{item.text}</span>
                        <div className="flex space-x-2 sm:opacity-0 group-hover:sm:opacity-100 transition-opacity self-end sm:self-start mt-2 sm:mt-0">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStatement(item.id)}
                            className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
              
              {/* Add new statement form */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-700">
                <h4 className="text-xs sm:text-sm font-medium mb-2 text-blue-400 text-center sm:text-left">Add New {tabs.find(tab => tab.id === activeTab)?.label} Statement</h4>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <input
                    type="text"
                    value={newStatement}
                    onChange={(e) => setNewStatement(e.target.value)}
                    placeholder={`Enter new ${activeTab} statement...`}
                    className="flex-1 p-2 text-sm rounded-md border border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddStatement}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
                    disabled={!newStatement.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatementTabs;