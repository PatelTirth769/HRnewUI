import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Table, InputNumber, notification, Typography } from 'antd';
import { AppstoreAddOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const AssessmentResultTool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [assessmentPlans, setAssessmentPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [planDetails, setPlanDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [existingScores, setExistingScores] = useState({});
    const [newScores, setNewScores] = useState({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await API.get('/api/resource/Assessment Plan?limit_page_length=None');
            setAssessmentPlans(res.data.data?.map(d => d.name) || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const loadData = async () => {
        if (!selectedPlan) return;
        setFetchingData(true);
        try {
            const planRes = await API.get(`/api/resource/Assessment Plan/${selectedPlan}`);
            const plan = planRes.data.data;
            setPlanDetails(plan);

            if (plan.student_group) {
                const groupRes = await API.get(`/api/resource/Student Group/${plan.student_group}`);
                setStudents(groupRes.data.data.students || []);
            }

            const resultsRes = await API.get(`/api/resource/Assessment Result?filters=[["assessment_plan","=","${selectedPlan}"]]&fields=["student","assessment_criteria","score"]&limit_page_length=None`);
            const scoresMap = {};
            resultsRes.data.data?.forEach(r => {
                scoresMap[`${r.student}_${r.assessment_criteria}`] = r.score;
            });
            setExistingScores(scoresMap);
            setNewScores({});
        } catch (err) {
            console.error('Error loading data:', err);
            notification.error({ message: 'Load Failed', description: 'Could not retrieve assessment details.' });
        } finally {
            setFetchingData(false);
        }
    };

    const handleScoreChange = (studentId, criteriaId, value) => {
        setNewScores(prev => ({
            ...prev,
            [`${studentId}_${criteriaId}`]: value
        }));
    };

    const handleSave = async () => {
        const updates = Object.entries(newScores);
        if (updates.length === 0) return;

        setLoading(true);
        try {
            await Promise.all(updates.map(async ([key, value]) => {
                const [student, criteria] = key.split('_');
                return API.post('/api/resource/Assessment Result', {
                    student,
                    assessment_plan: selectedPlan,
                    assessment_criteria: criteria,
                    score: value,
                    student_name: students.find(s => s.student === student)?.student_name
                });
            }));

            notification.success({ message: 'Scores Saved', description: `Successfully updated ${updates.length} markers.` });
            loadData();
        } catch (err) {
            console.error('Error saving scores:', err);
            notification.error({ message: 'Save Failed', description: 'Some scores could not be saved.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    const criteriaColumns = planDetails?.assessment_criteria?.map(c => ({
        title: <span>{c.assessment_criteria} <span className="text-blue-500 text-[10px]">(Max: {c.maximum_score})</span></span>,
        key: c.assessment_criteria,
        align: 'center',
        width: 150,
        render: (_, record) => {
            const key = `${record.student}_${c.assessment_criteria}`;
            const val = newScores[key] !== undefined ? newScores[key] : (existingScores[key] || 0);
            return (
                <InputNumber
                    min={0}
                    max={c.maximum_score}
                    value={val}
                    onChange={v => handleScoreChange(record.student, c.assessment_criteria, v)}
                    className="form-grid-input"
                    style={{ width: '80px' }}
                />
            );
        }
    })) || [];

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
            width: 220,
            render: (text) => <span className="font-semibold text-gray-800">{text}</span>
        },
        ...criteriaColumns
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Standard Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Assessment Result Tool</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-100">Not Saved</span>
                </div>
                <div>
                    <Button
                        type="primary"
                        className="bg-gray-900 border-0 h-9 px-6 rounded-md font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors"
                        onClick={handleSave}
                        disabled={Object.keys(newScores).length === 0 || loading}
                        loading={loading}
                    >
                        Update Results
                    </Button>
                </div>
            </div>

            {/* Main Form */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Assessment Plan Selector */}
                <div className="p-6 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-x-12 items-end">
                        <div>
                            <label className={`${labelStyle} flex gap-1 items-center`}>Assessment Plan <span className="text-red-500">*</span></label>
                            <Select
                                className="w-full erp-select bg-red-50/20"
                                size="large"
                                placeholder="Select Assessment Plan"
                                showSearch
                                value={selectedPlan}
                                onChange={v => setSelectedPlan(v)}
                            >
                                {assessmentPlans.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </div>
                        <div>
                            <Button
                                className="h-9 px-5 text-[13px] font-semibold bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 rounded"
                                onClick={loadData}
                                loading={fetchingData}
                            >
                                Get Students
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Plan Details */}
                {planDetails && (
                    <div className="px-6 py-4 bg-[#fafafa] border-b border-gray-100 grid grid-cols-3 gap-6">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Group</span>
                            <p className="text-gray-800 font-semibold text-sm mt-0.5">{planDetails.student_group || '—'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessment Group</span>
                            <p className="text-gray-800 font-semibold text-sm mt-0.5">{planDetails.assessment_group || '—'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule Date</span>
                            <p className="text-gray-800 font-semibold text-sm mt-0.5">{planDetails.schedule_date || '—'}</p>
                        </div>
                    </div>
                )}

                {/* Results Grid */}
                {students.length > 0 && (
                    <div className="px-6 py-4">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Results ({students.length})</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table
                                dataSource={students}
                                columns={columns}
                                pagination={false}
                                rowKey="student"
                                size="small"
                                scroll={{ x: 'max-content' }}
                                className="erp-grid-table"
                                locale={{ emptyText: <div className="py-8"><div className="text-gray-300 text-4xl mb-2"><AppstoreAddOutlined /></div><p className="text-gray-500 font-semibold text-sm">No Data</p></div> }}
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
                    padding: 8px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .erp-grid-table .ant-table-tbody > tr > td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .form-grid-input.ant-input-number {
                    border: 1px solid transparent !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border-radius: 4px !important;
                }
                .form-grid-input.ant-input-number:hover,
                .form-grid-input.ant-input-number-focused {
                    border-color: #cbd5e1 !important;
                    background: white !important;
                }
            `}</style>
        </div>
    );
};

export default AssessmentResultTool;
