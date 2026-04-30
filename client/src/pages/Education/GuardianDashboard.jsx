import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton, Empty, Button, Tabs } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined, 
    DollarOutlined, 
    BookOutlined, 
    TeamOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    RightOutlined,
    LockOutlined,
    SmileOutlined
} from '@ant-design/icons';
import API from '../../services/api';

const GuardianDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [guardianData, setGuardianData] = useState(null);
    const [wards, setWards] = useState([]);
    const [activeWard, setActiveWard] = useState(null);
    const [wardProfile, setWardProfile] = useState(null);
    const [wardDetails, setWardDetails] = useState({
        attendance: [],
        fees: [],
        assessments: []
    });

    const userEmail = localStorage.getItem('user');

    useEffect(() => {
        fetchGuardianData();
    }, []);

    const fetchGuardianData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Guardian Profile
            const guardRes = await API.get(`/api/resource/Guardian?filters=[["email_address","=","${userEmail}"]]&fields=["name","guardian_name","mobile_number"]`);
            
            if (guardRes.data.data && guardRes.data.data.length > 0) {
                const guardian = guardRes.data.data[0];
                // Get FULL guardian doc for child table of students
                const fullGuard = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardian.name)}`);
                setGuardianData(fullGuard.data.data);

                const students = fullGuard.data.data.students || [];
                setWards(students);

                if (students.length > 0) {
                    fetchWardDetails(students[0].student);
                }
            }
        } catch (err) {
            console.error('Guardian Dashboard Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWardDetails = async (studentId) => {
        setActiveWard(studentId);
        try {
            // Fetch Full Student Profile
            const profileRes = await API.get(`/api/resource/Student/${encodeURIComponent(studentId)}`);
            const wardProf = profileRes.data.data;
            setWardProfile(wardProf);

            // Parallel Data Fetch with Individual Error Handling & 417 recovery
            const [attRes, feeRes, assessRes, enrRes] = await Promise.allSettled([
                API.get('/api/resource/Student Attendance', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "date", "status"]), limit_page_length: 5 } }),
                API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "due_date", "outstanding_amount", "total_amount"]) } })
                    .catch(err => {
                        if (err.response?.status === 417) return API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "outstanding_amount"]) } });
                        throw err;
                    }),
                API.get('/api/resource/Assessment Result', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "assessment_plan", "total_score", "maximum_score"]) } }),
                API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program", "fee_structure"]) } })
                    .catch(err => {
                        if (err.response?.status === 417) return API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program"]) } });
                        throw err;
                    })
            ]);

            const attendanceList = attRes.status === 'fulfilled' ? (attRes.value.data?.data || []) : [];
            const feeList = feeRes.status === 'fulfilled' ? (feeRes.value.data?.data || []) : [];
            const assessList = assessRes.status === 'fulfilled' ? (assessRes.value.data?.data || []) : [];
            const enrollmentData = enrRes.status === 'fulfilled' ? (enrRes.value.data?.data || []) : [];

            // 4. Resolve Fee Structure (3-Stage Logic)
            let linkedFeeStructure = (enrollmentData.length > 0 && enrollmentData[0].fee_structure) 
                ? enrollmentData[0].fee_structure 
                : (wardProf.fee_structure || null);

            const programToSearch = (enrollmentData.length > 0 && enrollmentData[0].program) 
                ? enrollmentData[0].program 
                : (wardProf.program || null);

            if (!linkedFeeStructure && programToSearch) {
                try {
                    const fsRes = await API.get('/api/resource/Fee Structure', {
                        params: { filters: JSON.stringify([["program", "=", programToSearch]]), fields: JSON.stringify(["name"]) }
                    });
                    if (fsRes.data?.data?.length > 0) {
                        linkedFeeStructure = fsRes.data.data[0].name;
                    } else {
                        try {
                            const fsExact = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(programToSearch)}`);
                            if (fsExact.data?.data) linkedFeeStructure = fsExact.data.data.name;
                        } catch (e) {}
                    }
                } catch (e) {}
            }

            let feeStructureDetails = null;
            if (linkedFeeStructure) {
                try {
                    const fsFull = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(linkedFeeStructure)}`);
                    feeStructureDetails = fsFull.data?.data;
                } catch (e) { console.error('[Guardian] FS details fetch failed:', e); }
            }

            setWardDetails({
                attendance: attendanceList,
                fees: feeList,
                assessments: assessList,
                feeStructure: linkedFeeStructure,
                feeStructureDetails
            });
        } catch (e) {
            console.error("Error fetching ward details", e);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
                <Row gutter={[24, 24]}>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                </Row>
            </div>
        );
    }

    if (!guardianData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 m-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <LockOutlined className="text-3xl text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Guardian Profile Not Found</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Your account is recognized as a <b>Guardian</b>, but we couldn't find your record in ERPNext. 
                    Please ensure a Guardian record exists with your email: <br/>
                    <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block font-bold text-blue-600">{userEmail}</code>
                </p>
                <Button type="primary" onClick={fetchGuardianData}>Retry Connection</Button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Avatar size={72} icon={<UserOutlined />} className="bg-indigo-600 shadow-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Welcome, {guardianData.guardian_name}!
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-gray-500">
                            <SmileOutlined className="text-indigo-500" /> 
                            <span>Monitoring {wards.length} Ward(s)</span>
                            <span className="text-gray-300">|</span>
                            <span>{guardianData.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wards Selector */}
            {wards.length > 0 ? (
                <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                    {wards.map(w => (
                        <div 
                            key={w.student}
                            onClick={() => fetchWardDetails(w.student)}
                            className={`cursor-pointer px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 whitespace-nowrap ${
                                activeWard === w.student 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-300'
                            }`}
                        >
                            <UserOutlined />
                            <span className="font-bold">{w.student_name || w.student}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-8 flex items-center gap-3 text-orange-700">
                    <ClockCircleOutlined />
                    <span>No students are currently linked to your guardian profile in ERPNext. Please contact the school administration to link your children to your account.</span>
                </div>
            )}

            {/* Ward Quick Stats */}
            <Row gutter={[24, 24]} className="mb-10">
                <Col xs={24} sm={12} lg={8}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-6 -mt-6"></div>
                        <Statistic 
                            title={<span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Attendance Status</span>}
                            value={wardDetails.attendance[0]?.status || 'N/A'}
                            prefix={<CheckCircleOutlined className="text-green-500 mr-2" />}
                        />
                        <div className="mt-3 text-[11px] text-gray-400">Last marked on {wardDetails.attendance[0]?.date || '...'}</div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-6 -mt-6"></div>
                        <Statistic 
                            title={<span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Pending Fees</span>}
                            value={wardDetails.fees.reduce((acc, f) => acc + f.outstanding_amount, 0)}
                            prefix={<DollarOutlined className="text-red-500 mr-2" />}
                            suffix="USD"
                        />
                        <div className="mt-3 text-[11px] text-red-500 font-bold hover:underline cursor-pointer">View Fee Invoices <RightOutlined className="text-[10px]" /></div>
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-6 -mt-6"></div>
                        <Statistic 
                            title={<span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Latest Result</span>}
                            value={wardDetails.assessments[0]?.total_score || 0}
                            suffix={` / ${wardDetails.assessments[0]?.maximum_score || 100}`}
                            prefix={<BookOutlined className="text-blue-500 mr-2" />}
                        />
                        <div className="mt-3 text-[11px] text-blue-500 font-bold uppercase tracking-wider">{wardDetails.assessments[0]?.assessment_plan || 'No Recent Exams'}</div>
                    </div>
                </Col>
            </Row>

            {/* Guardian Profile Card */}
            <Card 
                title={<div className="flex items-center gap-2"><UserOutlined className="text-indigo-500"/> <span className="font-bold">Guardian Profile</span></div>}
                className="mb-6 rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-gradient-to-r from-indigo-50/30 to-transparent"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 p-2">
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Guardian ID</span>
                        <span className="font-bold text-gray-800">{guardianData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Full Name</span>
                        <span className="font-bold text-gray-800">{guardianData.guardian_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Mobile Number</span>
                        <span className="font-bold text-gray-800">{guardianData.mobile_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Email Address</span>
                        <span className="font-bold text-indigo-600">{guardianData.email_address || userEmail}</span>
                    </div>
                </div>
            </Card>

            {/* Student Profile Card */}
            {wardProfile && (
                <Card 
                    title={<div className="flex items-center gap-2"><TeamOutlined className="text-indigo-500"/> <span className="font-bold">Student Profile (Ward)</span></div>}
                    className="mb-10 rounded-2xl border-gray-100 shadow-sm overflow-hidden"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 p-2">
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Student ID</span>
                            <span className="font-bold text-gray-800">{wardProfile.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Joining Date</span>
                            <span className="font-bold text-gray-800">{wardProfile.joining_date || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Program</span>
                            <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                                {wardProfile.program || 'General'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Gender</span>
                            <span className="font-bold text-gray-800">{wardProfile.gender || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Email</span>
                            <span className="font-bold text-indigo-600">{wardProfile.student_email_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Mobile</span>
                            <span className="font-bold text-gray-800">{wardProfile.mobile_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Status</span>
                            <span className="flex items-center gap-1.5 font-bold text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Main Content */}
            <Tabs defaultActiveKey="1" className="guardian-tabs">
                <Tabs.TabPane tab={<span><CalendarOutlined /> Recent Attendance</span>} key="1">
                    <Card className="rounded-2xl border-gray-100">
                        <Table 
                            dataSource={wardDetails.attendance}
                            pagination={false}
                            columns={[
                                { title: 'Date', dataIndex: 'date', key: 'date' },
                                { 
                                    title: 'Status', 
                                    dataIndex: 'status', 
                                    key: 'status',
                                    render: (s) => <Tag color={s === 'Present' ? 'green' : 'red'}>{s}</Tag>
                                }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><DollarOutlined /> Fee Details</span>} key="2">
                    <Card className="rounded-2xl border-gray-100">
                        {wardDetails.fees && wardDetails.fees.length > 0 ? (
                            <Table 
                                dataSource={wardDetails.fees}
                                pagination={false}
                                columns={[
                                    { title: 'Fee ID', dataIndex: 'name', key: 'id', render: (id) => <span className="font-bold text-indigo-600">{id}</span> },
                                    { title: 'Due Date', dataIndex: 'due_date', key: 'due' },
                                    { title: 'Grand Total', dataIndex: 'total_amount', key: 'total', render: (val) => <span className="font-bold">{val}</span> },
                                    { 
                                        title: 'Outstanding', 
                                        dataIndex: 'outstanding_amount', 
                                        key: 'out', 
                                        render: (val) => (
                                            <span className={`font-bold ${val > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {val}
                                            </span>
                                        ) 
                                    },
                                    {
                                        title: 'Status',
                                        key: 'status',
                                        render: (rec) => {
                                            const isPaid = rec.outstanding_amount === 0;
                                            return <Tag color={isPaid ? 'green' : 'red'}>{isPaid ? 'Paid' : 'Unpaid'}</Tag>
                                        }
                                    },
                                    {
                                        title: 'Action',
                                        key: 'action',
                                        render: (rec) => (
                                            <Button type="link" size="small" className="font-bold" onClick={() => window.open(`/education/fees/${rec.name}`, '_blank')}>
                                                View Details
                                            </Button>
                                        )
                                    }
                                ]}
                            />
                        ) : wardDetails.feeStructureDetails ? (
                            <div className="p-0">
                                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg mb-4 flex flex-col gap-1 mx-4 mt-4">
                                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                                        <ClockCircleOutlined /> Scheduled Fee Structure: <span className="px-1.5 py-0.5 bg-amber-100 rounded font-black">{wardDetails.feeStructure}</span>
                                    </div>
                                    <div className="text-amber-700 text-[10px]">
                                        No invoices generated yet. Showing components for <b>{activeWard}</b>.
                                    </div>
                                </div>

                                <Table 
                                    dataSource={wardDetails.feeStructureDetails.components}
                                    pagination={false}
                                    size="small"
                                    columns={[
                                        { title: 'Fees Category', dataIndex: 'fees_category', key: 'cat', render: (t) => <span className="text-sm font-semibold text-gray-700">{t}</span> },
                                        { title: 'Amount', dataIndex: 'amount', key: 'amt', align: 'right', render: (v) => <span className="text-sm font-bold text-indigo-600">₹{v.toLocaleString()}</span> }
                                    ]}
                                />
                                
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center px-6 pb-6">
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total Academic Fees</span>
                                    <span className="text-xl font-black text-indigo-600">₹{wardDetails.feeStructureDetails.total_amount?.toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <Empty description="No pending fees or defined fee structure found for this student." />
                        )}
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><BookOutlined /> Academic Progress</span>} key="3">
                    <Card className="rounded-2xl border-gray-100">
                        <Table 
                            dataSource={wardDetails.assessments}
                            pagination={false}
                            columns={[
                                { title: 'Exam', dataIndex: 'assessment_plan', key: 'plan' },
                                { title: 'Score', key: 'score', render: (rec) => `${rec.total_score} / ${rec.maximum_score}` }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
            </Tabs>

            <style>{`
                .guardian-tabs .ant-tabs-nav::before {
                    border-bottom: 2px solid #F3F4F6;
                }
                .guardian-tabs .ant-tabs-tab {
                    font-weight: 700;
                    font-size: 14px;
                    padding: 12px 24px;
                    color: #9CA3AF;
                }
                .guardian-tabs .ant-tabs-tab-active {
                    color: #4F46E5 !important;
                }
                .guardian-tabs .ant-tabs-ink-bar {
                    background: #4F46E5;
                    height: 3px;
                }
            `}</style>
        </div>
    );
};

export default GuardianDashboard;
