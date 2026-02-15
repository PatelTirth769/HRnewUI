import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState({
    sales: {
      title: 'Sales Report',
      description: 'Monthly sales performance and revenue analysis',
      data: [
        { month: 'January', revenue: 125000, orders: 245, growth: '+12%' },
        { month: 'February', revenue: 135000, orders: 267, growth: '+8%' },
        { month: 'March', revenue: 142000, orders: 289, growth: '+5%' },
        { month: 'April', revenue: 158000, orders: 312, growth: '+11%' },
        { month: 'May', revenue: 165000, orders: 334, growth: '+4%' },
        { month: 'June', revenue: 178000, orders: 356, growth: '+8%' }
      ]
    },
    financial: {
      title: 'Financial Report',
      description: 'Financial statements and budget analysis',
      data: [
        { category: 'Revenue', amount: 178000, budget: 180000, variance: '-1.1%' },
        { category: 'Expenses', amount: 125000, budget: 130000, variance: '+3.8%' },
        { category: 'Profit', amount: 53000, budget: 50000, variance: '+6.0%' },
        { category: 'Taxes', amount: 12000, budget: 12500, variance: '+4.0%' },
        { category: 'Net Income', amount: 41000, budget: 37500, variance: '+9.3%' }
      ]
    },
    inventory: {
      title: 'Inventory Report',
      description: 'Stock levels and inventory turnover analysis',
      data: [
        { product: 'Product A', stock: 450, reorder: 100, status: 'Good' },
        { product: 'Product B', stock: 75, reorder: 200, status: 'Low' },
        { product: 'Product C', stock: 890, reorder: 150, status: 'Good' },
        { product: 'Product D', stock: 25, reorder: 80, status: 'Critical' },
        { product: 'Product E', stock: 340, reorder: 120, status: 'Good' }
      ]
    },
    customer: {
      title: 'Customer Report',
      description: 'Customer acquisition and retention metrics',
      data: [
        { metric: 'New Customers', value: 156, change: '+15%', trend: 'up' },
        { metric: 'Returning Customers', value: 892, change: '+8%', trend: 'up' },
        { metric: 'Customer Satisfaction', value: '4.7/5', change: '+0.2', trend: 'up' },
        { metric: 'Churn Rate', value: '2.3%', change: '-0.5%', trend: 'down' },
        { metric: 'Average Order Value', value: '$485', change: '+12%', trend: 'up' }
      ]
    },
    performance: {
      title: 'Performance Report',
      description: 'System performance and operational metrics',
      data: [
        { metric: 'System Uptime', value: '99.9%', target: '99.5%', status: 'Excellent' },
        { metric: 'Response Time', value: '245ms', target: '<300ms', status: 'Good' },
        { metric: 'Error Rate', value: '0.02%', target: '<0.1%', status: 'Excellent' },
        { metric: 'User Activity', value: '1,247', target: '1,000', status: 'Above Target' },
        { metric: 'Database Queries', value: '45,892', target: '50,000', status: 'Good' }
      ]
    },
    custom: {
      title: 'Custom Report',
      description: 'Create custom reports with specific parameters',
      data: []
    }
  });

  const reportTypes = [
    { id: 'sales', label: 'Sales Report', icon: '📊' },
    { id: 'financial', label: 'Financial Report', icon: '💰' },
    { id: 'inventory', label: 'Inventory Report', icon: '📦' },
    { id: 'customer', label: 'Customer Report', icon: '👥' },
    { id: 'performance', label: 'Performance Report', icon: '⚡' },
    { id: 'custom', label: 'Custom Report', icon: '🛠️' }
  ];

  const handleExport = (format) => {
    alert(`Exporting ${reportData[activeReport].title} as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReport = reportData[activeReport];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <p className="text-gray-600 mt-1">Generate and analyze business reports</p>
              </div>
              <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Report Types</h3>
                {reportTypes.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full text-left px-4 py-3 rounded-md mb-2 transition-colors ${
                      activeReport === report.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-3">{report.icon}</span>
                    {report.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              {/* Report Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{currentReport.title}</h2>
                  <p className="text-gray-600 mt-1">{currentReport.description}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    📄 Export PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    📊 Export Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    🖨️ Print
                  </button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-6">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              {activeReport === 'sales' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800">Total Revenue</h3>
                      <p className="text-3xl font-bold text-blue-600">₹1,203,000</p>
                      <p className="text-sm text-blue-600">+8.2% from last period</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800">Total Orders</h3>
                      <p className="text-3xl font-bold text-green-600">2,403</p>
                      <p className="text-sm text-green-600">+6.8% from last period</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-800">Average Order</h3>
                      <p className="text-3xl font-bold text-purple-600">₹501</p>
                      <p className="text-sm text-purple-600">+1.4% from last period</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{row.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.orders}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{row.growth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeReport === 'financial' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800">Net Income</h3>
                      <p className="text-3xl font-bold text-green-600">₹41,000</p>
                      <p className="text-sm text-green-600">+9.3% above budget</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-800">Total Expenses</h3>
                      <p className="text-3xl font-bold text-red-600">₹125,000</p>
                      <p className="text-sm text-red-600">+3.8% below budget</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{row.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{row.budget.toLocaleString()}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              row.variance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {row.variance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeReport === 'inventory' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800">Total Products</h3>
                      <p className="text-3xl font-bold text-blue-600">1,780</p>
                      <p className="text-sm text-blue-600">In stock</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-yellow-800">Low Stock Items</h3>
                      <p className="text-3xl font-bold text-yellow-600">12</p>
                      <p className="text-sm text-yellow-600">Need reordering</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-800">Critical Items</h3>
                      <p className="text-3xl font-bold text-red-600">3</p>
                      <p className="text-sm text-red-600">Immediate action required</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Point</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.product}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.stock}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.reorder}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                row.status === 'Good' ? 'bg-green-100 text-green-800' :
                                row.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeReport === 'customer' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800">Total Customers</h3>
                      <p className="text-3xl font-bold text-blue-600">1,048</p>
                      <p className="text-sm text-blue-600">+156 new this month</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800">Satisfaction Score</h3>
                      <p className="text-3xl font-bold text-green-600">4.7/5</p>
                      <p className="text-sm text-green-600">Excellent rating</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-800">Churn Rate</h3>
                      <p className="text-3xl font-bold text-purple-600">2.3%</p>
                      <p className="text-sm text-purple-600">Low churn rate</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.value}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              row.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {row.change}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.trend === 'up' ? '📈' : '📉'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeReport === 'performance' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800">System Uptime</h3>
                      <p className="text-3xl font-bold text-green-600">99.9%</p>
                      <p className="text-sm text-green-600">Excellent performance</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800">Response Time</h3>
                      <p className="text-3xl font-bold text-blue-600">245ms</p>
                      <p className="text-sm text-blue-600">Good performance</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.target}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                row.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                                row.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeReport === 'custom' && (
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Custom Report</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Sales Analysis</option>
                          <option>Customer Behavior</option>
                          <option>Financial Summary</option>
                          <option>Performance Metrics</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                          <option>Last Quarter</option>
                          <option>Last Year</option>
                          <option>Custom Range</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Include Metrics</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          Revenue
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          Customer Count
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Conversion Rate
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Average Order Value
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;