import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { notification, Tabs, Modal, Input, InputNumber, Button, Select, Spin, Table, Tag } from 'antd';
import axios from 'axios';
import { useUserRole } from '../../hooks/useUserRole';

const { TabPane } = Tabs;
const { Option } = Select;
import { Radio } from 'antd';

const FeesDiscountScreen = () => {
    const { systemCode } = useUserRole();
    const currentSystemCode = 'schooler_system'; // Hardcoded to main system collection as requested

    // Tabs
    const [activeTab, setActiveTab] = useState('categories');

    // --- Discount Categories State ---
    const [discounts, setDiscounts] = useState([]);
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', percentage: 0, description: '' });

    // --- Assignment State ---
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [dropdowns, setDropdowns] = useState({ students: [], academicYears: [], programs: [], terms: [], boards: [], studentGroups: [] });
    const [assignForm, setAssignForm] = useState({ discount_id: '', academic_year: '', target_type: 'specific', program: '', board: '', terms: [] });
    const [assignFilters, setAssignFilters] = useState({ board: '', program: '', student_group: '', search: '' });
    const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchDiscounts();
        if (activeTab === 'assignments') {
            fetchAssignments();
            fetchDropdowns();
        }
    }, [activeTab, currentSystemCode]);

    // --- Category Logic ---
    const fetchDiscounts = async () => {
        setLoadingDiscounts(true);
        try {
            const colRef = collection(db, currentSystemCode, 'data', 'fees_discounts');
            const snapshot = await getDocs(colRef);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDiscounts(data);
        } catch (err) {
            console.error('Error fetching discounts:', err);
            notification.error({ message: 'Error fetching discounts' });
        } finally {
            setLoadingDiscounts(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || categoryForm.percentage <= 0) {
            notification.warning({ message: 'Name and Percentage (>0) are required' });
            return;
        }
        try {
            const colRef = collection(db, currentSystemCode, 'data', 'fees_discounts');
            if (editingCategory) {
                await updateDoc(doc(db, currentSystemCode, 'data', 'fees_discounts', editingCategory.id), categoryForm);
                notification.success({ message: 'Discount updated' });
            } else {
                await addDoc(colRef, { ...categoryForm, createdAt: new Date().toISOString() });
                notification.success({ message: 'Discount added' });
            }
            setIsCategoryModalVisible(false);
            fetchDiscounts();
        } catch (err) {
            console.error('Save category error:', err);
            notification.error({ message: 'Error saving discount' });
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this discount?')) return;
        try {
            await deleteDoc(doc(db, currentSystemCode, 'data', 'fees_discounts', id));
            notification.success({ message: 'Discount deleted' });
            fetchDiscounts();
        } catch (err) {
            console.error('Delete category error:', err);
            notification.error({ message: 'Error deleting discount' });
        }
    };

    const openCategoryModal = (record = null) => {
        if (record) {
            setEditingCategory(record);
            setCategoryForm({ name: record.name, percentage: record.percentage, description: record.description || '' });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', percentage: 0, description: '' });
        }
        setIsCategoryModalVisible(true);
    };

    // --- Assignment Logic ---
    const fetchDropdowns = async () => {
        try {
            const [sRes, yRes, pRes, tRes, cRes, sgRes] = await Promise.all([
                API.get('/api/resource/Student', { params: { fields: JSON.stringify(["name", "student_name", "program", "custom_board"]), limit_page_length: 'None' } }).catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Program?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Fee Category?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Group?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setDropdowns({
                students: sRes.data.data?.map(d => ({
                    id: d.name,
                    name: d.student_name || d.name,
                    program: d.program || '',
                    board: d.custom_board || '',
                    student_group: ''
                })) || [],
                boards: cRes.data.data?.map(c => c.name) || [...new Set((sRes.data.data || []).map(d => d.custom_board).filter(Boolean))].sort(),
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                terms: tRes.data.data?.map(d => d.name) || [],
                studentGroups: sgRes.data.data?.map(d => d.name) || []
            });
        } catch (err) {
            console.error('Dropdown fetch error:', err);
        }
    };

    const fetchAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const colRef = collection(db, currentSystemCode, 'data', 'student_discounts');
            const snapshot = await getDocs(colRef);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Attach discount info
            const discountsMap = discounts.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
            const enriched = data.map(d => ({
                ...d,
                discount_name: discountsMap[d.discount_id]?.name || 'Unknown Discount',
                percentage: discountsMap[d.discount_id]?.percentage || 0
            }));
            setAssignments(enriched);
        } catch (err) {
            console.error('Fetch assignments error:', err);
            notification.error({ message: 'Error fetching assignments' });
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleAssignDiscount = async () => {
        if (!assignForm.discount_id || !assignForm.academic_year) {
            notification.warning({ message: 'Please select Academic Year and Discount Category' });
            return;
        }

        if (selectedStudentKeys.length === 0) {
            notification.warning({ message: 'Please select at least one student from the table' });
            return;
        }

        setAssigning(true);
        try {
            await Promise.all(selectedStudentKeys.map(stId => 
                axios.post('/local-api/payment/assign-discount', {
                    systemCode: currentSystemCode,
                    discount_id: assignForm.discount_id,
                    student_id: stId,
                    academic_year: assignForm.academic_year,
                    terms: assignForm.terms || []
                }, { withCredentials: true })
            ));
            
            notification.success({ message: `Discount assigned to ${selectedStudentKeys.length} student(s) successfully` });
            setIsAssignModalVisible(false);
            setSelectedStudentKeys([]);
            fetchAssignments();
        } catch (err) {
            console.error('Assign error:', err);
            notification.error({ message: 'Error assigning discount', description: err.response?.data?.message || err.message });
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm('Are you sure you want to remove this discount? This will automatically revert the ERPNext fees back to the original price.')) return;
        try {
            const res = await axios.post('/local-api/payment/remove-discount', {
                systemCode: currentSystemCode,
                assignment_id: id
            }, { withCredentials: true });
            notification.success({ message: 'Assignment removed', description: res.data.message });
            fetchAssignments();
        } catch (err) {
            console.error('Delete assignment error:', err);
            notification.error({ message: 'Error removing assignment', description: err.response?.data?.message || err.message });
        }
    };

    const categoryColumns = [
        { title: 'Discount Name', dataIndex: 'name', key: 'name', className: 'font-semibold' },
        { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', render: val => <Tag color="blue">{val}%</Tag> },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Action', key: 'action', render: (_, record) => (
                <div className="flex gap-2">
                    <Button type="link" onClick={() => openCategoryModal(record)}>Edit</Button>
                    <Button type="link" danger onClick={() => handleDeleteCategory(record.id)}>Delete</Button>
                </div>
            )
        }
    ];

    const assignmentColumns = [
        { title: 'Student ID', dataIndex: 'student_id', key: 'student_id', className: 'font-semibold' },
        { title: 'Student Name', dataIndex: 'student_name', key: 'student_name' },
        { 
            title: 'Board', 
            key: 'board', 
            render: (_, record) => {
                const s = dropdowns.students.find(st => st.id === record.student_id);
                return s?.board ? <Tag color="cyan">{s.board}</Tag> : <span className="text-gray-400">-</span>;
            } 
        },
        { title: 'Academic Year', dataIndex: 'academic_year', key: 'academic_year' },
        { 
            title: 'Terms', 
            dataIndex: 'terms', 
            key: 'terms', 
            render: terms => terms && terms.length > 0 ? terms.map(t => <Tag color="green" key={t}>{t}</Tag>) : <Tag color="default">All Terms</Tag> 
        },
        { title: 'Discount', dataIndex: 'discount_name', key: 'discount_name' },
        { title: 'Percentage', dataIndex: 'percentage', key: 'percentage', render: val => <Tag color="blue">{val}%</Tag> },
        {
            title: 'Action', key: 'action', render: (_, record) => (
                <Button type="link" danger onClick={() => handleDeleteAssignment(record.id)}>Remove</Button>
            )
        }
    ];

    const assignTableColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
        { title: 'Student Name', dataIndex: 'name', key: 'name' },
        { title: 'Program', dataIndex: 'program', key: 'program', width: 120 },
        { title: 'Board', dataIndex: 'board', key: 'board', width: 150 },
        { title: 'Section', dataIndex: 'student_group', key: 'student_group', width: 150 },
    ];

    const filteredStudentsForAssign = React.useMemo(() => {
        return dropdowns.students.filter(s => {
            if (assignFilters.board && s.board !== assignFilters.board) return false;
            if (assignFilters.program && s.program !== assignFilters.program) return false;
            if (assignFilters.student_group && s.student_group !== assignFilters.student_group) return false;
            if (assignFilters.search) {
                const q = assignFilters.search.toLowerCase();
                if (!s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [dropdowns.students, assignFilters]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Fees Discount Management</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                    <TabPane tab={<span className="font-semibold px-4">Discount Categories</span>} key="categories">
                        <div className="mb-4 flex justify-end">
                            <Button type="primary" onClick={() => openCategoryModal()}>+ New Category</Button>
                        </div>
                        <Table
                            dataSource={discounts}
                            columns={categoryColumns}
                            rowKey="id"
                            loading={loadingDiscounts}
                            pagination={false}
                            className="border rounded-lg shadow-sm"
                        />
                    </TabPane>

                    <TabPane tab={<span className="font-semibold px-4">Student Assignments</span>} key="assignments">
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-sm text-gray-500">Assign discounts to students for specific academic years. This will automatically update their ERPNext outstanding fees.</p>
                            <Button type="primary" onClick={() => setIsAssignModalVisible(true)}>+ Assign Discount</Button>
                        </div>
                        <Table
                            dataSource={assignments}
                            columns={assignmentColumns}
                            rowKey="id"
                            loading={loadingAssignments}
                            pagination={false}
                            className="border rounded-lg shadow-sm"
                        />
                    </TabPane>
                </Tabs>
            </div>

            {/* Category Modal */}
            <Modal
                title={editingCategory ? "Edit Discount Category" : "New Discount Category"}
                visible={isCategoryModalVisible}
                onOk={handleSaveCategory}
                onCancel={() => setIsCategoryModalVisible(false)}
                okText="Save"
            >
                <div className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount Name *</label>
                        <Input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Staff Discount" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Percentage (%) *</label>
                        <InputNumber min={0} max={100} value={categoryForm.percentage} onChange={val => setCategoryForm({ ...categoryForm, percentage: val })} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Input.TextArea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} />
                    </div>
                </div>
            </Modal>

            {/* Assign Modal */}
            <Modal
                title="Assign Bulk Discount to Students"
                visible={isAssignModalVisible}
                onCancel={() => setIsAssignModalVisible(false)}
                width={1000}
                footer={null}
            >
                <div className="flex flex-col space-y-4">
                    {/* Top Filters */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded border">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Filter Board</label>
                            <Select allowClear className="w-full" placeholder="All Boards" value={assignFilters.board} onChange={v => setAssignFilters({...assignFilters, board: v})}>
                                {dropdowns.boards.map(b => <Option key={b} value={b}>{b}</Option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Filter Class/Program</label>
                            <Select allowClear className="w-full" placeholder="All Classes" value={assignFilters.program} onChange={v => setAssignFilters({...assignFilters, program: v})}>
                                {dropdowns.programs.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Filter Section/Group</label>
                            <Select allowClear className="w-full" placeholder="All Sections" value={assignFilters.student_group} onChange={v => setAssignFilters({...assignFilters, student_group: v})}>
                                {dropdowns.studentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search Student</label>
                            <Input placeholder="Search name or ID..." value={assignFilters.search} onChange={e => setAssignFilters({...assignFilters, search: e.target.value})} allowClear />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded">
                        <Table 
                            rowSelection={{
                                selectedRowKeys: selectedStudentKeys,
                                onChange: (selectedRowKeys) => setSelectedStudentKeys(selectedRowKeys)
                            }}
                            columns={assignTableColumns} 
                            dataSource={filteredStudentsForAssign} 
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            size="small"
                        />
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-100 rounded">
                        <div className="flex-1 flex space-x-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-800 mb-1">Target Academic Year *</label>
                                <Select className="w-full" placeholder="Select Year" value={assignForm.academic_year} onChange={val => setAssignForm({ ...assignForm, academic_year: val })}>
                                    {dropdowns.academicYears.map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-800 mb-1">Discount Category *</label>
                                <Select className="w-full" placeholder="Select Discount" value={assignForm.discount_id} onChange={val => setAssignForm({ ...assignForm, discount_id: val })}>
                                    {discounts.map(d => <Option key={d.id} value={d.id}>{d.name} ({d.percentage}%)</Option>)}
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-800 mb-1">Terms (Optional)</label>
                                <Select mode="multiple" allowClear className="w-full" placeholder="All Terms" value={assignForm.terms} onChange={val => setAssignForm({ ...assignForm, terms: val })}>
                                    {dropdowns.terms.map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </div>
                        </div>
                        <div className="pt-5">
                            <Button type="primary" loading={assigning} onClick={handleAssignDiscount} disabled={selectedStudentKeys.length === 0} style={{ background: '#10b981', borderColor: '#10b981' }}>
                                Apply Discount to {selectedStudentKeys.length} Selected
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FeesDiscountScreen;
