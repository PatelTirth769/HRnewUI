import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Table, Input, notification, Checkbox, Typography } from 'antd';
import { DeleteOutlined, AppstoreAddOutlined, SettingOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ProgramEnrollmentTool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    const [form, setForm] = useState({
        get_students_from: 'Student Applicant', // Default as per typical flow
        academic_year: '',
        program: '',
        academic_term: '',
        new_student_batch: ''
    });

    const [masters, setMasters] = useState({
        academicYears: [],
        academicTerms: [],
        programs: [],
        batches: []
    });

    const [studentList, setStudentList] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [ayRes, atRes, prgRes, batchRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Student Batch Name?limit_page_length=None')
            ]);
            setMasters({
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                academicTerms: atRes.data.data?.map(d => d.name) || [],
                programs: prgRes.data.data?.map(d => d.name) || [],
                batches: batchRes.data.data?.map(d => d.name) || []
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const getStudents = async () => {
        if (!form.academic_year || !form.program || !form.get_students_from) {
            notification.warning({ message: 'Missing Fields', description: 'Get Students From, Academic Year, and Program are mandatory.' });
            return;
        }

        setFetchingStudents(true);
        try {
            let fetchedStudents = [];
            
            if (form.get_students_from === 'Student Applicant') {
                // Fetch approved applicants for the program and academic year
                const res = await API.get(`/api/resource/Student Applicant?filters=[["program","=","${form.program}"],["academic_year","=","${form.academic_year}"],["application_status","=","Approved"]]&fields=["name","first_name","last_name"]&limit_page_length=None`);
                fetchedStudents = res.data.data?.map((app, idx) => ({
                    id: Date.now() + idx,
                    student_applicant: app.name,
                    student: '', // Not created yet typically, or linked if already a student
                    student_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
                    student_batch_name: form.new_student_batch || ''
                })) || [];
                
            } else if (form.get_students_from === 'Student') {
                // Fetch existing students, perhaps filtering by Program if they are already enrolled in a previous term
                 const res = await API.get(`/api/resource/Student?limit_page_length=None`); // Simplified for UI tool demo
                 fetchedStudents = res.data.data?.map((stu, idx) => ({
                    id: Date.now() + idx,
                    student_applicant: '',
                    student: stu.name,
                    student_name: stu.title || stu.name,
                    student_batch_name: form.new_student_batch || ''
                })).slice(0, 15) || []; // Limit for demo
            }

            if (fetchedStudents.length === 0) {
                 notification.info({ message: 'No Data Found', description: `No ${form.get_students_from}s found matching criteria.` });
            } else {
                 notification.success({ message: 'Data Fetched', description: `Loaded ${fetchedStudents.length} rows.` });
            }
            
            setStudentList(fetchedStudents);
            setSelectedRowKeys([]); // Reset selection

        } catch (err) {
            console.error('Error fetching students:', err);
            notification.error({ message: 'Fetch Failed', description: 'Could not fetch data from server.' });
        } finally {
            setFetchingStudents(false);
        }
    };

    const handleRowChange = (id, field, value) => {
        setStudentList(prev => prev.map(row => 
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const addRow = () => {
        setStudentList([...studentList, {
            id: Date.now(),
            student_applicant: '',
            student: '',
            student_name: '',
            student_batch_name: form.new_student_batch || ''
        }]);
    };

    const removeRow = (id) => {
        setStudentList(studentList.filter(row => row.id !== id));
        setSelectedRowKeys(selectedRowKeys.filter(key => key !== id));
    };

    const handleEnroll = async () => {
        const rowsToProcess = selectedRowKeys.length > 0 
            ? studentList.filter(row => selectedRowKeys.includes(row.id))
            : studentList;

        if (rowsToProcess.length === 0) {
            notification.warning({ message: 'Empty List', description: 'No valid rows to enroll or none selected.' });
            return;
        }

        // Must have New Student Batch for actual enrollment or allow empty if not mandatory? 
        // Assuming Program Enrollment API needs Program and Academic Year.

        setLoading(true);
        try {
            await Promise.all(rowsToProcess.map(async row => {
                // If enrolling from applicant without a Student ID, logic might first create Student.
                // Assuming standard ERPNext Program Enrollment payload here:
                return API.post('/api/resource/Program Enrollment', {
                    student_applicant: row.student_applicant || undefined,
                    student: row.student || undefined,
                    student_name: row.student_name,
                    program: form.program,
                    academic_year: form.academic_year,
                    academic_term: form.academic_term || undefined,
                    student_batch_name: form.new_student_batch || row.student_batch_name || undefined,
                    enrollment_date: new Date().toISOString().split('T')[0]
                });
            }));

            notification.success({ message: 'Enrollment Successful', description: `Successfully enrolled ${rowsToProcess.length} students.` });
            // Remove successful rows from list or clear all
            setStudentList([]);
            setSelectedRowKeys([]);
        } catch (err) {
            console.error('Error enrolling students:', err);
            notification.error({ message: 'Enrollment Failed', description: 'Some enrollments failed. Ensure students aren\'t already enrolled in this term.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    const columns = [
        {
            title: 'No.',
            dataIndex: 'no',
            width: 60,
            align: 'center',
            render: (_, __, index) => <span className="text-gray-400 font-mono text-xs">{index + 1}</span>
        },
        {
            title: 'Student Applicant',
            dataIndex: 'student_applicant',
            width: 200,
            render: (text, record) => (
                <Input className="form-grid-input w-full" value={text} onChange={e => handleRowChange(record.id, 'student_applicant', e.target.value)} placeholder="Applicant ID" />
            )
        },
        {
            title: 'Student',
            dataIndex: 'student',
            width: 200,
            render: (text, record) => (
                <Input className="form-grid-input w-full" value={text} onChange={e => handleRowChange(record.id, 'student', e.target.value)} placeholder="Student ID" />
            )
        },
        {
            title: 'Student Name',
            dataIndex: 'student_name',
            width: 250,
            render: (text, record) => (
                <Input className="form-grid-input w-full" value={text} onChange={e => handleRowChange(record.id, 'student_name', e.target.value)} />
            )
        },
        {
            title: 'Student Batch Name',
            dataIndex: 'student_batch_name',
            width: 200,
            render: (text, record) => (
                <Select className="w-full form-grid-input" showSearch value={text || undefined} onChange={v => handleRowChange(record.id, 'student_batch_name', v)} allowClear placeholder="Select Batch">
                    {masters.batches.map(b => <Option key={b} value={b}>{b}</Option>)}
                </Select>
            )
        },
        {
            title: <SettingOutlined className="text-gray-400" />,
            key: 'action',
            width: 60,
            align: 'center',
            render: (_, record) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(record.id)} className="opacity-50 hover:opacity-100" />
            )
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <Title level={3} className="!m-0 text-gray-800">Program Enrollment Tool</Title>
                </div>
            </div>

            {/* Main Form container matching Frappe style */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* Header Fields Section */}
                <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6 bg-white border-b border-gray-100">
                    
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={`${labelStyle} flex gap-1 items-center`}>Get Students From <span className="text-red-500">*</span></label>
                            <Select 
                                className="w-full erp-select bg-red-50/20" 
                                size="large"
                                value={form.get_students_from} 
                                onChange={v => setForm({...form, get_students_from: v})}
                            >
                                <Option value="Student Applicant">Student Applicant</Option>
                                <Option value="Student">Student</Option>
                            </Select>
                        </div>
                        
                        <div>
                            <label className={`${labelStyle} flex gap-1 items-center`}>Program <span className="text-red-500">*</span></label>
                            <Select 
                                className="w-full erp-select bg-red-50/20" 
                                size="large"
                                value={form.program} 
                                onChange={v => setForm({...form, program: v})}
                                showSearch
                            >
                                {masters.programs.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={`${labelStyle} flex gap-1 items-center`}>Academic Year <span className="text-red-500">*</span></label>
                            <Select 
                                className="w-full erp-select bg-red-50/20" 
                                size="large"
                                value={form.academic_year} 
                                onChange={v => setForm({...form, academic_year: v})}
                                showSearch
                            >
                                {masters.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                            </Select>
                        </div>

                        <div>
                            <label className={labelStyle}>Academic Term</label>
                            <Select 
                                className="w-full erp-select bg-gray-50/50" 
                                size="large"
                                value={form.academic_term} 
                                onChange={v => setForm({...form, academic_term: v})}
                                showSearch
                                allowClear
                            >
                                {masters.academicTerms.map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Get Students Button */}
                <div className="px-6 py-4 bg-white">
                    <Button 
                        className="h-9 px-5 text-[13px] font-semibold bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 rounded"
                        onClick={getStudents}
                        loading={fetchingStudents}
                    >
                        Get Students
                    </Button>
                </div>

                {/* Sub-Table Section */}
                <div className="px-6 pb-6">
                    <label className={`${labelStyle} text-gray-400 mb-2 normal-case tracking-normal`}>Students</label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <Table 
                            rowSelection={{ type: 'checkbox', ...rowSelection }}
                            dataSource={studentList} 
                            columns={columns} 
                            pagination={false} 
                            rowKey="id"
                            size="small"
                            scroll={{ x: 'max-content' }}
                            className="erp-grid-table-alt"
                            locale={{ emptyText: <div className="py-8"><div className="text-gray-300 text-4xl mb-2"><AppstoreAddOutlined /></div><p className="text-gray-500 font-semibold text-sm">No Data</p></div> }}
                        />
                        <div className="px-3 py-2 border-t border-gray-100 bg-[#f8f9fa]">
                            <Button 
                                type="text" 
                                size="small" 
                                className="text-[12px] font-semibold text-gray-600 hover:bg-gray-200" 
                                onClick={addRow}
                            >
                                Add Row
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Enrollment Details Section */}
                <div className="px-6 py-6 border-t border-gray-100 bg-[#fafafa]">
                    <Title level={5} className="!m-0 !font-bold text-gray-800 mb-6">Enrollment Details</Title>
                    <div className="w-1/2 pr-6">
                        <label className={labelStyle}>New Student Batch</label>
                        <Select 
                            className="w-full erp-select bg-gray-50/50" 
                            size="large"
                            value={form.new_student_batch} 
                            onChange={v => setForm({...form, new_student_batch: v})}
                            showSearch
                            allowClear
                        >
                            {masters.batches.map(b => <Option key={b} value={b}>{b}</Option>)}
                        </Select>
                    </div>

                    <div className="mt-8">
                        <Button 
                            type="primary" 
                            className="bg-gray-950 border-0 h-10 px-6 rounded-md font-bold text-sm shadow-sm hover:bg-black transition-colors"
                            onClick={handleEnroll}
                            loading={loading}
                        >
                            Enroll Students
                        </Button>
                    </div>
                </div>

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
                
                .erp-grid-table-alt .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 8px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .erp-grid-table-alt .ant-table-thead > tr > th.ant-table-selection-column {
                    padding-left: 20px;
                }
                
                .erp-grid-table-alt .ant-table-tbody > tr > td {
                    padding: 4px 8px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .erp-grid-table-alt .ant-table-tbody > tr > td.ant-table-selection-column {
                    padding-left: 20px;
                }

                .form-grid-input {
                    border-radius: 4px !important;
                }
                
                .form-grid-input.ant-input, .form-grid-input .ant-select-selector, .form-grid-input.ant-input-number {
                    border: 1px solid transparent !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }
                
                .form-grid-input:hover, .form-grid-input.ant-input:focus, .form-grid-input .ant-select-focused .ant-select-selector, .form-grid-input.ant-input-number-focused {
                    border-color: #cbd5e1 !important;
                    background: white !important;
                }
            `}</style>
        </div>
    );
};

export default ProgramEnrollmentTool;
