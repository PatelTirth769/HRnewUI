import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Tree, Space, notification, Row, Col, Card, Spin } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileExcelOutlined, FilePdfOutlined, EyeOutlined, CloseOutlined, SearchOutlined, DragOutlined } from '@ant-design/icons';
import api from '../../utility/api';
import './ReportExport.css';
import ReportTable from './ReportTable.jsx';
import './ReportTable.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Option } = Select;
const { Search } = Input;

const DraggableTreeNode = ({ data }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COLUMN',
    item: { data },
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
    drop: (item) => onDrop(item.data),
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

// Draggable Selected Column Item Component
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

const ReportContent = ({ reportOpen, exportData, onClose }) => {
  const [templateName, setTemplateName] = useState('');
  const [treeData, setTreeData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [exportType, setExportType] = useState('');
  const [queryFields, setQueryFields] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const selectedMenuCode = JSON.parse(localStorage.getItem('selectedMenuCode'));

  useEffect(() => {
    const transformedData = exportData.columns.map((col, index) => ({
      title: col.title,
      key: index.toString(),
      children: null
    }));
    setTreeData(transformedData);
  }, [exportData.columns]);

  const handleDrop = (item) => {
    if (!selectedColumns.find(col => col.key === item.key)) {
      setSelectedColumns([...selectedColumns, item]);
    }
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

  const handleQueryFieldChange = (field, value) => {
    setQueryFields(prev => ({
      ...prev,
      [field]: value
    }));
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
      const exportPayload = {
        MenuID: selectedMenuCode,
        TemplateName: templateName || 'Export',
        TemplateTable: exportData.tableName,
        OutputColumns: selectedColumns.map(col => col.title).join(','),
        QueryFields: Object.keys(queryFields).map(key => ({
          FieldName: key,
          Value: queryFields[key]
        })),
        TemplateType: type,
        ExportType: type
      };

      const response = await fetch('http://localhost:5000/actions/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exportPayload,
          ResponseType: 'json'
        })
      });
      if (!response.ok) {
        throw new Error('Server error while fetching report');
      }
      const respJson = await response.json();
      if (!respJson || !respJson.data) {
        throw new Error('No data received from server');
      }
      const data = respJson.data;

      if (type === 'Show') {
        setPreviewData(data);
      } else if (type === 'Excel') {
        // Generate Excel file using XLSX
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Style headers
        const range = XLSX.utils.decode_range(ws['!ref']);
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4A90E2" } },
          alignment: { horizontal: 'center' }
        };

        // Apply header styles
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const header = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[header]) continue;
          if (!ws.s) ws.s = {};
          if (!ws.s.fills) ws.s.fills = [];
          ws[header].s = headerStyle;
        }

        // Auto-size columns
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxLen = 10;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cell] && ws[cell].v) {
              const len = String(ws[cell].v).length;
              if (len > maxLen) maxLen = len;
            }
          }
          colWidths[C] = { width: maxLen + 2 };
        }
        ws['!cols'] = colWidths;

        // Create workbook and append worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");

        // Generate Excel file
        XLSX.writeFile(wb, `${templateName || 'Export'}_${new Date().toISOString().split('T')[0]}.xlsx`);

        notification.success({
          message: 'Excel Export Successful',
          description: 'Your Excel file has been downloaded successfully.',
        });
      } else if (type === 'PDF') {
        // Generate PDF using jsPDF with autotable
        const doc = new jsPDF('l', 'pt', 'a4');
        
        // Add title
        doc.setFontSize(18);
        doc.setTextColor(51, 51, 51);
        doc.text(templateName || 'Export Report', doc.internal.pageSize.width / 2, 40, { align: 'center' });

        // Add timestamp
        doc.setFontSize(10);
        doc.setTextColor(119, 119, 119);
        doc.text(new Date().toLocaleString(), doc.internal.pageSize.width - 40, 20, { align: 'right' });

        // Prepare table data
        const headers = Object.keys(data[0]);
        const tableData = data.map(row => headers.map(header => row[header]));

        // Add table
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 60,
          styles: {
            fontSize: 9,
            cellPadding: 5,
            overflow: 'linebreak',
            halign: 'left'
          },
          headStyles: {
            fillColor: [74, 144, 226],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 60 },
          theme: 'grid'
        });

        // Save PDF
        doc.save(`${templateName || 'Export'}_${new Date().toISOString().split('T')[0]}.pdf`);

        notification.success({
          message: 'PDF Export Successful',
          description: 'Your PDF file has been downloaded successfully.',
        });
      }
    } catch (error) {
      console.error('Error in export:', error);
      notification.error({
        message: 'Export Error',
        description: error.message || 'Failed to export report. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShow = async () => {
    setExportType('Show');
    await handleExport('Show');
  };

  const handleExcelExport = async () => {
    setExportType('Excel');
    await handleExport('Excel');
      };

  const handlePdfExport = async () => {
    setExportType('PDF');
    await handleExport('PDF');
  };

  const filteredTreeData = treeData.filter(node => 
    node.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      width={'90vw'}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{exportData.title}</span>
         
        </div>
      }
      open={reportOpen}
      onCancel={onClose}
      footer={[
        <Button 
          key="show" 
          type="default"
          onClick={() => {
            handleShow();
            setShowPreview(true);
          }}
          disabled={selectedColumns.length === 0}
          icon={<EyeOutlined />}
        >
          Preview
        </Button>,
        <Button 
          key="excel" 
          type="primary"
          onClick={handleExcelExport}
          disabled={selectedColumns.length === 0}
          icon={<FileExcelOutlined />}
          style={{ background: '#217346' }}
        >
          Export Excel
        </Button>,
        <Button 
          key="pdf" 
          type="primary"
          onClick={handlePdfExport}
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
        <Space>
            <Search
              placeholder="Search columns..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
          />
          </Space>

          {/* Columns Selection Section */}
          <Row gutter={16}>
          <Col span={12}>
            <Card 
              title="Available Columns" 
                style={{ 
                height: '400px', 
                overflowY: 'auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              bodyStyle={{ padding: '12px' }}
              >
              {filteredTreeData.map((node) => (
                <DraggableTreeNode key={node.key} data={node} />
              ))}
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
              bodyStyle={{ padding: '12px' }}
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

          {/* Preview Data Section */}
          {showPreview && previewData && (
            <Card
              title="Preview Data"
              extra={
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  onClick={() => setShowPreview(false)}
                />
              }
              style={{ marginTop: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <ReportTable data={previewData} />
            </Card>
          )}
        </Space>
      </Spin>
    </Modal>
  );
};

// Add some CSS styles
const styles = `
  .selected-column-item:hover {
    background: #f5f5f5;
  }
  
  .ant-input-search .ant-input {
    border-radius: 4px;
  }
  
  .ant-card {
    border-radius: 8px;
  }
  
  .draggable-tree-node {
    padding: 8px 12px;
    margin: 4px 0;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    cursor: move;
    transition: all 0.3s;
  }
  
  .draggable-tree-node:hover {
    background: #f5f5f5;
    border-color: #40a9ff;
  }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const ReportExport = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReportContent {...props} />
    </DndProvider>
  );
};

export default ReportExport;
