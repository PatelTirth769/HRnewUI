import React, { useState } from 'react';
import { Modal, Button, Input, Tree, Space, notification, Row, Col, Card, Spin, Table } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileExcelOutlined, FilePdfOutlined, EyeOutlined, CloseOutlined, SearchOutlined, DragOutlined } from '@ant-design/icons';
import './ReportExport.css';
import ReportTable from './ReportTable.jsx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Search } = Input;

// Mock data for the tree structure
const mockTreeData = [
  {
    title: 'Employee',
    key: '0',
    children: [
      {
        title: 'Personal Details',
        key: '0-0',
        children: [
          { title: 'Employee ID', key: '0-0-0' },
          { title: 'Full Name', key: '0-0-1' },
          { title: 'Date of Birth', key: '0-0-2' },
          { title: 'Gender', key: '0-0-3' },
        ],
      },
      {
        title: 'Address',
        key: '0-1',
        children: [
          { title: 'Street Address', key: '0-1-0' },
          { title: 'City', key: '0-1-1' },
          { title: 'State', key: '0-1-2' },
          { title: 'Postal Code', key: '0-1-3' },
        ],
      },
      {
        title: 'Bank Details',
        key: '0-2',
        children: [
          { title: 'Bank Name', key: '0-2-0' },
          { title: 'Account Number', key: '0-2-1' },
          { title: 'IFSC Code', key: '0-2-2' },
        ],
      },
      {
        title: 'Assignment',
        key: '0-3',
        children: [
          { title: 'Department', key: '0-3-0' },
          { title: 'Position', key: '0-3-1' },
          { title: 'Join Date', key: '0-3-2' },
        ],
      },
      {
        title: 'Hierarchy',
        key: '0-4',
        children: [
          { title: 'Level', key: '0-4-0' },
          { title: 'Grade', key: '0-4-1' },
          { title: 'Team', key: '0-4-2' },
        ],
      },
      {
        title: 'Managers',
        key: '0-5',
        children: [
          { title: 'Direct Manager', key: '0-5-0' },
          { title: 'Department Head', key: '0-5-1' },
        ],
      },
      {
        title: 'Education',
        key: '0-6',
        children: [
          { title: 'Degree', key: '0-6-0' },
          { title: 'Institution', key: '0-6-1' },
          { title: 'Year', key: '0-6-2' },
        ],
      },
      {
        title: 'Leaves',
        key: '0-7',
        children: [
          { title: 'Leave Balance', key: '0-7-0' },
          { title: 'Leave History', key: '0-7-1' },
        ],
      },
      {
        title: 'Trainings',
        key: '0-8',
        children: [
          { title: 'Training Name', key: '0-8-0' },
          { title: 'Completion Date', key: '0-8-1' },
          { title: 'Status', key: '0-8-2' },
        ],
      },
      {
        title: 'Performance',
        key: '0-9',
        children: [
          { title: 'Ratings', key: '0-9-0' },
          { title: 'Reviews', key: '0-9-1' },
          { title: 'Goals', key: '0-9-2' },
        ],
      },
      {
        title: 'Travels',
        key: '0-10',
        children: [
          { title: 'Travel History', key: '0-10-0' },
          { title: 'Upcoming Travels', key: '0-10-1' },
        ],
      },
    ],
  },
];

