import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Table, Radio, Space, notification, Typography } from 'antd';
import API from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const StudentAttendanceTool = () => {
    const navigate = useNavigate();
    const [basedOn, setBasedOn] = useState('Student Group');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    const [filters, setFilters] = useState({
        student_group: '',
        course_schedule: '',
        group_based_on: 'Batch',
        date: new Date().toISOString().split('T')[0],
    });

    const [masters, setMasters] = useState({
        studentGroups: [],
        courseSchedules: [],
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [sgRes, csRes] = await Promise.all([
                API.get('/api/resource/Student Group?limit_page_length=None'),
                API.get('/api/resource/Course Schedule?limit_page_length=None'),
            ]);
            setMasters({
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                courseSchedules: csRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const getStudents = async () => {
        const filterValue = basedOn === 'Student Group' ? filters.student_group : filters.course_schedule;
        if (!filterValue) {
            notification.warning({ message: 'Selection Required', description: `Please select a ${basedOn} first.` });
            return;
        }

        setFetchingStudents(true);
        try {
            let res;
            if (basedOn === 'Student Group') {
                res = await API.get(`/api/resource/Student Group/${filters.student_group}`);
                const studentList = res.data.data.students?.map(s => ({
                    student: s.student,
                    student_name: s.student_name,
                    status: 'Present'
                })) || [];
                setStudents(studentList);
            } else {
                res = await API.get(`/api/resource/Course Schedule/${filters.course_schedule}`);
                const studentGroup = res.data.data.student_group;
                if (studentGroup) {
                    const sgRes = await API.get(`/api/resource/Student Group/${studentGroup}`);
                    const studentList = sgRes.data.data.students?.map(s => ({
                        student: s.student,
                        student_name: s.student_name,
                        status: 'Present'
                    })) || [];
                    setStudents(studentList);
                }
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            notification.error({ message: 'Fetch Failed', description: 'Could not retrieve student list.' });
        } finally {
            setFetchingStudents(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setStudents(prev => prev.map(s => s.student === studentId ? { ...s, status } : s));
    };

    const markAll = (status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    const handleSave = async () => {
        if (students.length === 0) return;
        setLoading(true);
        try {
            await Promise.all(students.map(s =>
                API.post('/api/resource/Student Attendance', {
                    student: s.student,
                    date: filters.date,
                    status: s.status,
                    student_group: filters.student_group,
                    course_schedule: filters.course_schedule
                })
            ));
            notification.success({ message: 'Attendance Saved', description: `Successfully marked attendance for ${students.length} students.` });
        } catch (err) {
            console.error('Error saving attendance:', err);
            notification.error({ message: 'Save Failed', description: 'Some attendance records could not be saved.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    const columns = [
        {
            title: 'No.',
            width: 60,
            align: 'center',
            render: (_, __, index) => <span className="text-gray-400 font-mono text-xs">{index + 1}</span>
        },
        {
            title: 'Student ID',
            dataIndex: 'student',
            key: 'student',
            width: 180,
            render: (text) => <span className="text-gray-500 font-mono text-xs">{text}</span>
        },
        {
            title: 'Student Name',
            dataIndex: 'student_name',
            key: 'student_name',
            render: (text) => <span className="font-semibold text-gray-800">{text}</span>
        },
        {
            title: 'Status',
            key: 'status',
            align: 'right',
            width: 320,
            render: (_, record) => (
                <Radio.Group
                    value={record.status}
                    onChange={e => handleAttendanceChange(record.student, e.target.value)}
                    buttonStyle="solid"
                    size="small"
                >
                    <Radio.Button value="Present" className="present-btn">Present</Radio.Button>
                    <Radio.Button value="Absent" className="absent-btn">Absent</Radio.Button>
                    <Radio.Button value="On Leave" className="leave-btn">On Leave</Radio.Button>
                    <Radio.Button value="Half Day" className="half-btn">Half Day</Radio.Button>
                </Radio.Group>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Standard Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Student Attendance Tool</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-100">Not Saved</span>
                </div>
                <div>
                    <Button
                        type="primary"
                        className="bg-gray-900 border-0 h-9 px-6 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors"
                        onClick={handleSave}
                        disabled={students.length === 0 || loading}
                        loading={loading}
                    >
                        Mark Attendance
                    </Button>
                </div>
            </div>

            {/* Main Form */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Filter Fields */}
                <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6 border-b border-gray-100">
                    <div>
                        <label className={labelStyle}>Based On</label>
                        <Select className="w-full erp-select" size="large" value={basedOn} onChange={setBasedOn}>
                            <Option value="Student Group">Student Group</Option>
                            <Option value="Course Schedule">Course Schedule</Option>
                        </Select>
                    </div>
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>{basedOn} <span className="text-red-500">*</span></label>
                        {basedOn === 'Student Group' ? (
                            <Select className="w-full erp-select bg-red-50/20" size="large" showSearch value={filters.student_group} onChange={v => setFilters({...filters, student_group: v})}>
                                {masters.studentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                            </Select>
                        ) : (
                            <Select className="w-full erp-select bg-red-50/20" size="large" showSearch value={filters.course_schedule} onChange={v => setFilters({...filters, course_schedule: v})}>
                                {masters.courseSchedules.map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                        )}
                    </div>
                    <div>
                        <label className={labelStyle}>Group Based On</label>
                        <Select className="w-full erp-select" size="large" value={filters.group_based_on} onChange={v => setFilters({...filters, group_based_on: v})}>
                            <Option value="Batch">Batch</Option>
                            <Option value="Course">Course</Option>
                            <Option value="Activity">Activity</Option>
                        </Select>
                    </div>
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>Date <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-red-50/20 hover:border-gray-300" style={{ height: '38px' }} value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
                    </div>
                </div>

                {/* Get Students Button */}
                <div className="px-6 py-4 bg-white border-b border-gray-100">
                    <Button
                        className="h-9 px-5 text-[13px] font-semibold bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 rounded"
                        onClick={getStudents}
                        loading={fetchingStudents}
                    >
                        Get Students
                    </Button>
                </div>

                {/* Student List */}
                {students.length > 0 && (
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">Student List ({students.length})</label>
                            <Space>
                                <Button size="small" className="text-[11px] font-semibold border-green-200 text-green-600 hover:bg-green-50" onClick={() => markAll('Present')}>All Present</Button>
                                <Button size="small" className="text-[11px] font-semibold border-red-200 text-red-600 hover:bg-red-50" onClick={() => markAll('Absent')}>All Absent</Button>
                            </Space>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table
                                dataSource={students}
                                columns={columns}
                                pagination={false}
                                rowKey="student"
                                size="small"
                                className="erp-grid-table"
                            />
                        </div>
                    </div>
                )}
            </div>

            <style jsx="true">{`
                .erp-select .ant-select-selector {
                    border-radius: 6px !important;
                    border: 1px solid #e5e7eb !important;
                    box-shadow: none !important;
                    height: 38px !important;
                    padding: 0 12px !important;
                    align-items: center;
                }
                .erp-select.ant-select-focused .ant-select-selector {
                    border-color: #94a3b8 !important;
                }
                .erp-grid-table .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 8px 16px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .erp-grid-table .ant-table-tbody > tr > td {
                    padding: 10px 16px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .present-btn.ant-radio-button-wrapper-checked { background: #10b981 !important; border-color: #10b981 !important; }
                .absent-btn.ant-radio-button-wrapper-checked { background: #ef4444 !important; border-color: #ef4444 !important; }
                .leave-btn.ant-radio-button-wrapper-checked { background: #f59e0b !important; border-color: #f59e0b !important; }
                .half-btn.ant-radio-button-wrapper-checked { background: #6366f1 !important; border-color: #6366f1 !important; }
                .ant-radio-button-wrapper:first-child { border-radius: 6px 0 0 6px; }
                .ant-radio-button-wrapper:last-child { border-radius: 0 6px 6px 0; }
            `}</style>
        </div>
    );
};

export default StudentAttendanceTool;
