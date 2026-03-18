import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { toast } from 'react-toastify';
import { getStorageData, setStorageData } from '../../../services/storageService';


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// SVG Icons
const PencilIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XMarkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function CourseOutcomeBlock() {
  const [selectedCO, setSelectedCO] = useState(() => 
    getStorageData('mapping_selectedCO', ''));
  const [selectedPO, setSelectedPO] = useState('');
  
  // State for CO editing
  const [isAddingCO, setIsAddingCO] = useState(false);
  const [isEditingCO, setIsEditingCO] = useState(false);
  const [newCOId, setNewCOId] = useState('');
  const [newCODescription, setNewCODescription] = useState('');
  const [editingCOId, setEditingCOId] = useState('');
  
  // Save selectedCO to localStorage whenever it changes
  useEffect(() => {
    setStorageData('mapping_selectedCO', selectedCO);
  }, [selectedCO]);
  
  // Function to add a new course outcome
  const handleAddCO = () => {
    if (!selectedCourseCode) return;
    if (!newCOId || !newCODescription) {
      toast.error('Please enter both CO ID and description');
      return;
    }
    
    // Check if CO ID already exists
    if (allCourseOutcomes[selectedCourseCode].some(co => co.id === newCOId)) {
      toast.error(`CO with ID ${newCOId} already exists`);
      return;
    }
    
    // Add new CO
    const updatedCOs = {
      ...allCourseOutcomes,
      [selectedCourseCode]: [
        ...allCourseOutcomes[selectedCourseCode],
        { id: newCOId, description: newCODescription }
      ]
    };
    
    // Update mapping data with default values for the new CO
    const updatedMappingData = {
      ...allMappingData
    };
    
    if (updatedMappingData[selectedCourseCode]) {
      // Filter out the average row
      const withoutAvg = updatedMappingData[selectedCourseCode].filter(row => row.co !== 'Avg.');
      
      // Add new CO mapping row
      withoutAvg.push({ co: newCOId, po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 });
      
      // Calculate new averages
      const avgRow = { co: 'Avg.' };
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(po => {
        const sum = withoutAvg.reduce((acc, curr) => acc + (curr[po] || 0), 0);
        avgRow[po] = parseFloat((sum / (withoutAvg.length || 1)).toFixed(1));
      });
      
      // Add average row back
      updatedMappingData[selectedCourseCode] = [...withoutAvg, avgRow];
    }
    
    setAllCourseOutcomes(updatedCOs);
    setAllMappingData(updatedMappingData);
    
    // Save to localStorage for persistence
    setStorageData('mapping_allMappingData', updatedMappingData);
    setStorageData('mapping_allCourseOutcomes', updatedCOs);
    
    setNewCOId('');
    setNewCODescription('');
    setIsAddingCO(false);
    toast.success('Course outcome added successfully');
  };
  
  // Function to start editing a course outcome
  const handleStartEditCO = (co) => {
    setEditingCOId(co.id);
    setNewCOId(co.id);
    setNewCODescription(co.description);
    setIsEditingCO(true);
  };
  
  // Function to update a course outcome
  const handleUpdateCO = () => {
    if (!selectedCourseCode || !editingCOId) return;
    if (!newCOId || !newCODescription) {
      toast.error('Please enter both CO ID and description');
      return;
    }
    
    // Check if new CO ID already exists (if changed) and is not the current one
    if (newCOId !== editingCOId && 
        allCourseOutcomes[selectedCourseCode].some(co => co.id === newCOId)) {
      toast.error(`CO with ID ${newCOId} already exists`);
      return;
    }
    
    // Update CO
    const updatedCOs = {
      ...allCourseOutcomes,
      [selectedCourseCode]: allCourseOutcomes[selectedCourseCode].map(co => 
        co.id === editingCOId ? { id: newCOId, description: newCODescription } : co
      )
    };
    
    // Update mapping data if CO ID changed
    let updatedMappingData = { ...allMappingData };
    if (newCOId !== editingCOId && updatedMappingData[selectedCourseCode]) {
      updatedMappingData = {
        ...allMappingData,
        [selectedCourseCode]: allMappingData[selectedCourseCode].map(row => 
          row.co === editingCOId ? { ...row, co: newCOId } : row
        )
      };
    }
    
    setAllCourseOutcomes(updatedCOs);
    setAllMappingData(updatedMappingData);
    
    // Save to localStorage for persistence
    setStorageData('mapping_allMappingData', updatedMappingData);
    setStorageData('mapping_allCourseOutcomes', updatedCOs);
    
    setNewCOId('');
    setNewCODescription('');
    setEditingCOId('');
    setIsEditingCO(false);
    
    // Update selectedCO if it was the edited one
    if (selectedCO === editingCOId) {
      setSelectedCO(newCOId);
    }
    
    toast.success('Course outcome updated successfully');
  };
  
  // Function to delete a course outcome
  const handleDeleteCO = (coId) => {
    if (!selectedCourseCode) return;
    
    // Remove CO from course outcomes
    const updatedCOs = {
      ...allCourseOutcomes,
      [selectedCourseCode]: allCourseOutcomes[selectedCourseCode].filter(co => co.id !== coId)
    };
    
    // Remove CO from mapping data
    const updatedMappingData = {
      ...allMappingData
    };
    
    if (updatedMappingData[selectedCourseCode]) {
      // Filter out the CO and the average row
      const withoutCOAndAvg = updatedMappingData[selectedCourseCode].filter(
        row => row.co !== coId && row.co !== 'Avg.'
      );
      
      // Calculate new averages
      const avgRow = { co: 'Avg.' };
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(po => {
        const sum = withoutCOAndAvg.reduce((acc, curr) => acc + (curr[po] || 0), 0);
        avgRow[po] = parseFloat((sum / (withoutCOAndAvg.length || 1)).toFixed(1));
      });
      
      // Add average row back
      updatedMappingData[selectedCourseCode] = [...withoutCOAndAvg, avgRow];
    }
    
    setAllCourseOutcomes(updatedCOs);
    setAllMappingData(updatedMappingData);
    
    // Save to localStorage for persistence
    setStorageData('mapping_allMappingData', updatedMappingData);
    setStorageData('mapping_allCourseOutcomes', updatedCOs);
    
    // Clear selectedCO if it was the deleted one
    if (selectedCO === coId) {
      setSelectedCO('');
    }
    
    toast.success('Course outcome deleted successfully');
  };
  
  // Program Specific Outcomes (PSOs) for different departments
  const programSpecificOutcomes = {
    cse: {
      PSO1: "Apply knowledge of computer science and engineering to develop solutions for complex engineering problems in the domain of software engineering.",
      PSO2: "Design and develop software systems with consideration for security, scalability, and maintainability to meet industry standards.",
      PSO3: "Apply modern tools and technologies for efficient software development and project management in multidisciplinary environments."
    },
    mech: {
      PSO1: "Apply knowledge of mechanical engineering to design and analyze mechanical systems for complex engineering problems.",
      PSO2: "Design and develop mechanical components and systems with consideration for efficiency, reliability, and sustainability.",
      PSO3: "Apply modern tools and technologies for mechanical system design, analysis, and manufacturing in multidisciplinary environments."
    },
    ece: {
      PSO1: "Apply knowledge of electronics and communication engineering to develop solutions for complex engineering problems.",
      PSO2: "Design and develop electronic systems with consideration for signal processing, communication protocols, and hardware integration.",
      PSO3: "Apply modern tools and technologies for electronic system design, testing, and implementation in multidisciplinary environments."
    },
    eee: {
      PSO1: "Apply knowledge of electrical and electronics engineering to develop solutions for complex power systems and control problems.",
      PSO2: "Design and develop electrical systems with consideration for power efficiency, control mechanisms, and safety standards.",
      PSO3: "Apply modern tools and technologies for electrical system design, analysis, and implementation in multidisciplinary environments."
    },
    civil: {
      PSO1: "Apply knowledge of civil engineering to develop solutions for complex structural and environmental engineering problems.",
      PSO2: "Design and develop civil infrastructure with consideration for sustainability, safety, and environmental impact.",
      PSO3: "Apply modern tools and technologies for civil engineering design, analysis, and construction management in multidisciplinary environments."
    }
  };
  
  // Course outcomes for different courses - load from localStorage or use default
  const [allCourseOutcomes, setAllCourseOutcomes] = useState(() => {
    const savedOutcomes = getStorageData('mapping_allCourseOutcomes', null);
    if (savedOutcomes) return savedOutcomes;
    
    // Default course outcomes if none in localStorage
    return {
      'R20CC31OE03': [ // OPERATIONS RESEARCH
        { id: 'CO1', description: 'Illustrate and solve linear programming problems' },
        { id: 'CO2', description: 'Solve transportation and assignment problems' },
        { id: 'CO3', description: 'Select sequencing and solve waiting line problems' },
        { id: 'CO4', description: 'Solve networking and replacement problems' },
        { id: 'CO5', description: 'Analyze game theory & dynamic programming' },
      ],
      'R20CC31OE04': [ // DATA STRUCTURES
        { id: 'CO1', description: 'Understand and implement basic data structures like arrays, linked lists, stacks, and queues' },
        { id: 'CO2', description: 'Apply tree and graph data structures to solve complex problems' },
        { id: 'CO3', description: 'Analyze and implement various searching and sorting algorithms' },
        { id: 'CO4', description: 'Design and implement hash tables and handle collision resolution techniques' },
        { id: 'CO5', description: 'Evaluate algorithm efficiency using time and space complexity analysis' },
      ],
      'R20CC31OE05': [ // DATABASE SYSTEMS
        { id: 'CO1', description: 'Understand database concepts, architecture, and data models' },
        { id: 'CO2', description: 'Design and implement relational database schemas using normalization techniques' },
        { id: 'CO3', description: 'Write complex SQL queries for data manipulation and retrieval' },
        { id: 'CO4', description: 'Implement transaction management, concurrency control, and recovery mechanisms' },
        { id: 'CO5', description: 'Apply database security principles and explore modern database technologies' },
      ]
    };
  });
  
  // Save course outcomes to localStorage whenever they change
  useEffect(() => {
    setStorageData('mapping_allCourseOutcomes', allCourseOutcomes);
  }, [allCourseOutcomes]);

  // Mapping data for different courses - load from localStorage or use default
  const [allMappingData, setAllMappingData] = useState(() => {
    const savedMappingData = getStorageData('mapping_allMappingData', null);
    if (savedMappingData) return savedMappingData;
    
    // Default mapping data if none in localStorage
    return {
      'R20CC31OE03': [ // OPERATIONS RESEARCH
        { co: 'CO1', po1: 3, po2: 3, po3: 2, po4: 0, po5: 0, pso1: 3, pso2: 0, pso3: 0 },
        { co: 'CO2', po1: 3, po2: 3, po3: 2, po4: 0, po5: 0, pso1: 3, pso2: 0, pso3: 0 },
        { co: 'CO3', po1: 3, po2: 3, po3: 2, po4: 0, po5: 0, pso1: 3, pso2: 0, pso3: 0 },
        { co: 'CO4', po1: 3, po2: 3, po3: 2, po4: 0, po5: 0, pso1: 3, pso2: 0, pso3: 0 },
        { co: 'CO5', po1: 3, po2: 3, po3: 2, po4: 0, po5: 0, pso1: 3, pso2: 0, pso3: 0 },
        { co: 'Avg.', po1: 3.0, po2: 3.0, po3: 2.0, po4: 0, po5: 0, pso1: 3.0, pso2: 0, pso3: 0 },
      ],
      'R20CC31OE04': [ // DATA STRUCTURES
        { co: 'CO1', po1: 3, po2: 3, po3: 3, po4: 1, po5: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO2', po1: 3, po2: 3, po3: 3, po4: 1, po5: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO3', po1: 3, po2: 3, po3: 2, po4: 2, po5: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO4', po1: 3, po2: 3, po3: 2, po4: 1, po5: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO5', po1: 3, po2: 3, po3: 2, po4: 2, po5: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'Avg.', po1: 3.0, po2: 3.0, po3: 2.4, po4: 1.4, po5: 2.0, pso1: 3.0, pso2: 2.0, pso3: 1.0 },
      ],
      'R20CC31OE05': [ // DATABASE SYSTEMS
        { co: 'CO1', po1: 3, po2: 2, po3: 3, po4: 1, po5: 3, pso1: 3, pso2: 3, pso3: 2 },
        { co: 'CO2', po1: 3, po2: 3, po3: 3, po4: 1, po5: 3, pso1: 3, pso2: 3, pso3: 2 },
        { co: 'CO3', po1: 3, po2: 3, po3: 2, po4: 1, po5: 3, pso1: 3, pso2: 3, pso3: 2 },
        { co: 'CO4', po1: 3, po2: 3, po3: 2, po4: 1, po5: 3, pso1: 3, pso2: 3, pso3: 2 },
        { co: 'CO5', po1: 3, po2: 3, po3: 2, po4: 1, po5: 3, pso1: 3, pso2: 3, pso3: 2 },
        { co: 'Avg.', po1: 3.0, po2: 2.8, po3: 2.4, po4: 1.0, po5: 3.0, pso1: 3.0, pso2: 3.0, pso3: 2.0 },
      ]
    };
  });
  
  // Save mapping data to localStorage whenever they change
  useEffect(() => {
    setStorageData('mapping_allMappingData', allMappingData);
  }, [allMappingData]);

  // Function to get color based on correlation value
  const getCorrelationColor = (value) => {
    switch (value) {
      case 3: return 'bg-green-600 bg-opacity-70';
      case 2: return 'bg-yellow-600 bg-opacity-70';
      case 1: return 'bg-red-600 bg-opacity-70';
      default: return 'bg-gray-700';
    }
  };

  // Function to get tooltip text based on correlation value
  const getCorrelationTooltip = (value) => {
    switch (value) {
      case 3: return 'Strong Correlation (3)';
      case 2: return 'Moderate Correlation (2)';
      case 1: return 'Weak Correlation (1)';
      default: return 'No Correlation (0)';
    }
  };
  
  // Function to update mapping value when clicked
  const updateMappingValue = (coId, poField, currentValue) => {
    // Skip updating for average row
    if (coId === 'Avg.') return;
    
    // Calculate next value (cycle through 0, 1, 2, 3)
    let nextValue;
    if (!currentValue || currentValue === 0) {
      nextValue = 1;
    } else if (currentValue === 3) {
      nextValue = 0;
    } else {
      nextValue = currentValue + 1;
    }
    
    // Create updated mapping data
    const updatedMappingData = {...allMappingData};
    
    // Check if the course data exists, if not create an empty array
    if (!updatedMappingData[selectedCourseCode]) {
      updatedMappingData[selectedCourseCode] = [];
    }
    
    // Find the row with the given CO ID
    const rowIndex = updatedMappingData[selectedCourseCode].findIndex(row => row.co === coId);
    
    // If the row exists, update it
    if (rowIndex !== -1) {
      // Create a new array with the updated row
      const courseData = updatedMappingData[selectedCourseCode].map(row => {
        if (row.co === coId) {
          return { ...row, [poField]: nextValue };
        }
        return row;
      });
      
      // Calculate new averages
      const coRows = courseData.filter(row => row.co !== 'Avg.');
      const avgRow = { co: 'Avg.' };
      
      // Calculate average for each PO/PSO field
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(field => {
        const sum = coRows.reduce((acc, curr) => acc + (curr[field] || 0), 0);
        avgRow[field] = parseFloat((sum / (coRows.length || 1)).toFixed(1));
      });
      
      // Replace the average row
      updatedMappingData[selectedCourseCode] = [...coRows, avgRow];
    } else {
      console.error(`Row with CO ID ${coId} not found in mapping data for course ${selectedCourseCode}`);
      toast.error(`Failed to update mapping: Row with CO ID ${coId} not found`);
      return;
    }
    
    // Update the state
    setAllMappingData(updatedMappingData);
    
    // Save to localStorage for persistence
    setStorageData('mapping_allMappingData', updatedMappingData);
    
    toast.success(`Updated ${coId} correlation with ${poField.toUpperCase()} to ${nextValue === 0 ? 'None' : nextValue}`);
  };
  
  // Function to add a new mapping for a course
  const addNewMapping = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a course first');
      return;
    }
    
    // Create a dialog to get the new mapping details
    const courseCode = prompt('Enter the course code for the new mapping:');
    if (!courseCode) return;
    
    // Check if mapping already exists
    if (allMappingData[courseCode]) {
      toast.error(`Mapping for course ${courseCode} already exists`);
      return;
    }
    
    // Check if course outcomes exist for this course
    if (!allCourseOutcomes[courseCode]) {
      // Ask if user wants to create default course outcomes
      const createDefaultCOs = window.confirm(`No course outcomes found for ${courseCode}. Do you want to create default course outcomes?`);
      
      if (createDefaultCOs) {
        // Create default course outcomes
        const defaultCOs = [
          { id: 'CO1', description: 'Course Outcome 1' },
          { id: 'CO2', description: 'Course Outcome 2' },
          { id: 'CO3', description: 'Course Outcome 3' },
          { id: 'CO4', description: 'Course Outcome 4' },
          { id: 'CO5', description: 'Course Outcome 5' },
        ];
        
        // Update course outcomes
        setAllCourseOutcomes({
          ...allCourseOutcomes,
          [courseCode]: defaultCOs
        });
        
        // Create default mapping data
        const defaultMapping = [
          { co: 'CO1', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
          { co: 'CO2', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
          { co: 'CO3', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
          { co: 'CO4', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
          { co: 'CO5', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
          { co: 'Avg.', po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 },
        ];
        
        // Update mapping data
        const updatedMappingData = {
          ...allMappingData,
          [courseCode]: defaultMapping
        };
        
        setAllMappingData(updatedMappingData);
        
        // Save to localStorage for persistence
        setStorageData('mapping_allMappingData', updatedMappingData);
        setStorageData('mapping_allCourseOutcomes', {
          ...allCourseOutcomes,
          [courseCode]: defaultCOs
        });
        
        toast.success(`Created default course outcomes and mapping for ${courseCode}`);
      } else {
        toast.error('Cannot create mapping without course outcomes');
        return;
      }
    } else {
      // Course outcomes exist, create mapping based on existing COs
      const coRows = allCourseOutcomes[courseCode].map(co => ({
        co: co.id,
        po1: 0,
        po2: 0,
        po3: 0,
        po4: 0,
        po5: 0,
        pso1: 0,
        pso2: 0,
        pso3: 0
      }));
      
      // Calculate averages
      const avgRow = { co: 'Avg.' };
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(field => {
        avgRow[field] = 0;
      });
      
      // Update mapping data
      const updatedMappingData = {
        ...allMappingData,
        [courseCode]: [...coRows, avgRow]
      };
      
      setAllMappingData(updatedMappingData);
      
      // Save to localStorage for persistence
      setStorageData('mapping_allMappingData', updatedMappingData);
      
      toast.success(`Created new mapping for ${courseCode}`);
    }
    
    // Switch to the new mapping
    setSelectedCourseCode(courseCode);
  };
  
  // Function to copy mapping from one course to another
  const copyMapping = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a source course first');
      return;
    }
    
    // Get the target course code
    const targetCourseCode = prompt('Enter the target course code to copy mapping to:');
    if (!targetCourseCode) return;
    
    // Check if target is the same as source
    if (targetCourseCode === selectedCourseCode) {
      toast.error('Cannot copy to the same course');
      return;
    }
    
    // Check if target mapping already exists
    if (allMappingData[targetCourseCode]) {
      const overwrite = window.confirm(`Mapping for course ${targetCourseCode} already exists. Do you want to overwrite it?`);
      if (!overwrite) return;
    }
    
    // Check if target course outcomes exist
    if (!allCourseOutcomes[targetCourseCode]) {
      // Ask if user wants to copy course outcomes too
      const copyCOs = window.confirm(`No course outcomes found for ${targetCourseCode}. Do you want to copy course outcomes too?`);
      
      if (copyCOs) {
        // Copy course outcomes
        const updatedCOs = {
          ...allCourseOutcomes,
          [targetCourseCode]: JSON.parse(JSON.stringify(allCourseOutcomes[selectedCourseCode]))
        };
        
        // Copy mapping data
        const updatedMappingData = {
          ...allMappingData,
          [targetCourseCode]: JSON.parse(JSON.stringify(allMappingData[selectedCourseCode]))
        };
        
        setAllCourseOutcomes(updatedCOs);
        setAllMappingData(updatedMappingData);
        
        // Save to localStorage for persistence
        setStorageData('mapping_allMappingData', updatedMappingData);
        setStorageData('mapping_allCourseOutcomes', updatedCOs);
        
        toast.success(`Copied course outcomes and mapping from ${selectedCourseCode} to ${targetCourseCode}`);
      } else {
        toast.error('Cannot copy mapping without course outcomes');
        return;
      }
    } else {
      // Course outcomes exist, but may not match the source
      // We need to create a mapping that matches the target course outcomes
      
      const sourceMappingWithoutAvg = allMappingData[selectedCourseCode].filter(row => row.co !== 'Avg.');
      const targetCOs = allCourseOutcomes[targetCourseCode];
      
      // Create mapping rows for each target CO
      const targetMappingRows = targetCOs.map(co => {
        // Try to find a matching CO in the source mapping
        const matchingSourceRow = sourceMappingWithoutAvg.find(row => row.co === co.id);
        
        if (matchingSourceRow) {
          // Use the mapping values from the source
          return { ...matchingSourceRow };
        } else {
          // Create a new mapping row with default values
          return {
            co: co.id,
            po1: 0,
            po2: 0,
            po3: 0,
            po4: 0,
            po5: 0,
            pso1: 0,
            pso2: 0,
            pso3: 0
          };
        }
      });
      
      // Calculate averages
      const avgRow = { co: 'Avg.' };
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(field => {
        const sum = targetMappingRows.reduce((acc, curr) => acc + (curr[field] || 0), 0);
        avgRow[field] = parseFloat((sum / (targetMappingRows.length || 1)).toFixed(1));
      });
      
      // Update mapping data
      const updatedMappingData = {
        ...allMappingData,
        [targetCourseCode]: [...targetMappingRows, avgRow]
      };
      
      setAllMappingData(updatedMappingData);
      
      // Save to localStorage for persistence
      setStorageData('mapping_allMappingData', updatedMappingData);
      
      toast.success(`Copied mapping from ${selectedCourseCode} to ${targetCourseCode}`);
    }
    
    // Ask if user wants to switch to the target course
    const switchToCourse = window.confirm('Do you want to switch to the target course?');
    if (switchToCourse) {
      setSelectedCourseCode(targetCourseCode);
    }
  };
  
  // Function to delete a mapping
  const deleteMapping = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a course first');
      return;
    }
    
    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete the mapping for ${selectedCourseCode}? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    // Create updated mapping data without the selected course
    const updatedMappingData = { ...allMappingData };
    delete updatedMappingData[selectedCourseCode];
    
    // Ask if user wants to delete course outcomes too
    const deleteCOs = window.confirm(`Do you also want to delete the course outcomes for ${selectedCourseCode}?`);
    
    if (deleteCOs) {
      // Create updated course outcomes without the selected course
      const updatedCourseOutcomes = { ...allCourseOutcomes };
      delete updatedCourseOutcomes[selectedCourseCode];
      
      // Update state
      setAllCourseOutcomes(updatedCourseOutcomes);
      setAllMappingData(updatedMappingData);
      
      // Persist changes to localStorage
      setStorageData('mapping_allCourseOutcomes', updatedCourseOutcomes);
      setStorageData('mapping_allMappingData', updatedMappingData);
      
      toast.success(`Deleted mapping and course outcomes for ${selectedCourseCode}`);
    } else {
      // Update only mapping data
      setAllMappingData(updatedMappingData);
      
      // Persist changes to localStorage
      setStorageData('mapping_allMappingData', updatedMappingData);
      
      toast.success(`Deleted mapping for ${selectedCourseCode}`);
    }
    
    // Reset selected course
    setSelectedCourseCode('');
  };
  
  // Function to reset mapping values to zero
  const resetMapping = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a course first');
      return;
    }
    
    // Confirm reset
    const confirmReset = window.confirm(`Are you sure you want to reset all mapping values for ${selectedCourseCode} to zero?`);
    if (!confirmReset) return;
    
    // Get current mapping data without the average row
    const currentMappingWithoutAvg = allMappingData[selectedCourseCode].filter(row => row.co !== 'Avg.');
    
    // Reset all values to zero
    const resetMappingRows = currentMappingWithoutAvg.map(row => {
      const resetRow = { co: row.co };
      ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(field => {
        resetRow[field] = 0;
      });
      return resetRow;
    });
    
    // Add average row (all zeros)
    const avgRow = { co: 'Avg.' };
    ['po1', 'po2', 'po3', 'po4', 'po5', 'pso1', 'pso2', 'pso3'].forEach(field => {
      avgRow[field] = 0;
    });
    
    // Update mapping data
    const updatedMappingData = {
      ...allMappingData,
      [selectedCourseCode]: [...resetMappingRows, avgRow]
    };
    
    setAllMappingData(updatedMappingData);
    
    // Persist changes to localStorage
    setStorageData('mapping_allMappingData', updatedMappingData);
    
    toast.success(`Reset all mapping values for ${selectedCourseCode} to zero`);
  };
  
  // Function to export mapping data
  const exportMappingData = () => {
    try {
      // Create export data object
      const exportData = {
        courseOutcomes: allCourseOutcomes,
        mappingData: allMappingData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapping_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Mapping data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export mapping data');
    }
  };
  
  // Function to import mapping data
  const importMappingData = () => {
    try {
      // Create file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      
      // Handle file selection
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target.result);
            
            // Validate imported data structure
            if (!importedData.courseOutcomes || !importedData.mappingData) {
              throw new Error('Invalid import file format');
            }
            
            // Confirm import
            const confirmImport = window.confirm(
              'Are you sure you want to import this mapping data? This will overwrite your current mapping data.'
            );
            
            if (confirmImport) {
              // Update state with imported data
              setAllCourseOutcomes(importedData.courseOutcomes);
              setAllMappingData(importedData.mappingData);
              
              // Save to localStorage for persistence
              setStorageData('mapping_allMappingData', importedData.mappingData);
              setStorageData('mapping_allCourseOutcomes', importedData.courseOutcomes);
              
              // Reset selections
              setSelectedCourseCode('');
              setSelectedCO('');
              
              toast.success('Mapping data imported successfully');
            }
          } catch (error) {
            console.error('Import parsing error:', error);
            toast.error('Failed to import mapping data: Invalid file format');
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read import file');
        };
        
        reader.readAsText(file);
      };
      
      // Trigger file selection dialog
      fileInput.click();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import mapping data');
    }
  };
  
  // Function to export mapping data as PDF
  const exportMappingAsPDF = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a course first');
      return;
    }
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to export as PDF');
        return;
      }
      
      // Get course outcomes and mapping data for selected course
      const courseOutcomes = allCourseOutcomes[selectedCourseCode] || [];
      const mappingData = allMappingData[selectedCourseCode] || [];
      
      // Get department and institute names
      const departmentName = departments.find(d => d.id === selectedDepartment)?.name || selectedDepartment;
      const instituteName = institutes.find(i => i.id === selectedInstitute)?.name || selectedInstitute;
      
      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CO-PO/PSO Mapping - ${selectedCourseCode}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2, h3 { margin-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
            .course-info { margin-bottom: 15px; }
            .correlation-legend { display: flex; margin-bottom: 20px; }
            .correlation-item { margin-right: 20px; display: flex; align-items: center; }
            .color-box { width: 20px; height: 20px; margin-right: 5px; }
            .strong { background-color: #4CAF50; }
            .moderate { background-color: #2196F3; }
            .slight { background-color: #FFC107; }
            .none { background-color: #f5f5f5; border: 1px solid #ddd; }
            .co-list { margin-bottom: 20px; }
            .co-item { margin-bottom: 10px; }
            @media print {
              body { margin: 0.5cm; }
              h1 { font-size: 18pt; }
              h2 { font-size: 16pt; }
              h3 { font-size: 14pt; }
              p, table { font-size: 12pt; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CO-PO/PSO Mapping Report</h1>
            <div class="course-info">
              <p><strong>Institute:</strong> ${instituteName}</p>
              <p><strong>Department:</strong> ${departmentName}</p>
              <p><strong>Course Code:</strong> ${selectedCourseCode}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <h2>Course Outcomes (COs)</h2>
          <div class="co-list">
            ${courseOutcomes.map((co, index) => `
              <div class="co-item">
                <p><strong>CO${index + 1}:</strong> ${co}</p>
              </div>
            `).join('')}
          </div>
          
          <h2>CO-PO/PSO Mapping</h2>
          <div class="correlation-legend">
            <div class="correlation-item"><div class="color-box strong"></div> Strong (3)</div>
            <div class="correlation-item"><div class="color-box moderate"></div> Moderate (2)</div>
            <div class="correlation-item"><div class="color-box slight"></div> Slight (1)</div>
            <div class="correlation-item"><div class="color-box none"></div> None (0)</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>CO</th>
                <th>PO1</th>
                <th>PO2</th>
                <th>PO3</th>
                <th>PO4</th>
                <th>PO5</th>
                <th>PSO1</th>
                <th>PSO2</th>
                <th>PSO3</th>
              </tr>
            </thead>
            <tbody>
              ${mappingData.map(row => `
                <tr>
                  <td>${row.co}</td>
                  <td>${row.po1}</td>
                  <td>${row.po2}</td>
                  <td>${row.po3}</td>
                  <td>${row.po4}</td>
                  <td>${row.po5}</td>
                  <td>${row.pso1}</td>
                  <td>${row.pso2}</td>
                  <td>${row.pso3}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            // Auto print when loaded
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;
      
      // Write HTML content to the new window
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.success('Preparing PDF export...');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export mapping as PDF');
    }
  };
  
  // Function to export mapping data as CSV
  const exportMappingAsCSV = () => {
    if (!selectedCourseCode) {
      toast.error('Please select a course first');
      return;
    }
    
    try {
      // Get mapping data for selected course
      const mappingData = allMappingData[selectedCourseCode] || [];
      
      // Create CSV header
      let csvContent = 'CO,PO1,PO2,PO3,PO4,PO5,PSO1,PSO2,PSO3\n';
      
      // Add mapping data rows
      mappingData.forEach(row => {
        csvContent += `${row.co},${row.po1},${row.po2},${row.po3},${row.po4},${row.po5},${row.pso1},${row.pso2},${row.pso3}\n`;
      });
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCourseCode}_mapping_data.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Mapping data exported as CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export mapping as CSV');
    }
  };
  
  // Additional mapping functions can be added here

  // Initialize state from localStorage or default to empty string
  const [selectedInstitute, setSelectedInstitute] = useState(() => 
    getStorageData('mapping_selectedInstitute', ''));
  const [selectedDepartment, setSelectedDepartment] = useState(() => 
    getStorageData('mapping_selectedDepartment', ''));
  const [selectedCourseCode, setSelectedCourseCode] = useState(() => 
    getStorageData('mapping_selectedCourseCode', ''));
  
  // Save selections to localStorage whenever they change
  useEffect(() => {
    setStorageData('mapping_selectedInstitute', selectedInstitute);
  }, [selectedInstitute]);
  
  useEffect(() => {
    setStorageData('mapping_selectedDepartment', selectedDepartment);
  }, [selectedDepartment]);
  
  useEffect(() => {
    setStorageData('mapping_selectedCourseCode', selectedCourseCode);
  }, [selectedCourseCode]);
  
  // Reset dependent selections when parent selection changes
  useEffect(() => {
    if (selectedInstitute === '') {
      setSelectedDepartment('');
      setSelectedCourseCode('');
      setSelectedCO('');
    }
  }, [selectedInstitute]);
  
  useEffect(() => {
    if (selectedDepartment === '') {
      setSelectedCourseCode('');
      setSelectedCO('');
    }
  }, [selectedDepartment]);
  
  useEffect(() => {
    if (selectedCourseCode === '') {
      setSelectedCO('');
    }
  }, [selectedCourseCode]);
  
  // Sample data for dropdowns
  const institutes = [
    { id: 'nec', name: 'Narasaraopeta Engineering College' }
  ];
  
  const departments = [
    { id: 'mech', name: 'Department of Mechanical Engineering' },
    { id: 'cse', name: 'Department of Computer Science Engineering' },
    { id: 'ece', name: 'Department of Electronics & Communication Engineering' },
    { id: 'eee', name: 'Department of Electrical & Electronics Engineering' },
    { id: 'civil', name: 'Department of Civil Engineering' }
  ];
  
  const courses = [
    { id: 'R20CC31OE03', name: 'OPERATIONS RESEARCH', code: 'R20CC31OE03', regulation: 'R20', semester: 'V', credits: 3 },
    { id: 'R20CC31OE04', name: 'DATA STRUCTURES', code: 'R20CC31OE04', regulation: 'R20', semester: 'V', credits: 3 },
    { id: 'R20CC31OE05', name: 'DATABASE SYSTEMS', code: 'R20CC31OE05', regulation: 'R20', semester: 'V', credits: 3 }
  ];
  
  // Get current course outcomes and mapping data based on selected course
  const courseOutcomes = selectedCourseCode ? allCourseOutcomes[selectedCourseCode] || [] : [];
  const mappingData = selectedCourseCode ? allMappingData[selectedCourseCode] || [] : [];
  
  // Course details
  const selectedCourse = courses.find(course => course.id === selectedCourseCode);
  
  // Get PSOs based on selected department
  const currentPSOs = selectedDepartment ? programSpecificOutcomes[selectedDepartment] || {} : {};
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >

      {/* Course Outcomes Section */}
      <div className="bg-gray-800 rounded-lg p-3">
        <h3 className="text-md font-medium text-white mb-3">Course Information and Course Outcomes Management</h3>
        
        {/* Institute, Department, and Course Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Institute Dropdown */}
          <div>
            <label htmlFor="institute" className="block text-xs font-medium text-gray-300 mb-1">
              Institute
            </label>
            <select
              id="institute"
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="block w-full rounded-md border-0 bg-gray-700 text-white py-2 pl-3 pr-10 text-xs focus:outline-none"
            >
              <option value="">Select Institute</option>
              {institutes.map(institute => (
                <option key={institute.id} value={institute.id}>{institute.name}</option>
              ))}
            </select>
          </div>
          
          {/* Department Dropdown */}
          <div>
            <label htmlFor="department" className="block text-xs font-medium text-gray-300 mb-1">
              Department
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="block w-full rounded-md border-0 bg-gray-700 text-white py-2 pl-3 pr-10 text-xs focus:outline-none"
              disabled={!selectedInstitute}
            >
              <option value="">Select Department</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          
          {/* Course Dropdown */}
          <div>
            <label htmlFor="course" className="block text-xs font-medium text-gray-300 mb-1">
              Course
            </label>
            <select
              id="course"
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="block w-full rounded-md border-0 bg-gray-700 text-white py-2 pl-3 pr-10 text-xs focus:outline-none"
              disabled={!selectedDepartment}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Selection Status */}
        {!selectedInstitute && (
          <div className="bg-blue-900 bg-opacity-50 rounded-md p-3 mb-3 text-center">
            <p className="text-blue-200 text-sm">👆 Please select an Institute to continue</p>
          </div>
        )}
        
        {selectedInstitute && !selectedDepartment && (
          <div className="bg-blue-900 bg-opacity-50 rounded-md p-3 mb-3 text-center">
            <p className="text-blue-200 text-sm">👆 Please select a Department to continue</p>
          </div>
        )}
        
        {selectedDepartment && !selectedCourseCode && (
          <div className="bg-blue-900 bg-opacity-50 rounded-md p-3 mb-3 text-center">
            <p className="text-blue-200 text-sm">👆 Please select a Course to view its outcomes</p>
          </div>
        )}
        
        {/* Course Details */}
        {selectedCourseCode && (
          <div className="bg-gray-700 rounded-md p-3 mb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Course Code:</p>
                <p className="text-white font-medium">{selectedCourse?.code}</p>
              </div>
              <div>
                <p className="text-gray-400">Regulation:</p>
                <p className="text-white font-medium">{selectedCourse?.regulation}</p>
              </div>
              <div>
                <p className="text-gray-400">Semester:</p>
                <p className="text-white font-medium">{selectedCourse?.semester}</p>
              </div>
              <div>
                <p className="text-gray-400">Credits:</p>
                <p className="text-white font-medium">{selectedCourse?.credits}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Course Outcomes List */}
        {selectedCourseCode && (
          <>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-white">Course Outcomes (COs)</h4>
              <button
                onClick={() => {
                  setIsAddingCO(true);
                  setIsEditingCO(false);
                  setNewCOId('');
                  setNewCODescription('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded-md flex items-center"
                disabled={isAddingCO || isEditingCO}
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                Add CO
              </button>
            </div>
            
            {/* Add/Edit CO Form */}
            {(isAddingCO || isEditingCO) && (
              <div className="bg-gray-700 p-3 rounded-md mb-3">
                <h5 className="text-sm font-medium text-white mb-2">
                  {isAddingCO ? 'Add New Course Outcome' : 'Edit Course Outcome'}
                </h5>
                <div className="space-y-2">
                  <div>
                    <label htmlFor="coId" className="block text-xs font-medium text-gray-300 mb-1">
                      CO ID
                    </label>
                    <input
                      type="text"
                      id="coId"
                      value={newCOId}
                      onChange={(e) => setNewCOId(e.target.value)}
                      placeholder="e.g. CO1"
                      className="block w-full rounded-md border-0 bg-gray-600 text-white py-1.5 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="coDescription" className="block text-xs font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="coDescription"
                      value={newCODescription}
                      onChange={(e) => setNewCODescription(e.target.value)}
                      placeholder="Enter course outcome description"
                      rows="2"
                      className="block w-full rounded-md border-0 bg-gray-600 text-white py-1.5 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={isAddingCO ? handleAddCO : handleUpdateCO}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center"
                    >
                      <CheckIcon className="w-3 h-3 mr-1" />
                      {isAddingCO ? 'Add' : 'Update'}
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCO(false);
                        setIsEditingCO(false);
                        setNewCOId('');
                        setNewCODescription('');
                        setEditingCOId('');
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded-md flex items-center"
                    >
                      <XMarkIcon className="w-3 h-3 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Course Outcomes List */}
            {courseOutcomes.length > 0 ? (
              <ul className="space-y-1">
                {courseOutcomes.map((co) => (
                  <li
                    key={co.id}
                    className={`text-gray-200 bg-gray-700 p-2 rounded-md text-sm ${selectedCO === co.id ? 'border-l-4 border-blue-500' : ''} flex justify-between items-center`}
                  >
                    <div 
                      className="flex-grow cursor-pointer"
                      onClick={() => setSelectedCO(selectedCO === co.id ? '' : co.id)}
                    >
                      <span className="font-medium">{co.id}:</span> {co.description}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStartEditCO(co)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        disabled={isAddingCO || isEditingCO}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCO(co.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        disabled={isAddingCO || isEditingCO}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-gray-700 p-3 rounded-md text-center">
                <p className="text-gray-400 text-sm">No course outcomes available. Add one to get started.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CO Dropdown Viewer */}
      {selectedCourseCode && courseOutcomes.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-md font-medium text-white mb-3">Select Course Outcome</h3>
          <div className="relative">
            <select
              value={selectedCO}
              onChange={(e) => setSelectedCO(e.target.value)}
              className="block w-full rounded-md border-0 bg-gray-700 text-white py-2 pl-3 pr-10 focus:outline-none sm:text-sm"
            >
              <option value="">Select a Course Outcome</option>
              {courseOutcomes.map((co) => (
                <option key={co.id} value={co.id}>{co.id}</option>
              ))}
            </select>
          </div>

          {selectedCO && (
            <div
              className="mt-3 p-2 bg-gray-700 rounded-md text-white text-sm"
            >
              <p>
                <span className="font-medium">{selectedCO}:</span> {courseOutcomes.find(co => co.id === selectedCO)?.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Program Outcomes and Program Specific Outcomes Section */}
      {selectedDepartment && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-md font-medium text-white mb-3">Program Outcomes (POs) & Program Specific Outcomes (PSOs)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
            {/* Program Outcomes Buttons */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <button
                key={`PO${num}`}
                onClick={() => setSelectedPO(selectedPO === `PO${num}` ? '' : `PO${num}`)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${selectedPO === `PO${num}` ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >
                PO{num}
              </button>
            ))}
            
            {/* Program Specific Outcomes Buttons */}
            {[1, 2, 3].map((num) => (
              <button
                key={`PSO${num}`}
                onClick={() => setSelectedPO(selectedPO === `PSO${num}` ? '' : `PSO${num}`)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${selectedPO === `PSO${num}` ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
              >
                PSO{num}
              </button>
            ))}
          </div>
          
          {selectedPO ? (
            <div className="mt-2 p-3 bg-gray-700 rounded-md text-sm text-gray-200 border-l-4 border-blue-500">
              {selectedPO === 'PO1' && (
                <p><span className="font-medium">PO1. Engineering knowledge:</span> Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.</p>
              )}
              {selectedPO === 'PO2' && (
                <p><span className="font-medium">PO2. Problem analysis:</span> Identify, formulate, review research literature, and analyse complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.</p>
              )}
              {selectedPO === 'PO3' && (
                <p><span className="font-medium">PO3. Design/development of solutions:</span> Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.</p>
              )}
              {selectedPO === 'PO4' && (
                <p><span className="font-medium">PO4. Conduct investigations of complex problems:</span> Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.</p>
              )}
              {selectedPO === 'PO5' && (
                <p><span className="font-medium">PO5. Modern tool usage:</span> Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modelling to complex engineering activities with an understanding of the limitations.</p>
              )}
              {selectedPO === 'PO6' && (
                <p><span className="font-medium">PO6. The engineer and society:</span> Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.</p>
              )}
              {selectedPO === 'PO7' && (
                <p><span className="font-medium">PO7. Environment and sustainability:</span> Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.</p>
              )}
              {selectedPO === 'PO8' && (
                <p><span className="font-medium">PO8. Ethics:</span> Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.</p>
              )}
              {selectedPO === 'PO9' && (
                <p><span className="font-medium">PO9. Individual and team work:</span> Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.</p>
              )}
              {selectedPO === 'PO10' && (
                <p><span className="font-medium">PO10. Communication:</span> Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.</p>
              )}
              {selectedPO === 'PO11' && (
                <p><span className="font-medium">PO11. Project management and finance:</span> Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.</p>
              )}
              {selectedPO === 'PO12' && (
                <p><span className="font-medium">PO12. Life-long learning:</span> Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.</p>
              )}
              {selectedPO === 'PSO1' && (
                <p><span className="font-medium">PSO1:</span> {currentPSOs.PSO1}</p>
              )}
              {selectedPO === 'PSO2' && (
                <p><span className="font-medium">PSO2:</span> {currentPSOs.PSO2}</p>
              )}
              {selectedPO === 'PSO3' && (
                <p><span className="font-medium">PSO3:</span> {currentPSOs.PSO3}</p>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">
              <p>👆 Click on a PO/PSO button above to view its description</p>
            </div>
          )}
        </div>
      )}

      {/* Mapping Table */}
      {selectedCourseCode && mappingData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-white">CO-PO/PSO Mapping</h3>
            <div className="flex space-x-2">
              <button
                onClick={addNewMapping}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded-md flex items-center"
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                Add New Mapping
              </button>
              <button
                onClick={copyMapping}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
                Copy Mapping
              </button>
              <button
                onClick={deleteMapping}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-md flex items-center"
              >
                <TrashIcon className="w-3 h-3 mr-1" />
                Delete Mapping
              </button>
              <button
                onClick={resetMapping}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded-md flex items-center ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset Mapping
              </button>
              <button
                onClick={exportMappingData}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded-md flex items-center ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Export
              </button>
              <button
                onClick={importMappingData}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md flex items-center ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Import
              </button>
              <button
                onClick={exportMappingAsPDF}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md flex items-center ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                PDF
              </button>
              <button
                onClick={exportMappingAsCSV}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-2 py-1 rounded-md flex items-center ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
                </svg>
                CSV
              </button>
            </div>
          </div>
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-600">
            <thead>
              <tr>
                <th scope="col" className="py-2 pl-3 pr-2 text-left text-xs font-medium text-gray-300 sm:pl-0">CO</th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PO1' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PO1' ? '' : 'PO1')}
                >
                  PO1
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PO2' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PO2' ? '' : 'PO2')}
                >
                  PO2
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PO3' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PO3' ? '' : 'PO3')}
                >
                  PO3
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PO4' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PO4' ? '' : 'PO4')}
                >
                  PO4
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PO5' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PO5' ? '' : 'PO5')}
                >
                  PO5
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PSO1' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PSO1' ? '' : 'PSO1')}
                >
                  PSO1
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PSO2' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PSO2' ? '' : 'PSO2')}
                >
                  PSO2
                </th>
                <th 
                  scope="col" 
                  className={`px-2 py-2 text-center text-xs font-medium ${selectedPO === 'PSO3' ? 'bg-blue-600 text-white' : 'text-gray-300'} transition-colors`}
                  onClick={() => setSelectedPO(selectedPO === 'PSO3' ? '' : 'PSO3')}
                >
                  PSO3
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {(selectedCO ? mappingData.filter(row => row.co === selectedCO || row.co === 'Avg.') : mappingData).map((row, rowIndex) => (
                <tr key={row.co} className={row.co === 'Avg.' ? 'bg-gray-700' : ''}>
                  <td className="whitespace-nowrap py-2 pl-3 pr-2 text-xs font-medium text-white sm:pl-0">{row.co}</td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PO1' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.po1)} ${selectedPO === 'PO1' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.po1)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'po1', row.po1 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PO1' ? '' : 'PO1');
                          }
                        }}
                      >
                        {row.po1 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PO2' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.po2)} ${selectedPO === 'PO2' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.po2)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'po2', row.po2 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PO2' ? '' : 'PO2');
                          }
                        }}
                      >
                        {row.po2 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PO3' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.po3)} ${selectedPO === 'PO3' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.po3)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'po3', row.po3 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PO3' ? '' : 'PO3');
                          }
                        }}
                      >
                        {row.po3 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PO4' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.po4)} ${selectedPO === 'PO4' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.po4)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'po4', row.po4 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PO4' ? '' : 'PO4');
                          }
                        }}
                      >
                        {row.po4 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PO5' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.po5)} ${selectedPO === 'PO5' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.po5)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'po5', row.po5 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PO5' ? '' : 'PO5');
                          }
                        }}
                      >
                        {row.po5 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PSO1' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.pso1)} ${selectedPO === 'PSO1' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.pso1)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'pso1', row.pso1 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PSO1' ? '' : 'PSO1');
                          }
                        }}
                      >
                        {row.pso1 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PSO2' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.pso2)} ${selectedPO === 'PSO2' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.pso2)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'pso2', row.pso2 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PSO2' ? '' : 'PSO2');
                          }
                        }}
                      >
                        {row.pso2 || '-'}
                      </span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-xs ${selectedPO === 'PSO3' ? 'bg-blue-600 bg-opacity-20' : ''}`}>
                    <div className="flex justify-center">
                      <span 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${getCorrelationColor(row.pso3)} ${selectedPO === 'PSO3' ? 'ring-2 ring-blue-400' : ''} ${row.co !== 'Avg.' ? 'cursor-pointer' : ''}`}
                        title={`${getCorrelationTooltip(row.pso3)}${row.co !== 'Avg.' ? ' - Click to change' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.co !== 'Avg.') {
                            updateMappingValue(row.co, 'pso3', row.pso3 || 0);
                          } else {
                            setSelectedPO(selectedPO === 'PSO3' ? '' : 'PSO3');
                          }
                        }}
                      >
                        {row.pso3 || '-'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-300">
          <p>📌 Values: 3 = Strong Correlation, 2 = Moderate, 1 = Weak</p>
        </div>
      </div>
      )}

      {/* Legend */}
      {selectedCourseCode && mappingData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3 mt-4">
          <h3 className="text-md font-medium text-white mb-3">Correlation Legend</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-600 rounded mr-2"></div>
              <span className="text-sm text-gray-300">3 - Strong</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-300">2 - Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-300">1 - Slight</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-600 rounded mr-2"></div>
              <span className="text-sm text-gray-300">- - No Correlation</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}