// Enhanced mock data with tree structure for preview
const mockEmployeeTreeData = [
  {
    title: 'Employees',
    key: 'employees',
    children: [
      {
        title: 'EMP001 - John Doe',
        key: 'emp001',
        children: [
          {
            title: 'Personal Details',
            key: 'emp001-personal',
            children: [
              { title: 'Employee ID: EMP001', key: 'emp001-id' },
              { title: 'Full Name: John Doe', key: 'emp001-name' },
              { title: 'Date of Birth: 1990-05-15', key: 'emp001-dob' },
              { title: 'Gender: Male', key: 'emp001-gender' },
            ],
          },
          {
            title: 'Address',
            key: 'emp001-address',
            children: [
              { title: 'Street Address: 123 Main St', key: 'emp001-street' },
              { title: 'City: New York', key: 'emp001-city' },
              { title: 'State: NY', key: 'emp001-state' },
              { title: 'Postal Code: 10001', key: 'emp001-postal' },
            ],
          },
          {
            title: 'Bank Details',
            key: 'emp001-bank',
            children: [
              { title: 'Bank Name: Chase Bank', key: 'emp001-bank-name' },
              { title: 'Account Number: XXXX-XXXX-1234', key: 'emp001-account' },
              { title: 'IFSC Code: CHASE12345', key: 'emp001-ifsc' },
            ],
          },
          {
            title: 'Assignment',
            key: 'emp001-assignment',
            children: [
              { title: 'Department: IT', key: 'emp001-dept' },
              { title: 'Position: Senior Developer', key: 'emp001-pos' },
              { title: 'Join Date: 2020-01-15', key: 'emp001-join' },
            ],
          },
          {
            title: 'Hierarchy',
            key: 'emp001-hierarchy',
            children: [
              { title: 'Level: L4', key: 'emp001-level' },
              { title: 'Grade: G7', key: 'emp001-grade' },
              { title: 'Team: Backend Development', key: 'emp001-team' },
            ],
          },
          {
            title: 'Managers',
            key: 'emp001-managers',
            children: [
              { title: 'Direct Manager: Jane Smith', key: 'emp001-manager' },
              { title: 'Department Head: Mike Johnson', key: 'emp001-head' },
            ],
          },
          {
            title: 'Education',
            key: 'emp001-education',
            children: [
              { title: 'Degree: Master in Computer Science', key: 'emp001-degree' },
              { title: 'Institution: MIT', key: 'emp001-institution' },
              { title: 'Year: 2015', key: 'emp001-year' },
            ],
          },
          {
            title: 'Leaves',
            key: 'emp001-leaves',
            children: [
              { title: 'Leave Balance: 15 days', key: 'emp001-balance' },
              { title: 'Sick Leave: 7 days', key: 'emp001-sick' },
              { title: 'Casual Leave: 8 days', key: 'emp001-casual' },
            ],
          },
          {
            title: 'Trainings',
            key: 'emp001-trainings',
            children: [
              { title: 'Training Name: Advanced React', key: 'emp001-training1' },
              { title: 'Completion Date: 2023-06-15', key: 'emp001-training-date1' },
              { title: 'Status: Completed', key: 'emp001-training-status1' },
            ],
          },
          {
            title: 'Performance',
            key: 'emp001-performance',
            children: [
              { title: 'Ratings: 4.8/5', key: 'emp001-ratings' },
              { title: 'Reviews: Excellent performance in Q3 2023', key: 'emp001-reviews' },
              { title: 'Goals: Implement microservices architecture', key: 'emp001-goals' },
            ],
          },
          {
            title: 'Travels',
            key: 'emp001-travels',
            children: [
              { title: 'Travel History: San Francisco - Tech Conference 2023', key: 'emp001-travel-history' },
              { title: 'Upcoming Travels: London - Team Meeting Dec 2023', key: 'emp001-upcoming-travel' },
            ],
          },
        ],
      },
      {
        title: 'EMP002 - Alice Johnson',
        key: 'emp002',
        children: [
          {
            title: 'Personal Details',
            key: 'emp002-personal',
            children: [
              { title: 'Employee ID: EMP002', key: 'emp002-id' },
              { title: 'Full Name: Alice Johnson', key: 'emp002-name' },
              { title: 'Date of Birth: 1988-08-20', key: 'emp002-dob' },
              { title: 'Gender: Female', key: 'emp002-gender' },
            ],
          },
          {
            title: 'Address',
            key: 'emp002-address',
            children: [
              { title: 'Street Address: 456 Park Avenue', key: 'emp002-street' },
              { title: 'City: Boston', key: 'emp002-city' },
              { title: 'State: MA', key: 'emp002-state' },
              { title: 'Postal Code: 02108', key: 'emp002-postal' },
            ],
          },
          {
            title: 'Bank Details',
            key: 'emp002-bank',
            children: [
              { title: 'Bank Name: Bank of America', key: 'emp002-bank-name' },
              { title: 'Account Number: XXXX-XXXX-5678', key: 'emp002-account' },
              { title: 'IFSC Code: BOA98765', key: 'emp002-ifsc' },
            ],
          },
          {
            title: 'Assignment',
            key: 'emp002-assignment',
            children: [
              { title: 'Department: HR', key: 'emp002-dept' },
              { title: 'Position: HR Manager', key: 'emp002-pos' },
              { title: 'Join Date: 2019-03-20', key: 'emp002-join' },
            ],
          },
          {
            title: 'Hierarchy',
            key: 'emp002-hierarchy',
            children: [
              { title: 'Level: L3', key: 'emp002-level' },
              { title: 'Grade: G6', key: 'emp002-grade' },
              { title: 'Team: HR Operations', key: 'emp002-team' },
            ],
          },
          {
            title: 'Managers',
            key: 'emp002-managers',
            children: [
              { title: 'Direct Manager: Robert Brown', key: 'emp002-manager' },
              { title: 'Department Head: Sarah Wilson', key: 'emp002-head' },
            ],
          },
          {
            title: 'Education',
            key: 'emp002-education',
            children: [
              { title: 'Degree: MBA in HR Management', key: 'emp002-degree' },
              { title: 'Institution: Harvard Business School', key: 'emp002-institution' },
              { title: 'Year: 2014', key: 'emp002-year' },
            ],
          },
          {
            title: 'Leaves',
            key: 'emp002-leaves',
            children: [
              { title: 'Leave Balance: 12 days', key: 'emp002-balance' },
              { title: 'Sick Leave: 5 days', key: 'emp002-sick' },
              { title: 'Casual Leave: 7 days', key: 'emp002-casual' },
            ],
          },
          {
            title: 'Trainings',
            key: 'emp002-trainings',
            children: [
              { title: 'Training Name: Leadership Development', key: 'emp002-training1' },
              { title: 'Completion Date: 2023-08-30', key: 'emp002-training-date1' },
              { title: 'Status: Completed', key: 'emp002-training-status1' },
            ],
          },
          {
            title: 'Performance',
            key: 'emp002-performance',
            children: [
              { title: 'Ratings: 4.7/5', key: 'emp002-ratings' },
              { title: 'Reviews: Outstanding leadership skills', key: 'emp002-reviews' },
              { title: 'Goals: Implement new recruitment strategy', key: 'emp002-goals' },
            ],
          },
          {
            title: 'Travels',
            key: 'emp002-travels',
            children: [
              { title: 'Travel History: Chicago - HR Summit 2023', key: 'emp002-travel-history' },
              { title: 'Upcoming Travels: Miami - Recruitment Drive Jan 2024', key: 'emp002-upcoming-travel' },
            ],
          },
        ],
      },
      {
        title: 'EMP003 - Michael Chen',
        key: 'emp003',
        children: [
          {
            title: 'Personal Details',
            key: 'emp003-personal',
            children: [
              { title: 'Employee ID: EMP003', key: 'emp003-id' },
              { title: 'Full Name: Michael Chen', key: 'emp003-name' },
              { title: 'Date of Birth: 1992-11-30', key: 'emp003-dob' },
              { title: 'Gender: Male', key: 'emp003-gender' },
            ],
          },
          {
            title: 'Address',
            key: 'emp003-address',
            children: [
              { title: 'Street Address: 789 Tech Boulevard', key: 'emp003-street' },
              { title: 'City: San Francisco', key: 'emp003-city' },
              { title: 'State: CA', key: 'emp003-state' },
              { title: 'Postal Code: 94105', key: 'emp003-postal' },
            ],
          },
          {
            title: 'Bank Details',
            key: 'emp003-bank',
            children: [
              { title: 'Bank Name: Wells Fargo', key: 'emp003-bank-name' },
              { title: 'Account Number: XXXX-XXXX-9012', key: 'emp003-account' },
              { title: 'IFSC Code: WF543210', key: 'emp003-ifsc' },
            ],
          },
          {
            title: 'Assignment',
            key: 'emp003-assignment',
            children: [
              { title: 'Department: Product', key: 'emp003-dept' },
              { title: 'Position: Product Manager', key: 'emp003-pos' },
              { title: 'Join Date: 2021-06-01', key: 'emp003-join' },
            ],
          },
          {
            title: 'Hierarchy',
            key: 'emp003-hierarchy',
            children: [
              { title: 'Level: L3', key: 'emp003-level' },
              { title: 'Grade: G5', key: 'emp003-grade' },
              { title: 'Team: Mobile Products', key: 'emp003-team' },
            ],
          },
          {
            title: 'Managers',
            key: 'emp003-managers',
            children: [
              { title: 'Direct Manager: Emily Davis', key: 'emp003-manager' },
              { title: 'Department Head: David Wilson', key: 'emp003-head' },
            ],
          },
          {
            title: 'Education',
            key: 'emp003-education',
            children: [
              { title: 'Degree: MS in Product Management', key: 'emp003-degree' },
              { title: 'Institution: Stanford University', key: 'emp003-institution' },
              { title: 'Year: 2018', key: 'emp003-year' },
            ],
          },
          {
            title: 'Leaves',
            key: 'emp003-leaves',
            children: [
              { title: 'Leave Balance: 18 days', key: 'emp003-balance' },
              { title: 'Sick Leave: 8 days', key: 'emp003-sick' },
              { title: 'Casual Leave: 10 days', key: 'emp003-casual' },
            ],
          },
          {
            title: 'Trainings',
            key: 'emp003-trainings',
            children: [
              { title: 'Training Name: Product Innovation', key: 'emp003-training1' },
              { title: 'Completion Date: 2023-09-15', key: 'emp003-training-date1' },
              { title: 'Status: In Progress', key: 'emp003-training-status1' },
            ],
          },
          {
            title: 'Performance',
            key: 'emp003-performance',
            children: [
              { title: 'Ratings: 4.9/5', key: 'emp003-ratings' },
              { title: 'Reviews: Exceptional product vision', key: 'emp003-reviews' },
              { title: 'Goals: Launch mobile app 2.0', key: 'emp003-goals' },
            ],
          },
          {
            title: 'Travels',
            key: 'emp003-travels',
            children: [
              { title: 'Travel History: Seattle - Product Summit 2023', key: 'emp003-travel-history' },
              { title: 'Upcoming Travels: Tokyo - Market Research Feb 2024', key: 'emp003-upcoming-travel' },
            ],
          },
        ],
      },
    ],
  },
];

