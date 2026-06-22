import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
    Table, Button, Input, Card, Space, Tag, Popconfirm, Modal, notification, Spin, Empty, Typography 
} from 'antd';
import { 
    PrinterOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined, ArrowLeftOutlined, SearchOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import ssvLogo from '../../assets/images/SSVLOGO.png';
import schoolHeader from '../../assets/images/newheader.jpeg';

const { Title } = Typography;
const RECORDS_PATH = 'schooler_system/certificates/records';

export default function CertificateRecords() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const recordsRef = collection(db, RECORDS_PATH);
            const q = query(recordsRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    created_at: docData.created_at?.toDate ? docData.created_at.toDate() : new Date(docData.created_at || Date.now())
                };
            });
            setRecords(data);
        } catch (error) {
            console.error("Error loading certificate records:", error);
            notification.error({
                message: 'Error Loading History',
                description: 'Could not fetch records from Firestore.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // Local filtering for search responsiveness
    const filteredRecords = records.filter(r => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        return (
            (r.certificateNo || '').toLowerCase().includes(query) ||
            (r.studentName || '').toLowerCase().includes(query) ||
            (r.grNo || '').toLowerCase().includes(query) ||
            (r.std || '').toLowerCase().includes(query) ||
            (r.type || 'Bonafide').toLowerCase().includes(query)
        );
    });

    const handleDelete = async (recordId) => {
        try {
            await deleteDoc(doc(db, RECORDS_PATH, recordId));
            notification.success({
                message: 'Record Deleted',
                description: 'The certificate record was removed from logs.'
            });
            fetchRecords();
        } catch (error) {
            console.error("Error deleting certificate record:", error);
            notification.error({
                message: 'Delete Failed',
                description: 'Could not remove log from Firestore.'
            });
        }
    };

    // Pronoun lookup helper to ensure compatibility
    const getPronouns = (record) => {
        // Return saved values if they exist, otherwise compute based on gender
        const prefix = record.prefix || (record.gender?.toLowerCase() === 'female' ? 'Miss' : record.gender?.toLowerCase() === 'male' ? 'Master' : 'Student');
        const heShe = record.heShe || (record.gender?.toLowerCase() === 'female' ? 'She' : record.gender?.toLowerCase() === 'male' ? 'He' : 'They');
        const hisHer = record.hisHer || (record.gender?.toLowerCase() === 'female' ? 'Her' : record.gender?.toLowerCase() === 'male' ? 'His' : 'Their');
        const himHer = record.himHer || (record.gender?.toLowerCase() === 'female' ? 'her' : record.gender?.toLowerCase() === 'male' ? 'him' : 'them');
        const relation = record.relation || (record.gender?.toLowerCase() === 'female' ? 'daughter of' : record.gender?.toLowerCase() === 'male' ? 'son of' : 'child of');

        return { prefix, heShe, hisHer, himHer, relation };
    };

    // Modal print handler
    const handlePrintRecord = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Modal download PDF handler
    const handleDownloadPDF = () => {
        if (!selectedRecord) return;
        const element = document.getElementById('certificate-print-area');
        const typePrefix = selectedRecord.type === 'Trial' ? 'Trial' : (selectedRecord.type === 'Transfer' ? 'Transfer' : 'Bonafide');
        const opt = {
            margin: 0,
            filename: `${typePrefix}_${selectedRecord.studentName.replace(/\s+/g, '_')}_No_${selectedRecord.certificateNo}.pdf`,
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

    const columns = [
        {
            title: 'Cert No',
            dataIndex: 'certificateNo',
            key: 'certificateNo',
            render: (text) => <span className="font-bold text-gray-700">{text}</span>
        },
        {
            title: 'Student Name',
            dataIndex: 'studentName',
            key: 'studentName',
            render: (text) => <span className="font-semibold text-gray-900">{text}</span>
        },
        {
            title: 'GR No',
            dataIndex: 'grNo',
            key: 'grNo'
        },
        {
            title: 'Roll No',
            dataIndex: 'rollNo',
            key: 'rollNo',
            render: (text) => text || ' - '
        },
        {
            title: 'Standard',
            dataIndex: 'std',
            key: 'std'
        },
        {
            title: 'Issue Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => dayjs(text).format('DD MMM YYYY')
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (text) => {
                const type = text || 'Bonafide';
                const colorMap = {
                    'Bonafide': 'orange',
                    'Trial': 'cyan',
                    'Transfer': 'magenta',
                    'Domisile & Character': 'purple'
                };
                return <Tag color={colorMap[type] || 'blue'} className="rounded font-semibold">{type}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                            setSelectedRecord(record);
                            setViewModalVisible(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 border-none font-medium flex items-center"
                    >
                        View / Print
                    </Button>
                    <Popconfirm
                        title="Delete record?"
                        description="This removes the log from history permanently."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button 
                            danger
                            type="text"
                            icon={<DeleteOutlined />} 
                            size="small"
                            className="hover:bg-red-50"
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Compute preview parameters
    const pronouns = selectedRecord ? getPronouns(selectedRecord) : {};
    const displayDob = selectedRecord?.dateOfBirth || (selectedRecord?.date_of_birth ? dayjs(selectedRecord.date_of_birth).format('DD/MM/YYYY') : '');

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 no-print">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/certificates/dashboard')}
                    className="border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-700 font-semibold"
                >
                    Back to Overview
                </Button>
                <h2 className="text-2xl font-extrabold text-gray-900 m-0">Certificate Logs</h2>
            </div>

            {/* List Card */}
            <Card className="shadow-sm border-gray-100 no-print">
                <div className="flex justify-between items-center mb-6">
                    <Input
                        placeholder="Search logs by name, GR no, standard, cert no..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="max-w-md rounded-lg py-2"
                        allowClear
                    />
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredRecords}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        locale={{
                            emptyText: <Empty description="No certificate records found." />
                        }}
                    />
                )}
            </Card>

            {/* View & Reprint Modal */}
            <Modal
                title={<span className="font-extrabold text-gray-800">Certificate Reprint Viewer</span>}
                open={viewModalVisible}
                onCancel={() => {
                    setViewModalVisible(false);
                    setSelectedRecord(null);
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setViewModalVisible(false);
                        setSelectedRecord(null);
                    }}>
                        Close
                    </Button>,
                    <Button 
                        key="print" 
                        icon={<PrinterOutlined />} 
                        onClick={handlePrintRecord}
                        className="border-red-700 text-red-700 hover:text-white hover:bg-red-700 font-semibold"
                    >
                        Print
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
                {selectedRecord && (
                    <div className="w-full overflow-x-auto bg-gray-100 p-6 rounded border border-gray-200 flex justify-center">
                        <div 
                            id="certificate-print-area"
                            className={`bg-white shadow-md text-black ${selectedRecord.type === 'Trial' ? 'trial-cert' : (selectedRecord.type === 'Transfer' ? 'transfer-cert' : (selectedRecord.type === 'Domisile & Character' ? 'domisile-cert' : 'bonafide-cert'))}`}
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
                            {selectedRecord.type === 'Trial' ? (
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

                                        {/* Title centered */}
                                        <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '2px' }}>
                                            <span style={{ 
                                                fontSize: '26px', 
                                                fontWeight: 'bold', 
                                                color: '#000000',
                                                fontFamily: '"Times New Roman", Times, serif',
                                                letterSpacing: '1px'
                                            }}>
                                                TRIAL CERTIFICATE
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                            <span style={{ 
                                                fontSize: '18px', 
                                                fontWeight: 'bold', 
                                                color: '#000000',
                                                fontFamily: '"Times New Roman", Times, serif',
                                                letterSpacing: '0.5px'
                                            }}>
                                                SCHOOL INDEX NO. 55.0304
                                            </span>
                                        </div>

                                        {/* Metadata Details (Cert no / Date) */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif', marginBottom: '20px' }}>
                                        <div>
                                            Certificate No. &nbsp; <strong>{selectedRecord.certificateNo || '______'}</strong>
                                        </div>
                                        <div>
                                            Date: &nbsp; <strong>{dayjs(selectedRecord.date).format('DD/MM/YYYY')}</strong>
                                        </div>
                                    </div>
 
                                    {/* Paragraph Content */}
                                    <div 
                                        style={{ 
                                            fontSize: '18.5px', 
                                            textAlign: 'justify', 
                                            lineHeight: '2.3',
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginTop: '15px',
                                            textIndent: '30px'
                                        }}
                                    >
                                        This is to certify that {pronouns.prefix ? pronouns.prefix + ' ' : ''}
                                        <strong style={{ textTransform: 'uppercase', fontSize: '19.5px' }}>{selectedRecord.studentName || '________________________________'}</strong> 
                                        &nbsp;{pronouns.relation || 's/o of Sh.'}&nbsp;
                                        <strong style={{ textTransform: 'uppercase', fontSize: '19.5px' }}>{selectedRecord.fatherName || '________________________'}</strong>
                                        , studying in class <strong>{selectedRecord.std || '______'}</strong>
                                        , (GR.NO. <strong>{selectedRecord.grNo || '______'}</strong>)
                                        in the academic session <strong>{selectedRecord.academicYear || '______'}</strong> is a bonafide student of Shree Saraswati Vidhyalay, Gandhinagar.
                                        {pronouns.heShe} has passed {selectedRecord.examName || 'Secondary School Certificate Examination'} conducted by {selectedRecord.boardName || 'GSEB'} in the {selectedRecord.attemptType || 'First Trial'}.
                                    </div>

                                    {/* Seat number */}
                                    <div 
                                        style={{ 
                                            fontSize: '18.5px', 
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginTop: '15px'
                                        }}
                                    >
                                        {pronouns.hisHer} seat number was <strong>{selectedRecord.seatNo || '________________'}</strong>
                                    </div>

                                    {/* Character & Wishes */}
                                    <div 
                                        style={{ 
                                            fontSize: '18.5px', 
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginTop: '15px'
                                        }}
                                    >
                                        {pronouns.heShe} bears a good moral character. I wish {pronouns.himHer} success in all the future endeavours.
                                    </div>
 
                                    {/* Signature Space on the Left Bottom */}
                                    <div style={{ position: 'absolute', bottom: '20mm', left: '16mm', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                        {/* Stamp outline box */}
                                        <div style={{ width: '130px', height: '60px', border: '1px solid #c0c0c0', marginBottom: '15px' }} />
                                        <strong>{selectedRecord.principalName || 'Neeraj Kaushesh'}</strong>
                                        <div style={{ marginTop: '2px', fontSize: '16px' }}>Principal</div>
                                    </div>
                                </div>
                            ) : selectedRecord.type === 'Transfer' ? (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: '6px double #000000',
                                        padding: '6mm 6mm',
                                        boxSizing: 'border-box',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#ffffff'
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
                                        <div>TC. No : <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '45px', lineHeight: '1.2' }}>{selectedRecord.certificateNo || '\u00A0'}</span></div>
                                        <div>Gr No : <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '45px', lineHeight: '1.2' }}>{selectedRecord.grNo || '______'}</span></div>
                                        <div>Date: <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 3px 8px', display: 'inline-block', minWidth: '70px', lineHeight: '1.2' }}>{selectedRecord.date ? dayjs(selectedRecord.date).format('DD/MM/YYYY') : '\u00A0'}</span></div>
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
                                                    {renderRow('1', 'Name of Pupil', selectedRecord.studentName)}
                                                    {renderRow('2', "Mother's Name", selectedRecord.motherName)}
                                                    {renderRow('3', "Father's/Guardian's Name", selectedRecord.fatherName)}
                                                    {renderRow('4', 'Nationality', selectedRecord.nationality)}
                                                    {renderRow('5', 'Religion, Caste & Sub-Caste', selectedRecord.religionCaste)}
                                                    {renderRow('6', 'Whether the Candidate belongs to Scheduled Caste/Scheduled Tribe', selectedRecord.isScSt)}
                                                    
                                                    {/* Row 7 */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11.5px', fontFamily: 'Arial, sans-serif' }}>
                                                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                            <div style={{ width: '310px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                                <span>7. Date of Birth (in Christian Era) according to Admission Register(in figures & words)</span>
                                                                <span>:</span>
                                                            </div>
                                                            <div style={{ flexGrow: 1, borderBottom: '1px solid #000000', marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', paddingBottom: '3px' }}>
                                                                {selectedRecord.dateOfBirth ? dayjs(selectedRecord.dateOfBirth).format('DD/MM/YYYY') : '\u00A0'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '1.5px' }}>
                                                            <div style={{ width: '310px', flexShrink: 0 }} />
                                                            <div style={{ flexGrow: 1, borderBottom: '1px solid #000000', marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', textTransform: 'uppercase', paddingBottom: '3px' }}>
                                                                {selectedRecord.dateOfBirthWords || '\u00A0'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {renderRow('8', 'Proof of Date of Birth Submitted at the time of admission', selectedRecord.birthProof)}
                                                    {renderRow('9', 'Place of Birth', selectedRecord.birthPlace)}
                                                    {renderRow('10', 'Date of Admission in the School with Class', selectedRecord.admissionClass)}
                                                    {renderRow('11', 'Class in which the pupil last studied', selectedRecord.classLastStudied)}
                                                    {renderRow('12', "School/Board's Annual examination last taken with result", selectedRecord.lastExamResult)}
                                                    {renderRow('13', 'Whether failed, if so once/twice in the same class : ONCE/TWICE', selectedRecord.isFailed)}
                                                    
                                                    {/* Row 14 */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: '11.5px', lineHeight: '1.3', fontFamily: 'Arial, sans-serif' }}>
                                                        <div style={{ width: '310px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>14. Subjects Studies: All Compulsory Subjects,Third Language (if any)</span>
                                                            <span>:</span>
                                                        </div>
                                                        <div className="lined-value" style={{ flexGrow: 1, marginLeft: '6px', fontWeight: 'bold', paddingLeft: '4px', textTransform: 'uppercase' }}>
                                                            {selectedRecord.subjects}
                                                        </div>
                                                    </div>

                                                    {renderRow('15', 'Whether qualified for promotion to the higher class(in figures & words)', selectedRecord.promotedClass)}
                                                    {renderRow('16', 'Month upto which the pupil has paid school dues', selectedRecord.schoolDuesPaid)}
                                                    {renderRow('17', 'Total number of working days', selectedRecord.workingDays)}
                                                    {renderRow('18', 'Total number of working days present', selectedRecord.presentDays)}
                                                    {renderRow('19', 'Games played or Co-curricular activities in which the pupil usually took part', selectedRecord.gamesCoCurricular)}
                                                    {renderRow('20', 'General conduct', selectedRecord.conduct)}
                                                    {renderRow('21', 'Date of application for certificate', selectedRecord.applDate ? dayjs(selectedRecord.applDate).format('DD/MM/YYYY') : '')}
                                                    {renderRow('22', "Date on which pupil's name was struck off the rolls of the school", selectedRecord.struckOffDate ? dayjs(selectedRecord.struckOffDate).format('DD/MM/YYYY') : '')}
                                                    {renderRow('23', 'Date of issue of certificate', selectedRecord.date ? dayjs(selectedRecord.date).format('DD/MM/YYYY') : '')}
                                                    {renderRow('24', 'Reason for leaving the school', selectedRecord.leavingReason)}
                                                    {renderRow('25', 'UID No', selectedRecord.uidNo)}
                                                    {renderRow('26', 'Personal Education Number (PEN)', selectedRecord.penNo)}
                                                    {renderRow('27', 'APAAR ID', selectedRecord.apaarId)}
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
                            ) : selectedRecord.type === 'Domisile & Character' ? (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: '16mm 14mm',
                                        boxSizing: 'border-box',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    {/* Page Corner Crop Brackets */}
                                    <div className="corner-bracket top-left"></div>
                                    <div className="corner-bracket top-right"></div>
                                    <div className="corner-bracket bottom-left"></div>
                                    <div className="corner-bracket bottom-right"></div>

                                    {/* Header Section */}
                                    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '10px', width: '100%' }}>
                                        <img src={schoolHeader} alt="School Header" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                                    </div>

                                    {/* Divider Line */}
                                    <div style={{ borderTop: '1.5px solid #000000', marginTop: '5px', marginBottom: '15px', width: '100%' }} />

                                    {/* Title */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <span style={{ 
                                            fontSize: '26px', 
                                            fontWeight: 'bold', 
                                            textDecoration: 'underline', 
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            letterSpacing: '1.2px'
                                        }}>
                                            CERTIFICATE
                                        </span>
                                    </div>

                                    {/* GR Number */}
                                    <div style={{ fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif', marginBottom: '20px' }}>
                                        GR.No.<strong>{selectedRecord.grNo || '______'}</strong>
                                    </div>

                                    {/* Paragraph Content */}
                                    <div 
                                        style={{ 
                                            fontSize: '18.5px', 
                                            textAlign: 'justify', 
                                            lineHeight: '2.2',
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginTop: '20px'
                                        }}
                                    >
                                        This is to certify that {pronouns.prefix && pronouns.prefix !== 'Student' ? pronouns.prefix + ' ' : ''}
                                        <strong style={{ textTransform: 'uppercase', fontSize: '20px' }}>
                                            {selectedRecord.studentName || '________________________________'}
                                        </strong> is a bonafide student of Shree Saraswati Vidhyalay – SSV CAMPUS and {pronouns.heShe?.toLowerCase()} has been studying in the class <strong>{selectedRecord.std || '______'}</strong> in the academic year <strong>{selectedRecord.academicYear || '______'}</strong>. {pronouns.hisHer} birth date as recorded in the General Register of this school is <strong>{displayDob || 'DD/MM/YYYY'}</strong> ({selectedRecord.dateOfBirthWords || '________________________'}).
                                    </div>

                                    {/* Character paragraph */}
                                    <div 
                                        style={{ 
                                            fontSize: '18.5px', 
                                            textAlign: 'justify', 
                                            lineHeight: '2.2',
                                            color: '#000000',
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginTop: '25px'
                                        }}
                                    >
                                        {pronouns.heShe} bears a good moral character.
                                    </div>

                                    {/* Principal signature block */}
                                    <div style={{ position: 'absolute', bottom: '16mm', left: '14mm', fontSize: '17px', color: '#000000', fontFamily: '"Times New Roman", Times, serif', lineHeight: '1.4' }}>
                                        <strong>{selectedRecord.principalName || 'Neeraj Kaushesh'}</strong>
                                        <div style={{ marginTop: '1px' }}>Principal</div>
                                        <div style={{ fontSize: '14px', marginTop: '1px' }}>Shree Saraswati Vidhyalay</div>
                                    </div>
                                </div>
                            ) : (
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
 
                                    {/* Metadata details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                Certificate No. &nbsp; <strong>{selectedRecord.certificateNo}</strong>
                                            </div>
                                            <div>
                                                Date : &nbsp; <strong>{dayjs(selectedRecord.date).format('DD/MM/YYYY')}</strong>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                Std. &nbsp; <strong>{selectedRecord.std || '______'}</strong>
                                                {selectedRecord.rollNo && (
                                                    <>
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Roll No. &nbsp; <strong>{selectedRecord.rollNo}</strong>
                                                    </>
                                                )}
                                            </div>
                                            <div>
                                                Gr.No. &nbsp; <strong>{selectedRecord.grNo || '______'}</strong>
                                            </div>
                                        </div>
                                    </div>
 
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
                                        This is to certify that {pronouns.prefix ? pronouns.prefix + ' ' : ''}<strong style={{ textTransform: 'uppercase', fontSize: '20px' }}>{selectedRecord.studentName || '________________________________'}</strong> is a Bonafide student of this School. {pronouns.heShe} {pronouns.heShe?.toLowerCase() === 'they' ? 'bear' : 'bears'} a good moral character.
                                        <br />
                                        {pronouns.hisHer} Birth Date : <strong>{displayDob || 'DD/MM/YYYY'}</strong> &nbsp;&nbsp; {pronouns.hisHer?.toLowerCase()} caste : <strong>{selectedRecord.caste || '_________'}</strong> & Sub Caste : <strong>{selectedRecord.subCaste?.trim() || '-'}</strong>.
                                    </div>
 
                                    {/* Signatures */}
                                    <div style={{ position: 'absolute', bottom: '16mm', left: '14mm', fontSize: '16px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                        <strong>{selectedRecord.principalName || 'Neeraj Kaushesh'}</strong>
                                        <div style={{ marginTop: '2px' }}>Principal</div>
                                        <div style={{ fontSize: '14px', marginTop: '1px' }}>Shree Saraswati Vidhyalay</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

             {/* Print styling block for window.print() inside the logs page */}
             <style dangerouslySetInnerHTML={{
                 __html: `
                 @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
                 
                 .corner-bracket {
                     position: absolute;
                     width: 12mm;
                     height: 12mm;
                     border-color: rgba(0, 0, 0, 0.2);
                     border-style: solid;
                     pointer-events: none;
                 }
                 .corner-bracket.top-left {
                     top: 10mm;
                     left: 10mm;
                     border-width: 1px 0 0 1px;
                 }
                 .corner-bracket.top-right {
                     top: 10mm;
                     right: 10mm;
                     border-width: 1px 1px 0 0;
                 }
                 .corner-bracket.bottom-left {
                     bottom: 10mm;
                     left: 10mm;
                     border-width: 0 0 1px 1px;
                 }
                 .corner-bracket.bottom-right {
                     bottom: 10mm;
                     right: 10mm;
                     border-width: 0 1px 1px 0;
                 }

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
                         box-shadow: none !important;
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
                         box-sizing: border-box !important;
                     }
                     #certificate-print-area.domisile-cert > div {
                         border: none !important;
                         padding: 16mm 14mm !important;
                     }
                     .corner-bracket {
                         border-color: rgba(0, 0, 0, 0.4) !important;
                     }
                     #certificate-print-area.bonafide-cert > div {
                         padding: 16mm 14mm !important;
                     }
                     #certificate-print-area.trial-cert > div {
                         padding: 16mm 14mm !important;
                     }
                    #certificate-print-area.transfer-cert > div {
                        padding: 6mm 6mm !important;
                    }
                    .lined-value {
                         line-height: 22px;
                         background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2222%22%3E%3Cline%20x1%3D%220%22%20y1%3D%2221%22%20x2%3D%22100%22%20y2%3D%2221%22%20stroke%3D%22black%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E");
                         background-repeat: repeat;
                         display: inline-block;
                         width: 100%;
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
