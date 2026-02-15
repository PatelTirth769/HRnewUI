import React from 'react';
import { Table, Card } from 'antd';

const ReportTable = ({ data, columns: providedColumns }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Generate columns from the first data item
  const autoColumns = Object.keys(data[0]).map(key => ({
    title: key,
    dataIndex: key,
    key: key,
    sorter: (a, b) => {
      if (typeof a[key] === 'number') {
        return a[key] - b[key];
      }
      return String(a[key]).localeCompare(String(b[key]));
    },
    render: (text) => {
      // Handle different data types for display
      if (text === null || text === undefined) return '-';
      if (typeof text === 'boolean') return text ? 'Yes' : 'No';
      if (text instanceof Date) return text.toLocaleDateString();
      return String(text);
    }
  }));

  const columns = (providedColumns && providedColumns.length) ? providedColumns : autoColumns;

  return (
    <Card className="report-table-card">
      <Table
        columns={columns}
        dataSource={data.map((item, index) => ({ ...item, key: index }))}
        scroll={{ x: 'max-content', y: 400 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
        size="middle"
        bordered
      />
    </Card>
  );
};

export default ReportTable;