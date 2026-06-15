import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { 
    Card, Col, Row, Button, Select, Input, DatePicker, notification, Spin, Space, Divider, Typography, Form, Modal, AutoComplete
} from 'antd';
import { 
    PrinterOutlined, DownloadOutlined, ArrowLeftOutlined, SearchOutlined, SaveOutlined, EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import schoolHeader from '../../assets/images/school_header.jpg';

const { Title, Text } = Typography;
const RECORDS_PATH = 'schooler_system/certificates/records';

export default function BonafideCertificate() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const certificateRef = useRef(null);

    const [searching, setSearching] = useState(false);
    const [students, setStudents] = useState([]);
    const [saving, setSaving] = useState(false);
    const [certificateNo, setCertificateNo] = useState('');
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    
    // Masters and Group States
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [boards, setBoards] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [allStudentGroups, setAllStudentGroups] = useState([]);
    const [filteredPrograms, setFilteredPrograms] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [studentsInGroup, setStudentsInGroup] = useState([]);
    const [loadingGroupStudents, setLoadingGroupStudents] = useState(false);
    const [studentsInProgram, setStudentsInProgram] = useState([]);
    const [loadingProgramStudents, setLoadingProgramStudents] = useState(false);

    // Certificate preview live state
    const [previewData, setPreviewData] = useState({
        certificateNo: '',
        date: dayjs().format('DD/MM/YYYY'),
        studentName: '',
        grNo: '',
        rollNo: '',
        std: '',
        caste: '',
        subCaste: ' - ',
        gender: '',
        academicYear: `${dayjs().year()}-${dayjs().year() + 1}`,
        principalName: 'Neeraj Kaushesh',
        prefix: 'Master',
        heShe: 'He',
        hisHer: 'His',
        himHer: 'him',
        relation: 'son of'
    });

    useEffect(() => {
        const fetchMasters = async () => {
            setLoadingMasters(true);
            try {
                const [pRes, sgRes, bRes] = await Promise.all([
                    API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Student Group?fields=["name","program"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } }))
                ]);
                const fetchedPrograms = pRes.data.data || [];
                setPrograms(fetchedPrograms);
                setFilteredPrograms(fetchedPrograms);
                
                const groups = sgRes.data.data || [];
                setAllStudentGroups(groups);
                setFilteredGroups(groups);
                
                setBoards(bRes.data.data || []);
            } catch (err) {
                console.error('Error fetching programs or student groups:', err);
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
    }, []);

    useEffect(() => {
        // Fetch next certificate number from Firebase on mount
        const getNextCertNo = async () => {
            try {
                const recordsRef = collection(db, RECORDS_PATH);
                const q = query(recordsRef, orderBy('created_at', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const lastDoc = snapshot.docs[0].data();
                    const lastNo = parseInt(lastDoc.certificateNo, 10);
                    if (!isNaN(lastNo)) {
                        setCertificateNo(String(lastNo + 1));
                        form.setFieldsValue({ certificateNo: String(lastNo + 1) });
                        setPreviewData(prev => ({ ...prev, certificateNo: String(lastNo + 1) }));
                    } else {
                        setCertificateNo('1');
                        form.setFieldsValue({ certificateNo: '1' });
                        setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
                    }
                } else {
                    setCertificateNo('1');
                    form.setFieldsValue({ certificateNo: '1' });
                    setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
                }
            } catch (err) {
                console.error("Error generating next certificate no:", err);
                setCertificateNo('1');
                form.setFieldsValue({ certificateNo: '1' });
                setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
            }
        };

        getNextCertNo();
    }, [form]);

    // Load student profiles for the selected program
    const fetchStudentsForProgram = async (programName) => {
        if (!programName) {
            setStudentsInProgram([]);
            return;
        }
        setLoadingProgramStudents(true);
        try {
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number"]);
            const filters = JSON.stringify([["program", "=", programName]]);
            const res = await API.get(`/api/resource/Student?filters=${filters}&fields=${fieldsList}&limit_page_length=1000`);
            const programStudents = res.data?.data || [];
            setStudentsInProgram(programStudents);
            setStudents(programStudents);
        } catch (err) {
            console.error("Failed to load students for program:", err);
        } finally {
            setLoadingProgramStudents(false);
        }
    };

    // Handle board change
    const handleBoardChange = (value) => {
        setSelectedBoard(value);
        if (value) {
            const fProgs = programs.filter(p => {
                const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (value || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
            setFilteredPrograms(fProgs);
            
            const fGroups = allStudentGroups.filter(sg => {
                const prog = programs.find(p => p.name === sg.program);
                const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (value || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
            setFilteredGroups(fGroups);
        } else {
            setFilteredPrograms(programs);
            setFilteredGroups(allStudentGroups);
        }
        setSelectedProgram('');
        setSelectedGroup('');
        form.setFieldsValue({ board: value, program: undefined, studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '' });
        setStudentsInProgram([]);
        setStudentsInGroup([]);
        setStudents([]);
    };

    // Filter student groups when program changes
    const handleProgramChange = (value) => {
        setSelectedProgram(value);
        if (value) {
            setFilteredGroups(allStudentGroups.filter(g => g.program === value));
            form.setFieldsValue({ std: value, program: value });
            setPreviewData(prev => ({ ...prev, std: value }));
            fetchStudentsForProgram(value);
        } else {
            if (selectedBoard) {
                const fGroups = allStudentGroups.filter(sg => {
                    const prog = programs.find(p => p.name === sg.program);
                    const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                    const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
                    return pBoard === fBoard;
                });
                setFilteredGroups(fGroups);
            } else {
                setFilteredGroups(allStudentGroups);
            }
            form.setFieldsValue({ program: undefined });
            setStudentsInProgram([]);
            setStudents([]);
        }
        // Clear dependent fields
        setSelectedGroup('');
        form.setFieldsValue({ studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '' });
        setStudentsInGroup([]);
    };

    // Load group members and their full profiles when a student group is selected
    const handleGroupChange = async (value) => {
        setSelectedGroup(value);
        // Clear dependent fields
        form.setFieldsValue({ studentSearch: undefined, studentName: '', grNo: '', rollNo: '' });
        setStudentsInGroup([]);
        setStudents([]);

        if (!value) {
            if (selectedProgram) {
                setStudents(studentsInProgram);
            }
            return;
        }

        setLoadingGroupStudents(true);
        try {
            const sgRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(value)}`);
            const groupStudents = sgRes.data.data?.students || [];
            if (groupStudents.length === 0) {
                setLoadingGroupStudents(false);
                return;
            }

            const studentIds = groupStudents.map(s => s.student);
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number"]);
            const filters = JSON.stringify([["name", "in", studentIds]]);
            const profileRes = await API.get(`/api/resource/Student?filters=${filters}&fields=${fieldsList}&limit_page_length=1000`);

            const detailedStudents = profileRes.data.data || [];
            setStudentsInGroup(detailedStudents);
            
            if (selectedProgram) {
                setStudents(detailedStudents.filter(s => s.program === selectedProgram));
            } else {
                setStudents(detailedStudents);
            }
        } catch (err) {
            console.error("Failed to load students for group:", err);
        } finally {
            setLoadingGroupStudents(false);
        }
    };

    const handleStudentSelectFocus = () => {
        if (selectedGroup && studentsInGroup.length > 0) {
            if (selectedProgram) {
                setStudents(studentsInGroup.filter(s => s.program === selectedProgram));
            } else {
                setStudents(studentsInGroup);
            }
        } else if (selectedProgram && studentsInProgram.length > 0) {
            setStudents(studentsInProgram);
        }
    };

    // Handle student search on ERPNext API or filter locally within selected group/program
    const handleStudentSearch = async (value) => {
        if (selectedGroup) {
            const baseList = selectedProgram 
                ? studentsInGroup.filter(s => s.program === selectedProgram)
                : studentsInGroup;
            if (!value || value.trim().length === 0) {
                setStudents(baseList);
            } else {
                const lowerVal = value.toLowerCase();
                const filtered = baseList.filter(s => 
                    (s.student_name && s.student_name.toLowerCase().includes(lowerVal)) ||
                    (s.name && s.name.toLowerCase().includes(lowerVal))
                );
                setStudents(filtered);
            }
            return;
        }

        if (selectedProgram) {
            if (!value || value.trim().length === 0) {
                setStudents(studentsInProgram);
            } else {
                const lowerVal = value.toLowerCase();
                const filtered = studentsInProgram.filter(s => 
                    (s.student_name && s.student_name.toLowerCase().includes(lowerVal)) ||
                    (s.name && s.name.toLowerCase().includes(lowerVal))
                );
                setStudents(filtered);
            }
            return;
        }

        if (!value || value.trim().length < 2) {
            setStudents([]);
            return;
        }

        setSearching(true);
        try {
            let additionalFilters = [];
            if (selectedBoard) {
                const validPrograms = programs.filter(p => {
                    const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
                    const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
                    return pBoard === fBoard;
                }).map(p => p.name);
                if (validPrograms.length > 0) {
                    additionalFilters.push(["program", "in", validPrograms]);
                }
            }
            
            const filters = [
                ["student_name", "like", `%${value}%`],
                ...additionalFilters
            ];
            const res = await API.get(
                `/api/resource/Student?filters=${JSON.stringify(filters)}&fields=["name","student_name","first_name","middle_name","last_name","gender","date_of_birth","program","roll_number","gr_number"]&limit_page_length=20`
            );
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Student search failed:", err);
        } finally {
            setSearching(false);
        }
    };

    // Auto-fill values and configure pronouns when a student is selected
    const handleStudentSelect = (studentId) => {
        const student = students.find(s => s.name === studentId);
        if (!student) return;

        const fullName = student.student_name || `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim();
        const grNo = student.gr_number || '';
        const rollNo = student.roll_number || '';
        
        // Extract a clean class/standard name if possible
        const std = student.program || '';

        // Format Date of Birth
        let dob = '';
        if (student.date_of_birth) {
            dob = dayjs(student.date_of_birth).format('DD/MM/YYYY');
        }

        // Determine default pronouns based on ERPNext gender field
        let prefix = 'Student';
        let heShe = 'They';
        let hisHer = 'Their';
        let himHer = 'them';
        let relation = 'child of';

        if (student.gender?.toLowerCase() === 'male') {
            prefix = 'Master';
            heShe = 'He';
            hisHer = 'His';
            himHer = 'him';
            relation = 'son of';
        } else if (student.gender?.toLowerCase() === 'female') {
            prefix = 'Miss';
            heShe = 'She';
            hisHer = 'Her';
            himHer = 'her';
            relation = 'daughter of';
        }

        const updatedFields = {
            studentName: fullName,
            studentId: student.name,
            grNo,
            rollNo,
            std,
            gender: student.gender || '',
            dateOfBirth: dob,
            prefix,
            heShe,
            hisHer,
            himHer,
            relation
        };

        form.setFieldsValue(updatedFields);
        
        setPreviewData(prev => ({
            ...prev,
            ...updatedFields,
            studentName: fullName,
            grNo,
            rollNo,
            std,
            gender: student.gender || '',
            dob
        }));
    };

    // Update preview data as form inputs change
    const handleFormValuesChange = (changedValues, allValues) => {
        setPreviewData(prev => {
            const next = { ...prev, ...allValues };
            
            // Format dates for display
            if (allValues.date) {
                next.date = dayjs(allValues.date).format('DD/MM/YYYY');
            }
            if (allValues.dateOfBirth) {
                // If it is a dayjs object
                if (dayjs.isDayjs(allValues.dateOfBirth)) {
                    next.dob = allValues.dateOfBirth.format('DD/MM/YYYY');
                } else {
                    next.dob = allValues.dateOfBirth;
                }
            }
            return next;
        });
    };

    // Save record to Firebase Firestore
    const saveCertificateRecord = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student first.' });
            return null;
        }

        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, RECORDS_PATH), {
                certificateNo: values.certificateNo || certificateNo,
                date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                studentName: values.studentName,
                studentId: values.studentId || '',
                grNo: values.grNo || '',
                rollNo: values.rollNo || '',
                std: values.std || '',
                caste: values.caste || '',
                subCaste: values.subCaste || ' - ',
                gender: values.gender || '',
                academicYear: values.academicYear || '',
                type: 'Bonafide',
                principalName: values.principalName || 'Neeraj Kaushesh',
                prefix: values.prefix || '',
                heShe: values.heShe || '',
                hisHer: values.hisHer || '',
                himHer: values.himHer || '',
                relation: values.relation || '',
                created_at: serverTimestamp()
            });

            notification.success({ 
                message: 'Certificate Saved', 
                description: `Bonafide Certificate No. ${values.certificateNo || certificateNo} has been logged in history.` 
            });

            // Increment local certificate counter for next issue
            const nextNo = parseInt(values.certificateNo || certificateNo, 10) + 1;
            if (!isNaN(nextNo)) {
                setCertificateNo(String(nextNo));
                form.setFieldsValue({ certificateNo: String(nextNo) });
            }

            return docRef.id;
        } catch (error) {
            console.error("Error saving certificate record:", error);
            notification.error({ 
                message: 'Save Failed', 
                description: 'Could not store the certificate log in Firestore.' 
            });
            return null;
        } finally {
            setSaving(false);
        }
    };

    // Trigger landscape A4 browser print dialog
    const handlePrint = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before printing.' });
            return;
        }

        // Save to Firebase first
        await saveCertificateRecord();

        // Print using window.print()
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Download high-fidelity PDF with html2pdf.js
    const handleDownloadPDF = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before downloading.' });
            return;
        }

        // Save to Firebase first
        await saveCertificateRecord();

        const element = document.getElementById('certificate-print-area');
        const opt = {
            margin: 0,
            filename: `Bonafide_${values.studentName.replace(/\s+/g, '_')}_No_${values.certificateNo || certificateNo}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                letterRendering: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Execute download
        html2pdf().from(element).set(opt).save();
    };

    const handleOpenPreview = () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before previewing.' });
            return;
        }
        setPreviewModalVisible(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-48">
            {/* Header / Back */}
            <div className="flex justify-between items-center mb-6 no-print">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/certificates/dashboard')}
                    className="border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-700 font-semibold"
                >
                    Back to Overview
                </Button>
                <h3 className="text-xl font-extrabold text-gray-900 m-0">Issue Bonafide Certificate</h3>
            </div>

            <div className="max-w-3xl mx-auto no-print">
                <Card title={<span className="font-bold text-gray-800">Certificate Parameters</span>} className="shadow-sm border-gray-100">
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            certificateNo: certificateNo,
                            date: dayjs(),
                            academicYear: `${dayjs().year()}-${dayjs().year() + 1}`,
                            principalName: 'Neeraj Kaushesh',
                            subCaste: ' - ',
                            prefix: 'Master',
                            heShe: 'He',
                            hisHer: 'His',
                            himHer: 'him',
                            relation: 'son of',
                            program: '',
                            studentGroup: '',
                            rollNo: ''
                        }}
                        onValuesChange={handleFormValuesChange}
                    >
                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">1. Student Lookup</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={8}>
                                <Form.Item label="Board" name="board">
                                    <Select 
                                        placeholder="Select Board" 
                                        showSearch
                                        allowClear
                                        onChange={handleBoardChange}
                                        disabled={loadingMasters}
                                    >
                                        {boards.map(b => (
                                            <Select.Option key={b.name} value={b.name}>{b.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Program (Class)" name="program">
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Select program..."
                                        onChange={handleProgramChange}
                                        disabled={loadingMasters}
                                        optionFilterProp="children"
                                    >
                                        {filteredPrograms.map(p => (
                                            <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Student Group" name="studentGroup">
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Select student group..."
                                        onChange={handleGroupChange}
                                        disabled={loadingMasters}
                                        optionFilterProp="children"
                                    >
                                        {filteredGroups.map(g => (
                                            <Select.Option key={g.name} value={g.name}>{g.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item 
                            label="Search ERPNext Student" 
                            name="studentSearch"
                            help={
                                selectedGroup 
                                    ? "Filter students in the selected group or type to search" 
                                    : (selectedProgram 
                                        ? "Filter students in the selected program or type to search" 
                                        : "Type student name to search")
                            }
                            className="mt-2"
                        >
                            <Select
                                showSearch
                                placeholder={
                                    selectedGroup 
                                        ? "Select a student from group..." 
                                        : (selectedProgram 
                                            ? "Select a student from program..." 
                                            : "Search by student name...")
                                }
                                defaultActiveFirstOption={false}
                                filterOption={false}
                                onSearch={handleStudentSearch}
                                onChange={handleStudentSelect}
                                onFocus={handleStudentSelectFocus}
                                notFoundContent={loadingGroupStudents || loadingProgramStudents || searching ? <Spin size="small" /> : null}
                                suffixIcon={<SearchOutlined />}
                                className="w-full"
                            >
                                {students.map(s => (
                                    <Select.Option key={s.name} value={s.name}>
                                        {s.student_name} ({s.name}) - Roll {s.roll_number || 'N/A'}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Hidden studentId field */}
                        <Form.Item name="studentId" noStyle><Input type="hidden" /></Form.Item>
                        <Form.Item name="gender" noStyle><Input type="hidden" /></Form.Item>

                        <Form.Item 
                            label="Student Full Name" 
                            name="studentName" 
                            rules={[{ required: true, message: 'Student name is required' }]}
                        >
                            <Input placeholder="Autofilled or enter manually" />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="G.R. No (Admission No)" name="grNo">
                                    <Input placeholder="Enter GR Number" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Roll No" name="rollNo">
                                    <Input placeholder="Enter Roll Number" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Std (Class)" name="std">
                                    <Input placeholder="e.g. Std. 1" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">2. Certificate Log Details</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={12}>
                                <Form.Item label="Certificate No" name="certificateNo" rules={[{ required: true }]}>
                                    <Input placeholder="Auto-incremented" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Date of Issue" name="date" rules={[{ required: true }]}>
                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Academic Year" name="academicYear">
                                    <Input placeholder="e.g. 2026-2027" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Date of Birth" name="dateOfBirth">
                                    <Input placeholder="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Caste" name="caste">
                                    <Input placeholder="e.g. DIWAN" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Sub Caste" name="subCaste">
                                    <Input placeholder="e.g. Sunni" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Principal Name" name="principalName">
                            <Input placeholder="e.g. Neeraj Kaushesh" />
                        </Form.Item>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">3. Pronoun Adjustments (Overrides)</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={8}>
                                <Form.Item label="Prefix" name="prefix">
                                    <Select>
                                        <Select.Option value="Master">Master</Select.Option>
                                        <Select.Option value="Miss">Miss</Select.Option>
                                        <Select.Option value="Student">Student</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="He/She" name="heShe">
                                    <Select>
                                        <Select.Option value="He">He</Select.Option>
                                        <Select.Option value="She">She</Select.Option>
                                        <Select.Option value="They">They</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="His/Her" name="hisHer">
                                    <Select>
                                        <Select.Option value="His">His</Select.Option>
                                        <Select.Option value="Her">Her</Select.Option>
                                        <Select.Option value="Their">Their</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Relation (son/daughter of)" name="relation">
                                    <Select>
                                        <Select.Option value="son of">son of</Select.Option>
                                        <Select.Option value="daughter of">daughter of</Select.Option>
                                        <Select.Option value="child of">child of</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="him/her" name="himHer">
                                    <Select>
                                        <Select.Option value="him">him</Select.Option>
                                        <Select.Option value="her">her</Select.Option>
                                        <Select.Option value="them">them</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="flex gap-3 justify-end mt-4">
                            <Button 
                                type="default" 
                                icon={<EyeOutlined />} 
                                onClick={handleOpenPreview}
                                className="border-red-700 text-red-700 hover:text-red-800 hover:border-red-800 font-semibold"
                            >
                                Preview Certificate
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<SaveOutlined />} 
                                loading={saving} 
                                onClick={saveCertificateRecord}
                                className="bg-indigo-600 hover:bg-indigo-700 border-none font-semibold text-white"
                            >
                                Save Only
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* Preview Modal */}
            <Modal
                title={<span className="font-extrabold text-gray-800">Certificate Preview</span>}
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPreviewModalVisible(false)}>
                        Close
                    </Button>,
                    <Button 
                        key="print" 
                        icon={<PrinterOutlined />} 
                        onClick={handlePrint}
                        className="border-red-700 text-red-700 hover:text-white hover:bg-red-700 font-semibold"
                    >
                        Print Certificate
                    </Button>,
                    <Button 
                        key="download" 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadPDF}
                        className="bg-red-700 hover:bg-red-800 border-none font-semibold text-white"
                    >
                        Download PDF
                    </Button>
                ]}
                width={950}
                centered
                destroyOnHidden
                className="no-print"
            >
                <div className="w-full overflow-x-auto bg-gray-100 p-6 rounded border border-gray-200 flex justify-center">
                    <div 
                        id="certificate-print-area"
                        ref={certificateRef}
                        className="bg-white shadow-md text-black"
                        style={{
                            width: '210mm',
                            height: '297mm',
                            padding: '8mm',
                            boxSizing: 'border-box',
                            position: 'relative',
                            fontFamily: '"Times New Roman", Times, serif',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '6px double #000000',
                                padding: '16mm 14mm',
                                boxSizing: 'border-box',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Header Section */}
                            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '10px', width: '100%' }}>
                                <img src={schoolHeader} alt="School Header" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                            </div>

                            {/* Divider Line */}
                            <div style={{ borderTop: '1.5px solid #000000', marginTop: '5px', marginBottom: '15px', width: '100%' }} />

                            {/* Title */}
                            <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
                                <span style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold', 
                                    textDecoration: 'underline', 
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif'
                                }}>
                                    Bonafide Certificate
                                </span>
                            </div>

                            {/* Metadata Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        Certificate No. &nbsp; <strong>{previewData.certificateNo || '______'}</strong>
                                    </div>
                                    <div>
                                        Date : &nbsp; <strong>{previewData.date}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        Std. &nbsp; <strong>{previewData.std || '______'}</strong>
                                        {previewData.rollNo && (
                                            <>
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Roll No. &nbsp; <strong>{previewData.rollNo}</strong>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        Gr.No. &nbsp; <strong>{previewData.grNo || '______'}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Paragraph Content */}
                            <div 
                                style={{ 
                                    fontSize: '18.5px', 
                                    textAlign: 'justify', 
                                    lineHeight: '2.2',
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    marginTop: '30px'
                                }}
                            >
                                This is to certify that {previewData.prefix ? previewData.prefix + ' ' : ''}<strong style={{ textTransform: 'uppercase', fontSize: '20px' }}>{previewData.studentName || '________________________________'}</strong> is a Bonafide student of this School. {previewData.heShe} {previewData.heShe?.toLowerCase() === 'they' ? 'bear' : 'bears'} a good moral character.
                                <br />
                                {previewData.hisHer} Birth Date : <strong>{previewData.dob || 'DD/MM/YYYY'}</strong> &nbsp;&nbsp; {previewData.hisHer?.toLowerCase()} caste : <strong>{previewData.caste || '_________'}</strong> & Sub Caste : <strong>{previewData.subCaste?.trim() || '-'}</strong>.
                            </div>

                            {/* Principal Signature Space */}
                            <div style={{ position: 'absolute', bottom: '16mm', left: '14mm', fontSize: '16px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                <strong>{previewData.principalName}</strong>
                                <div style={{ marginTop: '2px' }}>Principal</div>
                                <div style={{ fontSize: '14px', marginTop: '1px' }}>Shree Saraswati Vidhyalay</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Custom CSS specifically for window.print() style targets */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
                @media print {
                    /* Hide everything except certificate print area */
                    body * {
                        visibility: hidden;
                        background: none !important;
                    }
                    .no-print, .no-print * {
                        display: none !important;
                        height: 0 !important;
                        width: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #certificate-print-area, #certificate-print-area * {
                        visibility: visible !important;
                    }
                    #certificate-print-area {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        padding: 8mm !important;
                        background: #ffffff !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    #certificate-print-area > div {
                        width: 100% !important;
                        height: 100% !important;
                        border: 6px double #000000 !important;
                        padding: 16mm 14mm !important;
                        box-sizing: border-box !important;
                    }
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                }
                `
            }} />
        </div>
    );
}
