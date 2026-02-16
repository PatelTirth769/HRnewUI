import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Tree, Space, notification, Row, Col, Card, Spin, Table } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileExcelOutlined, FilePdfOutlined, EyeOutlined, CloseOutlined, SearchOutlined, DragOutlined } from '@ant-design/icons';
import './ReportExport.css';
import ReportTable from './ReportTable.jsx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API from '../../services/api';

const { Search } = Input;

// Mock data for the tree structure
// Mock data removed in favor of dynamic fetching
const mockTreeData = [];
const mockEmployeeTreeData = [];

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
      if (child.children) { // If it's a nested section
        fields = [...fields, ...getAllChildFields(child)];
      } else { // If it's a leaf field
        fields.push(child);
      }
    });
  } else { // If the node itself is a leaf field
    fields.push(node);
  }
  return fields;
};

// PreviewModal component updated to use raw data
const PreviewModal = ({ visible, onClose, selectedColumns, previewData }) => {
  const columns = selectedColumns.map(col => ({
    title: col.title,
    dataIndex: col.key, // Use col.key for dataIndex
    key: col.key,
    sorter: (a, b) => {
      const aVal = a[col.key] || '';
      const bVal = b[col.key] || '';
      return String(aVal).localeCompare(String(bVal));
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
        dataSource={previewData} // Use previewData directly
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
  const [previewData, setPreviewData] = useState([]); // Store fetched data for preview
  const [treeData, setTreeData] = useState([]); // Store fields from DocType
  const [expandedKeys, setExpandedKeys] = useState([]); // For tree expansion

  // Fetch Fields from DocType on mount
  useEffect(() => {
    if (reportOpen) {
      const fetchDocType = async () => {
        try {
          // Fetch Employee DocType definition
          const res = await API.get('/api/resource/DocType/Employee');
          const fields = res.data.data.fields;

          // Build Tree from fields
          const tree = [];
          let currentSection = { title: 'General Details', key: 'sec_general', children: [] };
          tree.push(currentSection);

          fields.forEach(f => {
            if (f.fieldtype === 'Section Break') {
              currentSection = { title: f.label || 'Other Details', key: f.fieldname || `sec_${Math.random()}`, children: [] };
              tree.push(currentSection);
            } else if (['Column Break', 'Table', 'Button', 'HTML', 'Attach Image', 'Signature', 'Barcode', 'Rating'].includes(f.fieldtype)) {
              // Skip layout/special fields that are not typically for reporting
            } else {
              // Add field to current section
              currentSection.children.push({
                title: f.label, // Display Label
                key: f.fieldname, // API Field Name
                isLeaf: true
              });
            }
          });

          setTreeData(tree.filter(t => t.children.length > 0)); // Only keep sections with fields
          setExpandedKeys(tree.filter(t => t.children.length > 0).map(t => t.key)); // Expand all sections by default

        } catch (err) {
          console.error("Failed to fetch DocType:", err);
          notification.error({ message: 'Failed to load fields' });
        }
      };

      fetchDocType();
    }
  }, [reportOpen]);

  const handleDrop = (item) => {
    let newColumns = [...selectedColumns];

    // If dropping a parent node (section), get all its child fields
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

  // Helper to fetch data
  const fetchReportData = async () => {
    const fieldNames = selectedColumns.map(c => c.key); // ['first_name', 'department', ...]
    // Always include 'name' for keys if not already present
    const fieldsToFetch = JSON.stringify([...new Set(['name', ...fieldNames])]);

    const res = await API.get(`/api/resource/Employee?fields=${fieldsToFetch}&limit_page_length=None`);
    return res.data.data;
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      setPreviewData(data); // Store raw data
      setShowPreview(true);
    } catch (err) {
      console.error("Failed to fetch preview data:", err);
      notification.error({ message: 'Failed to fetch preview data' });
    } finally {
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleExport = async (type) => {
    if (selectedColumns.length === 0) {
      notification.warning({
        message: 'No Columns Selected',
        description: 'Please select at least one column to export.',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchReportData();

      // Transform for Export (Flatten if needed, handle nulls)
      const exportData = data.map(row => {
        const newRow = {};
        selectedColumns.forEach(col => {
          newRow[col.title] = row[col.key] || ''; // Use col.title for header, col.key for data
        });
        return newRow;
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
      console.error(error);
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
      node.title?.toLowerCase().includes(searchText) ||
      (node.children && node.children.length > 0)
    );
  };

  const filteredTreeData = searchText ? filterTreeData(treeData) : treeData;

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
        previewData={previewData}
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
