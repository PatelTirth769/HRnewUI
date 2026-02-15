import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Progress,
  Badge,
  Statistic,
  Typography,
  Modal,
  Table,
  Button,
  Switch,
} from 'antd';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title } = Typography;

const Dashboard = () => {
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [showTotalEmployeesCard, setShowTotalEmployeesCard] = useState(true);
  const [showPresentEmployeesCard, setShowPresentEmployeesCard] = useState(true);
  const [showAverageWorkingHoursCard, setShowAverageWorkingHoursCard] = useState(true);
  const [showCheckedOutEmployeesCard, setShowCheckedOutEmployeesCard] = useState(true);
  const [showAttendanceDistributionChart, setShowAttendanceDistributionChart] = useState(true);
  const [showEmployeeTypesCard, setShowEmployeeTypesCard] = useState(true);
  const [showAttendanceTrendsChart, setShowAttendanceTrendsChart] = useState(true);
  const [showTotalCheckInsCard, setShowTotalCheckInsCard] = useState(true);
  const [showTotalCheckOutsCard, setShowTotalCheckOutsCard] = useState(true);
  const [showPresentEmployeesStatCard, setShowPresentEmployeesStatCard] = useState(true);
  const [personalizeModalVisible, setPersonalizeModalVisible] = useState(false);

  // Sample data for stacked bar chart
  const attendanceData = [
    {
      date: 'Jan',
      TotalEmployees: 450,
      CheckedOut: 85,
      CheckedIn: 120,
      Total: 655,
    },
    {
      date: 'Feb',
      TotalEmployees: 480,
      CheckedOut: 90,
      CheckedIn: 125,
      Total: 695,
    },
    {
      date: 'Mar',
      TotalEmployees: 460,
      CheckedOut: 88,
      CheckedIn: 122,
      Total: 670,
    },
    {
      date: 'Apr',
      TotalEmployees: 500,
      CheckedOut: 95,
      CheckedIn: 130,
      Total: 725,
    },
    {
      date: 'May',
      TotalEmployees: 520,
      CheckedOut: 98,
      CheckedIn: 135,
      Total: 753,
    },
  ];

  // Sample data for modals
  const employeeList = [
    { key: '1', name: 'Sagar Jani', department: 'IT', employeeType: 'Full-time', duration: 3 },
    { key: '2', name: 'Ram Kumar', department: 'HR', employeeType: 'Part-time', duration: 5 },
    { key: '3', name: 'Priya Singh', department: 'Finance', employeeType: 'Contract', duration: 2 },
    {
      key: '4',
      name: 'Amit Shah',
      department: 'Operations',
      employeeType: 'Full-time',
      duration: 1,
    },
    {
      key: '5',
      name: 'Neha Patel',
      department: 'Marketing',
      employeeType: 'Full-time',
      duration: 7,
    },
  ];

  const checkInData = [
    {
      key: '1',
      name: 'Suresh Kumar',
      department: 'IT',
      checkInTime: '09:00 AM',
      location: 'Main Office',
    },
    {
      key: '2',
      name: 'Shekhar Gupta',
      department: 'HR',
      checkInTime: '10:30 AM',
      location: 'Branch 1',
    },
    {
      key: '3',
      name: 'Meera Reddy',
      department: 'Finance',
      checkInTime: '11:00 AM',
      location: 'Main Office',
    },
    {
      key: '4',
      name: 'Rajesh Singh',
      department: 'Operations',
      checkInTime: '02:00 PM',
      location: 'Branch 2',
    },
    {
      key: '5',
      name: 'Anita Desai',
      department: 'Marketing',
      checkInTime: '03:30 PM',
      location: 'Main Office',
    },
  ];

  const checkOutData = [
    {
      key: '1',
      name: 'Kriti Sharma',
      department: 'IT',
      checkOutTime: '11:00 AM',
      duration: '2 hours',
    },
    {
      key: '2',
      name: 'Shekhar Kapoor',
      department: 'HR',
      checkOutTime: '12:30 PM',
      duration: '2 hours',
    },
    {
      key: '3',
      name: 'Rahul Verma',
      department: 'Finance',
      checkOutTime: '11:30 AM',
      duration: '30 mins',
    },
    {
      key: '4',
      name: 'Deepa Mehta',
      department: 'Operations',
      checkOutTime: '04:00 PM',
      duration: '2 hours',
    },
    {
      key: '5',
      name: 'Arun Kumar',
      department: 'Marketing',
      checkOutTime: '05:30 PM',
      duration: '2 hours',
    },
  ];

  const handleBarClick = (data, category) => {
    if (category === 'CheckedIn') {
      setEmployeeModalVisible(true);
    } else if (category === 'TotalEmployees') {
      setCheckInModalVisible(true);
    } else if (category === 'CheckedOut') {
      setCheckOutModalVisible(true);
    }
  };

  const renderBarChart = (data, width, height) => {
    const chartData = {
      labels: data.map(item => item.date),
      datasets: [
        {
          label: 'Total',
          data: data.map(item => item.Total),
          backgroundColor: '#4CAF81',
          borderRadius: 4,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Distribution'
        }
      }
    };

    return (
      <div style={{ width, height }}>
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  const cardStyle = {
    backgroundColor: '#f5f5f5',
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Personalize Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: '16px' }}>
        <Link to="/employee-mis">
          <Button>Employee MIS</Button>
        </Link>
        <Button type="primary" onClick={() => setPersonalizeModalVisible(true)}>
          Personalize
        </Button>
      </div>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Row gutter={[24, 24]}>
            {showTotalEmployeesCard && (
              <Col span={24}>
                <Card style={cardStyle}>
                  <h5 className="card-title mb-2">Total Employees</h5>
                  <h6 className="text-success mb-0">
                    <FaArrowUp /> 753 vs last month
                  </h6>
                </Card>
              </Col>
            )}
            {showPresentEmployeesCard && (
              <Col span={24}>
                <Card style={cardStyle}>
                  <h5 className="card-title mb-2">Present Employees</h5>
                  <h6 className="text-danger mb-0">
                    <FaArrowDown /> 245 vs last month
                  </h6>
                </Card>
              </Col>
            )}
            {showAverageWorkingHoursCard && (
              <Col span={24}>
                <Card style={cardStyle}>
                  <h5 className="card-title mb-2">Average Working Hours</h5>
                  <h6 className="text-danger mb-0">
                    <FaArrowDown /> 8 hours vs last month
                  </h6>
                </Card>
              </Col>
            )}
            {showCheckedOutEmployeesCard && (
              <Col span={24}>
                <Card style={cardStyle}>
                  <h5 className="card-title mb-2">Checked Out Employees</h5>
                  <h6 className="text-success mb-0">
                    <FaArrowUp /> 82 vs last month
                  </h6>
                </Card>
              </Col>
            )}
          </Row>
        </Col>
        {showAttendanceDistributionChart && (
          <Col span={12}>
            <Card title="Monthly Attendance Distribution" style={cardStyle}>
              <div style={{ height: 400 }}>{renderBarChart(attendanceData, 400, 300)}</div>
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        {showEmployeeTypesCard && (
          <Col xs={24} lg={8}>
            <Card title="Employee Types" style={cardStyle}>
              <Progress
                type="circle"
                percent={45}
                format={() => 'Full-time'}
                strokeWidth={25}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: '24px' }}>
                <Badge color="#87d068" text="Full-time (45%)" />
                <br />
                <Badge color="#f50" text="Contract (25%)" />
              </div>
            </Card>
          </Col>
        )}
        {showAttendanceTrendsChart && (
          <Col span={16}>
            <Card title="Attendance Trends" style={cardStyle}>
              <div style={{ height: 400 }}>{renderBarChart(attendanceData, 500, 300)}</div>
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        {showTotalCheckInsCard && (
          <Col xs={24} sm={12} md={8}>
            <Card style={cardStyle}>
              <Statistic
                title="Total Check-Ins"
                value={135}
                precision={0}
                valueStyle={{ color: '#4CAF50' }}
                prefix={<FaArrowUp />}
                suffix="vs last month"
              />
            </Card>
          </Col>
        )}

        {showTotalCheckOutsCard && (
          <Col xs={24} sm={12} md={8}>
            <Card style={cardStyle}>
              <Statistic
                title="Total Check-Outs"
                value={98}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<FaArrowDown />}
                suffix="vs last month"
              />
            </Card>
          </Col>
        )}

        {showPresentEmployeesStatCard && (
          <Col xs={24} sm={12} md={8}>
            <Card style={cardStyle}>
              <Statistic
                title="Present Employees"
                value={753}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<FaArrowUp />}
                suffix="vs last month"
              />
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title="Personalize Dashboard"
        visible={personalizeModalVisible}
        onCancel={() => setPersonalizeModalVisible(false)}
        footer={null}
      >
        <h4>Cards</h4>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Switch
              checked={showTotalEmployeesCard}
              onChange={() => setShowTotalEmployeesCard(!showTotalEmployeesCard)}
              checkedChildren="Total Employees"
              unCheckedChildren="Total Employees"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showPresentEmployeesCard}
              onChange={() => setShowPresentEmployeesCard(!showPresentEmployeesCard)}
              checkedChildren="Present Employees"
              unCheckedChildren="Present Employees"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showAverageWorkingHoursCard}
              onChange={() => setShowAverageWorkingHoursCard(!showAverageWorkingHoursCard)}
              checkedChildren="Avg. Working Hours"
              unCheckedChildren="Avg. Working Hours"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showCheckedOutEmployeesCard}
              onChange={() => setShowCheckedOutEmployeesCard(!showCheckedOutEmployeesCard)}
              checkedChildren="Checked Out Employees"
              unCheckedChildren="Checked Out Employees"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showTotalCheckInsCard}
              onChange={() => setShowTotalCheckInsCard(!showTotalCheckInsCard)}
              checkedChildren="Total Check-Ins"
              unCheckedChildren="Total Check-Ins"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showTotalCheckOutsCard}
              onChange={() => setShowTotalCheckOutsCard(!showTotalCheckOutsCard)}
              checkedChildren="Total Check-Outs"
              unCheckedChildren="Total Check-Outs"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showPresentEmployeesStatCard}
              onChange={() => setShowPresentEmployeesStatCard(!showPresentEmployeesStatCard)}
              checkedChildren="Present Employees"
              unCheckedChildren="Present Employees"
            />
          </Col>
        </Row>
        <h4 style={{ marginTop: '16px' }}>Charts</h4>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Switch
              checked={showAttendanceDistributionChart}
              onChange={() => setShowAttendanceDistributionChart(!showAttendanceDistributionChart)}
              checkedChildren="Attendance Distribution"
              unCheckedChildren="Attendance Distribution"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showEmployeeTypesCard}
              onChange={() => setShowEmployeeTypesCard(!showEmployeeTypesCard)}
              checkedChildren="Employee Types"
              unCheckedChildren="Employee Types"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showAttendanceTrendsChart}
              onChange={() => setShowAttendanceTrendsChart(!showAttendanceTrendsChart)}
              checkedChildren="Attendance Trends"
              unCheckedChildren="Attendance Trends"
            />
          </Col>
        </Row>
      </Modal>
      <Modal
        title="Employee Details"
        visible={employeeModalVisible}
        onCancel={() => setEmployeeModalVisible(false)}
        footer={null}
      >
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Department', dataIndex: 'department', key: 'department' },
            { title: 'Employee Type', dataIndex: 'employeeType', key: 'employeeType' },
            { title: 'Duration (Hours)', dataIndex: 'duration', key: 'duration' },
          ]}
          dataSource={employeeList}
        />
      </Modal>
      <Modal
        title="Check-In Details"
        visible={checkInModalVisible}
        onCancel={() => setCheckInModalVisible(false)}
        footer={null}
      >
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Department', dataIndex: 'department', key: 'department' },
            { title: 'Check-In Time', dataIndex: 'checkInTime', key: 'checkInTime' },
            { title: 'Location', dataIndex: 'location', key: 'location' },
          ]}
          dataSource={checkInData}
        />
      </Modal>
      <Modal
        title="Check-Out Details"
        visible={checkOutModalVisible}
        onCancel={() => setCheckOutModalVisible(false)}
        footer={null}
      >
        <Table
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Department', dataIndex: 'department', key: 'department' },
            { title: 'Check-Out Time', dataIndex: 'checkOutTime', key: 'checkOutTime' },
            { title: 'Duration', dataIndex: 'duration', key: 'duration' },
          ]}
          dataSource={checkOutData}
        />
        <h4 style={{ marginTop: '16px' }}>Statistic Cards</h4>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Switch
              checked={showTotalCheckInsCard}
              onChange={() => setShowTotalCheckInsCard(!showTotalCheckInsCard)}
              checkedChildren="Total Check-Ins"
              unCheckedChildren="Total Check-Ins"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showTotalCheckOutsCard}
              onChange={() => setShowTotalCheckOutsCard(!showTotalCheckOutsCard)}
              checkedChildren="Total Check-Outs"
              unCheckedChildren="Total Check-Outs"
            />
          </Col>
          <Col span={12}>
            <Switch
              checked={showPresentEmployeesStatCard}
              onChange={() => setShowPresentEmployeesStatCard(!showPresentEmployeesStatCard)}
              checkedChildren="Present Employees"
              unCheckedChildren="Present Employees"
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default Dashboard;