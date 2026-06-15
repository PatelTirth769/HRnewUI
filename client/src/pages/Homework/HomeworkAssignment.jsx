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
    AutoComplete 
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
    DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import API from '../../services/api';
import { useUserRole } from '../../hooks/useUserRole';

const HOMEWORK_PATH = 'schooler_system/homework_management/assignments';

export default function HomeworkAssignment() {
    const { isAdmin, isInstructor, isStudent, isGuardian } = useUserRole();
    const isWriteAllowed = isAdmin || isInstructor;

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

    // Filter states
    const [filterBoard, setFilterBoard] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Homework Assignments from Firestore
    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, HOMEWORK_PATH), orderBy('dueDate', 'asc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data(),
                // Convert Firestore timestamps or ISO strings safely
                created_at: docSnapshot.data().created_at?.toDate 
                    ? docSnapshot.data().created_at.toDate() 
                    : new Date(docSnapshot.data().created_at || Date.now())
            }));
            setAssignments(data);
        } catch (error) {
            console.error('Error fetching homework:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to fetch homework assignments.'
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
        fetchAssignments();
        fetchMasters();
    }, []);

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
                dueDate: values.dueDate.format('YYYY-MM-DD'),
                status: values.status || 'Assigned',
                attachmentUrl: values.attachmentUrl || '',
                estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
                assignedBy: values.assignedBy || 'Instructor',
                updatedAt: serverTimestamp()
            };

            if (editingRecord) {
                // Update assignment in Firestore
                const docRef = doc(db, HOMEWORK_PATH, editingRecord.id);
                await updateDoc(docRef, payload);
                notification.success({
                    message: 'Success',
                    description: 'Homework assignment updated successfully.'
                });
            } else {
                // Add new assignment to Firestore
                payload.created_at = serverTimestamp();
                await addDoc(collection(db, HOMEWORK_PATH), payload);
                notification.success({
                    message: 'Success',
                    description: 'Homework assigned successfully.'
                });
            }
            
            setIsModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            fetchAssignments();
        } catch (error) {
            console.error('Error saving homework:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to save homework assignment.'
            });
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, HOMEWORK_PATH, id));
            notification.success({
                message: 'Success',
                description: 'Homework assignment deleted successfully.'
            });
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting homework:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to delete homework assignment.'
            });
        }
    };

    // Open Modal for Create
    const handleCreateOpen = () => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({
            dueDate: dayjs().add(1, 'day'),
            status: 'Assigned',
            assignedBy: isInstructor ? 'Instructor' : 'Admin'
        });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleEditOpen = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
            title: record.title,
            description: record.description,
            board: record.board,
            program: record.program,
            studentGroup: record.studentGroup,
            subject: record.subject,
            dueDate: dayjs(record.dueDate),
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
    }, [assignments, filterBoard, filterProgram, filterGroup, filterSubject, filterStatus, searchQuery]);

    const selectedBoard = Form.useWatch('board', form);

    const filteredPrograms = useMemo(() => {
        if (!selectedBoard) return [];
        return programs.filter(p => {
            const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
            const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
            return pBoard === fBoard;
        });
    }, [programs, selectedBoard]);

    const filterProgramsList = useMemo(() => {
        if (!filterBoard) return programs;
        return programs.filter(p => {
            const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
            const fBoard = (filterBoard || '').toString().trim().toLowerCase();
            return pBoard === fBoard;
        });
    }, [programs, filterBoard]);

    const selectedProgram = Form.useWatch('program', form);

    const filteredStudentGroups = useMemo(() => {
        let groups = studentGroups;
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
    }, [studentGroups, programs, selectedBoard, selectedProgram]);

    const filterStudentGroupsList = useMemo(() => {
        let groups = studentGroups;
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
    }, [studentGroups, programs, filterBoard, filterProgram]);


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
    const handleDownloadHomework = () => {
        if (filteredAssignments.length === 0) {
            notification.warning({
                message: 'No Data',
                description: 'No homework records found to download.'
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
            'Due Date': item.dueDate,
            'Status': item.status,
            'Estimated Duration (mins)': item.estimatedMinutes || '',
            'Assigned By': item.assignedBy || 'Instructor'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Homework');
        XLSX.writeFile(workbook, `Homework_Assignments_${dayjs().format('YYYY_MM_DD')}.xlsx`);

        notification.success({
            message: 'Export Successful',
            description: 'Homework records exported to Excel.'
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
                    {record.attachmentUrl && (
                        <a 
                            href={record.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs mt-2 flex items-center gap-1 w-max"
                        >
                            <LinkOutlined /> Attachment Link
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
            title: 'Due Date',
            key: 'dueDate',
            sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
            render: (_, record) => {
                const isOverdue = dayjs(record.dueDate).isBefore(dayjs(), 'day') && record.status !== 'Completed';
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <CalendarOutlined className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                            <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                                {dayjs(record.dueDate).format('DD MMM YYYY')}
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
                    <Tooltip title="Edit Assignment">
                        <Button 
                            type="text" 
                            icon={<EditOutlined className="text-blue-500" />} 
                            onClick={() => handleEditOpen(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Delete Assignment">
                        <Popconfirm
                            title="Delete Homework"
                            description="Are you sure you want to delete this homework assignment?"
                            onConfirm={() => handleDelete(record.id)}
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
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileTextOutlined className="text-blue-600" />
                        Homework
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Assign, track, and manage student homework assignments. Configured in Firebase.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadHomework}
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
                            Assign Homework
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters panel */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <SearchOutlined /> Filter Assignments
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
                            {boards.map(b => (
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
                    loading={loading || loadingMasters}
                    rowKey="id"
                    pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} assignments`
                    }}
                    locale={{
                        emptyText: <Empty description="No homework assignments found." />
                    }}
                />
            </div>

            {/* Form Modal */}
            <Modal
                title={editingRecord ? "Edit Homework Assignment" : "Assign New Homework"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="title"
                        label="Homework Title / Topic"
                        rules={[{ required: true, message: 'Please enter homework title' }]}
                    >
                        <Input placeholder="e.g., Chapter 3: Quadratic Equations Exercise 3.2" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description / Instructions"
                        rules={[{ required: true, message: 'Please enter description or instruction details' }]}
                    >
                        <Input.TextArea 
                            rows={4} 
                            placeholder="Detail out the assignments steps, pages to read, or questions to solve..." 
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
                                {boards.map(b => (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="subject"
                            label="Subject (Course)"
                            rules={[{ required: true, message: 'Please type or select Subject (Course)' }]}
                        >
                            <AutoComplete
                                placeholder="Type or select Subject (Course)"
                                options={subjects.map(s => ({ value: s.name }))}
                                filterOption={(inputValue, option) =>
                                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            name="dueDate"
                            label="Due Date"
                            rules={[{ required: true, message: 'Please pick a due date' }]}
                        >
                            <DatePicker className="w-full" format="YYYY-MM-DD" />
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
                        name="attachmentUrl"
                        label="Attachment Link / Reference URL"
                    >
                        <Input 
                            prefix={<LinkOutlined className="text-gray-400" />} 
                            placeholder="e.g., Google Drive or PDF link" 
                        />
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
