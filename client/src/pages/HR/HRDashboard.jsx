import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Dropdown, Popover, Select, Button, Space } from 'antd';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

const HRDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchDashboardData = () => {
        setLoading(true);
        fetch('/local-api/hr-dashboard')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch dashboard data");
                return res.json();
            })
            .then(fetchedData => {
                setData(fetchedData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching HR Dashboard data:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading && !data) return <div className="p-8 flex justify-center"><Spin size="large" /></div>;
    if (error) return <div className="p-8"><Alert message="Error" description={error} type="error" showIcon /></div>;
    if (!data) return null;

    const { stats, charts } = data;

    const actionMenuItems = [
        { key: 'refresh', label: 'Refresh', onClick: fetchDashboardData },
        { key: 'edit', label: 'Edit' },
    ];

    const filterContent = (
        <div style={{ width: '380px', padding: '4px' }}>
            <Row gutter={[8, 8]} align="middle" className="mb-3">
                <Col span={7}><Select value="Status" style={{ width: '100%' }} disabled /></Col>
                <Col span={6}><Select value="Equals" style={{ width: '100%' }} disabled /></Col>
                <Col span={9}>
                    <Select defaultValue="Active" style={{ width: '100%' }}>
                        <Select.Option value="Active">Active</Select.Option>
                        <Select.Option value="Inactive">Inactive</Select.Option>
                    </Select>
                </Col>
                <Col span={2} className="text-center">
                    <span className="text-gray-400 hover:text-red-500 cursor-pointer text-lg font-bold" onClick={() => {}}>×</span>
                </Col>
            </Row>
            <Row gutter={[8, 8]} align="middle" className="mb-4">
                <Col span={7}><Select value="Company" style={{ width: '100%' }} disabled /></Col>
                <Col span={6}><Select value="Equals" style={{ width: '100%' }} disabled /></Col>
                <Col span={9}>
                    <Select defaultValue="Preeshe Consultant" style={{ width: '100%' }}>
                        <Select.Option value="Preeshe Consultant">Preeshe Consultant</Select.Option>
                    </Select>
                </Col>
                <Col span={2} className="text-center">
                    <span className="text-gray-400 hover:text-red-500 cursor-pointer text-lg font-bold" onClick={() => {}}>×</span>
                </Col>
            </Row>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <Button type="link" size="small" style={{ padding: 0, color: '#6b7280' }}>+ Add a Filter</Button>
                <Space>
                    <Button type="text" size="small" style={{ color: '#6b7280' }}>Clear Filters</Button>
                    <Button type="primary" size="small" style={{ backgroundColor: '#111827', color: 'white' }}>Apply Filters</Button>
                </Space>
            </div>
        </div>
    );

    const renderChartControls = () => (
        <div className="flex text-gray-400 gap-2">
            <Popover content={filterContent} trigger="click" placement="bottomRight" overlayInnerStyle={{ padding: '8px' }}>
                <span className="cursor-pointer border border-gray-100 bg-gray-50 p-1 rounded hover:text-gray-600 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                </span>
            </Popover>
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']} placement="bottomRight">
                <span className="cursor-pointer border border-gray-100 bg-gray-50 p-1 rounded hover:text-gray-600 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </span>
            </Dropdown>
        </div>
    );

    // Helper for rendering Pie charts uniformly
    const renderPieChart = (chartData) => {
        if (!chartData) return null;
        const mappedData = {
            labels: chartData.labels,
            datasets: [
                {
                    data: chartData.counts,
                    backgroundColor: [
                        '#B4D1F0', // Light Blue
                        '#E896B4', // Pinkish
                        '#508DE6', // Solid Blue
                        '#76C185', // Green
                        '#FFD166', // Yellowish
                        '#06D6A0',
                        '#118AB2',
                    ],
                    borderWidth: 1,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                    }
                }
            }
        };

        return (
            <div style={{ height: 250 }}>
                <Pie data={mappedData} options={options} />
            </div>
        );
    };

    const renderBarChart = (chartData) => {
        if (!chartData) return null;
        const mappedData = {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Employees',
                    data: chartData.counts,
                    backgroundColor: '#8BC3F4',
                    borderRadius: 2,
                    barPercentage: 0.5,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        };

        return (
            <div style={{ height: 300 }}>
                <Bar data={mappedData} options={options} />
            </div>
        );
    };

    const renderStatCard = (title, count, description) => (
        <Card bodyStyle={{ padding: '16px' }} style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderColor: '#f0f0f0' }}>
            <div className="flex justify-between items-start">
               <div>
                  <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">{title}</Text>
                  <Title level={3} style={{ marginTop: '8px', marginBottom: '8px' }}>{count}</Title>
                  {description && <Text type="secondary" className="text-xs">{description}</Text>}
               </div>
               <Dropdown menu={{ items: actionMenuItems }} trigger={['click']} placement="bottomRight">
                   <div className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                   </div>
               </Dropdown>
            </div>
        </Card>
    );

    const chartCardStyle = { borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderColor: '#f0f0f0' };

    return (
        <div style={{ padding: '24px', backgroundColor: '#fafafa', minHeight: '100%' }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={4} style={{ margin: 0 }}>Human Resource Dashboard</Title>
                <Dropdown menu={{ items: actionMenuItems }} trigger={['click']} placement="bottomRight">
                    <div className="cursor-pointer text-gray-400 bg-gray-100 p-1.5 rounded hover:bg-gray-200">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </div>
                </Dropdown>
            </div>

            {/* Stat Cards Row */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} md={8} lg={6}>
                    {renderStatCard('Total Employees', stats?.totalEmployees?.count, stats?.totalEmployees?.description)}
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    {renderStatCard('New Hires (This Year)', stats?.newHires?.count, stats?.newHires?.description)}
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    {renderStatCard('Employee Exits (This Year)', stats?.employeeExits?.count, stats?.employeeExits?.description)}
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    {renderStatCard('Employees Joining (This Quarter)', stats?.employeesJoining?.count, stats?.employeesJoining?.description)}
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    {renderStatCard('Employees Relieving (This Quarter)', stats?.employeesRelieving?.count, stats?.employeesRelieving?.description)}
                </Col>
            </Row>

            {/* Main Bar Chart */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col span={24}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Text strong style={{ fontSize: '15px' }}>Employees by Age</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderBarChart(charts?.employeesByAge)}
                    </Card>
                </Col>
            </Row>

            {/* Pie Charts Grid */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Gender Diversity Ratio</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.genderDiversity)}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Employees by Type</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.employeesByType)}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Employees by Grade</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.employeesByGrade)}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Employees by Branch</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.employeesByBranch)}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Designation Wise Employee Count</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.designationWise)}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={chartCardStyle} bodyStyle={{ padding: '20px' }}>
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <Text strong style={{ fontSize: '15px' }}>Department Wise Employee Count</Text>
                                <div style={{ marginTop: '2px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Last synced {stats?.lastSynced}</Text>
                                </div>
                            </div>
                            {renderChartControls()}
                        </div>
                        {renderPieChart(charts?.departmentWise)}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default HRDashboard;