const DraggableTreeNode = ({ data }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COLUMN',
    item: data,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [data]);

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="draggable-tree-node"
    >
      {data.title}
    </div>
  );
};

const DroppableArea = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COLUMN',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [onDrop]);

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isOver ? '#e6f7ff' : 'transparent',
        height: '100%',
        minHeight: '200px',
        padding: '8px',
      }}
    >
      {children}
    </div>
  );
};

const DraggableSelectedColumn = ({ id, index, column, moveColumn, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'SELECTED_COLUMN',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'SELECTED_COLUMN',
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.index === index) return;
      moveColumn(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className="selected-column-item"
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        margin: '4px 0',
        background: '#fff',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.3s'
      }}
    >
      <DragOutlined style={{ marginRight: 8, color: '#999' }} />
      <span style={{ flex: 1 }}>{column.title}</span>
      <Button 
        type="text" 
        icon={<CloseOutlined />}
        onClick={() => onRemove(column.key)}
        style={{ color: '#ff4d4f' }}
      />
    </div>
  );
};

const getAllChildFields = (node) => {
  let fields = [];
  if (node.children) {
    node.children.forEach(child => {
      if (child.children) {
        fields = [...fields, ...getAllChildFields(child)];
      } else {
        fields.push(child);
      }
    });
  } else {
    fields.push(node);
  }
  return fields;
};

