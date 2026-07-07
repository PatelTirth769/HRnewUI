import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { 
    Card, Col, Row, Button, Select, Input, DatePicker, notification, Spin, Divider, Typography, Form, Modal, AutoComplete
} from 'antd';
import { 
    PrinterOutlined, DownloadOutlined, ArrowLeftOutlined, SearchOutlined, SaveOutlined, EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import ssvLogo from '../../assets/images/SSVLOGO.png';

const { Title, Text } = Typography;
const RECORDS_PATH = 'schooler_system/certificates/records';

// Helper utilities for number to words conversion
const convertNumberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const helper = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + helper(n % 100) : '');
        if (n < 1000000) return helper(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
        return '';
    };
    return helper(num);
};

const parseDateString = (str) => {
    if (!str) return null;
    // Handle DD/MM/YYYY explicitly
    const parts = str.split('/');
    if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed month
        const y = parseInt(parts[2], 10);
        const parsed = dayjs(new Date(y, m, d));
        if (parsed.isValid()) return parsed;
    }
    // Fallback to standard dayjs parse
    return dayjs(str);
};

const convertDateToWords = (dateString) => {
    if (!dateString) return '';
    const parsed = parseDateString(dateString);
    if (!parsed || !parsed.isValid()) return '';
    
    const dayWords = [
        '', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH',
        'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH', 'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH',
        'TWENTY FIRST', 'TWENTY SECOND', 'TWENTY THIRD', 'TWENTY FOURTH', 'TWENTY FIFTH', 'TWENTY SIXTH', 'TWENTY SEVENTH', 'TWENTY EIGHTH', 'TWENTY NINTH', 'THIRTIETH',
        'THIRTY FIRST'
    ];
    
    const day = parsed.date();
    const month = parsed.format('MMMM').toUpperCase();
    const year = parsed.year();
    
    const dayText = dayWords[day] || '';
    const yearText = convertNumberToWords(year);
    
    return `${dayText} ${month} ${yearText}`;
};

export default function TransferCertificate() {
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

    // Initial default preview values
    const [previewData, setPreviewData] = useState({
        tcNo: '',
        grNo: '',
        date: dayjs().format('DD/MM/YYYY'),
        studentName: '',
        motherName: '',
        fatherName: '',
        nationality: 'INDIAN',
        religionCaste: '',
        isScSt: 'NO',
        dateOfBirth: '',
        dateOfBirthWords: '',
        birthProof: 'BIRTH CERTIFICATE',
        birthPlace: '',
        admissionClass: '',
        classLastStudied: '',
        lastExamResult: 'CBSE',
        isFailed: 'NO',
        subjects: 'COMPUTER, ENGLISH, EVS, GENERAL KNOWLEDGE, GUJARATI, HEALTH AND PHYSICAL EDUCATION, HINDI, MATHEMATICS',
        promotedClass: '',
        schoolDuesPaid: `MARCH-${dayjs().year()}`,
        workingDays: '220',
        presentDays: '200',
        gamesCoCurricular: 'NA',
        conduct: 'VERY GOOD',
        applDate: dayjs().format('DD/MM/YYYY'),
        struckOffDate: dayjs().format('DD/MM/YYYY'),
        leavingReason: 'TRANSFER',
        uidNo: '',
        penNo: '',
        apaarId: ''
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
        const getNextCertNo = async () => {
            try {
                const recordsRef = collection(db, RECORDS_PATH);
                const q = query(recordsRef, where('type', '==', 'Transfer'), orderBy('created_at', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const lastDoc = snapshot.docs[0].data();
                    const lastNo = parseInt(lastDoc.certificateNo, 10);
                    if (!isNaN(lastNo)) {
                        setCertificateNo(String(lastNo + 1));
                        form.setFieldsValue({ certificateNo: String(lastNo + 1) });
                        setPreviewData(prev => ({ ...prev, tcNo: String(lastNo + 1) }));
                    } else {
                        setCertificateNo('1');
                        form.setFieldsValue({ certificateNo: '1' });
                        setPreviewData(prev => ({ ...prev, tcNo: '1' }));
                    }
                } else {
                    setCertificateNo('1');
                    form.setFieldsValue({ certificateNo: '1' });
                    setPreviewData(prev => ({ ...prev, tcNo: '1' }));
                }
            } catch (err) {
                console.error("Error generating next certificate no:", err);
                setCertificateNo('1');
                form.setFieldsValue({ certificateNo: '1' });
                setPreviewData(prev => ({ ...prev, tcNo: '1' }));
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
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number", "nationality", "joining_date"]);
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
        form.setFieldsValue({ board: value, program: undefined, studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '', motherName: '', fatherName: '' });
        setStudentsInProgram([]);
        setStudentsInGroup([]);
        setStudents([]);
    };

    // Filter student groups when program changes
    const handleProgramChange = (value) => {
        setSelectedProgram(value);
        if (value) {
            setFilteredGroups(allStudentGroups.filter(g => g.program === value));
            form.setFieldsValue({ classLastStudied: value, program: value });
            setPreviewData(prev => ({ ...prev, classLastStudied: value }));
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
        form.setFieldsValue({ studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '', motherName: '', fatherName: '' });
        setStudentsInGroup([]);
    };

    // Load group members and their full profiles when a student group is selected
    const handleGroupChange = async (value) => {
        setSelectedGroup(value);
        form.setFieldsValue({ studentSearch: undefined, studentName: '', grNo: '', rollNo: '', motherName: '', fatherName: '' });
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
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number", "nationality", "joining_date"]);
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

    // Handle student search
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
                `/api/resource/Student?filters=${JSON.stringify(filters)}&fields=["name","student_name","first_name","middle_name","last_name","gender","date_of_birth","program","roll_number","gr_number","nationality","joining_date"]&limit_page_length=20`
            );
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Student search failed:", err);
        } finally {
            setSearching(false);
        }
    };

    // Auto-fill values when student is selected
    const handleStudentSelect = async (studentId) => {
        const student = students.find(s => s.name === studentId);
        if (!student) return;

        const fullName = student.student_name || `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim();
        const grNo = student.gr_number || '';
        const rollNo = student.roll_number || '';
        const std = student.program || '';
        const nationality = student.nationality || 'INDIAN';
        const dateOfBirth = student.date_of_birth ? dayjs(student.date_of_birth).format('DD/MM/YYYY') : '';
        const dateOfBirthWords = dateOfBirth ? convertDateToWords(dateOfBirth) : '';

        let fatherName = '';
        let motherName = '';

        if (student.middle_name) {
            fatherName = student.middle_name.trim();
        } else if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length > 2) {
                fatherName = parts.slice(1, parts.length - 1).join(' ').trim();
            }
        }

        const admissionClass = student.joining_date 
            ? `${dayjs(student.joining_date).format('DD/MM/YYYY')} CLASS : ${std}` 
            : `CLASS : ${std}`;

        const updatedFields = {
            studentName: fullName,
            studentId: student.name,
            grNo,
            rollNo,
            std,
            nationality,
            dateOfBirth,
            dateOfBirthWords,
            admissionClass,
            classLastStudied: std,
            fatherName,
            motherName,
            religionCaste: '',
            isScSt: 'NO',
            birthProof: 'BIRTH CERTIFICATE',
            birthPlace: '',
            lastExamResult: 'CBSE',
            isFailed: 'NO',
            subjects: 'COMPUTER, ENGLISH, EVS, GENERAL KNOWLEDGE, GUJARATI, HEALTH AND PHYSICAL EDUCATION, HINDI, MATHEMATICS',
            promotedClass: `YES, GRADE - ${std}`,
            schoolDuesPaid: `MARCH-${dayjs().year()}`,
            workingDays: '',
            presentDays: '',
            gamesCoCurricular: 'NA',
            conduct: 'VERY GOOD',
            applDate: dayjs(),
            struckOffDate: dayjs(),
            leavingReason: 'TRANSFER',
            uidNo: student.student_aadhar_number || '',
            penNo: student.pen_number || '',
            apaarId: student.abha_number || ''
        };

        form.setFieldsValue(updatedFields);
        
        setPreviewData(prev => ({
            ...prev,
            ...updatedFields,
            date: prev.date,
            tcNo: prev.tcNo,
            applDate: dayjs().format('DD/MM/YYYY'),
            struckOffDate: dayjs().format('DD/MM/YYYY')
        }));

        // Fetch detailed record for parents name
        try {
            const res = await API.get(`/api/resource/Student/${encodeURIComponent(studentId)}`);
            const fullStudent = res.data?.data;
            if (fullStudent) {
                let fetchedFatherName = fatherName;
                let fetchedMotherName = motherName;

                if (fullStudent.guardians && fullStudent.guardians.length > 0) {
                    const fatherGuardian = fullStudent.guardians.find(g => g.relation?.toLowerCase() === 'father');
                    if (fatherGuardian && fatherGuardian.guardian_name) {
                        fetchedFatherName = fatherGuardian.guardian_name.trim();
                    }
                    const motherGuardian = fullStudent.guardians.find(g => g.relation?.toLowerCase() === 'mother');
                    if (motherGuardian && motherGuardian.guardian_name) {
                        fetchedMotherName = motherGuardian.guardian_name.trim();
                    }
                }

                const extraFields = {
                    fatherName: fetchedFatherName,
                    motherName: fetchedMotherName,
                    uidNo: fullStudent.student_aadhar_number || fullStudent.aadhar_number || updatedFields.uidNo,
                    penNo: fullStudent.pen_number || fullStudent.pen || updatedFields.penNo,
                    apaarId: fullStudent.abha_number || fullStudent.abha || updatedFields.apaarId
                };

                form.setFieldsValue(extraFields);
                setPreviewData(prev => ({
                    ...prev,
                    ...extraFields
                }));
            }
        } catch (err) {
            console.error("Failed to fetch detailed student profile:", err);
        }

        // Fetch Attendance for working days
        try {
            const attRes = await API.get(`/api/resource/Student Attendance?filters=[["student","=","${encodeURIComponent(studentId)}"]]&fields=["status"]&limit_page_length=9999`);
            const attendanceRecords = attRes.data?.data || [];
            let totalWorking = '0';
            let totalPresent = '0';
            
            if (attendanceRecords.length > 0) {
                totalWorking = attendanceRecords.length.toString();
                totalPresent = attendanceRecords.filter(r => r.status === 'Present').length.toString();
            }

            const attendanceFields = {
                workingDays: totalWorking,
                presentDays: totalPresent
            };

            form.setFieldsValue(attendanceFields);
            setPreviewData(prev => ({
                ...prev,
                ...attendanceFields
            }));
        } catch (err) {
            console.error('Failed to fetch attendance for transfer certificate:', err);
        }
    };

    // Update preview data as form inputs change
    const handleFormValuesChange = (changedValues, allValues) => {
        setPreviewData(prev => {
            const next = { ...prev, ...allValues };
            
            // Format dates
            if (allValues.date) {
                next.date = dayjs(allValues.date).format('DD/MM/YYYY');
            }
            if (allValues.applDate) {
                next.applDate = dayjs(allValues.applDate).format('DD/MM/YYYY');
            }
            if (allValues.struckOffDate) {
                next.struckOffDate = dayjs(allValues.struckOffDate).format('DD/MM/YYYY');
            }
            if (allValues.dateOfBirth) {
                const words = convertDateToWords(allValues.dateOfBirth);
                if (words) {
                    next.dateOfBirthWords = words;
                    form.setFieldsValue({ dateOfBirthWords: words });
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
                motherName: values.motherName || '',
                fatherName: values.fatherName || '',
                nationality: values.nationality || 'INDIAN',
                religionCaste: values.religionCaste || '',
                isScSt: values.isScSt || 'NO',
                dateOfBirth: values.dateOfBirth || '',
                dateOfBirthWords: values.dateOfBirthWords || '',
                birthProof: values.birthProof || 'BIRTH CERTIFICATE',
                birthPlace: values.birthPlace || '',
                admissionClass: values.admissionClass || '',
                classLastStudied: values.classLastStudied || '',
                lastExamResult: values.lastExamResult || 'CBSE',
                isFailed: values.isFailed || 'NO',
                subjects: values.subjects || '',
                promotedClass: values.promotedClass || '',
                schoolDuesPaid: values.schoolDuesPaid || '',
                workingDays: values.workingDays || '',
                presentDays: values.presentDays || '',
                gamesCoCurricular: values.gamesCoCurricular || 'NA',
                conduct: values.conduct || 'VERY GOOD',
                applDate: values.applDate ? dayjs(values.applDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                struckOffDate: values.struckOffDate ? dayjs(values.struckOffDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                leavingReason: values.leavingReason || 'TRANSFER',
                uidNo: values.uidNo || '',
                penNo: values.penNo || '',
                apaarId: values.apaarId || '',
                type: 'Transfer',
                created_at: serverTimestamp()
            });

            notification.success({ 
                message: 'Certificate Saved', 
                description: `Transfer Certificate No. ${values.certificateNo || certificateNo} has been logged in history.` 
            });

            // Increment local certificate counter
            const nextNo = parseInt(values.certificateNo || certificateNo, 10) + 1;
            if (!isNaN(nextNo)) {
                setCertificateNo(String(nextNo));
                form.setFieldsValue({ certificateNo: String(nextNo) });
                setPreviewData(prev => ({ ...prev, tcNo: String(nextNo) }));
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

    // Print
    const handlePrint = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before printing.' });
            return;
        }

        await saveCertificateRecord();

        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Download PDF
    const handleDownloadPDF = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before downloading.' });
            return;
        }

        await saveCertificateRecord();

        const element = document.getElementById('certificate-print-area');
        const opt = {
            margin: 0,
            filename: `Transfer_${values.studentName.replace(/\s+/g, '_')}_No_${values.certificateNo || certificateNo}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                letterRendering: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

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
                <h3 className="text-xl font-extrabold text-gray-900 m-0">Issue Transfer Certificate</h3>
            </div>

            <div className="max-w-3xl mx-auto no-print">
                <Card title={<span className="font-bold text-gray-800">Certificate Parameters (Transfer)</span>} className="shadow-sm border-gray-100">
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            certificateNo: certificateNo,
                            date: dayjs(),
                            nationality: 'INDIAN',
                            isScSt: 'NO',
                            birthProof: 'BIRTH CERTIFICATE',
                            lastExamResult: 'CBSE',
                            isFailed: 'NO',
                            subjects: 'COMPUTER, ENGLISH, EVS, GENERAL KNOWLEDGE, GUJARATI, HEALTH AND PHYSICAL EDUCATION, HINDI, MATHEMATICS',
                            schoolDuesPaid: `MARCH-${dayjs().year()}`,
                            workingDays: '220',
                            presentDays: '200',
                            gamesCoCurricular: 'NA',
                            conduct: 'VERY GOOD',
                            applDate: dayjs(),
                            struckOffDate: dayjs(),
                            leavingReason: 'TRANSFER'
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
                            label="Search Student" 
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
                                        ? "Select student from group..." 
                                        : (selectedProgram 
                                            ? "Select student from program..." 
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

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">2. Student Details</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={12}>
                                <Form.Item 
                                    label="Student Full Name (Name of Pupil)" 
                                    name="studentName" 
                                    rules={[{ required: true, message: 'Student name is required' }]}
                                >
                                    <Input placeholder="Enter student name" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="G.R. No (Gr No)" name="grNo">
                                    <Input placeholder="Enter GR Number" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Mother's Name" name="motherName" rules={[{ required: true, message: 'Mother name is required' }]}>
                                    <Input placeholder="Enter Mother's Name" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Father's/Guardian's Name" name="fatherName" rules={[{ required: true, message: 'Father name is required' }]}>
                                    <Input placeholder="Enter Father's Name" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Nationality" name="nationality">
                                    <Input placeholder="e.g. INDIAN" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Religion, Caste & Sub-Caste" name="religionCaste">
                                    <Input placeholder="e.g. HINDU,PATEL" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Whether SC/ST (YES/NO)" name="isScSt">
                                    <Select>
                                        <Select.Option value="NO">NO</Select.Option>
                                        <Select.Option value="YES">YES</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Date of Birth (DD/MM/YYYY)" name="dateOfBirth" rules={[{ required: true, message: 'Date of birth is required' }]}>
                                    <Input placeholder="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={16}>
                                <Form.Item label="Date of Birth in Words (Auto-generated)" name="dateOfBirthWords">
                                    <Input placeholder="Will auto-fill from DOB or enter manually" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Proof of DOB Submitted" name="birthProof">
                                    <Input placeholder="e.g. BIRTH CERTIFICATE" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Place of Birth" name="birthPlace">
                                    <Input placeholder="Enter place of birth" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">3. Academic History & Leaving Details</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={12}>
                                <Form.Item label="Date of Admission & Class" name="admissionClass">
                                    <Input placeholder="e.g. 01/04/2025 CLASS :1" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Class in which pupil last studied" name="classLastStudied">
                                    <Input placeholder="e.g. GRADE I" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="School/Board Annual Exam Taken with Result" name="lastExamResult">
                                    <Input placeholder="e.g. CBSE" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Whether failed in same class (YES/NO)" name="isFailed">
                                    <Input placeholder="e.g. NO" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Subjects Studies" name="subjects">
                            <Input.TextArea placeholder="Enter subjects separated by comma" rows={2} />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Qualified for Promotion (Class in figures & words)" name="promotedClass">
                                    <Input placeholder="e.g. YES, GRADE - II SECOND" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Month upto which school dues paid" name="schoolDuesPaid">
                                    <Input placeholder="e.g. MARCH-2026" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Total Working Days" name="workingDays">
                                    <Input placeholder="e.g. 224" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Total Working Days Present" name="presentDays">
                                    <Input placeholder="e.g. 209" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Games/Co-curricular activities" name="gamesCoCurricular">
                                    <Input placeholder="e.g. NA" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="General Conduct" name="conduct">
                                    <Input placeholder="e.g. VERY GOOD" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Reason for leaving school" name="leavingReason">
                                    <Input placeholder="e.g. TRANSFER" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Date of Application" name="applDate">
                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Date of Struck off from rolls" name="struckOffDate">
                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="UID No" name="uidNo">
                                    <Input placeholder="18-digit UID No" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Personal Education Number (PEN)" name="penNo">
                                    <Input placeholder="Enter PEN No" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="APAAR ID" name="apaarId">
                                    <Input placeholder="Enter APAAR ID" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">4. Certificate Details</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={12}>
                                <Form.Item label="Certificate No (TC. No)" name="certificateNo" rules={[{ required: true }]}>
                                    <Input placeholder="Auto-incremented" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Date of Issue" name="date" rules={[{ required: true }]}>
                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
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
                title={<span className="font-extrabold text-gray-800">Certificate Preview (Transfer)</span>}
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
                            fontFamily: 'Arial, sans-serif',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '6px double #000000',
                                padding: '6mm 6mm',
                                boxSizing: 'border-box',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Header Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #7c1a2e 0%, #a21a1a 50%, #e25814 100%)',
                                padding: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: '#ffffff',
                                fontFamily: 'Arial, sans-serif',
                                borderRadius: '3px',
                                marginBottom: '10px',
                                WebkitPrintColorAdjust: 'exact',
                                printColorAdjust: 'exact'
                            }}>
                                {/* Left Logo */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '75px', textAlign: 'center' }}>
                                    <img src={ssvLogo} style={{ width: '48px', height: '50px', objectFit: 'contain' }} alt="Logo" />
                                    <span style={{ fontSize: '6px', marginTop: '3px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>Managed by : AGTVS Trust</span>
                                </div>
                                
                                {/* Center Text */}
                                <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                                    <div style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '0.3px', color: '#ffffff' }}>SHREE SARASWATI VIDHYALAY</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', marginTop: '1px' }}>
                                        <span style={{ fontWeight: '800', color: '#ffffff' }}>[ SSV CAMPUS ]</span>
                                        <span style={{ marginLeft: '6px', fontStyle: 'italic', fontWeight: '500', color: '#ffffff' }}>Nurturing Mind, Shaping Future...</span>
                                    </div>
                                    <div style={{ fontSize: '8.5px', marginTop: '3px', opacity: 0.95, color: '#ffffff' }}>Affiliated to Central Board of Secondary Education, New Delhi.</div>
                                    <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginTop: '1px', color: '#ffffff' }}>School Code : 11737 &nbsp;&nbsp; Affiliation No.: 430601</div>
                                </div>
                                
                                {/* Right Seal */}
                                <div style={{ width: '75px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '1.5px dashed #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', textAlign: 'center', color: '#ffffff', lineHeight: '1.1' }}>SSV<br/>CAMPUS<br/>SEAL</span>
                                    </div>
                                </div>
                            </div>

                             {/* Certificate Title */}
                             <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                 <span style={{
                                     fontSize: '15px', 
                                     fontWeight: 'bold', 
                                     border: '2px solid #000000', 
                                     borderRadius: '10px', 
                                     padding: '4px 20px 12px 20px', 
                                     display: 'inline-block',
                                     textAlign: 'center',
                                     fontFamily: 'Arial, sans-serif',
                                     letterSpacing: '0.8px',
                                     boxSizing: 'border-box'
                                 }}>
                                     TRANSFER CERTIFICATE
                                 </span>
                             </div>

                             {/* Metadata row */}
                             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', padding: '0 4px', fontFamily: 'Arial, sans-serif' }}>
                                 <div>TC. No : <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '45px', lineHeight: '1.2' }}>{previewData.tcNo || '\u00A0'}</span></div>
                                 <div>Gr No : <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '45px', lineHeight: '1.2' }}>{previewData.grNo || '______'}</span></div>
                                 <div>Date: <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '70px', lineHeight: '1.2' }}>{previewData.date || '\u00A0'}</span></div>
                             </div>

                             {/* 27 Fields */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                 {(() => {
                                     const renderRow = (num, label, val) => (
                                         <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '11.5px', lineHeight: '1.2', fontFamily: 'Arial, sans-serif' }}>
                                             <div style={{ width: '310px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                 <span>{num}. {label}</span>
                                                 <span>:</span>
                                             </div>
                                             <div style={{ flexGrow: 1, borderBottom: '1px solid #000000', marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', textTransform: 'uppercase', paddingBottom: '3px' }}>
                                                 {val || '\u00A0'}
                                             </div>
                                         </div>
                                     );

                                     return (
                                         <>
                                             {renderRow('1', 'Name of Pupil', previewData.studentName)}
                                             {renderRow('2', "Mother's Name", previewData.motherName)}
                                             {renderRow('3', "Father's/Guardian's Name", previewData.fatherName)}
                                             {renderRow('4', 'Nationality', previewData.nationality)}
                                             {renderRow('5', 'Religion, Caste & Sub-Caste', previewData.religionCaste)}
                                             {renderRow('6', 'Whether the Candidate belongs to Scheduled Caste/Scheduled Tribe', previewData.isScSt)}
                                             
                                             {/* Row 7 */}
                                             <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11.5px', fontFamily: 'Arial, sans-serif' }}>
                                                 <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                     <div style={{ width: '310px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                         <span>7. Date of Birth (in Christian Era) according to Admission Register(in figures & words)</span>
                                                         <span>:</span>
                                                     </div>
                                                     <div style={{ flexGrow: 1, borderBottom: '1px solid #000000', marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', paddingBottom: '3px' }}>
                                                         {previewData.dateOfBirth || '\u00A0'}
                                                     </div>
                                                 </div>
                                                 <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                     <div style={{ width: '310px', flexShrink: 0 }}></div>
                                                     <div style={{ flexGrow: 1, borderBottom: '1px solid #000000', marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', textTransform: 'uppercase', paddingBottom: '3px' }}>
                                                         {previewData.dateOfBirthWords || '\u00A0'}
                                                     </div>
                                                 </div>
                                             </div>

                                             {renderRow('8', 'Proof of Date of Birth Submitted at the time of admission', previewData.birthProof)}
                                             {renderRow('9', 'Place of Birth', previewData.birthPlace)}
                                             {renderRow('10', 'Date of Admission in the School with Class', previewData.admissionClass)}
                                             {renderRow('11', 'Class in which the pupil last studied', previewData.classLastStudied)}
                                             {renderRow('12', "School/Board's Annual examination last taken with result", previewData.lastExamResult)}
                                             {renderRow('13', 'Whether failed, if so once/twice in the same class : ONCE/TWICE', previewData.isFailed)}
                                             
                                             {/* Row 14 */}
                                             <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: '11.5px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>
                                                 <div style={{ width: '310px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                     <span>14. Subjects Studies: All Compulsory Subjects,Third Language (if any)</span>
                                                     <span>:</span>
                                                 </div>
                                                 <div className="lined-value" style={{ flexGrow: 1, marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', textTransform: 'uppercase' }}>
                                                     {previewData.subjects}
                                                 </div>
                                             </div>

                                            {renderRow('15', 'Whether qualified for promotion to the higher class(in figures & words)', previewData.promotedClass)}
                                            {renderRow('16', 'Month upto which the pupil has paid school dues', previewData.schoolDuesPaid)}
                                            {renderRow('17', 'Total number of working days', previewData.workingDays)}
                                            {renderRow('18', 'Total number of working days present', previewData.presentDays)}
                                            {renderRow('19', 'Games played or Co-curricular activities in which the pupil usually took part', previewData.gamesCoCurricular)}
                                            {renderRow('20', 'General conduct', previewData.conduct)}
                                            {renderRow('21', 'Date of application for certificate', previewData.applDate)}
                                            {renderRow('22', "Date on which pupil's name was struck off the rolls of the school", previewData.struckOffDate)}
                                            {renderRow('23', 'Date of issue of certificate', previewData.date)}
                                            {renderRow('24', 'Reason for leaving the school', previewData.leavingReason)}
                                            {renderRow('25', 'UID No', previewData.uidNo)}
                                            {renderRow('26', 'Personal Education Number (PEN)', previewData.penNo)}
                                            {renderRow('27', 'APAAR ID', previewData.apaarId)}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Signatures & Footer */}
                            <div style={{ marginTop: 'auto', paddingTop: '20px', fontFamily: 'Arial, sans-serif' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginBottom: '15px', padding: '0 8px' }}>
                                    <span>Class Teacher</span>
                                    <span>Clerk</span>
                                    <span>Principal</span>
                                </div>
                                <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#333333', textAlign: 'left', paddingLeft: '4px' }}>
                                    Certified that the above information is in accordance with the school register.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Print styling block for window.print() */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
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
                        padding: 6mm 6mm !important;
                        box-sizing: border-box !important;
                    }
                     .lined-value {
                         line-height: 22px !important;
                         background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2222%22%3E%3Cline%20x1%3D%220%22%20y1%3D%2221%22%20x2%3D%22100%22%20y2%3D%2221%22%20stroke%3D%22black%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E") !important;
                         background-repeat: repeat !important;
                         display: inline-block !important;
                         width: 100% !important;
                         -webkit-print-color-adjust: exact !important;
                         print-color-adjust: exact !important;
                     }
                     @page {
                         size: portrait;
                         margin: 0;
                     }
                 }
                 .lined-value {
                     line-height: 22px;
                     background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2222%22%3E%3Cline%20x1%3D%220%22%20y1%3D%2221%22%20x2%3D%22100%22%20y2%3D%2221%22%20stroke%3D%22black%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E");
                     background-repeat: repeat;
                     display: inline-block;
                     width: 100%;
                 }
                `
            }} />
        </div>
    );
}
