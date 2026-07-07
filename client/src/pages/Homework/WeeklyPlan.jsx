import React, { useState, useEffect, useMemo } from 'react';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
    Table, 
    Button, 
    Modal, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    Tag, 
    Space, 
    notification, 
    Popconfirm, 
    Tooltip, 
    Empty,
    AutoComplete,
    Upload,
    message
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    BookOutlined, 
    CalendarOutlined, 
    UserOutlined,
    LinkOutlined,
    FileTextOutlined,
    SearchOutlined,
    ClearOutlined,
    DownloadOutlined,
    UploadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import axios from 'axios';
import API from '../../services/api';
import { useUserRole } from '../../hooks/useUserRole';
import { useInstructorGroups } from '../../hooks/useInstructorGroups';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';
import { triggerNotification } from '../../services/notificationService';

const WEEKLY_PLAN_PATH = 'schooler_system/weekly_plan_management/weekly_plans';

export default function WeeklyPlan() {
    const { isAdmin, isInstructor, isStudent, isGuardian, isCoordinator } = useUserRole();
    const isWriteAllowed = isAdmin || isInstructor || isCoordinator;
    const instructorData = useInstructorGroups();
    const coordinatorScope = useCoordinatorScope();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Dropdown options from ERPNext
    const [programs, setPrograms] = useState([]);
    const [studentGroups, setStudentGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [boards, setBoards] = useState([]);
    const [loadingMasters, setLoadingMasters] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // Filter states
    const [filterBoard, setFilterBoard] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Weekly Plan Assignments from Firestore
    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, WEEKLY_PLAN_PATH), orderBy('startDate', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data(),
                created_at: docSnapshot.data().created_at?.toDate 
                    ? docSnapshot.data().created_at.toDate() 
                    : new Date(docSnapshot.data().created_at || Date.now())
            }));
            setAssignments(data);
        } catch (error) {
            console.error('Error fetching classwork:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to fetch weekly plans.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch ERPNext Masters (Programs, Student Groups, Courses as Subjects)
    const fetchMasters = async () => {
        setLoadingMasters(true);
        try {
            const [pRes, sgRes, cRes, bRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Group?fields=["name","program"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Course?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            
            setPrograms(pRes.data?.data || []);
            setStudentGroups(sgRes.data?.data || []);
            setSubjects(cRes.data?.data || []);
            setBoards(bRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching masters:', error);
        } finally {
            setLoadingMasters(false);
        }
    };

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        fetchAssignments();
        fetchMasters();
    }, [isCoordinator, coordinatorScope.loading]);

    // Handle form submit
    const handleSubmit = async (values) => {
        try {
            const payload = {
                title: values.title,
                description: values.description || '',
                board: values.board || '',
                program: values.program || '',
                studentGroup: values.studentGroup || '',
                subject: values.subject || '',
                startDate: values.planDates[0].format('YYYY-MM-DD'),
                endDate: values.planDates[1].format('YYYY-MM-DD'),
                status: values.status || 'Assigned',
                attachmentUrl: values.attachmentUrl || '',
                uploadedFiles: uploadedFiles || [],
                estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
                assignedBy: values.assignedBy || 'Instructor',
                updatedAt: serverTimestamp()
            };

            if (editingRecord) {
                // Update assignment in Firestore
                const docRef = doc(db, WEEKLY_PLAN_PATH, editingRecord.id);
                await updateDoc(docRef, payload);
                notification.success({
                    message: 'Success',
                    description: 'Weekly Plan assignment updated successfully.'
                });
            } else {
                // Add new assignment to Firestore
                payload.created_at = serverTimestamp();
                await addDoc(collection(db, WEEKLY_PLAN_PATH), payload);
                notification.success({
                    message: 'Success',
                    description: 'Weekly plan assigned successfully.'
                });

                triggerNotification({
                    type: 'weekly_plan',
                    title: `📅 Weekly Plan: ${payload.title}`,
                    message: payload.description || 'New weekly plan published',
                    targetType: payload.assignedToType,
                    targetValue: payload.assignedTo,
                    clickUrl: '/education/student-dashboard'
                });
            }
            
            setIsModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            fetchAssignments();
        } catch (error) {
            console.error('Error saving classwork:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to save weekly plan.'
            });
        }
    };

    // Handle delete
    const handleDelete = async (record) => {
        try {
            // Delete all associated files from S3
            const filesToDelete = record.uploadedFiles || [];
            if (record.awsFileKey) {
                filesToDelete.push({ key: record.awsFileKey });
            }
            
            for (const file of filesToDelete) {
                if (file.key) {
                    await axios.delete(`/local-api/api/s3/delete?key=${encodeURIComponent(file.key)}`).catch(err => {
                        console.error('Failed to delete file from S3', err);
                    });
                }
            }
            await deleteDoc(doc(db, WEEKLY_PLAN_PATH, record.id));
            notification.success({
                message: 'Success',
                description: 'Weekly Plan assignment deleted successfully.'
            });
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting classwork:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to delete weekly plan.'
            });
        }
    };

    // Open Modal for Create
    const handleCreateOpen = () => {
        setEditingRecord(null);
        setFileList([]);
        setUploadedFiles([]);
        form.resetFields();
        form.setFieldsValue({
            planDates: [dayjs(), dayjs().add(7, 'day')],
            status: 'Assigned',
            assignedBy: isCoordinator ? 'Coordinator' : (isInstructor ? 'Instructor' : 'Admin')
        });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleEditOpen = (record) => {
        setEditingRecord(record);
        let initialFiles = record.uploadedFiles || [];
        if (record.uploadedFileUrl && initialFiles.length === 0) {
            initialFiles = [{ uid: '-1', name: 'Uploaded File', url: record.uploadedFileUrl, key: record.awsFileKey }];
        }
        setUploadedFiles(initialFiles);
        setFileList(initialFiles.map((f, idx) => ({
            uid: f.uid || `-${idx}`,
            name: f.name || `Attachment ${idx + 1}`,
            status: 'done',
            url: f.url,
            key: f.key
        })));
        form.setFieldsValue({
            title: record.title,
            description: record.description,
            board: record.board,
            program: record.program,
            studentGroup: record.studentGroup,
            subject: record.subject,
            planDates: [dayjs(record.startDate), dayjs(record.endDate)],
            status: record.status,
            attachmentUrl: record.attachmentUrl,
            estimatedMinutes: record.estimatedMinutes,
            assignedBy: record.assignedBy
        });
        setIsModalOpen(true);
    };

    // Filter assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter(item => {
            if (isCoordinator) {
                if (coordinatorScope.loading) return false;
                if (!item.program || !coordinatorScope.programs.includes(item.program)) return false;
            } else if (isInstructor) {
                if (instructorData.loading) return false;
                if (!item.studentGroup || !instructorData.studentGroups.includes(item.studentGroup)) return false;
            }
            const matchesBoard = !filterBoard || item.board === filterBoard;
            const matchesProgram = !filterProgram || item.program === filterProgram;
            const matchesGroup = !filterGroup || item.studentGroup === filterGroup;
            const matchesSubject = !filterSubject || 
                item.subject?.toLowerCase().includes(filterSubject.toLowerCase());
            const matchesStatus = !filterStatus || item.status === filterStatus;
            const matchesSearch = !searchQuery || 
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesBoard && matchesProgram && matchesGroup && matchesSubject && matchesStatus && matchesSearch;
        });
    }, [assignments, filterBoard, filterProgram, filterGroup, filterSubject, filterStatus, searchQuery, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    const allowedBoards = useMemo(() => {
        if (isAdmin) return boards;
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            return boards.filter(b => coordinatorScope.boards.includes(b.name));
        }
        if (!isInstructor) return boards;
        if (!instructorData || instructorData.programs.length === 0) return boards;
        const instProgs = programs.filter(p => instructorData.programs.includes(p.name));
        const instBoards = instProgs.map(p => p.custom_board).filter(Boolean);
        return boards.filter(b => instBoards.includes(b.name));
    }, [boards, programs, isInstructor, instructorData, isAdmin, isCoordinator, coordinatorScope]);

    const selectedBoard = Form.useWatch('board', form);

    const filteredPrograms = useMemo(() => {
        let list = programs;
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            list = list.filter(p => coordinatorScope.programs.includes(p.name));
        } else if (isInstructor && instructorData && instructorData.programs.length > 0) {
            list = list.filter(p => instructorData.programs.includes(p.name));
        }
        if (!selectedBoard) return (isInstructor || isCoordinator) ? list : [];
        return list.filter(p => {
            const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
            const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
            return pBoard === fBoard;
        });
    }, [programs, selectedBoard, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    const filterProgramsList = useMemo(() => {
        let list = programs;
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            list = list.filter(p => coordinatorScope.programs.includes(p.name));
        } else if (isInstructor && instructorData && instructorData.programs.length > 0) {
            list = list.filter(p => instructorData.programs.includes(p.name));
        }
        if (!filterBoard) return list;
        return list.filter(p => {
            const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
            const fBoard = (filterBoard || '').toString().trim().toLowerCase();
            return pBoard === fBoard;
        });
    }, [programs, filterBoard, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    const selectedProgram = Form.useWatch('program', form);

    const filteredStudentGroups = useMemo(() => {
        let groups = studentGroups;
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            groups = groups.filter(sg => coordinatorScope.programs.includes(sg.program));
        } else if (isInstructor && instructorData && instructorData.studentGroups.length > 0) {
            groups = groups.filter(sg => instructorData.studentGroups.includes(sg.name));
        }
        if (selectedProgram) {
            groups = groups.filter(sg => sg.program === selectedProgram);
        } else if (selectedBoard) {
            groups = groups.filter(sg => {
                const prog = programs.find(p => p.name === sg.program);
                const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
        }
        return groups;
    }, [studentGroups, programs, selectedBoard, selectedProgram, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    const filterStudentGroupsList = useMemo(() => {
        let groups = studentGroups;
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            groups = groups.filter(sg => coordinatorScope.programs.includes(sg.program));
        } else if (isInstructor && instructorData && instructorData.studentGroups.length > 0) {
            groups = groups.filter(sg => instructorData.studentGroups.includes(sg.name));
        }
        if (filterProgram) {
            groups = groups.filter(sg => sg.program === filterProgram);
        } else if (filterBoard) {
            groups = groups.filter(sg => {
                const prog = programs.find(p => p.name === sg.program);
                const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (filterBoard || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
        }
        return groups;
    }, [studentGroups, programs, filterBoard, filterProgram, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    // Reset all filters
    const handleClearFilters = () => {
        setFilterBoard('');
        setFilterProgram('');
        setFilterGroup('');
        setFilterSubject('');
        setFilterStatus('');
        setSearchQuery('');
    };

    // Download/Export Excel
    const handleDownloadWeeklyPlan = () => {
        if (filteredAssignments.length === 0) {
            notification.warning({
                message: 'No Data',
                description: 'No classwork records found to download.'
            });
            return;
        }

        const dataToExport = filteredAssignments.map(item => ({
            'Title': item.title,
            'Description': item.description,
            'Subject (Course)': item.subject || 'N/A',
            'Board': item.board || 'Any',
            'Program': item.program || 'Any',
            'Student Group': item.studentGroup || 'Any',
            'Start Date': item.startDate,
            'End Date': item.endDate,
            'Status': item.status,
            'Estimated Duration (mins)': item.estimatedMinutes || '',
            'Assigned By': item.assignedBy || 'Instructor'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Plan');
        XLSX.writeFile(workbook, `Weekly Plan_Assignments_${dayjs().format('YYYY_MM_DD')}.xlsx`);
        
        notification.success({
            message: 'Export Successful',
            description: 'Weekly Plan records exported to Excel.'
        });
    };

    // Define table columns
    const columns = [
        {
            title: 'Title & Description',
            key: 'details',
            width: '30%',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-[14px]">{record.title}</span>
                    <span className="text-gray-500 text-xs mt-1 line-clamp-2" title={record.description}>
                        {record.description}
                    </span>
                    {(record.attachmentUrl || record.uploadedFileUrl) && (
                        <a 
                            href={record.attachmentUrl || record.uploadedFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs mt-2 flex items-center gap-1 w-max"
                        >
                            <LinkOutlined /> {record.attachmentUrl ? 'Attachment Link' : 'View Uploaded File'}
                        </a>
                    )}
                </div>
            )
        },
        {
            title: 'Subject (Course)',
            key: 'classDetails',
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <BookOutlined className="text-gray-400" />
                        <span className="font-semibold">{record.subject || 'N/A'}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                        {record.board && <span className="mr-2 font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Board: {record.board}</span>}
                        <span>Prog: {record.program || 'Any'}</span>
                        {record.studentGroup && <span className="ml-2 font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Group: {record.studentGroup}</span>}
                    </div>
                </div>
            )
        },
        {
            title: 'Weekly Plan Date',
            key: 'startDate',
            sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
            render: (_, record) => {
                const isOverdue = dayjs(record.startDate).isBefore(dayjs(), 'day') && record.status !== 'Completed';
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <CalendarOutlined className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                            <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                                {dayjs(record.startDate).format('DD MMM YYYY')}
                            </span>
                        </div>
                        {record.estimatedMinutes && (
                            <span className="text-[11px] text-gray-400 mt-0.5">Est: {record.estimatedMinutes} mins</span>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Assigned By',
            key: 'assignedBy',
            dataIndex: 'assignedBy',
            render: (val) => (
                <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                    <UserOutlined className="text-gray-400" />
                    <span>{val || 'Instructor'}</span>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'Draft') color = 'default';
                if (status === 'Completed') color = 'green';
                if (status === 'Closed') color = 'red';
                return <Tag color={color} className="font-bold rounded">{status?.toUpperCase()}</Tag>;
            }
        }
    ];

    if (isWriteAllowed) {
        columns.push({
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Weekly Plan">
                        <Button 
                            type="text" 
                            icon={<EditOutlined className="text-blue-500" />} 
                            onClick={() => handleEditOpen(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Delete Weekly Plan">
                        <Popconfirm
                            title="Delete this classwork?"
                            onConfirm={() => handleDelete(record)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                type="text" 
                                icon={<DeleteOutlined className="text-red-500" />} 
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        });
    }

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileTextOutlined className="text-blue-600" />
                        Weekly Plan
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Assign, track, and manage student classwork & activities. Configured in Firebase.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Button 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadWeeklyPlan}
                        size="large"
                        className="border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-600 font-semibold"
                    >
                        Download
                    </Button>
                    {isWriteAllowed && (
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            className="bg-blue-600 hover:bg-blue-700 font-semibold"
                            onClick={handleCreateOpen}
                            size="large"
                        >
                            Assign Weekly Plan
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters panel */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <SearchOutlined /> Filter Weekly Plan
                    </span>
                    {(filterProgram || filterGroup || filterSubject || filterStatus || searchQuery) && (
                        <Button 
                            type="text" 
                            danger 
                            icon={<ClearOutlined />} 
                            onClick={handleClearFilters}
                            className="text-xs font-bold p-0 flex items-center"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <Input 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            prefix={<SearchOutlined className="text-gray-400" />}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <Select
                            placeholder="Filter Board"
                            className="w-full"
                            value={filterBoard || undefined}
                            onChange={val => {
                                setFilterBoard(val || '');
                                setFilterProgram('');
                                setFilterGroup('');
                            }}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {allowedBoards.map(b => (
                                <Select.Option key={b.name} value={b.name}>{b.name}</Select.Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Select
                            placeholder="Filter Program"
                            className="w-full"
                            value={filterProgram || undefined}
                            onChange={val => {
                                setFilterProgram(val || '');
                                setFilterGroup(''); // reset group filter
                            }}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            disabled={!filterBoard}
                        >
                            {filterProgramsList.map(p => (
                                <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Select
                            placeholder="Filter Student Group"
                            className="w-full"
                            value={filterGroup || undefined}
                            onChange={val => setFilterGroup(val || '')}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            disabled={!filterBoard && !filterProgram}
                        >
                            {filterStudentGroupsList.map(sg => (
                                <Select.Option key={sg.name} value={sg.name}>{sg.name}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Select
                            placeholder="Filter Subject (Course)"
                            className="w-full"
                            value={filterSubject || undefined}
                            onChange={val => setFilterSubject(val || '')}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {subjects.map(s => (
                                <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Select
                            placeholder="Filter Status"
                            className="w-full"
                            value={filterStatus || undefined}
                            onChange={val => setFilterStatus(val || '')}
                            allowClear
                        >
                            <Select.Option value="Draft">Draft</Select.Option>
                            <Select.Option value="Assigned">Assigned</Select.Option>
                            <Select.Option value="Completed">Completed</Select.Option>
                            <Select.Option value="Closed">Closed</Select.Option>
                        </Select>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <Table
                    columns={columns}
                    dataSource={filteredAssignments}
                    loading={loading || loadingMasters || (isCoordinator ? coordinatorScope.loading : false) || (isInstructor ? instructorData.loading : false)}
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} activities`
                    }}
                    locale={{
                        emptyText: <Empty description="No weekly plans found." />
                    }}
                />
            </div>

            {/* Form Modal */}
            <Modal
                title={editingRecord ? "Edit Weekly Plan Assignment" : "Assign New Weekly Plan"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="title"
                        label="Weekly Plan Title / Topic"
                        rules={[{ required: true, message: 'Please enter classwork title' }]}
                    >
                        <Input placeholder="e.g., Chapter 3: In-Class Practice Exercise 3.2" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description / Instructions"
                        rules={[{ required: true, message: 'Please enter description or instruction details' }]}
                    >
                        <Input.TextArea 
                            rows={4} 
                            placeholder="Detail out the classwork steps, questions to practice, or group tasks..." 
                        />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item
                            name="board"
                            label="Board"
                        >
                            <Select 
                                placeholder="Select Board" 
                                showSearch
                                optionFilterProp="children"
                                allowClear
                                onChange={() => form.setFieldsValue({ program: undefined, studentGroup: undefined })}
                            >
                                {allowedBoards.map(b => (
                                    <Select.Option key={b.name} value={b.name}>{b.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="program"
                            label="Program (Class)"
                            rules={[{ required: true, message: 'Please select Program' }]}
                        >
                            <Select 
                                placeholder={selectedBoard ? "Select Program" : "Please Select Board First"}
                                showSearch
                                optionFilterProp="children"
                                disabled={!selectedBoard}
                                onChange={() => form.setFieldsValue({ studentGroup: undefined })}
                            >
                                {filteredPrograms.map(p => (
                                    <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="studentGroup"
                            label="Student Group"
                            rules={[{ required: true, message: 'Please select Student Group' }]}
                        >
                            <Select 
                                placeholder={selectedBoard || selectedProgram ? "Select Student Group" : "Please Select Board/Program First"}
                                showSearch
                                optionFilterProp="children"
                                disabled={!selectedBoard && !selectedProgram}
                            >
                                {filteredStudentGroups.map(sg => (
                                    <Select.Option key={sg.name} value={sg.name}>{sg.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Form.Item
                            name="planDates"
                            label="Plan Dates"
                            rules={[{ required: true, message: 'Please pick start and end dates' }]}
                        >
                            <DatePicker.RangePicker className="w-full" format="YYYY-MM-DD" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item
                            name="status"
                            label="Status"
                            initialValue="Assigned"
                        >
                            <Select>
                                <Select.Option value="Draft">Draft</Select.Option>
                                <Select.Option value="Assigned">Assigned</Select.Option>
                                <Select.Option value="Completed">Completed</Select.Option>
                                <Select.Option value="Closed">Closed</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="estimatedMinutes"
                            label="Estimated Duration (minutes)"
                        >
                            <Input type="number" min={0} placeholder="e.g., 45" />
                        </Form.Item>

                        <Form.Item
                            name="assignedBy"
                            label="Assigned By"
                        >
                            <Input placeholder="e.g., Prof. Smith" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Reference Link (External URL)"
                        name="attachmentUrl"
                    >
                        <Input placeholder="https://example.com/materials" prefix={<LinkOutlined className="text-gray-400" />} />
                    </Form.Item>
                    
                    <Form.Item label="Upload Files (PDF, Image, Doc)">
                        <Upload
                            customRequest={async ({ file, onSuccess, onError }) => {
                                try {
                                    setUploading(true);
                                    const presignedRes = await axios.post('/local-api/api/s3/presigned-url', {
                                        fileName: file.name,
                                        fileType: file.type || 'application/octet-stream'
                                    });
                                    const { presignedUrl, fileUrl, key } = presignedRes.data;
                                    await axios.put(presignedUrl, file, {
                                        headers: { 'Content-Type': file.type || 'application/octet-stream' }
                                    });
                                    
                                    const newFile = { uid: file.uid, name: file.name, url: fileUrl, key: key };
                                    setUploadedFiles(prev => [...prev, newFile]);
                                    setFileList(prev => [...prev, { ...newFile, status: 'done' }]);
                                    onSuccess("ok");
                                    message.success(`${file.name} uploaded successfully.`);
                                } catch (err) {
                                    console.error("Upload error:", err);
                                    onError(err);
                                    message.error(`${file.name} upload failed.`);
                                } finally {
                                    setUploading(false);
                                }
                            }}
                            fileList={fileList}
                            onChange={({ fileList: newFileList }) => {
                                // Just update fileList for UI, but don't overwrite done files
                                // handle removal in onRemove
                            }}
                            onRemove={(file) => {
                                setFileList(prev => prev.filter(f => f.uid !== file.uid));
                                setUploadedFiles(prev => prev.filter(f => f.uid !== file.uid));
                                if (file.key) {
                                    axios.delete(`/local-api/api/s3/delete?key=${encodeURIComponent(file.key)}`).catch(err => {
                                        console.error('Failed to delete file from S3', err);
                                    });
                                }
                            }}
                            multiple={true}
                        >
                            <Button icon={<UploadOutlined />} loading={uploading}>Click to Upload</Button>
                        </Upload>
                    </Form.Item>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" className="bg-blue-600 hover:bg-blue-700 font-semibold">
                            Save Assignment
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
