import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle, 
  FiClock, 
  FiSearch, 
  FiInfo, 
  FiRefreshCw,
  FiTrendingUp,
  FiChevronRight,
  FiTrash2
} from 'react-icons/fi';
import { db } from '../../config/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function ImportLogs() {
  const [api, contextHolder] = notification.useNotification();
  const [logsList, setLogsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRun, setSelectedRun] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch logs from Firestore
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "schooler_system", "student_imports", "logs");
      const q = query(colRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedLogs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let formattedTime = 'N/A';
        if (data.timestamp) {
          formattedTime = data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date(data.timestamp).toLocaleString();
        } else if (data.time) {
          formattedTime = new Date(data.time).toLocaleString();
        }
        
        fetchedLogs.push({
          id: doc.id,
          runId: data.id || doc.id,
          fileName: data.fileName || 'Unknown File',
          importType: data.importType || 'Insert New Records',
          timeString: formattedTime,
          timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(),
          successCount: Number(data.successCount) || 0,
          failureCount: Number(data.failureCount) || 0,
          totalRecords: Number(data.totalRecords) || 0,
          status: data.status || 'Success',
          logs: data.logs || [],
          module: data.module || 'Student'
        });
      });
      
      setLogsList(fetchedLogs);
    } catch (err) {
      console.error('Failed to load Firestore import logs:', err);
      api.error({
        message: 'Load Failed',
        description: 'Could not fetch import logs from Firestore. Please try again.',
        duration: 4
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute metrics
  const totalImports = logsList.length;
  const totalSuccessRows = logsList.reduce((acc, curr) => acc + curr.successCount, 0);
  const totalFailedRows = logsList.reduce((acc, curr) => acc + curr.failureCount, 0);
  const totalProcessedRows = totalSuccessRows + totalFailedRows;
  const successRate = totalProcessedRows > 0 ? ((totalSuccessRows / totalProcessedRows) * 100).toFixed(1) : '0';

  // Filtered list
  const filteredLogs = logsList.filter(log => {
    const matchesSearch = log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.runId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && log.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleOpenDetails = (run) => {
    setSelectedRun(run);
    setIsDrawerOpen(true);
  };

  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this import log?")) {
      return;
    }
    
    try {
      api.info({ message: 'Deleting log...', duration: 1.5 });
      await deleteDoc(doc(db, "schooler_system", "student_imports", "logs", id));
      api.success({ message: 'Deleted Successfully', description: 'The import log has been removed.' });
      setLogsList(prev => prev.filter(log => log.id !== id));
      if (selectedRun?.id === id) {
        setIsDrawerOpen(false);
        setSelectedRun(null);
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
      api.error({ message: 'Delete Failed', description: 'Could not remove the log from Firestore.' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in relative min-h-screen">
      {contextHolder}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Student Import Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and inspect client-side student import sessions executed on this website.
          </p>
        </div>
        <div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Import Runs</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalImports}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FiFileText className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Successful Rows</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalSuccessRows}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <FiCheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed Rows</span>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalFailedRows}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <FiXCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Success Rate</span>
            <h3 className="text-2xl font-bold text-violet-600 mt-1">{successRate}%</h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FiSearch className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search by file or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-gray-50/50"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {['All', 'Success', 'Partial Success', 'Failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === status 
                  ? 'bg-gray-900 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm">Fetching import logs from Firestore...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FiInfo className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No Import Logs Found</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              We couldn't find any student import logs matching your criteria. Try performing an import from the Student screen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-600">Import ID / File</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Import Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Operation Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Row Results</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (log.status === 'Partial Success') {
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                  } else if (log.status === 'Failed') {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                            <FiFileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 truncate max-w-xs">{log.fileName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{log.runId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FiClock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.timeString}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 text-xs px-2.5 py-1 bg-gray-100 rounded-md font-medium">
                          {log.importType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-emerald-600">{log.successCount}</span>
                          <span className="text-gray-400">/</span>
                          <span className="font-bold text-rose-600">{log.failureCount}</span>
                          <span className="text-gray-400">of</span>
                          <span className="font-bold text-gray-700">{log.totalRecords}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpenDetails(log)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                          >
                            Inspect Logs
                            <FiChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteLog(log.id, e)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer flex items-center justify-center"
                            title="Delete Log"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sliding Inspector Drawer Panel */}
      {isDrawerOpen && selectedRun && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-gray-100">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 truncate max-w-md">{selectedRun.fileName}</h2>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <span>ID: {selectedRun.runId}</span>
                  <span>•</span>
                  <span>{selectedRun.timeString}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Run Summary Subcard */}
            <div className="p-6 border-b border-gray-100 grid grid-cols-3 gap-4 bg-white">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-center">
                <span className="text-xs font-medium text-emerald-800">Success Rows</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{selectedRun.successCount}</p>
              </div>
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 text-center">
                <span className="text-xs font-medium text-rose-800">Failed Rows</span>
                <p className="text-2xl font-bold text-rose-700 mt-1">{selectedRun.failureCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-600">Total Rows</span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{selectedRun.totalRecords}</p>
              </div>
            </div>

            {/* Run Detailed Row Logs List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detailed Processing Logs</h3>
              {selectedRun.logs && selectedRun.logs.length > 0 ? (
                selectedRun.logs.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border flex items-start gap-3 transition shadow-xs ${
                      item.type === 'success' 
                        ? 'bg-emerald-50/20 border-emerald-100/50 text-emerald-950' 
                        : 'bg-rose-50/20 border-rose-100/50 text-rose-950'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.type === 'success' ? (
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm font-medium leading-relaxed break-all">
                      {item.msg}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <FiInfo className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No individual row logs found for this run.</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition cursor-pointer shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
