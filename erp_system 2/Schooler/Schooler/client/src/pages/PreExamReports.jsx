import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaPrint, FaChartBar, FaUsers, FaBuilding, FaClipboardList, FaBarcode } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PreExamReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [reportFilters, setReportFilters] = useState({
    examCenterId: '',
    programId: '',
    yearId: '',
    examDate: '',
    reportType: 'summary',
    format: 'pdf'
  });
  const [examCenters, setExamCenters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const reportTypes = [
    { id: 'student-summary', name: 'Student Summary Report', icon: FaUsers },
    { id: 'exam-center-summary', name: 'Exam Center Summary', icon: FaBuilding },
    { id: 'attendance-report', name: 'Attendance Report', icon: FaClipboardList },
    { id: 'seat-allocation', name: 'Seat Allocation Report', icon: FaChartBar },
    { id: 'barcode-summary', name: 'Barcode Generation Summary', icon: FaBarcode },
    { id: 'block-resource', name: 'Block & Resource Report', icon: FaBuilding },
    { id: 'exam-schedule', name: 'Exam Schedule Report', icon: FaClipboardList },
    { id: 'center-capacity', name: 'Center Capacity Report', icon: FaChartBar }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [centersRes, programsRes, yearsRes] = await Promise.all([
        axios.get('/api/exam-centers'),
        axios.get('/api/programs'),
        axios.get('/api/years')
      ]);
      
      setExamCenters(Array.isArray(centersRes.data) ? centersRes.data : []);
      setPrograms(Array.isArray(programsRes.data) ? programsRes.data : []);
      setYears(Array.isArray(yearsRes.data) ? yearsRes.data : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch dropdown data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type = 'download') => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        reportType: selectedReport,
        format: reportFilters.format,
        ...reportFilters
      });

      if (type === 'preview') {
        const response = await axios.get(`/api/reports/pre-exam/preview?${params.toString()}`);
        setReportData(response.data);
        setShowPreview(true);
      } else {
        const response = await axios.get(`/api/reports/pre-exam/download?${params.toString()}`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedReport}-${new Date().toISOString().split('T')[0]}.${reportFilters.format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    // Open print window with report data
    const printWindow = window.open('/print-report', '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.postMessage({
          type: 'PRINT_REPORT',
          reportType: selectedReport,
          filters: reportFilters,
          reportData: reportData
        }, '*');
      };
    }
  };

  const clearFilters = () => {
    setReportFilters({
      examCenterId: '',
      programId: '',
      yearId: '',
      examDate: '',
      reportType: 'summary',
      format: 'pdf'
    });
    setSelectedReport('');
    setReportData(null);
  };

  const getExamCenterName = (centerId) => {
    const center = examCenters.find(c => c.examCenterId === centerId);
    return center ? center.examCenterName : centerId;
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.programId === programId);
    return program ? program.programName : programId;
  };

  const getYearName = (yearId) => {
    const year = years.find(y => y.yearId === yearId);
    return year ? year.yearName : yearId;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pre-Exam Reports</h1>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <IconComponent className="text-3xl text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium text-sm">{report.name}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center</label>
            <select
              value={reportFilters.examCenterId}
              onChange={(e) => setReportFilters({...reportFilters, examCenterId: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Centers</option>
              {examCenters.map(center => (
                <option key={center.examCenterId} value={center.examCenterId}>
                  {center.examCenterName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={reportFilters.programId}
              onChange={(e) => setReportFilters({...reportFilters, programId: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.programId} value={program.programId}>
                  {program.programName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={reportFilters.yearId}
              onChange={(e) => setReportFilters({...reportFilters, yearId: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year.yearId} value={year.yearId}>
                  {year.yearName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
            <input
              type="date"
              value={reportFilters.examDate}
              onChange={(e) => setReportFilters({...reportFilters, examDate: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportFilters.reportType}
              onChange={(e) => setReportFilters({...reportFilters, reportType: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="graphical">Graphical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={reportFilters.format}
              onChange={(e) => setReportFilters({...reportFilters, format: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear Filters
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => generateReport('preview')}
              disabled={!selectedReport || loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              Preview
            </button>
            <button
              onClick={() => generateReport('download')}
              disabled={!selectedReport || loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Download
            </button>
            <button
              onClick={printReport}
              disabled={!selectedReport}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && reportData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            {reportData.summary && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-lg font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {reportData.data && Array.isArray(reportData.data) && (
              <div>
                <h3 className="font-semibold mb-2">Data Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(reportData.data[0] || {}).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-3 py-2 whitespace-nowrap text-sm">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.data.length > 10 && (
                    <div className="text-center text-gray-500 text-sm mt-2">
                      Showing first 10 of {reportData.data.length} records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
            <button
              onClick={() => generateReport('download')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <FaDownload className="mr-2" /> Download Full Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreExamReports;