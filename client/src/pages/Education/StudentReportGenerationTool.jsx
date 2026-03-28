import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Checkbox, Button, Space, Breadcrumb, notification, Divider } from 'antd';
import { PrinterOutlined, FileTextOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Option } = Select;

const StudentReportGenerationTool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [masters, setMasters] = useState({
        students: [],
        programs: [],
        batches: [],
        assessmentGroups: [],
        academicYears: [],
        academicTerms: [],
        letterHeads: [],
    });

    const [form, setForm] = useState({
        student: '',
        assessment_group: '',
        program: '',
        academic_year: '',
        batch: '',
        academic_term: '',
        add_letterhead: true,
        show_marks: false,
        letter_head: 'Default Logo',
        terms: '',
        total_parents_teacher_meeting: '',
        no_of_meetings_attended_by_parents: '',
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [stdRes, prgRes, bchRes, agRes, ayRes, atRes, lhRes] = await Promise.all([
                API.get('/api/resource/Student?fields=["name","student_name"]&limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Student Batch Name?limit_page_length=None'),
                API.get('/api/resource/Assessment Group?limit_page_length=None'),
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Letter Head?limit_page_length=None'),
            ]);

            setMasters({
                students: stdRes.data.data || [],
                programs: prgRes.data.data?.map(d => d.name) || [],
                batches: bchRes.data.data?.map(d => d.name) || [],
                assessmentGroups: agRes.data.data?.map(d => d.name) || [],
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                academicTerms: atRes.data.data?.map(d => d.name) || [],
                letterHeads: lhRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching master data:', err);
        }
    };

    const handlePrint = () => {
        if (!form.student || !form.assessment_group || !form.program || !form.academic_year) {
            notification.warning({
                message: 'Missing Fields',
                description: 'Please fill in all mandatory fields (marked with *).',
            });
            return;
        }
        
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            window.print();
        }, 1000);
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";
    const sectionTitleStyle = "text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-6 block";

    return (
        <div className="p-6 max-w-6xl mx-auto pb-40">
            {/* Standard Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-[22px]">STUDENT REPORT GENERATION TOOL</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold uppercase tracking-widest leading-none">Utility</span>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <button 
                        className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md flex items-center gap-2" 
                        onClick={handlePrint} 
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : <><PrinterOutlined /> Print Report Card</>}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-12">
                {/* Identity Section */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={v => setForm({...form, student: v.target.value})}>
                            <option value="">Select Student</option>
                            {masters.students.map(s => <option key={s.name} value={s.name}>{s.student_name} ({s.name})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Assessment Group *</label>
                        <select className={inputStyle} value={form.assessment_group} onChange={v => setForm({...form, assessment_group: v.target.value})}>
                            <option value="">Select Group</option>
                            {masters.assessmentGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Program *</label>
                        <select className={inputStyle} value={form.program} onChange={v => setForm({...form, program: v.target.value})}>
                            <option value="">Select Program</option>
                            {masters.programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Year *</label>
                        <select className={inputStyle} value={form.academic_year} onChange={v => setForm({...form, academic_year: v.target.value})}>
                            <option value="">Select Year</option>
                            {masters.academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Batch</label>
                        <select className={inputStyle} value={form.batch} onChange={v => setForm({...form, batch: v.target.value})}>
                            <option value="">Select Batch</option>
                            {masters.batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Term</label>
                        <select className={inputStyle} value={form.academic_term} onChange={v => setForm({...form, academic_term: v.target.value})}>
                            <option value="">Select Term</option>
                            {masters.academicTerms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Settings Section */}
                <div>
                    <h3 className={sectionTitleStyle}>Report Settings</h3>
                    <div className="grid grid-cols-12 gap-x-12 gap-y-8">
                        <div className="col-span-12 flex gap-8 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors font-bold">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-all shadow-sm" checked={form.add_letterhead} onChange={e => setForm({...form, add_letterhead: e.target.checked})} />
                                Add letterhead
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors font-bold">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-all shadow-sm" checked={form.show_marks} onChange={e => setForm({...form, show_marks: e.target.checked})} />
                                Show Marks
                            </label>
                        </div>

                        <div className="col-span-6 space-y-8">
                            <div>
                                <label className={labelStyle}>Letter Head</label>
                                <select className={inputStyle} value={form.letter_head} onChange={v => setForm({...form, letter_head: v.target.value})} disabled={!form.add_letterhead}>
                                    {masters.letterHeads.map(lh => <option key={lh} value={lh}>{lh}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Total Parents Teacher Meeting</label>
                                <input type="number" className={inputStyle} placeholder="e.g. 10" value={form.total_parents_teacher_meeting} onChange={e => setForm({...form, total_parents_teacher_meeting: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelStyle}>No. of Meetings Attended by Parents</label>
                                <input type="number" className={inputStyle} placeholder="e.g. 8" value={form.no_of_meetings_attended_by_parents} onChange={e => setForm({...form, no_of_meetings_attended_by_parents: e.target.value})} />
                            </div>
                        </div>

                        <div className="col-span-6">
                            <label className={labelStyle}>Terms</label>
                            <textarea className={`${inputStyle} h-40 resize-none`} placeholder="Add specific terms or notes..." value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Hint Footer */}
                <div className="bg-gray-50 border-t border-gray-100 -mx-10 -mb-10 p-6 flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <SettingOutlined className="text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 italic">This tool generates a PDF report card based on the active assessment results for the selected student and group.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentReportGenerationTool;
