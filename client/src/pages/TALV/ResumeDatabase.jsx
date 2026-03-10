import React, { useState, useEffect } from 'react';
import { Table, Input, Card, Tag, Button, Space, Drawer, Typography, Empty, Pagination, Modal, Form, message, Popconfirm, Select, Divider } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, MailOutlined, PhoneOutlined, EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

export default function ResumeDatabase() {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

    // Filters
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState('');

    // View State
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedResume, setSelectedResume] = useState(null);

    // Edit Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchResumes();
    }, [pagination.current, search, skillFilter]);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            let url = `/local-api/api/resumes?page=${pagination.current}&limit=${pagination.pageSize}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (skillFilter) url += `&skills=${encodeURIComponent(skillFilter)}`;

            const { data } = await api.get(url);
            if (data.success) {
                setResumes(data.data);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch resumes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const viewResume = (record) => {
        setSelectedResume(record);
        setView('detail');
    };

    const handleEdit = (record) => {
        setSelectedResume(record);
        // De-duplicate skills and clean up name if "Email" was accidentally appended
        const uniqueSkills = [...new Set(record.skills || [])];
        const cleanName = (record.name || '').replace(/Email$/i, '').trim();

        editForm.setFieldsValue({
            name: cleanName,
            email: record.email,
            phone: record.phone,
            skills: uniqueSkills,
            objective: record.objective,
            experience: record.experience || [],
            education: record.education || [],
            profiles: record.profiles || []
        });
        setEditModalVisible(true);
    };

    const handleAddNew = () => {
        setSelectedResume(null);
        editForm.resetFields();
        setEditModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const { data } = await api.delete(`/local-api/api/resumes/${id}`);
            if (data.success) {
                message.success('Resume deleted successfully');
                fetchResumes();
            }
        } catch (error) {
            console.error('Failed to delete resume:', error);
            message.error('Failed to delete resume');
        }
    };

    const handleUpdate = async (values) => {
        setUpdating(true);
        try {
            const isEdit = !!selectedResume?._id;
            const url = isEdit
                ? `/local-api/api/resumes/${selectedResume._id}`
                : `/local-api/api/resumes`;

            const method = isEdit ? 'put' : 'post';

            const { data } = await api[method](url, values);

            if (data.success) {
                message.success(`Resume ${isEdit ? 'updated' : 'created'} successfully`);
                setEditModalVisible(false);
                fetchResumes();
            }
        } catch (error) {
            console.error('Failed to save resume:', error);
            message.error('Failed to save resume');
        } finally {
            setUpdating(false);
        }
    };

    const columns = [
        {
            title: 'Candidate Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div className="font-semibold text-gray-800">{text}</div>
                    <div className="text-xs text-gray-500 truncate w-40" title={record.email}>
                        {record.email || 'No email provided'}
                    </div>
                </div>
            )
        },
        {
            title: 'Top Skills',
            dataIndex: 'skills',
            key: 'skills',
            render: (skills) => (
                <div className="flex flex-wrap gap-1 max-w-[250px]">
                    {skills && skills.slice(0, 4).map((skill, index) => (
                        <Tag color="blue" key={index} className="text-[10px] m-0 border-blue-100 bg-blue-50 text-blue-600">
                            {skill}
                        </Tag>
                    ))}
                    {skills && skills.length > 4 && (
                        <Tag className="text-[10px] m-0 border-gray-100 bg-gray-50">+{skills.length - 4}</Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Recent Experience',
            dataIndex: 'experience',
            key: 'experience',
            render: (exp) => {
                if (!exp || exp.length === 0) return <span className="text-gray-400">Not parsed</span>;
                const recent = exp[0];
                return (
                    <div>
                        <div className="text-sm font-medium">{recent.title || 'Unknown Title'}</div>
                        <div className="text-xs text-gray-500">{recent.company || 'Unknown Company'}</div>
                    </div>
                )
            }
        },
        {
            title: 'Uploaded At',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined className="text-blue-600" />}
                        onClick={() => viewResume(record)}
                        title="View Details"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-orange-500" />}
                        onClick={() => handleEdit(record)}
                        title="Edit"
                    />
                    <Popconfirm
                        title="Delete resume?"
                        description="Are you sure you want to delete this resume?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            icon={<DeleteOutlined className="text-red-500" />}
                            title="Delete"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (view === 'detail' && selectedResume) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Button
                                type="text"
                                icon={<PlusOutlined className="rotate-[225deg]" />}
                                onClick={() => setView('list')}
                                className="text-gray-500 hover:text-gray-700"
                            />
                            <h1 className="text-xl font-semibold text-gray-800">
                                Candidate Profile: {selectedResume.name}
                            </h1>
                        </div>
                        <Space>
                            <Button onClick={() => setView('list')}>Back to List</Button>
                            <Button
                                type="primary"
                                ghost
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(selectedResume)}
                                className="border-blue-600 text-blue-600"
                            >
                                Edit
                            </Button>
                            <Popconfirm
                                title="Delete resume?"
                                onConfirm={() => {
                                    handleDelete(selectedResume._id);
                                    setView('list');
                                }}
                            >
                                <Button danger icon={<DeleteOutlined />}>Delete</Button>
                            </Popconfirm>
                        </Space>
                    </div>

                    <nav className="text-xs text-gray-400 mb-6">
                        <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>RESUME DATABASE</span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600">{selectedResume.name}</span>
                    </nav>

                    <Space direction="vertical" size="large" className="w-full">
                        {/* Profile Info Card */}
                        <Card className="shadow-sm border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                        {selectedResume.name[0]}
                                    </div>
                                    <div>
                                        <Title level={2} className="m-0 text-gray-800">{selectedResume.name}</Title>
                                        <Space className="text-gray-500 mt-1" size="middle">
                                            {selectedResume.email && <span className="flex items-center gap-1"><MailOutlined /> {selectedResume.email}</span>}
                                            {selectedResume.phone && <span className="flex items-center gap-1"><PhoneOutlined /> {selectedResume.phone}</span>}
                                        </Space>
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    href={`/local-api${selectedResume.fileUrl}`}
                                    target="_blank"
                                    className="bg-[#2b3674] border-none font-medium"
                                    size="large"
                                >
                                    Open Original File
                                </Button>
                            </div>
                        </Card>

                        {/* Professional Summary */}
                        {selectedResume.objective && (
                            <section>
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Professional Summary</h3>
                                <Card className="shadow-sm border-gray-200 bg-white">
                                    <Paragraph className="text-gray-600 text-[15px] leading-relaxed m-0">
                                        {selectedResume.objective}
                                    </Paragraph>
                                </Card>
                            </section>
                        )}

                        {/* Summary / Skills */}
                        <section>
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Extracted Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedResume.skills && selectedResume.skills.map((skill, index) => (
                                    <Tag key={index} className="px-4 py-1.5 rounded-md border-blue-100 bg-blue-50 text-blue-600 font-medium text-sm">
                                        {skill}
                                    </Tag>
                                ))}
                            </div>
                        </section>

                        {/* Experience */}
                        <section>
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Experience</h3>
                            <Space direction="vertical" className="w-full" size="middle">
                                {selectedResume.experience && selectedResume.experience.length > 0 ? (
                                    selectedResume.experience.map((exp, idx) => (
                                        <Card key={idx} className="shadow-sm border-gray-200">
                                            <div className="flex justify-between">
                                                <Title level={5} className="m-0 text-gray-800">{exp.title}</Title>
                                                <Text type="secondary" className="text-xs uppercase font-bold text-gray-400 italic">Experience {idx + 1}</Text>
                                            </div>
                                            <div className="text-blue-600 font-medium mt-1">{exp.company}</div>
                                            {exp.dates && <div className="text-gray-400 text-xs mt-1">{exp.dates}</div>}
                                            {exp.description && (
                                                <Paragraph className="mt-3 text-gray-600 text-sm whitespace-pre-wrap border-l-2 border-gray-100 pl-4 italic">
                                                    {exp.description}
                                                </Paragraph>
                                            )}
                                        </Card>
                                    ))
                                ) : (
                                    <Empty description="No experience data available" />
                                )}
                            </Space>
                        </section>

                        {/* Education */}
                        <section>
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Education</h3>
                            <Space direction="vertical" className="w-full" size="middle">
                                {selectedResume.education && selectedResume.education.length > 0 ? (
                                    selectedResume.education.map((edu, idx) => (
                                        <Card key={idx} className="shadow-sm border-gray-200">
                                            <div className="flex justify-between">
                                                <Title level={5} className="m-0 text-gray-800">{edu.degree || edu.qualification}</Title>
                                                <Text type="secondary" className="text-xs uppercase font-bold text-gray-400 italic">Education {idx + 1}</Text>
                                            </div>
                                            <div className="text-gray-700 font-medium mt-1">{edu.school || edu.university}</div>
                                            {edu.dates && <div className="text-gray-400 text-xs mt-1">{edu.dates}</div>}
                                            {edu.description && <Paragraph className="mt-2 text-gray-500 text-sm">{edu.description}</Paragraph>}
                                        </Card>
                                    ))
                                ) : (
                                    <Empty description="No education data available" />
                                )}
                            </Space>
                        </section>

                        {/* Social Profiles */}
                        {selectedResume.profiles && selectedResume.profiles.length > 0 && (
                            <section className="pb-10">
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Social Profiles</h3>
                                <Space wrap>
                                    {selectedResume.profiles.map((profile, idx) => (
                                        <Button key={idx} ghost className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 flex items-center gap-2">
                                            <span className="font-semibold">{profile.network || 'Profile'}:</span>
                                            <span>{profile.url || profile.username || 'Link'}</span>
                                        </Button>
                                    ))}
                                </Space>
                            </section>
                        )}
                    </Space>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <nav className="text-xs text-gray-500 mb-1">HOME {'>'} TA & LV {'>'} RESUME DATABASE</nav>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Resume Database</h1>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddNew}
                        className="bg-blue-600 font-medium h-10 px-6 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        New Resume Record
                    </Button>
                </div>

                <Card className="shadow-sm border-gray-200 rounded-lg mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <Input.Search
                            placeholder="Search by keywords across resumes..."
                            allowClear
                            onSearch={handleSearch}
                            className="w-full sm:w-96 rounded shadow-sm"
                            size="large"
                        />
                        <Input
                            placeholder="Filter by specific skill (e.g. React, Python)"
                            allowClear
                            value={skillFilter}
                            onChange={(e) => setSkillFilter(e.target.value)}
                            onPressEnter={() => setPagination(prev => ({ ...prev, current: 1 }))}
                            onBlur={() => setPagination(prev => ({ ...prev, current: 1 }))}
                            prefix={<FilterOutlined className="text-gray-400" />}
                            className="w-full sm:w-64 rounded shadow-sm"
                            size="large"
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={resumes}
                        rowKey="_id"
                        loading={loading}
                        pagination={false}
                        className="border border-gray-100 rounded-md"
                    />

                    <div className="mt-4 flex justify-end">
                        <Pagination
                            current={pagination.current}
                            total={total}
                            pageSize={pagination.pageSize}
                            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
                            showSizeChanger={false}
                        />
                    </div>
                </Card>



                {/* Edit/Create Modal */}
                <Modal
                    title={selectedResume?._id ? "Edit Resume Details" : "Create New Resume Entry"}
                    open={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    onOk={() => editForm.submit()}
                    confirmLoading={updating}
                    width={600}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleUpdate}
                        className="mt-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="name"
                                label="Candidate Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="Email Address"
                                rules={[{ type: 'email', message: 'Please enter valid email' }]}
                            >
                                <Input />
                            </Form.Item>
                        </div>
                        <Form.Item
                            name="phone"
                            label="Phone Number"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="skills"
                            label="Skills (Type and press Enter or use commas)"
                        >
                            <Select
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="Add skills"
                                tokenSeparators={[',']}
                                options={[...new Set(resumes.flatMap(r => r.skills || []))].map(s => ({ value: s, label: s }))}
                            />
                        </Form.Item>
                        <Form.Item
                            name="objective"
                            label="Professional Summary"
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Divider orientation="left">Experience</Divider>
                        <Form.List name="experience">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            size="small"
                                            className="mb-3 bg-gray-50"
                                            key={key}
                                            extra={<MinusCircleOutlined onClick={() => remove(name)} className="text-red-500" />}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'title']}
                                                    label="Job Title"
                                                >
                                                    <Input placeholder="e.g. Senior Developer" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'company']}
                                                    label="Company"
                                                >
                                                    <Input placeholder="e.g. Google" />
                                                </Form.Item>
                                            </div>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'date']}
                                                label="Duration / Dates"
                                            >
                                                <Input placeholder="e.g. Jan 2020 - Present" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                                label="Description"
                                            >
                                                <Input.TextArea rows={2} />
                                            </Form.Item>
                                        </Card>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Experience
                                    </Button>
                                </>
                            )}
                        </Form.List>

                        <Divider orientation="left" className="mt-6">Education</Divider>
                        <Form.List name="education">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            size="small"
                                            className="mb-3 bg-gray-50"
                                            key={key}
                                            extra={<MinusCircleOutlined onClick={() => remove(name)} className="text-red-500" />}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'degree']}
                                                    label="Degree / Qualification"
                                                >
                                                    <Input placeholder="e.g. Bachelor of Science" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'school']}
                                                    label="School / University"
                                                >
                                                    <Input placeholder="e.g. Stanford University" />
                                                </Form.Item>
                                            </div>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'date']}
                                                label="Dates"
                                            >
                                                <Input placeholder="e.g. 2016 - 2020" />
                                            </Form.Item>
                                        </Card>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Education
                                    </Button>
                                </>
                            )}
                        </Form.List>

                        <Divider orientation="left" className="mt-6">Social Profiles</Divider>
                        <Form.List name="profiles">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            size="small"
                                            className="mb-3 bg-gray-50"
                                            key={key}
                                            extra={<MinusCircleOutlined onClick={() => remove(name)} className="text-red-500" />}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'network']}
                                                    label="Network"
                                                >
                                                    <Input placeholder="LinkedIn, GitHub, etc." />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'url']}
                                                    label="Profile URL"
                                                >
                                                    <Input placeholder="https://..." />
                                                </Form.Item>
                                            </div>
                                        </Card>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Profile
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

