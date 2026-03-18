import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import OutcomeDetails from './OutcomeDetails';

// SVG Icons
const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const DocumentDuplicateIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ArrowDownTrayIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const DocumentArrowUpIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
import { getStorageData, setStorageData } from '../../../services/storageService';

export default function MappingTable() {
  // State for mapping data
  const [mappingData, setMappingData] = useState(() => {
    const savedData = getStorageData('mapping_data');
    return savedData || generateDefaultMapping();
  });

  // State for selected CO
  const [selectedCO, setSelectedCO] = useState('');
  
  // State to control the visibility of outcome details
  const [showOutcomeDetails, setShowOutcomeDetails] = useState(false);

  // Save mapping data to localStorage whenever it changes
  useEffect(() => {
    setStorageData('mapping_data', mappingData);
  }, [mappingData]);

  // Function to generate default mapping data
  function generateDefaultMapping() {
    return {
      rows: [
        { co: 'CO1', peo1: 3, peo2: 3, peo3: 3, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO2', peo1: 3, peo2: 3, peo3: 3, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO3', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO4', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO5', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO6', peo1: 0, peo2: 0, peo3: 0, pso1: 0, pso2: 0, pso3: 0 },
        { co: 'CO7', peo1: 0, peo2: 0, peo3: 0, pso1: 0, pso2: 0, pso3: 0 },
      ],
      averages: calculateAverages([
        { co: 'CO1', peo1: 3, peo2: 3, peo3: 3, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO2', peo1: 3, peo2: 3, peo3: 3, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO3', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO4', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO5', peo1: 3, peo2: 3, peo3: 2, pso1: 3, pso2: 2, pso3: 1 },
        { co: 'CO6', peo1: 0, peo2: 0, peo3: 0, pso1: 0, pso2: 0, pso3: 0 },
        { co: 'CO7', peo1: 0, peo2: 0, peo3: 0, pso1: 0, pso2: 0, pso3: 0 },
      ])
    };
  }

  // Function to calculate averages
  function calculateAverages(rows) {
    const averages = { co: 'Avg.' };
    const columns = ['peo1', 'peo2', 'peo3', 'pso1', 'pso2', 'pso3'];
    
    columns.forEach(col => {
      const sum = rows.reduce((acc, row) => acc + (row[col] || 0), 0);
      averages[col] = parseFloat((sum / (rows.length || 1)).toFixed(1));
    });
    
    return averages;
  }

  // Function to get color based on correlation value
  const getCorrelationColor = (value) => {
    if (value === 3) return 'bg-green-600 text-white';
    if (value === 2) return 'bg-yellow-600 text-white';
    if (value === 1) return 'bg-red-600 text-white';
    return 'bg-gray-600 text-white';
  };

  // Function to get correlation tooltip
  const getCorrelationTooltip = (value) => {
    if (value === 3) return 'Strong Correlation';
    if (value === 2) return 'Moderate Correlation';
    if (value === 1) return 'Weak Correlation';
    return 'No Correlation';
  };

  // Function to update mapping value
  const updateMappingValue = (coId, poId, currentValue) => {
    // Cycle through values: 0 -> 1 -> 2 -> 3 -> 0
    const newValue = (currentValue + 1) % 4;
    
    const updatedRows = mappingData.rows.map(row => {
      if (row.co === coId) {
        return { ...row, [poId]: newValue };
      }
      return row;
    });
    
    const updatedAverages = calculateAverages(updatedRows);
    
    setMappingData({
      rows: updatedRows,
      averages: updatedAverages
    });
    
    toast.success(`Updated ${coId} - ${poId.toUpperCase()} to ${newValue}`);
  };

  // Function to add new mapping
  const addNewMapping = () => {
    // Find the highest CO number
    const coNumbers = mappingData.rows
      .map(row => parseInt(row.co.replace('CO', '')))
      .filter(num => !isNaN(num));
    
    const highestCONumber = Math.max(...coNumbers, 0);
    const newCOId = `CO${highestCONumber + 1}`;
    
    // Add new CO mapping row
    const updatedRows = [
      ...mappingData.rows,
      { co: newCOId, po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, pso1: 0, pso2: 0, pso3: 0 }
    ];
    
    const updatedAverages = calculateAverages(updatedRows);
    
    setMappingData({
      rows: updatedRows,
      averages: updatedAverages
    });
    
    toast.success(`Added new course outcome ${newCOId}`);
  };

  // Function to copy mapping
  const copyMapping = () => {
    const mappingText = [
      'CO\tPEO1\tPEO2\tPEO3\tPSO1\tPSO2\tPSO3',
      ...mappingData.rows.map(row => 
        `${row.co}\t${row.peo1}\t${row.peo2}\t${row.peo3}\t${row.pso1}\t${row.pso2}\t${row.pso3}`
      ),
      `Avg.\t${mappingData.averages.peo1}\t${mappingData.averages.peo2}\t${mappingData.averages.peo3}\t${mappingData.averages.pso1}\t${mappingData.averages.pso2}\t${mappingData.averages.pso3}`
    ].join('\n');
    
    navigator.clipboard.writeText(mappingText)
      .then(() => toast.success('Mapping copied to clipboard'))
      .catch(() => toast.error('Failed to copy mapping'));
  };

  // Function to delete mapping
  const deleteMapping = () => {
    if (window.confirm('Are you sure you want to delete this mapping?')) {
      setMappingData(generateDefaultMapping());
      toast.success('Mapping reset to default');
    }
  };

  // Function to reset mapping
  const resetMapping = () => {
    if (window.confirm('Are you sure you want to reset this mapping?')) {
      setMappingData(generateDefaultMapping());
      toast.success('Mapping reset to default');
    }
  };

  // Function to export mapping as CSV
  const exportCSV = () => {
    const mappingCSV = [
      'CO,PEO1,PEO2,PEO3,PSO1,PSO2,PSO3',
      ...mappingData.rows.map(row => 
        `${row.co},${row.peo1},${row.peo2},${row.peo3},${row.pso1},${row.pso2},${row.pso3}`
      ),
      `Avg.,${mappingData.averages.peo1},${mappingData.averages.peo2},${mappingData.averages.peo3},${mappingData.averages.pso1},${mappingData.averages.pso2},${mappingData.averages.pso3}`
    ].join('\n');
    
    const blob = new Blob([mappingCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'co_po_mapping.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Mapping exported as CSV');
  };

  // Function to export mapping as PDF
  const exportPDF = () => {
    toast.success('PDF export functionality will be implemented');
    // PDF export functionality to be implemented
  };

  // Function to import mapping
  const importMapping = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n');
        
        // Skip header line
        const dataLines = lines.slice(1, -1); // Exclude header and average line
        
        const rows = dataLines.map(line => {
          const values = line.split(',');
          return {
            co: values[0],
            po1: parseInt(values[1]) || 0,
            po2: parseInt(values[2]) || 0,
            po3: parseInt(values[3]) || 0,
            po4: parseInt(values[4]) || 0,
            po5: parseInt(values[5]) || 0,
            pso1: parseInt(values[6]) || 0,
            pso2: parseInt(values[7]) || 0,
            pso3: parseInt(values[8]) || 0
          };
        });
        
        const averages = calculateAverages(rows);
        
        setMappingData({
          rows,
          averages
        });
        
        toast.success('Mapping imported successfully');
      } catch (error) {
        toast.error('Failed to import mapping');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-bold text-white mb-2 md:mb-0">CO-PO/PSO Mapping</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addNewMapping}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add New Mapping
            </button>
            
            <button
              onClick={copyMapping}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
              Copy Mapping
            </button>
            
            <button
              onClick={deleteMapping}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete Mapping
            </button>
            
            <button
              onClick={resetMapping}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Reset Mapping
            </button>
            
            <button
              onClick={exportPDF}
              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              PDF
            </button>
            
            <button
              onClick={exportCSV}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-2 rounded-md flex items-center"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              CSV
            </button>
            
            <label className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-md flex items-center cursor-pointer">
              <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
              Import
              <input
                type="file"
                accept=".csv"
                onChange={importMapping}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {/* Correlation Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="text-sm text-white mr-2">Values:</span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs mr-1">3</span>
            <span className="text-xs text-gray-300 mr-2">= Strong,</span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-600 text-white text-xs mr-1">2</span>
            <span className="text-xs text-gray-300 mr-2">= Moderate,</span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white text-xs mr-1">1</span>
            <span className="text-xs text-gray-300">= Weak</span>
          </div>
        </div>
        
        {/* Mapping Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-300">CO</th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PEO details"
                >
                  PEO1
                </th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PEO details"
                >
                  PEO2
                </th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PEO details"
                >
                  PEO3
                </th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PSO details"
                >
                  PSO1
                </th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PSO details"
                >
                  PSO2
                </th>
                <th 
                  scope="col" 
                  className="py-3 px-4 text-center text-xs font-medium text-gray-300 cursor-pointer hover:bg-gray-600"
                  onClick={() => setShowOutcomeDetails(!showOutcomeDetails)}
                  title="Click to view PSO details"
                >
                  PSO3
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {mappingData.rows.map((row) => (
                <tr key={row.co} className={selectedCO === row.co ? 'bg-gray-700' : ''}>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-white">{row.co}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.peo1)} cursor-pointer`}
                      title={getCorrelationTooltip(row.peo1)}
                      onClick={() => updateMappingValue(row.co, 'peo1', row.peo1)}
                    >
                      {row.peo1 || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.peo2)} cursor-pointer`}
                      title={getCorrelationTooltip(row.peo2)}
                      onClick={() => updateMappingValue(row.co, 'peo2', row.peo2)}
                    >
                      {row.peo2 || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.peo3)} cursor-pointer`}
                      title={getCorrelationTooltip(row.peo3)}
                      onClick={() => updateMappingValue(row.co, 'peo3', row.peo3)}
                    >
                      {row.peo3 || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.pso1)} cursor-pointer`}
                      title={getCorrelationTooltip(row.pso1)}
                      onClick={() => updateMappingValue(row.co, 'pso1', row.pso1)}
                    >
                      {row.pso1 || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.pso2)} cursor-pointer`}
                      title={getCorrelationTooltip(row.pso2)}
                      onClick={() => updateMappingValue(row.co, 'pso2', row.pso2)}
                    >
                      {row.pso2 || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                    <span 
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getCorrelationColor(row.pso3)} cursor-pointer`}
                      title={getCorrelationTooltip(row.pso3)}
                      onClick={() => updateMappingValue(row.co, 'pso3', row.pso3)}
                    >
                      {row.pso3 || '-'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Average Row */}
              <tr className="bg-gray-700">
                <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-white">Avg.</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.peo1}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.peo2}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.peo3}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.pso1}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.pso2}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600 text-white">
                    {mappingData.averages.pso3}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Correlation Legend (Bottom) */}
        <div className="mt-4 bg-gray-700 p-3 rounded-md">
          <h3 className="text-sm font-medium text-white mb-2">Correlation Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-sm mr-2"></div>
              <span className="text-xs text-gray-300">3 - Strong</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-600 rounded-sm mr-2"></div>
              <span className="text-xs text-gray-300">2 - Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-sm mr-2"></div>
              <span className="text-xs text-gray-300">1 - Slight</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-600 rounded-sm mr-2"></div>
              <span className="text-xs text-gray-300">- - No Correlation</span>
            </div>
          </div>
        </div>
        
        {/* Outcome Details Accordion */}
        {showOutcomeDetails && <OutcomeDetails />}
      </div>
    </motion.div>
  );
}