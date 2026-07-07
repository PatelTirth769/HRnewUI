import React, { useState, useEffect } from 'react';
import { notification, Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton, Modal, Button } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined, 
    CheckCircleOutlined, 
    BookOutlined, 
    TeamOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    RightOutlined,
    LockOutlined,
    EyeOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { fetchInstructorGroupDetails } from '../../utility/instructorHelper';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [instructorData, setInstructorData] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [myClassTeacherGroups, setMyClassTeacherGroups] = useState([]);
    const [myStudentGroups, setMyStudentGroups] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        classesToday: 0,
        pendingAssessments: 0,
        attendanceRate: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);

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
            const emailPrefix = userEmail ? userEmail.split('@')[0] : ''; // e.g. "jhaji"
            const nameWithSpace = emailPrefix.length > 3 ? emailPrefix.slice(0, 3) + " " + emailPrefix.slice(3) : emailPrefix; // e.g. "jha ji"

            try {
                // Stage 0: Try direct match on instructor_email (the email field we added)
                if (userEmail) {
                    try {
                        const emailRes = await API.get(`/api/resource/Instructor?filters=[["instructor_email","=","${userEmail}"]]&fields=["name","instructor_name","department","gender","status"]`);
                        if (emailRes.data.data?.[0]) instructor = emailRes.data.data[0];
                    } catch (e) { console.log("Lookup by instructor_email failed."); }
                }

                if (!instructor) {
                    // Stage 1: Try nested filter (Note: might 500/403 on some systems)
                    try {
                        const nestedRes = await API.get(`/api/resource/Instructor?filters=[["employee.user_id","=","${userEmail}"]]&fields=["name","instructor_name","department","gender","status"]`);
                        if (nestedRes.data.data?.[0]) instructor = nestedRes.data.data[0];
                    } catch (e) { console.log("Nested filter failed."); }
                }

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
                let fullInstructor = instructor;
                try {
                    const fullRes = await API.get(`/api/resource/Instructor/${encodeURIComponent(instructor.name)}`);
                    fullInstructor = fullRes.data.data || instructor;
                } catch (fullErr) {
                    console.error("Error fetching full instructor details:", fullErr);
                }
                setInstructorData(fullInstructor);

                // Use instructorHelper to fetch all valid groups
                const groupDetails = await fetchInstructorGroupDetails(instructor.name);
                const classTeacherGroups = groupDetails.classTeacherGroups || [];
                const subjectTeacherGroups = groupDetails.subjectTeacherGroups || [];
                const customGroup = groupDetails.customGroup;
                setMyClassTeacherGroups(classTeacherGroups);
                
                // 2. Fetch Schedule (including student_group and schedule_date)
                let schedulesList = [];
                try {
                    const scheduleRes = await API.get(`/api/resource/Course Schedule?filters=[["instructor","=","${instructor.name}"]]&fields=["name","course","from_time","to_time","room","student_group","schedule_date"]&order_by=from_time asc`);
                    schedulesList = scheduleRes.data.data || [];
                } catch (schedErr) {
                    console.error("Error fetching course schedules:", schedErr);
                }
                setSchedule(schedulesList);

                // Combine student groups dynamically
                const allGroupsMap = new Map();
                classTeacherGroups.forEach(g => {
                    allGroupsMap.set(g.name, {
                        name: g.name,
                        displayName: g.student_group_name || g.name,
                        program: g.program || '',
                        role: 'Class Teacher'
                    });
                });
                subjectTeacherGroups.forEach(g => {
                    if (!allGroupsMap.has(g.name)) {
                        allGroupsMap.set(g.name, {
                            name: g.name,
                            displayName: g.student_group_name || g.name,
                            program: g.program || '',
                            role: 'Subject Teacher'
                        });
                    }
                });
                if (customGroup && !allGroupsMap.has(customGroup.name)) {
                    allGroupsMap.set(customGroup.name, {
                        name: customGroup.name,
                        displayName: customGroup.student_group_name || customGroup.name,
                        program: customGroup.program || '',
                        role: 'Class Teacher'
                    });
                }
                schedulesList.forEach(c => {
                    if (c.student_group && !allGroupsMap.has(c.student_group)) {
                        allGroupsMap.set(c.student_group, {
                            name: c.student_group,
                            displayName: c.student_group,
                            program: '',
                            role: 'Subject Teacher'
                        });
                    }
                });
                const mergedGroups = Array.from(allGroupsMap.values());
                setMyStudentGroups(mergedGroups);

                // Calculate unique students across all groups using the helper's results
                let uniqueStudents = new Set(groupDetails.studentIds || []);

                // Fetch student name mapping to display name instead of just ID
                let studentNameMap = {};
                try {
                    const studentRes = await API.get('/api/resource/Student?fields=["name","student_name"]&limit_page_length=None');
                    studentRes.data.data?.forEach(s => {
                        studentNameMap[s.name] = s.student_name;
                    });
                } catch (sErr) {
                    console.error("Error fetching student names for dashboard:", sErr);
                }

                // Fetch Student Leave Applications
                let leaveApps = [];
                try {
                    const leaveRes = await API.get('/api/resource/Student Leave Application?fields=["name","student","from_date","to_date","mark_as_present","student_group","reason","attendance_based_on"]&limit_page_length=None&order_by=from_date desc');
                    leaveApps = leaveRes.data.data || [];
                } catch (leaveErr) {
                    console.error("Error fetching student leave applications:", leaveErr);
                }

                // Filter leave applications by student groups taught by the instructor or unique students
                const myGroupNames = mergedGroups.map(g => g.name);
                const filteredLeaves = leaveApps.filter(row => 
                    (row.student_group && myGroupNames.includes(row.student_group)) ||
                    (row.student && uniqueStudents.has(row.student))
                ).map(row => ({
                    ...row,
                    student_name: studentNameMap[row.student] || row.student
                }));

                setLeaveApplications(filteredLeaves);

                // 3. Fetch Stats
                const today = new Date().toISOString().split('T')[0];
                const todayClasses = schedulesList.filter(c => c.schedule_date === today).length;
                
                let pendingAssessments = 0;
                try {
                    // Query Assessment Plan without the invalid status filter to prevent the 417 error
                    const assessRes = await API.get('/api/resource/Assessment Plan?filters=[["docstatus","=",1]]&fields=["name"]&limit_page_length=None');
                    pendingAssessments = assessRes.data.data?.length || 0;
                } catch (e) {
                    console.log("Failed to fetch Assessment Plan count. Defaulting to 0.");
                }
                
                setStats({
                    totalStudents: uniqueStudents.size, 
                    classesToday: todayClasses || schedulesList.length,
                    pendingAssessments: pendingAssessments,
                    attendanceRate: 94
                });

                // Fetch Announcements from Firestore and filter for this instructor
                try {
                    const annRef = collection(db, 'schooler_system/announcements/records');
                    const annSnap = await getDocs(annRef);
                    const allAnn = annSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .sort((a, b) => {
                            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                            return tb - ta;
                        });

                    const instrGroupNames = mergedGroups.map(g => g.name);
                    const instrPrograms   = [...new Set(mergedGroups.map(g => g.program).filter(Boolean))];

                    // Resolve boards: fetch each unique program to get its custom_board
                    const instrBoards = new Set();
                    for (const programName of instrPrograms) {
                        try {
                            const pgRes = await API.get(`/api/resource/Program/${encodeURIComponent(programName)}?fields=["name","custom_board","company"]`);
                            const pgData = pgRes.data?.data;
                            if (pgData?.custom_board) instrBoards.add(pgData.custom_board);
                            if (pgData?.company)      instrBoards.add(pgData.company);
                        } catch (pgErr) {
                            console.warn('[InstructorDashboard] Could not fetch program board for:', programName);
                        }
                    }

                    console.log('[InstructorDashboard] Groups:', instrGroupNames, '| Programs:', instrPrograms, '| Boards:', [...instrBoards]);

                    const instructorAnn = allAnn.filter(ann => {
                        if (ann.targetType === 'All') return true;
                        if (ann.targetType === 'StudentGroup' && instrGroupNames.includes(ann.targetValue)) return true;
                        if (ann.targetType === 'Program'      && instrPrograms.includes(ann.targetValue))   return true;
                        if (ann.targetType === 'Board'        && instrBoards.has(ann.targetValue))           return true;
                        if (ann.targetType === 'Student') {
                            if (ann.createdBy === (localStorage.getItem('user') || '')) return true;
                            if (Array.isArray(ann.targetValue)) {
                                return ann.targetValue.some(id => uniqueStudents.has(id));
                            }
                            return uniqueStudents.has(ann.targetValue);
                        }
                        return false;
                    });
                    console.log('[InstructorDashboard] Total fetched:', allAnn.length, '| Shown to instructor:', instructorAnn.length);
                    setNotifications(instructorAnn);
                } catch (annErr) {
                    console.error('[InstructorDashboard] Announcement fetch error:', annErr);
                    setNotifications([]);
                }
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
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full md:w-auto">
                    <div className="relative shrink-0">
                        <Avatar size={72} icon={<UserOutlined />} className="bg-blue-600 shadow-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Hello, {instructorData.instructor_name || 'Instructor'}!
                        </h1>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                <BookOutlined className="text-xs" /> {instructorData.department || 'Academic Faculty'}
                            </span>
                            {myClassTeacherGroups.length > 0 ? (
                                <span className="text-emerald-700 font-semibold text-sm flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <UserOutlined className="text-xs" /> Class Teacher: {myClassTeacherGroups.map(g => `${g.program} (${g.student_group_name})`).join(', ')}
                                </span>
                            ) : myStudentGroups.length > 0 ? (
                                <span className="text-gray-700 font-semibold text-sm flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                    <UserOutlined className="text-xs" /> Assistant / Subject Teacher: {myStudentGroups.map(g => `${g.program ? g.program + ' ' : ''}(${g.displayName || g.name})`).join(', ')}
                                </span>
                            ) : (
                                <span className="text-gray-500 font-medium text-sm flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                    <UserOutlined className="text-xs" /> Assistant / Subject Teacher
                                </span>
                            )}
                            <span className="text-gray-400 text-sm">• {instructorData.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 self-center md:self-auto">
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
                                scroll={{ x: 'max-content' }}
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
                                scroll={{ x: 'max-content' }}
                                rowKey={(record, idx) => idx}
                                columns={[
                                    { title: 'Academic Year', dataIndex: 'academic_year', key: 'ay' },
                                    { title: 'Term', dataIndex: 'academic_term', key: 'term' },
                                    { 
                                        title: 'Program (Class)', 
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
                            title={<span className="font-bold text-gray-800">📢 Announcements</span>}
                            className="rounded-2xl border border-gray-100 shadow-sm"
                        >
                            {notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                                    <p style={{ fontSize: 13 }}>No announcements for you yet.</p>
                                </div>
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={notifications}
                                    renderItem={item => (
                                        <List.Item className="border-none px-0 py-2" style={{ alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '100%',
                                                background: item.targetType === 'All' ? '#eef2ff' : item.targetType === 'Program' ? '#fef3c7' : '#d1fae5',
                                                border: `1px solid ${item.targetType === 'All' ? '#c7d2fe' : item.targetType === 'Program' ? '#fde68a' : '#a7f3d0'}`,
                                                borderRadius: 10,
                                                padding: '10px 14px',
                                            }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 3 }}>{item.title}</div>
                                                <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>{item.message}</div>
                                                {item.createdAt && (
                                                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 5 }}>
                                                        {item.createdAt.toDate ? item.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>

                        {/* My Student Groups Card */}
                        <Card 
                            title={
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <TeamOutlined className="text-indigo-600" />
                                    </div>
                                    <span className="font-bold text-gray-800">My Student Groups</span>
                                </div>
                            }
                            className="rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <List
                                size="small"
                                dataSource={myStudentGroups}
                                renderItem={item => (
                                    <List.Item className="border-b last:border-none py-3 px-0 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 text-sm">{item.displayName}</span>
                                            {item.program && <span className="text-xs text-gray-400">{item.program}</span>}
                                        </div>
                                        <Tag color={item.role === 'Class Teacher' ? 'emerald' : 'blue'} className="border-none rounded-md font-semibold text-[10px] uppercase">
                                            {item.role}
                                        </Tag>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <div className="py-6 text-gray-400 text-xs italic text-center">No student groups assigned.</div> }}
                            />
                        </Card>

                        {/* Student Leave Applications Card */}
                        <Card 
                            title={
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-lg">
                                            <CalendarOutlined className="text-rose-600" />
                                        </div>
                                        <span className="font-bold text-gray-800">Student Leave Applications</span>
                                    </div>
                                    {leaveApplications.length > 0 && (
                                        <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {leaveApplications.length}
                                        </span>
                                    )}
                                </div>
                            }
                            className="rounded-2xl border border-gray-100 shadow-sm"
                            extra={
                                <button 
                                    onClick={() => navigate('/education/student-leave-application')}
                                    className="text-blue-600 font-semibold text-xs hover:underline flex items-center gap-1"
                                >
                                    View All <ArrowRightOutlined className="text-[10px]" />
                                </button>
                            }
                        >
                            <List
                                size="small"
                                dataSource={leaveApplications.slice(0, 4)}
                                renderItem={item => (
                                    <List.Item 
                                        className="border-b last:border-none py-3 px-0 flex flex-col items-start gap-1"
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-bold text-gray-800 text-sm">
                                                {item.student_name}
                                            </span>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                                {item.student_group}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {item.from_date} to {item.to_date}
                                        </div>
                                        {item.reason && (
                                            <div className="text-xs text-gray-400 italic line-clamp-1 w-full mt-0.5">
                                                "{item.reason}"
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center w-full mt-2">
                                            <Tag color={item.mark_as_present ? 'green' : 'orange'} className="border-none rounded-md font-semibold text-[9px] uppercase tracking-wider">
                                                {item.mark_as_present ? 'Marked Present' : 'Standard Leave'}
                                            </Tag>
                                            <Button 
                                                type="link" 
                                                size="small" 
                                                icon={<EyeOutlined />} 
                                                className="text-blue-600 hover:text-blue-800 text-xs p-0 h-auto font-medium"
                                                onClick={() => {
                                                    setSelectedLeave(item);
                                                    setIsLeaveModalVisible(true);
                                                }}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <div className="py-6 text-gray-400 text-xs italic text-center">No student leave applications.</div> }}
                            />
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

            {/* Leave Details Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <CalendarOutlined className="text-rose-500 text-lg" />
                        <span className="font-bold text-gray-800 text-lg">Leave Request Details</span>
                    </div>
                }
                open={isLeaveModalVisible}
                onCancel={() => setIsLeaveModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsLeaveModalVisible(false)} className="rounded-lg">
                        Close
                    </Button>,
                    <Button 
                        key="manage" 
                        type="primary" 
                        className="bg-blue-600 hover:bg-blue-700 border-none rounded-lg text-white"
                        onClick={() => {
                            setIsLeaveModalVisible(false);
                            navigate('/education/student-leave-application');
                        }}
                    >
                        Manage in Leave Screen
                    </Button>
                ]}
                className="rounded-2xl overflow-hidden"
                centered
            >
                {selectedLeave && (
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student Name</div>
                                <div className="text-sm font-semibold text-gray-800 mt-0.5">{selectedLeave.student_name}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student ID</div>
                                <div className="text-sm font-mono text-gray-600 mt-0.5">{selectedLeave.student}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Student Group</div>
                                <div className="text-sm font-semibold text-gray-800 mt-0.5">{selectedLeave.student_group || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Attendance Impact</div>
                                <div className="mt-1">
                                    <Tag color={selectedLeave.mark_as_present ? 'green' : 'orange'} className="border-none rounded-md font-semibold text-[10px] uppercase">
                                        {selectedLeave.mark_as_present ? 'Marked Present' : 'Standard Leave'}
                                    </Tag>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">From Date</div>
                                <div className="text-sm font-semibold text-gray-700 mt-0.5">{selectedLeave.from_date}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">To Date</div>
                                <div className="text-sm font-semibold text-gray-700 mt-0.5">{selectedLeave.to_date}</div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-50">
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reason for Leave</div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-1.5 whitespace-pre-line italic">
                                {selectedLeave.reason ? `"${selectedLeave.reason}"` : 'No reason provided.'}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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
