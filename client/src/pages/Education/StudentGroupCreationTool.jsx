import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Space, Table, Input, InputNumber, Checkbox, notification, Divider, Typography, Tooltip } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, DeleteOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const StudentGroupCreationTool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingCourses, setFetchingCourses] = useState(false);
    
    const [form, setForm] = useState({
        academic_year: '',
        academic_term: '',
        program: '',
        separate_course_based_group: false
    });

    const [masters, setMasters] = useState({
        academicYears: [],
        academicTerms: [],
        programs: [],
        courses: [],
        batches: []
    });

    const [coursesList, setCoursesList] = useState([]); // Selected courses to create groups for

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [ayRes, atRes, prgRes, crsRes, batchRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Course?limit_page_length=None'),
                API.get('/api/resource/Student Batch Name?limit_page_length=None')
            ]);
            setMasters({
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                academicTerms: atRes.data.data?.map(d => d.name) || [],
                programs: prgRes.data.data?.map(d => d.name) || [],
                courses: crsRes.data.data?.map(d => d.name) || [],
                batches: batchRes.data.data?.map(d => d.name) || []
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const getCourses = async () => {
        if (!form.academic_year || !form.program) {
            notification.warning({ message: 'Missing Fields', description: 'Academic Year and Program are mandatory.' });
            return;
        }

        setFetchingCourses(true);
        try {
            // In ERPNext, fetching courses for a program might involve checking Program Course or Course Schedule.
            // For this UI Tool, let's simulate fetching courses related to the program.
            // If the user checked "Separate course based Group for every Batch", we'd fetch batches too.
            
            // To provide a robust UI matching the screenshot, we simulate the auto-population 
            // of the courses sub-table based on the Program. Here we fetch the Program details.
            const prgRes = await API.get(`/api/resource/Program/${form.program}`);
            const programCourses = prgRes.data.data?.courses?.map(c => c.course) || [];
            
            if (programCourses.length === 0) {
                 notification.info({ message: 'No Courses Found', description: `No courses defined in Program ${form.program}.` });
                 setCoursesList([]);
                 return;
            }

            const newCourses = programCourses.map((course, idx) => ({
                id: Date.now() + idx, // unique internal id for list rendering
                group_based_on: 'Course',
                course: course,
                batch: '',
                student_group_name: `${form.academic_year}-${form.program}-${course}${form.academic_term ? `-${form.academic_term}` : ''}`,
                max_strength: null
            }));

            // If separate batch checked, we could multiply the rows. For simplicity in demo, we just load courses.
            setCoursesList(newCourses);
            notification.success({ message: 'Courses Fetched', description: `Loaded ${newCourses.length} courses for configuration.` });

        } catch (err) {
            console.error('Error fetching courses:', err);
            notification.error({ message: 'Fetch Failed', description: 'Could not fetch program courses.' });
        } finally {
            setFetchingCourses(false);
        }
    };

    const handleRowChange = (id, field, value) => {
        setCoursesList(prev => prev.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                // Auto-update student group name if course or batch changes
                if (field === 'course' || field === 'batch') {
                    const c = newRow.course || '';
                    const b = newRow.batch ? `-${newRow.batch}` : '';
                    newRow.student_group_name = `${form.academic_year}-${form.program}-${c}${b}`;
                }
                return newRow;
            }
            return row;
        }));
    };

    const addRow = () => {
        const newRow = {
            id: Date.now(),
            group_based_on: 'Course',
            course: '',
            batch: '',
            student_group_name: `${form.academic_year ? form.academic_year+'-' : ''}${form.program ? form.program+'-' : ''}NewGroup`,
            max_strength: null
        };
        setCoursesList([...coursesList, newRow]);
    };

    const removeRow = (id) => {
        setCoursesList(coursesList.filter(row => row.id !== id));
    };

    const handleCreateGroups = async () => {
        if (coursesList.length === 0) {
            notification.warning({ message: 'Empty List', description: 'No groups defined to create.' });
            return;
        }

        // Validate
        for (const row of coursesList) {
            if (!row.group_based_on || !row.student_group_name) {
                notification.error({ message: 'Validation Error', description: 'Group Based On and Student Group Name are mandatory for all rows.' });
                return;
            }
        }

        setLoading(true);
        try {
            await Promise.all(coursesList.map(async row => {
                return API.post('/api/resource/Student Group', {
                    student_group_name: row.student_group_name,
                    group_based_on: row.group_based_on,
                    program: form.program,
                    academic_year: form.academic_year,
                    academic_term: form.academic_term,
                    course: row.course || undefined,
                    batch: row.batch || undefined,
                    max_strength: row.max_strength || 0
                });
            }));

            notification.success({ message: 'Success', description: `Successfully created ${coursesList.length} Student Groups.` });
            setCoursesList([]); // Clear on success
        } catch (err) {
            console.error('Error creating groups:', err);
            notification.error({ message: 'Creation Failed', description: 'Some groups could not be created or already exist.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";
    const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors bg-white hover:border-gray-300";

    const columns = [
        {
            title: <Checkbox disabled />, // Dummy checkbox for 'No.' col visual
            dataIndex: 'checkbox',
            width: 50,
            align: 'center',
            render: () => <Checkbox />
        },
        {
            title: 'No.',
            dataIndex: 'no',
            width: 50,
            align: 'center',
            render: (_, __, index) => <span className="text-gray-400 font-mono text-xs">{index + 1}</span>
        },
        {
            title: <span>Group Based On <span className="text-red-400">*</span></span>,
            dataIndex: 'group_based_on',
            width: 150,
            render: (text, record) => (
                <Select className="w-full form-grid-input" value={text} onChange={v => handleRowChange(record.id, 'group_based_on', v)}>
                    <Option value="Batch">Batch</Option>
                    <Option value="Course">Course</Option>
                    <Option value="Activity">Activity</Option>
                </Select>
            )
        },
        {
            title: 'Course',
            dataIndex: 'course',
            width: 200,
            render: (text, record) => (
                <Select className="w-full form-grid-input" showSearch value={text} onChange={v => handleRowChange(record.id, 'course', v)} allowClear>
                    {masters.courses.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
            )
        },
        {
            title: 'Batch',
            dataIndex: 'batch',
            width: 150,
            render: (text, record) => (
                <Select className="w-full form-grid-input" showSearch value={text} onChange={v => handleRowChange(record.id, 'batch', v)} allowClear>
                    {masters.batches.map(b => <Option key={b} value={b}>{b}</Option>)}
                </Select>
            )
        },
        {
            title: <span>Student Group Name <span className="text-red-400">*</span></span>,
            dataIndex: 'student_group_name',
            width: 250,
            render: (text, record) => (
                <Input className="form-grid-input w-full" value={text} onChange={e => handleRowChange(record.id, 'student_group_name', e.target.value)} />
            )
        },
        {
            title: 'Max Strength',
            dataIndex: 'max_strength',
            width: 120,
            render: (text, record) => (
                <InputNumber className="form-grid-input w-full" value={text} onChange={v => handleRowChange(record.id, 'max_strength', v)} min={0} />
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

    return (
        <div className="p-6 max-w-7xl mx-auto pb-60">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Student Group Creation Tool</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-100">Not Saved</span>
                </div>
                <div className="flex gap-3">
                    <Button 
                        type="primary" 
                        className="bg-gray-900 border-0 h-9 px-6 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors"
                        onClick={handleCreateGroups}
                        loading={loading}
                    >
                        Create Student Groups
                    </Button>
                </div>
            </div>

            {/* Main Form container matching Frappe style */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                
                {/* Form Fields Section */}
                <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6 bg-[#fafafa] border-b border-gray-200">
                    
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={`${labelStyle} flex gap-1 items-center`}>Academic Year <span className="text-red-500">*</span></label>
                            <Select 
                                className="w-full erp-select" 
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
                                className="w-full erp-select" 
                                size="large"
                                value={form.academic_term} 
                                onChange={v => setForm({...form, academic_term: v})}
                                showSearch
                                allowClear
                            >
                                {masters.academicTerms.map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                            <p className="text-[11px] text-gray-500 mt-1 italic">Leave blank if you make students groups per year</p>
                        </div>

                        <div className="pt-2">
                            <Button 
                                className="h-9 px-5 text-[13px] font-semibold bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 rounded"
                                onClick={getCourses}
                                loading={fetchingCourses}
                            >
                                Get Courses
                            </Button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
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

                        <div className="pt-2">
                            <Checkbox 
                                className="font-semibold text-gray-700 text-sm"
                                checked={form.separate_course_based_group}
                                onChange={e => setForm({...form, separate_course_based_group: e.target.checked})}
                            >
                                Separate course based Group for every Batch
                            </Checkbox>
                            <p className="text-[11px] text-gray-500 mt-1.5 ml-6 italic">Leave unchecked if you don't want to consider batch while making course based groups.</p>
                        </div>
                    </div>

                </div>

                {/* Sub-Table Section */}
                <div className="p-6">
                    <label className={`${labelStyle} text-gray-400 mb-2`}>Courses</label>
                    <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
                        <Table 
                            dataSource={coursesList} 
                            columns={columns} 
                            pagination={false} 
                            rowKey="id"
                            size="small"
                            className="erp-grid-table"
                            locale={{ emptyText: <div className="py-8"><div className="text-gray-300 text-4xl mb-2"><AppstoreAddOutlined /></div><p className="text-gray-500 font-semibold text-sm">No Data</p></div> }}
                        />
                        <div className="px-3 py-2 border-t border-gray-100 bg-[#fbfbfb]">
                            <Button 
                                type="text" 
                                size="small" 
                                className="text-[12px] font-semibold text-gray-600 hover:bg-gray-100" 
                                onClick={addRow}
                            >
                                Add Row
                            </Button>
                        </div>
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
                
                .erp-grid-table .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 8px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .erp-grid-table .ant-table-tbody > tr > td {
                    padding: 4px 8px;
                    border-bottom: 1px solid #f3f4f6;
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

export default StudentGroupCreationTool;
