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

const CLASSWORK_PATH = 'schooler_system/classwork_management/assignments';

export default function ClassworkAssignment() {
    const { isAdmin, isInstructor, isStudent, isGuardian } = useUserRole();
    const isWriteAllowed = isAdmin || isInstructor;

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Dropdown options from ERPNext
    const [programs, setPrograms] = useState([]);
    const [studentGroups, setStudentGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loadingMasters, setLoadingMasters] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    // Filter states
    const [filterProgram, setFilterProgram] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Classwork Assignments from Firestore
    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, CLASSWORK_PATH), orderBy('classworkDate', 'desc'));
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
                description: 'Failed to fetch classwork assignments.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch ERPNext Masters (Programs, Student Groups, Courses as Subjects)
    const fetchMasters = async () => {
        setLoadingMasters(true);
        try {
            const [pRes, sgRes, cRes] = await Promise.all([
                API.get('/api/resource/Program?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Group?fields=["name","program"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Course?limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            
            setPrograms(pRes.data?.data || []);
            setStudentGroups(sgRes.data?.data || []);
            setSubjects(cRes.data?.data || []);
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
                program: values.program || '',
                studentGroup: values.studentGroup || '',
                subject: values.subject || '',
                classworkDate: values.classworkDate.format('YYYY-MM-DD'),
                status: values.status || 'Assigned',
                attachmentUrl: values.attachmentUrl || '',
                estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
                assignedBy: values.assignedBy || 'Instructor',
                updatedAt: serverTimestamp()
            };

            if (editingRecord) {
                // Update assignment in Firestore
                const docRef = doc(db, CLASSWORK_PATH, editingRecord.id);
                await updateDoc(docRef, payload);
                notification.success({
                    message: 'Success',
                    description: 'Classwork assignment updated successfully.'
                });
            } else {
                // Add new assignment to Firestore
                payload.created_at = serverTimestamp();
                await addDoc(collection(db, CLASSWORK_PATH), payload);
                notification.success({
                    message: 'Success',
                    description: 'Classwork assigned successfully.'
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
                description: 'Failed to save classwork assignment.'
            });
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, CLASSWORK_PATH, id));
            notification.success({
                message: 'Success',
                description: 'Classwork assignment deleted successfully.'
            });
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting classwork:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to delete classwork assignment.'
            });
        }
    };

    // Open Modal for Create
    const handleCreateOpen = () => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({
            classworkDate: dayjs(),
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
            program: record.program,
            studentGroup: record.studentGroup,
            subject: record.subject,
            classworkDate: dayjs(record.classworkDate),
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
            const matchesProgram = !filterProgram || item.program === filterProgram;
            const matchesGroup = !filterGroup || item.studentGroup === filterGroup;
            const matchesSubject = !filterSubject || 
                item.subject?.toLowerCase().includes(filterSubject.toLowerCase());
            const matchesStatus = !filterStatus || item.status === filterStatus;
            const matchesSearch = !searchQuery || 
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesProgram && matchesGroup && matchesSubject && matchesStatus && matchesSearch;
        });
    }, [assignments, filterProgram, filterGroup, filterSubject, filterStatus, searchQuery]);

    // Reset all filters
    const handleClearFilters = () => {
        setFilterProgram('');
        setFilterGroup('');
        setFilterSubject('');
        setFilterStatus('');
        setSearchQuery('');
    };

    // Download/Export Excel
    const handleDownloadClasswork = () => {
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
            'Program': item.program || 'Any',
            'Student Group': item.studentGroup || 'Any',
            'Classwork Date': item.classworkDate,
            'Status': item.status,
            'Estimated Duration (mins)': item.estimatedMinutes || '',
            'Assigned By': item.assignedBy || 'Instructor'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Classwork');
        XLSX.writeFile(workbook, `Classwork_Assignments_${dayjs().format('YYYY_MM_DD')}.xlsx`);
        
        notification.success({
            message: 'Export Successful',
            description: 'Classwork records exported to Excel.'
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
                        <span>Prog: {record.program || 'Any'}</span>
                        {record.studentGroup && <span className="ml-2 font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Group: {record.studentGroup}</span>}
                    </div>
                </div>
            )
        },
        {
            title: 'Classwork Date',
            key: 'classworkDate',
            sorter: (a, b) => new Date(a.classworkDate) - new Date(b.classworkDate),
            render: (_, record) => {
                const isOverdue = dayjs(record.classworkDate).isBefore(dayjs(), 'day') && record.status !== 'Completed';
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <CalendarOutlined className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                            <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                                {dayjs(record.classworkDate).format('DD MMM YYYY')}
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
                    <Tooltip title="Edit Classwork">
                        <Button 
                            type="text" 
                            icon={<EditOutlined className="text-blue-500" />} 
                            onClick={() => handleEditOpen(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Delete Classwork">
                        <Popconfirm
                            title="Delete Classwork"
                            description="Are you sure you want to delete this classwork assignment?"
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
                        Classwork
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Assign, track, and manage student classwork & activities. Configured in Firebase.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadClasswork}
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
                            Assign Classwork
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters panel */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <SearchOutlined /> Filter Classwork
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <Input 
                            placeholder="Search by title/desc..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            prefix={<SearchOutlined className="text-gray-400" />}
                            className="w-full"
                        />
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
                        >
                            {programs.map(p => (
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
                            disabled={!filterProgram}
                        >
                            {studentGroups
                                .filter(sg => !filterProgram || sg.program === filterProgram)
                                .map(sg => (
                                    <Select.Option key={sg.name} value={sg.name}>{sg.name}</Select.Option>
                                ))
                            }
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
                        showTotal: (total) => `Total ${total} activities`
                    }}
                    locale={{
                        emptyText: <Empty description="No classwork assignments found." />
                    }}
                />
            </div>

            {/* Form Modal */}
            <Modal
                title={editingRecord ? "Edit Classwork Assignment" : "Assign New Classwork"}
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
                        label="Classwork Title / Topic"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="program"
                            label="Program"
                            rules={[{ required: true, message: 'Please select Program' }]}
                        >
                            <Select 
                                placeholder="Select Program" 
                                showSearch
                                optionFilterProp="children"
                            >
                                {programs.map(p => (
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
                                placeholder="Select Student Group"
                                showSearch
                                optionFilterProp="children"
                            >
                                {studentGroups.map(sg => (
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
                            name="classworkDate"
                            label="Classwork Date"
                            rules={[{ required: true, message: 'Please pick a classwork date' }]}
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
