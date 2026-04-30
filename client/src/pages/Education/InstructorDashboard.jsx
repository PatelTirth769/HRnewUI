import React, { useState, useEffect } from 'react';
import { notification, Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined, 
    CheckCircleOutlined, 
    BookOutlined, 
    TeamOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    RightOutlined,
    LockOutlined
} from '@ant-design/icons';
import API from '../../services/api';

const InstructorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [instructorData, setInstructorData] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        classesToday: 0,
        pendingAssessments: 0,
        attendanceRate: 0
    });
    const [notifications, setNotifications] = useState([]);

    const userEmail = localStorage.getItem('user');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Instructor Profile
            // Robust multi-stage search:
            let instructor = null;
            const emailPrefix = userEmail.split('@')[0]; // e.g. "jhaji"
            const nameWithSpace = emailPrefix.slice(0, 3) + " " + emailPrefix.slice(3); // e.g. "jha ji"

            try {
                // Stage 1: Try nested filter (Note: might 500/403 on some systems)
                try {
                    const nestedRes = await API.get(`/api/resource/Instructor?filters=[["employee.user_id","=","${userEmail}"]]&fields=["name","instructor_name","department","gender","status"]`);
                    if (nestedRes.data.data?.[0]) instructor = nestedRes.data.data[0];
                } catch (e) { console.log("Nested filter failed."); }

                if (!instructor) {
                    // Stage 2: Try direct match on ID or Name with prefix variations
                    const searchTerms = [emailPrefix, nameWithSpace, instructorData?.instructor_name].filter(Boolean);
                    for (const term of searchTerms) {
                        try {
                            const res = await API.get(`/api/resource/Instructor?filters=[["name","=","${term}"]]&fields=["name","instructor_name","department","gender","status"]`);
                            if (res.data.data?.[0]) {
                                instructor = res.data.data[0];
                                break;
                            }
                            const resName = await API.get(`/api/resource/Instructor?filters=[["instructor_name","=","${term}"]]&fields=["name","instructor_name","department","gender","status"]`);
                            if (resName.data.data?.[0]) {
                                instructor = resName.data.data[0];
                                break;
                            }
                        } catch (e) { console.log(`Search for ${term} failed.`); }
                    }
                }

                if (!instructor) {
                    // Stage 3: Try finding employee by user_id
                    try {
                        const empRes = await API.get(`/api/resource/Employee?filters=[["user_id","=","${userEmail}"]]&fields=["name"]`);
                        const employeeName = empRes.data.data?.[0]?.name;
                        if (employeeName) {
                            const insRes = await API.get(`/api/resource/Instructor?filters=[["employee","=","${employeeName}"]]&fields=["name","instructor_name","department","gender","status"]`);
                            if (insRes.data.data?.[0]) instructor = insRes.data.data[0];
                        }
                    } catch (empErr) { console.log("Employee search failed."); }
                }
            } catch (e) {
                console.error("Error fetching instructor profile", e);
            }

            if (instructor) {
                // Fetch FULL document to get child tables like instructor_log
                const fullRes = await API.get(`/api/resource/Instructor/${encodeURIComponent(instructor.name)}`);
                const fullInstructor = fullRes.data.data;
                setInstructorData(fullInstructor);
                
                // 2. Fetch Schedule
                const scheduleRes = await API.get(`/api/resource/Course Schedule?filters=[["instructor","=","${instructor.name}"]]&fields=["name","course","from_time","to_time","room","academic_term"]&order_by=from_time asc`);
                setSchedule(scheduleRes.data.data || []);

                // 3. Fetch Stats
                const today = new Date().toISOString().split('T')[0];
                const todayClasses = (scheduleRes.data.data || []).filter(c => c.schedule_date === today).length;
                const assessRes = await API.get(`/api/resource/Assessment Plan?filters=[["status","=","Scheduled"]]&fields=["name"]`);
                
                setStats({
                    totalStudents: 146, 
                    classesToday: todayClasses || (scheduleRes.data.data?.length || 0),
                    pendingAssessments: assessRes.data.data?.length || 0,
                    attendanceRate: 94
                });

                setNotifications([
                    { title: 'New Assessment Scheduled', time: '2 hours ago', type: 'info' },
                    { title: 'Attendance for Course CS101 pending', time: 'Yesterday', type: 'warning' },
                    { title: 'Monthly Faculty Meeting at 4:00 PM', time: 'Today', type: 'event' }
                ]);
            }
        } catch (err) {
            console.error('Dashboard Fetch Error:', err);
            // notification.error({ message: 'Fetch Error', description: 'Failed to load instructor dashboard data.' });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Time',
            dataIndex: 'from_time',
            key: 'time',
            render: (text, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-blue-600 text-sm">{text?.substring(0, 5)}</span>
                    <span className="text-xs text-gray-400">{record.to_time?.substring(0, 5)}</span>
                </div>
            )
        },
        {
            title: 'Course',
            dataIndex: 'course',
            key: 'course',
            render: (text) => <span className="font-medium text-gray-800">{text}</span>
        },
        {
            title: 'Room',
            dataIndex: 'room',
            key: 'room',
            render: (text) => (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex items-center gap-1 w-fit">
                    <EnvironmentOutlined className="text-[10px]" /> {text || 'Main Hall'}
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
                <Row gutter={[24, 24]}>
                    <Col span={6}><Skeleton.Button active block size="large" /></Col>
                    <Col span={6}><Skeleton.Button active block size="large" /></Col>
                    <Col span={6}><Skeleton.Button active block size="large" /></Col>
                    <Col span={6}><Skeleton.Button active block size="large" /></Col>
                </Row>
            </div>
        );
    }

    if (!instructorData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 m-8">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <LockOutlined className="text-3xl text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Linked</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Your account is recognized as an <b>Instructor</b>, but we couldn't find your record in ERPNext. 
                    Please ensure an Instructor record exists with your email: <br/>
                    <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block font-bold text-blue-600">{userEmail}</code>
                </p>
                <button 
                    onClick={fetchDashboardData}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-200"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Avatar size={72} icon={<UserOutlined />} className="bg-blue-600 shadow-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Hello, {instructorData.instructor_name || 'Instructor'}!
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                <BookOutlined className="text-xs" /> {instructorData.department || 'Academic Faculty'}
                            </span>
                            <span className="text-gray-400 text-sm">• {instructorData.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="px-4 py-2 text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Current Term</div>
                        <div className="text-sm font-bold text-gray-800">Fall Semester 2026</div>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-100"></div>
                    <div className="p-2">
                        <CalendarOutlined className="text-xl text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <Row gutter={[24, 24]} className="mb-10">
                <Col xs={24} sm={12} lg={6}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <Statistic 
                            title={<span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Total Students</span>}
                            value={stats.totalStudents} 
                            prefix={<TeamOutlined className="text-blue-500 mr-2" />}
                            className="relative z-10"
                        />
                        <div className="mt-3 text-[11px] text-green-600 font-bold flex items-center gap-1">
                            <RightOutlined className="text-[10px]" /> View Class Lists
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <Statistic 
                            title={<span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Classes Today</span>}
                            value={stats.classesToday} 
                            prefix={<CalendarOutlined className="text-orange-500 mr-2" />}
                            className="relative z-10"
                        />
                        <div className="mt-3 text-[11px] text-orange-600 font-bold flex items-center gap-1">
                            <ClockCircleOutlined className="text-[10px]" /> Next at 2:00 PM
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <Statistic 
                            title={<span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Assessments</span>}
                            value={stats.pendingAssessments} 
                            prefix={<CheckCircleOutlined className="text-purple-500 mr-2" />}
                            className="relative z-10"
                        />
                        <div className="mt-3 text-[11px] text-purple-600 font-bold flex items-center gap-1">
                            <RightOutlined className="text-[10px]" /> Grade Submissions
                        </div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <Statistic 
                            title={<span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Avg Attendance</span>}
                            value={stats.attendanceRate} 
                            suffix="%"
                            prefix={<UserOutlined className="text-green-500 mr-2" />}
                            className="relative z-10"
                        />
                        <div className="mt-3 text-[11px] text-green-700 font-bold flex items-center gap-1">
                            <RightOutlined className="text-[10px]" /> Full Report
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Content */}
            <Row gutter={[24, 24]}>
                {/* Schedule Table */}
                <Col xs={24} lg={16}>
                    <div className="space-y-6">
                        <Card 
                            title={
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <CalendarOutlined className="text-blue-600" />
                                    </div>
                                    <span className="font-bold text-gray-800">Weekly Teaching Schedule</span>
                                </div>
                            }
                            className="rounded-2xl border border-gray-100 shadow-sm"
                            extra={<button className="text-blue-600 font-semibold text-xs hover:underline">Download PDF</button>}
                        >
                            <Table 
                                dataSource={schedule} 
                                columns={columns} 
                                pagination={false} 
                                className="custom-table"
                                rowKey="name"
                                locale={{ emptyText: <div className="py-10 text-gray-400">No classes scheduled for today.</div> }}
                            />
                        </Card>

                        {/* Instructor Log / Teaching History */}
                        <Card 
                            title={
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <BookOutlined className="text-green-600" />
                                    </div>
                                    <span className="font-bold text-gray-800">Teaching History & Assignments</span>
                                </div>
                            }
                            className="rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <Table 
                                dataSource={instructorData.instructor_log || []} 
                                pagination={{ pageSize: 5 }}
                                className="custom-table"
                                rowKey={(record, idx) => idx}
                                columns={[
                                    { title: 'Academic Year', dataIndex: 'academic_year', key: 'ay' },
                                    { title: 'Term', dataIndex: 'academic_term', key: 'term' },
                                    { 
                                        title: 'Program', 
                                        dataIndex: 'program', 
                                        key: 'program',
                                        render: (text) => <Tag color="blue" className="border-none rounded-md font-medium">{text}</Tag>
                                    },
                                    { title: 'Course', dataIndex: 'course', key: 'course' },
                                ]}
                                locale={{ emptyText: <div className="py-10 text-gray-400 italic">No teaching history logged in ERPNext.</div> }}
                            />
                        </Card>
                    </div>
                </Col>

                {/* Notifications & Quick Actions */}
                <Col xs={24} lg={8}>
                    <div className="space-y-6">
                        <Card 
                            title={<span className="font-bold text-gray-800">Recent Notifications</span>}
                            className="rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <List
                                itemLayout="horizontal"
                                dataSource={notifications}
                                renderItem={item => (
                                    <List.Item className="border-none px-0 py-3">
                                        <List.Item.Meta
                                            avatar={
                                                <div className={`p-2 rounded-lg ${
                                                    item.type === 'warning' ? 'bg-orange-50 text-orange-600' : 
                                                    item.type === 'event' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {item.type === 'warning' ? <ClockCircleOutlined /> : 
                                                     item.type === 'event' ? <CalendarOutlined /> : <BookOutlined />}
                                                </div>
                                            }
                                            title={<span className="font-semibold text-gray-800 text-sm">{item.title}</span>}
                                            description={<span className="text-xs text-gray-400">{item.time}</span>}
                                        />
                                    </List.Item>
                                )}
                            />
                            <button className="w-full mt-4 py-2 text-blue-600 font-bold text-xs border border-blue-50 rounded-lg hover:bg-blue-50 transition">
                                View All Notifications
                            </button>
                        </Card>

                        <Card 
                            title={<span className="font-bold text-gray-800">Quick Actions</span>}
                            className="rounded-2xl border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md">
                                    <CheckCircleOutlined className="text-xl" />
                                    <span className="text-[11px] font-bold">Mark Attendance</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md">
                                    <BookOutlined className="text-xl" />
                                    <span className="text-[11px] font-bold">Add Result</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md">
                                    <CalendarOutlined className="text-xl" />
                                    <span className="text-[11px] font-bold">Schedule Quiz</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md">
                                    <TeamOutlined className="text-xl" />
                                    <span className="text-[11px] font-bold">My Groups</span>
                                </button>
                            </div>
                        </Card>
                    </div>
                </Col>
            </Row>

            <style>{`
                .custom-table .ant-table-thead > tr > th {
                    background: #F9FAFB;
                    color: #9CA3AF;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 700;
                    border-bottom: 1px solid #F3F4F6;
                }
                .custom-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #F9FAFB;
                    padding: 16px 16px;
                }
                .custom-table .ant-table-tbody > tr:hover > td {
                    background: #F9FAFB !important;
                }
            `}</style>
        </div>
    );
};

export default InstructorDashboard;
