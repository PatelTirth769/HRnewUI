import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, List, Avatar, Spin, notification, Empty } from 'antd';
import { 
    TeamOutlined, 
    BookOutlined, 
    CheckCircleOutlined, 
    CalendarOutlined, 
    LoadingOutlined, 
    UserOutlined,
    NotificationOutlined,
    FileDoneOutlined,
    RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';

const { Title, Text } = Typography;

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Can be set to true when actual API integration is added
    const [coordinatorData, setCoordinatorData] = useState({
        name: localStorage.getItem('user') || 'Coordinator',
        designation: 'Academic Coordinator',
        department: 'Education'
    });

    const [stats, setStats] = useState({
        totalStudents: 1200,
        totalInstructors: 45,
        todayAttendance: 92,
        pendingLeaves: 12
    });

    // Mock data for display purposes
    const recentActivities = [
        { id: 1, text: 'Instructor John Doe submitted grades for Math 101', time: '2 hours ago', type: 'grade' },
        { id: 2, text: 'Student Leave Request by Alice Smith (Sick Leave)', time: '3 hours ago', type: 'leave' },
        { id: 3, text: 'System Maintenance scheduled for this weekend', time: '1 day ago', type: 'system' }
    ];

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const userEmail = localStorage.getItem('user') || '';
                if (!userEmail) return;

                // 1. Fetch assigned scope from Firebase
                const q = query(collection(db, 'schooler_system/coordinators/data'), where('email', '==', userEmail));
                const snap = await getDocs(q);
                let assignedPrograms = [];
                let assignedBoards = [];
                
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    assignedPrograms = data.programs || [];
                    assignedBoards = data.boards || [];
                    
                    if (data.isPrincipal) {
                        setCoordinatorData(prev => ({
                            ...prev,
                            designation: 'Principal'
                        }));
                    }
                }
                
                // Save globally so other pages can filter if needed
                localStorage.setItem('coordinator_programs', JSON.stringify(assignedPrograms));
                localStorage.setItem('coordinator_boards', JSON.stringify(assignedBoards));

                if (assignedPrograms.length === 0) {
                    setStats({ totalStudents: 0, totalInstructors: 0, todayAttendance: 0, pendingLeaves: 0 });
                    setLoading(false);
                    return;
                }

                // 2. Fetch stats based on assigned programs
                // Get Students (Program Enrollments)
                const enrollRes = await API.get(`/api/resource/Program Enrollment?filters=[["program","in",${JSON.stringify(assignedPrograms)}],["docstatus","=",1]]&fields=["student"]&limit_page_length=None`).catch(() => ({data: {data: []}}));
                const students = enrollRes.data?.data || [];
                const uniqueStudents = new Set(students.map(s => s.student));

                // Get Student Groups for these programs
                const groupsRes = await API.get(`/api/resource/Student Group?filters=[["program","in",${JSON.stringify(assignedPrograms)}]]&fields=["name"]&limit_page_length=None`).catch(() => ({data: {data: []}}));
                const groupNames = (groupsRes.data?.data || []).map(g => g.name);

                // Get Pending Leaves for these groups
                let pendingLeavesCount = 0;
                if (groupNames.length > 0) {
                    const leavesRes = await API.get(`/api/resource/Student Leave Application?filters=[["student_group","in",${JSON.stringify(groupNames)}],["docstatus","=",0]]&fields=["name"]&limit_page_length=None`).catch(() => ({data: {data: []}}));
                    pendingLeavesCount = leavesRes.data?.data?.length || 0;
                }

                // Get Active Instructors (just total for now or filter by schedule if possible, we'll keep it simple)
                const instRes = await API.get(`/api/resource/Instructor?filters=[["status","=","Active"]]&fields=["name"]&limit_page_length=None`).catch(() => ({data: {data: []}}));
                
                setStats({
                    totalStudents: uniqueStudents.size,
                    totalInstructors: instRes.data?.data?.length || 0,
                    todayAttendance: 92, // Mocked percentage
                    pendingLeaves: pendingLeavesCount
                });

            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const initials = coordinatorData?.name ? coordinatorData.name.split('@')[0].substring(0, 2).toUpperCase() : 'CO';
    const monthName = dayjs().format('MMMM YYYY');

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <Text type="secondary">Loading {coordinatorData.designation} Dashboard...</Text>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .emp-dash-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
                .emp-dash-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); transition: all 0.3s; }
                .emp-dash-card-header { padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:10px; }
                .emp-dash-card-header h3 { margin:0; font-size:15px; font-weight:600; color:#111827; }
                .emp-dash-card-body { padding:20px; }
                .stat-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; display:flex; align-items:center; gap:14px; transition: all .2s; cursor: pointer; }
                .stat-card:hover { transform:translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
                .stat-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
                .stat-value { font-size:26px; font-weight:700; color:#111827; line-height:1; }
                .stat-label { font-size:11px; color:#6b7280; margin-top:2px; font-weight:500; letter-spacing:.3px; text-transform:uppercase; }
                .activity-item { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid #f9fafb; }
                .activity-item:last-child { border-bottom:none; padding-bottom:0; }
                .activity-icon { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px; }
            `}} />

            {/* ── Welcome Banner ── */}
            <div className="flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 md:gap-6 p-6 md:p-8 mb-6" style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                borderRadius: 16, color: '#fff', 
                boxShadow: '0 8px 32px rgba(249,115,22,0.25)'
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700, flexShrink: 0
                }}>{initials}</div>
                <div style={{ flex:1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>
                        Welcome back, {coordinatorData.name}
                    </div>
                    <div style={{ fontSize: 13, opacity: .85 }}>
                        {coordinatorData.designation} · {coordinatorData.department}
                    </div>
                </div>
                <div className="md:text-right flex-shrink-0 mt-2 md:mt-0">
                    <div style={{ fontSize: 12, opacity: .7, marginBottom: 2 }}>Today</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{dayjs().format('DD MMM')}</div>
                    <div style={{ fontSize: 11, opacity: .7 }}>{dayjs().format('dddd')}</div>
                </div>
            </div>

            {/* ── Statistics Grid ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Overview · {monthName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    {[
                        { label: 'Total Students', value: stats.totalStudents, bg: '#dbeafe', color: '#1e40af', icon: <TeamOutlined /> },
                        { label: 'Total Instructors', value: stats.totalInstructors, bg: '#fef3c7', color: '#92400e', icon: <UserOutlined /> },
                        { label: 'Avg Attendance', value: stats.todayAttendance + '%', bg: '#dcfce7', color: '#166534', icon: <CheckCircleOutlined /> },
                        { label: 'Pending Leaves', value: stats.pendingLeaves, bg: '#fee2e2', color: '#991b1b', icon: <FileDoneOutlined /> },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main Content Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                
                {/* Quick Actions */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16, color: '#1890ff' }}><BookOutlined /></span>
                        <h3>Quick Links</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div 
                                onClick={() => navigate('/education/student-attendance')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Manage Student Attendance</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                            <div 
                                onClick={() => navigate('/education/quick-attendance')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Quick Attendance</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                            <div 
                                onClick={() => navigate('/education/absent-student-report')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Absent Student Report</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                            <div 
                                onClick={() => navigate('/education/student-leave-application')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Review Leave Applications</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                            <div 
                                onClick={() => navigate('/homework/assignments')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Assign Homework</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                            <div 
                                onClick={() => navigate('/homework/classwork')}
                                style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontWeight: 500, color: '#334155' }}>Assign Classwork</span>
                                <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="emp-dash-card">
                    <div className="emp-dash-card-header">
                        <span style={{ fontSize: 16, color: '#faad14' }}><NotificationOutlined /></span>
                        <h3>Recent Activities</h3>
                    </div>
                    <div className="emp-dash-card-body">
                        {recentActivities.map(activity => (
                            <div key={activity.id} className="activity-item">
                                <div className="activity-icon" style={{ 
                                    background: activity.type === 'leave' ? '#fee2e2' : activity.type === 'grade' ? '#dcfce7' : '#dbeafe',
                                    color: activity.type === 'leave' ? '#ef4444' : activity.type === 'grade' ? '#22c55e' : '#3b82f6'
                                }}>
                                    {activity.type === 'leave' ? <FileDoneOutlined /> : activity.type === 'grade' ? <BookOutlined /> : <NotificationOutlined />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 500, marginBottom: 4 }}>{activity.text}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{activity.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
