import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Input, Checkbox, notification, Row, Col, Typography } from 'antd';
import API from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const CourseSchedulingTool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        student_group: '',
        course: '',
        instructor: '',
        room: '',
        class_schedule_color: 'blue',
        
        from_time: '18:42:34',
        to_time: '18:42:34',
        course_start_date: '',
        course_end_date: '',
        reschedule: false,

        days: {
            Monday: false,
            Tuesday: false,
            Wednesday: false,
            Thursday: false,
            Friday: false,
            Saturday: false,
            Sunday: false
        }
    });

    const [masters, setMasters] = useState({
        studentGroups: [],
        courses: [],
        instructors: [],
        rooms: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [sgRes, crsRes, instRes, roomRes] = await Promise.all([
                API.get('/api/resource/Student Group?limit_page_length=None'),
                API.get('/api/resource/Course?limit_page_length=None'),
                API.get('/api/resource/Instructor?limit_page_length=None'),
                API.get('/api/resource/Room?limit_page_length=None')
            ]);
            setMasters({
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                courses: crsRes.data.data?.map(d => d.name) || [],
                instructors: instRes.data.data?.map(d => d.name) || [],
                rooms: roomRes.data.data?.map(d => d.name) || []
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const handleDayToggle = (day) => {
        setForm(prev => ({
            ...prev,
            days: { ...prev.days, [day]: !prev.days[day] }
        }));
    };

    const selectAllDays = (select) => {
        setForm(prev => ({
            ...prev,
            days: {
                Monday: select, Tuesday: select, Wednesday: select,
                Thursday: select, Friday: select, Saturday: select, Sunday: select
            }
        }));
    };

    const handleSchedule = async () => {
        // Validation
        if (!form.student_group || !form.course || !form.instructor || !form.room || !form.from_time || !form.to_time || !form.course_start_date || !form.course_end_date) {
            notification.warning({ message: 'Missing Fields', description: 'Please fill in all mandatory fields.' });
            return;
        }

        const selectedDays = Object.keys(form.days).filter(day => form.days[day]);
        if (selectedDays.length === 0) {
            notification.warning({ message: 'No Days Selected', description: 'Please select at least one day for the schedule.' });
            return;
        }

        setLoading(true);
        try {
            // Bulk scheduling mechanism logic here.
            // ERPNext's Course Scheduling Tool usually has a specific endpoint for this bulk operation
            // or we manually generate dates and POST to Course Schedule.
            // For UI prototype, we simulate the submission.
            
            // let endpoint = '/api/method/education.education.api.schedule_course';
            // await API.post(endpoint, { ...form, ... });

            await new Promise(r => setTimeout(r, 1500)); // Simulate delay
            notification.success({ message: 'Schedule Created', description: `Successfully scheduled course from ${form.course_start_date} to ${form.course_end_date}.` });
        } catch (err) {
            console.error('Error scheduling:', err);
            notification.error({ message: 'Scheduling Failed', description: 'Could not create course schedules.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";
    const dayCheckboxStyle = "text-gray-700 font-medium text-sm";

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Standard Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Course Scheduling Tool</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-100">Not Saved</span>
                </div>
                <div>
                    <Button 
                        type="primary" 
                        className="bg-gray-900 border-0 h-9 px-6 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors"
                        onClick={handleSchedule}
                        loading={loading}
                    >
                        Schedule Course
                    </Button>
                </div>
            </div>

            {/* Main Form container matching Frappe style */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-8">
                
                {/* Master Selection Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10">
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>Student Group <span className="text-red-500">*</span></label>
                        <Select 
                            className="w-full erp-select bg-red-50/20" 
                            size="large"
                            value={form.student_group} 
                            onChange={v => setForm({...form, student_group: v})}
                            showSearch
                        >
                            {masters.studentGroups.map(p => <Option key={p} value={p}>{p}</Option>)}
                        </Select>
                    </div>
                    <div className="row-start-2">
                        <label className={`${labelStyle} flex gap-1 items-center`}>Course <span className="text-red-500">*</span></label>
                        <Select 
                            className="w-full erp-select bg-red-50/20" 
                            size="large"
                            value={form.course} 
                            onChange={v => setForm({...form, course: v})}
                            showSearch
                        >
                            {masters.courses.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </div>

                    <div className="row-start-3">
                        <label className={`${labelStyle} flex gap-1 items-center`}>Instructor <span className="text-red-500">*</span></label>
                        <Select 
                            className="w-full erp-select bg-red-50/20" 
                            size="large"
                            value={form.instructor} 
                            onChange={v => setForm({...form, instructor: v})}
                            showSearch
                        >
                            {masters.instructors.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </div>
                    <div className="row-start-3">
                        <label className={`${labelStyle} flex gap-1 items-center`}>Room <span className="text-red-500">*</span></label>
                        <Select 
                            className="w-full erp-select bg-red-50/20" 
                            size="large"
                            value={form.room} 
                            onChange={v => setForm({...form, room: v})}
                            showSearch
                        >
                            {masters.rooms.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </div>
                    <div className="row-start-4 col-start-2">
                        <label className={labelStyle}>Class Schedule Color</label>
                        <Select 
                            className="w-full erp-select bg-gray-50/50" 
                            size="large"
                            value={form.class_schedule_color} 
                            onChange={v => setForm({...form, class_schedule_color: v})}
                        >
                            {['blue', 'red', 'green', 'yellow', 'purple', 'orange'].map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 mb-10">
                    <div className="flex gap-4 mb-6">
                        <Button size="small" className="text-xs font-semibold bg-gray-100 border-gray-200" onClick={() => selectAllDays(true)}>Select All</Button>
                        <Button size="small" className="text-xs font-semibold bg-gray-100 border-gray-200" onClick={() => selectAllDays(false)}>Unselect All</Button>
                    </div>
                    
                    <Row gutter={[48, 16]}>
                        <Col span={6}>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Friday} onChange={() => handleDayToggle('Friday')}>Friday</Checkbox>
                            <br/><br/>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Monday} onChange={() => handleDayToggle('Monday')}>Monday</Checkbox>
                        </Col>
                        <Col span={6}>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Saturday} onChange={() => handleDayToggle('Saturday')}>Saturday</Checkbox>
                            <br/><br/>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Sunday} onChange={() => handleDayToggle('Sunday')}>Sunday</Checkbox>
                        </Col>
                        <Col span={6}>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Thursday} onChange={() => handleDayToggle('Thursday')}>Thursday</Checkbox>
                            <br/><br/>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Tuesday} onChange={() => handleDayToggle('Tuesday')}>Tuesday</Checkbox>
                        </Col>
                        <Col span={6}>
                            <Checkbox className={dayCheckboxStyle} checked={form.days.Wednesday} onChange={() => handleDayToggle('Wednesday')}>Wednesday</Checkbox>
                        </Col>
                    </Row>
                </div>

                <div className="border-t border-gray-100 pt-8 grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>From Time <span className="text-red-500">*</span></label>
                        <input type="time" step="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-red-50/20 hover:border-gray-300" style={{ height: '38px'}} value={form.from_time} onChange={e => setForm({...form, from_time: e.target.value})} />
                    </div>
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>To Time <span className="text-red-500">*</span></label>
                        <input type="time" step="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-red-50/20 hover:border-gray-300" style={{ height: '38px'}} value={form.to_time} onChange={e => setForm({...form, to_time: e.target.value})} />
                    </div>

                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>Course Start Date <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-red-50/20 hover:border-gray-300" style={{ height: '38px'}} value={form.course_start_date} onChange={e => setForm({...form, course_start_date: e.target.value})} />
                    </div>
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>Course End Date <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-red-50/20 hover:border-gray-300" style={{ height: '38px'}} value={form.course_end_date} onChange={e => setForm({...form, course_end_date: e.target.value})} />
                        
                        <div className="mt-4">
                            <Checkbox 
                                className="font-semibold text-gray-700 text-sm"
                                checked={form.reschedule}
                                onChange={e => setForm({...form, reschedule: e.target.checked})}
                            >
                                Reschedule
                            </Checkbox>
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
            `}</style>
        </div>
    );
};

export default CourseSchedulingTool;
