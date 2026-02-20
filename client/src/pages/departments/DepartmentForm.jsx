import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { notification, Spin, Table, Button, Input, Select, Checkbox, Tabs } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TabPane } = Tabs;

const DepartmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, we are editing
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Dropdown Data States
  const [companies, setCompanies] = useState([]);
  const [parentDepartments, setParentDepartments] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [leaveBlockLists, setLeaveBlockLists] = useState([]);
  const [users, setUsers] = useState([]); // For Approvers

  const [formData, setFormData] = useState({
    department_name: '',
    company: '', // Default company if needed
    parent_department: '',
    is_group: 0,
    disabled: 0,
    payroll_cost_center: '',
    leave_block_list: '',
    shift_request_approver: [],
    leave_approver: [],
    expense_approver: []
  });

  useEffect(() => {
    fetchDropdowns();
    if (id || location.pathname.includes('/edit')) {
      setIsEditMode(true);
      if (location.state?.department) {
        fetchDepartmentDetails(location.state.department.name);
      } else if (id) {
        fetchDepartmentDetails(id);
      }
    }
  }, [id, location]);

  const fetchDropdowns = async () => {
    try {
      const [companiesRes, deptsRes, costsRes, blockListsRes, usersRes] = await Promise.all([
        api.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
        api.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
        api.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None'),
        api.get('/api/resource/Leave Block List?fields=["name"]&limit_page_length=None'),
        api.get('/api/resource/User?fields=["name","full_name"]&filters=[["enabled","=","1"]]&limit_page_length=None')
      ]);

      if (companiesRes.data.data) setCompanies(companiesRes.data.data);
      if (deptsRes.data.data) setParentDepartments(deptsRes.data.data);
      if (costsRes.data.data) setCostCenters(costsRes.data.data);
      if (blockListsRes.data.data) setLeaveBlockLists(blockListsRes.data.data);
      if (usersRes.data.data) setUsers(usersRes.data.data);

      // Set default company if only one exists and we are in create mode
      if (companiesRes.data.data && companiesRes.data.data.length === 1 && !id) {
        setFormData(prev => ({ ...prev, company: companiesRes.data.data[0].name }));
      }

    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      notification.error({ message: "Failed to load dependency data" });
    }
  };

  const fetchDepartmentDetails = async (deptName) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/resource/Department/${deptName}`);
      if (response.data && response.data.data) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
      notification.error({ message: "Failed to fetch department details" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Helper for Child Tables
  const handleAddRow = (tableField) => {
    setFormData(prev => ({
      ...prev,
      [tableField]: [...(prev[tableField] || []), { approver: '' }]
    }));
  };

  const handleRemoveRow = (tableField, index) => {
    const newRows = [...(formData[tableField] || [])];
    newRows.splice(index, 1);
    setFormData(prev => ({ ...prev, [tableField]: newRows }));
  };

  const handleTableChange = (tableField, index, field, value) => {
    const newRows = [...(formData[tableField] || [])];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, [tableField]: newRows }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.department_name) {
      notification.error({ message: "Department Name is required" });
      return;
    }
    if (!formData.company) {
      notification.error({ message: "Company is required" });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/api/resource/Department/${formData.name}`, formData); // Use original name ID for PUT
        notification.success({ message: "Department updated successfully" });
      } else {
        await api.post('/api/resource/Department', formData);
        notification.success({ message: "Department created successfully" });
      }
      navigate('/master/departments');
    } catch (error) {
      console.error("Error saving department:", error);
      notification.error({
        message: "Failed to save department",
        description: error.response?.data?.exception || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Columns for Approver Tables
  const approverColumns = (tableField) => [
    {
      title: 'Approver',
      dataIndex: 'approver',
      key: 'approver',
      render: (text, record, index) => (
        <Select
          showSearch
          placeholder="Select Approver"
          optionFilterProp="children"
          value={text}
          onChange={(value) => handleTableChange(tableField, index, 'approver', value)}
          style={{ width: '100%' }}
        >
          {users.map(user => (
            <Option key={user.name} value={user.name}>{user.full_name} ({user.name})</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record, index) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRow(tableField, index)}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Department' : 'New Department'}</h1>
                <p className="text-gray-600">{isEditMode ? `Editing: ${formData.department_name}` : 'Create a new department'}</p>
              </div>
              <button
                onClick={() => navigate('/master/departments')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Back to List
              </button>
            </div>
          </div>

          <Spin spinning={loading}>
            <form onSubmit={handleSubmit} className="p-6">

              {/* Main Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.department_name}
                    onChange={(e) => handleChange('department_name', e.target.value)}
                    placeholder="e.g. Sales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company <span className="text-red-500">*</span></label>
                  <Select
                    showSearch
                    value={formData.company}
                    onChange={(value) => handleChange('company', value)}
                    style={{ width: '100%' }}
                    placeholder="Select Company"
                  >
                    {companies.map(c => <Option key={c.name} value={c.name}>{c.name}</Option>)}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Department</label>
                  <Select
                    showSearch
                    value={formData.parent_department}
                    onChange={(value) => handleChange('parent_department', value)}
                    style={{ width: '100%' }}
                    placeholder="Select Parent Department"
                    allowClear
                  >
                    {parentDepartments.map(d => <Option key={d.name} value={d.name}>{d.name}</Option>)}
                  </Select>
                </div>
                <div className="flex items-center space-x-6 mt-6">
                  <Checkbox
                    checked={formData.is_group === 1}
                    onChange={(e) => handleChange('is_group', e.target.checked ? 1 : 0)}
                  >
                    Is Group
                  </Checkbox>
                  <Checkbox
                    checked={formData.disabled === 1}
                    onChange={(e) => handleChange('disabled', e.target.checked ? 1 : 0)}
                  >
                    Disabled
                  </Checkbox>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Cost Center</label>
                  <Select
                    showSearch
                    value={formData.payroll_cost_center}
                    onChange={(value) => handleChange('payroll_cost_center', value)}
                    style={{ width: '100%' }}
                    placeholder="Select Cost Center"
                    allowClear
                  >
                    {costCenters.map(cc => <Option key={cc.name} value={cc.name}>{cc.name}</Option>)}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Block List</label>
                  <Select
                    showSearch
                    value={formData.leave_block_list}
                    onChange={(value) => handleChange('leave_block_list', value)}
                    style={{ width: '100%' }}
                    placeholder="Select Leave Block List"
                    allowClear
                  >
                    {leaveBlockLists.map(lb => <Option key={lb.name} value={lb.name}>{lb.name}</Option>)}
                  </Select>
                </div>
              </div>

              {/* Approvers Child Tables */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Approvers</h3>
                <Tabs defaultActiveKey="1" type="card">
                  <TabPane tab="Shift Request Approver" key="1">
                    <Table
                      dataSource={formData.shift_request_approver || []}
                      columns={approverColumns('shift_request_approver')}
                      pagination={false}
                      rowKey={(record, index) => index}
                      size="small"
                    />
                    <Button type="dashed" onClick={() => handleAddRow('shift_request_approver')} block icon={<PlusOutlined />} className="mt-2">
                      Add Row
                    </Button>
                  </TabPane>
                  <TabPane tab="Leave Approver" key="2">
                    <Table
                      dataSource={formData.leave_approver || []}
                      columns={approverColumns('leave_approver')}
                      pagination={false}
                      rowKey={(record, index) => index}
                      size="small"
                    />
                    <Button type="dashed" onClick={() => handleAddRow('leave_approver')} block icon={<PlusOutlined />} className="mt-2">
                      Add Row
                    </Button>
                  </TabPane>
                  <TabPane tab="Expense Approver" key="3">
                    <Table
                      dataSource={formData.expense_approver || []}
                      columns={approverColumns('expense_approver')}
                      pagination={false}
                      rowKey={(record, index) => index}
                      size="small"
                    />
                    <Button type="dashed" onClick={() => handleAddRow('expense_approver')} block icon={<PlusOutlined />} className="mt-2">
                      Add Row
                    </Button>
                  </TabPane>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/master/departments')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading && <Spin size="small" className="mr-2" />}
                  {isEditMode ? 'Update Department' : 'Create Department'}
                </button>
              </div>

            </form>
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default DepartmentForm;