const PreviewModal = ({ visible, onClose, selectedColumns, previewData }) => {
  const generateTableData = () => {
    if (!selectedColumns.length) return [];

    return previewData[0].children.map(employee => {
      const rowData = { key: employee.key };
      
      // Find corresponding employee data
      const employeeData = employee.children.reduce((acc, category) => {
        category.children.forEach(item => {
          const [field, value] = item.title.split(': ');
          if (value) {
            acc[field] = value;
          }
        });
        return acc;
      }, {});

      selectedColumns.forEach(col => {
        let value = '';
        if (employeeData[col.title]) {
          value = employeeData[col.title];
        } else {
          // Search through the employee's tree structure for the value
          employee.children.forEach(category => {
            category.children.forEach(item => {
              if (item.title.includes(col.title)) {
                value = item.title.split(': ')[1] || item.title;
              }
            });
          });
        }
        rowData[col.title] = value;
      });

      return rowData;
    });
  };

  const columns = selectedColumns.map(col => ({
    title: col.title,
    dataIndex: col.title,
    key: col.key,
    sorter: (a, b) => {
      const aVal = a[col.title] || '';
      const bVal = b[col.title] || '';
      return aVal.localeCompare(bVal);
    },
  }));

  return (
    <Modal
      title="Preview Selected Data"
      open={visible}
      onCancel={onClose}
      width="90vw"
      footer={null}
    >
      <Table 
        columns={columns} 
        dataSource={generateTableData()}
        scroll={{ x: 'max-content' }}
        pagination={false}
        size="middle"
        bordered
      />
    </Modal>
  );
};

const EmployeeReportContent = ({ reportOpen, onClose }) => {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(['0']);

  const handleDrop = (item) => {
    let newColumns = [...selectedColumns];
    
    // If dropping a parent node, get all its child fields
    if (item.children) {
      const childFields = getAllChildFields(item);
      childFields.forEach(field => {
        if (!newColumns.find(col => col.key === field.key)) {
          newColumns.push(field);
        }
      });
    } else {
      // Single field drop
      if (!newColumns.find(col => col.key === item.key)) {
        newColumns.push(item);
      }
    }
    
    setSelectedColumns(newColumns);
  };

  const moveColumn = (fromIndex, toIndex) => {
    const updatedColumns = [...selectedColumns];
    const [movedColumn] = updatedColumns.splice(fromIndex, 1);
    updatedColumns.splice(toIndex, 0, movedColumn);
    setSelectedColumns(updatedColumns);
  };

  const handleRemoveColumn = (columnKey) => {
    setSelectedColumns(selectedColumns.filter(col => col.key !== columnKey));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleExport = (type) => {
    if (selectedColumns.length === 0) {
      notification.warning({
        message: 'No Columns Selected',
        description: 'Please select at least one column to export.',
      });
      return;
    }

    setLoading(true);
    try {
      const exportData = mockEmployeeTreeData[0].children.map(employee => {
        const data = {};
        const employeeData = employee.children.reduce((acc, category) => {
          category.children.forEach(item => {
            const [field, value] = item.title.split(': ');
            if (value) {
              acc[field] = value;
            }
          });
          return acc;
        }, {});

        selectedColumns.forEach(col => {
          data[col.title] = employeeData[col.title] || '';
        });
        return data;
      });

      if (type === 'Excel') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Report");
        
        // Add some styling to the Excel sheet
        const colWidths = selectedColumns.map(() => ({ width: 20 }));
        ws['!cols'] = colWidths;
        
        XLSX.writeFile(wb, `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (type === 'PDF') {
        const doc = new jsPDF('l', 'pt', 'a4');
        doc.text('Employee Report', 40, 40);
        
        doc.autoTable({
          head: [selectedColumns.map(col => col.title)],
          body: exportData.map(row => selectedColumns.map(col => row[col.title])),
          startY: 60,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [71, 71, 71] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        
        doc.save(`Employee_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      notification.success({
        message: `${type} Export Successful`,
        description: `Your ${type} file has been downloaded successfully.`,
      });
    } catch (error) {
      notification.error({
        message: 'Export Error',
        description: error.message || 'Failed to export report. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const filterTreeData = (nodes) => {
    if (!nodes) return [];
    
    return nodes.map(node => {
      const newNode = { ...node };
      if (node.children) {
        newNode.children = filterTreeData(node.children);
      }
      return newNode;
    }).filter(node => 
      node.title.toLowerCase().includes(searchText) ||
      (node.children && node.children.length > 0)
    );
  };

  const filteredTreeData = searchText ? filterTreeData(mockTreeData) : mockTreeData;

  return (
    <Modal
      width={'90vw'}
      title="Employee Report Export"
      open={reportOpen}
      onCancel={onClose}
      footer={[
        <Button 
          key="show" 
          type="default"
          onClick={handlePreview}
          disabled={selectedColumns.length === 0}
          icon={<EyeOutlined />}
        >
          Preview
        </Button>,
        <Button 
          key="excel" 
          type="primary"
          onClick={() => handleExport('Excel')}
          disabled={selectedColumns.length === 0}
          icon={<FileExcelOutlined />}
          style={{ background: '#217346' }}
        >
          Export Excel
        </Button>,
        <Button 
          key="pdf" 
          type="primary"
          onClick={() => handleExport('PDF')}
          disabled={selectedColumns.length === 0}
          icon={<FilePdfOutlined />}
          style={{ background: '#FF4B4B' }}
        >
          Export PDF
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Search
            placeholder="Search columns..."
            allowClear
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: 200 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Card 
                title="Employee Data Structure" 
                style={{ 
                  height: '400px', 
                  overflowY: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Tree
                  treeData={filteredTreeData}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  titleRender={(nodeData) => (
                    <DraggableTreeNode data={nodeData} />
                  )}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title="Selected Columns" 
                style={{ 
                  height: '400px', 
                  overflowY: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <DroppableArea onDrop={handleDrop}>
                  {selectedColumns.map((col, index) => (
                    <DraggableSelectedColumn
                      key={col.key}
                      id={col.key}
                      index={index}
                      column={col}
                      moveColumn={moveColumn}
                      onRemove={handleRemoveColumn}
                    />
                  ))}
                </DroppableArea>
              </Card>
            </Col>
          </Row>
        </Space>
      </Spin>

      <PreviewModal
        visible={showPreview}
        onClose={handleClosePreview}
        selectedColumns={selectedColumns}
        previewData={mockEmployeeTreeData}
      />
    </Modal>
  );
};

const EmployeeReportExport = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
    <EmployeeReportContent {...props} />
    </DndProvider>
  );
};

export default EmployeeReportExport;
