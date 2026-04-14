import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin, Button, Space, Table, Input } from 'antd';
import { 
    FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, 
    FiSave, FiPlus, FiTrash2
} from 'react-icons/fi';
import API from '../../services/api';

const ItemVariantSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        do_not_update_variants: 0,
        allow_rename_attribute_value: 0,
        fields: []
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            let data = {};
            
            try {
                // Primary method: fetch full doc including child tables
                const res = await API.post('/api/method/frappe.desk.form.load.getdoc', {
                    doctype: 'Item Variant Settings',
                    name: 'Item Variant Settings'
                });
                const doc = res.data?.docs?.[0] || res.data?.message?.docs?.[0];
                if (doc) data = doc;
            } catch (methodErr) {
                console.warn('getdoc failed, falling back to resource API:', methodErr);
                // Fallback to resource API
                const res = await API.get('/api/resource/Item Variant Settings');
                data = res.data?.data || {};
            }

            setSettings({
                do_not_update_variants: data.do_not_update_variants || 0,
                allow_rename_attribute_value: data.allow_rename_attribute_value || 0,
                fields: data.fields || [],
                name: data.name,
                modified: data.modified
            });
        } catch (err) {
            console.error('Error fetching item variant settings:', err);
            notification.error({ 
                message: 'Error', 
                description: 'Failed to load Item Variant Settings.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                doc: {
                    doctype: 'Item Variant Settings',
                    name: 'Item Variant Settings',
                    ...settings,
                    fields: settings.fields.map(f => ({ 
                        doctype: 'Item Variant Attribute', // Typical child table name for this setting
                        field_name: f.field_name 
                    }))
                },
                action: 'Save'
            };
            
            await API.post('/api/method/frappe.desk.form.save.savedocs', payload);
            notification.success({ message: 'Success', description: 'Item Variant Settings updated successfully.' });
            fetchSettings(); // Reload to get updated modified info
        } catch (err) {
            console.error('Error saving item variant settings:', err);
            const errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            notification.error({ 
                message: 'Save Failed', 
                description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) 
            });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleAddRow = () => {
        const newRow = { field_name: '' };
        setSettings(prev => ({
            ...prev,
            fields: [...prev.fields, newRow]
        }));
    };

    const handleDeleteRow = (index) => {
        const newFields = [...settings.fields];
        newFields.splice(index, 1);
        setSettings(prev => ({
            ...prev,
            fields: newFields
        }));
    };

    const handleTableFieldChange = (index, value) => {
        const newFields = [...settings.fields];
        newFields[index] = { ...newFields[index], field_name: value };
        setSettings(prev => ({
            ...prev,
            fields: newFields
        }));
    };

    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 bg-gray-50 p-2 border-b rounded-t text-[13px] mt-8 first:mt-0";
    const helpTextStyle = "text-[11px] text-gray-400 mt-1 leading-relaxed";

    const isEnabled = (value) => value === 1 || value === true || value === '1';

    const CheckboxField = ({ label, name, help }) => (
        <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded-sm border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer transition-all active:scale-95" 
                    checked={isEnabled(settings[name])} 
                    onChange={e => updateField(name, e.target.checked ? 1 : 0)} 
                />
                <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
            </label>
            {help && <p className={helpTextStyle + " ml-7"}>{help}</p>}
        </div>
    );

    const columns = [
        {
            title: 'No.',
            dataIndex: 'index',
            key: 'index',
            width: 60,
            render: (_, __, index) => <span className="text-gray-400 text-xs">{index + 1}</span>,
        },
        {
            title: 'Field Name',
            dataIndex: 'field_name',
            key: 'field_name',
            render: (text, _, index) => (
                <Input 
                    value={text} 
                    onChange={e => handleTableFieldChange(index, e.target.value)}
                    placeholder="e.g. item_group"
                    variant="borderless"
                    className="text-[13px] py-1"
                />
            ),
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_, __, index) => (
                <button 
                    onClick={() => handleDeleteRow(index)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                >
                    <FiTrash2 size={14} />
                </button>
            ),
        },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 bg-gray-50/20 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-2 rounded-t-lg">
                <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 mr-1" onClick={() => navigate(-1)}>
                        <FiChevronLeft size={18} />
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Item Variant Settings
                    </span>
                    <div className="flex gap-2 ml-1">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#F2F4F7] text-[#344054] font-bold border border-[#EAECF0]">Saved</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button className="h-8 text-[13px] border-gray-300">Help</Button>
                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>
                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <button 
                        className="px-6 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" 
                        onClick={handleSave} 
                        disabled={saving}
                    >
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiSave />} Save
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="animate-fade-in max-w-3xl">
                        <div className="mb-10">
                            <CheckboxField 
                                label="Do not update variants on save" 
                                name="do_not_update_variants" 
                                help="Fields will be copied over only at time of creation."
                            />
                            <CheckboxField 
                                label="Allow Rename Attribute Value" 
                                name="allow_rename_attribute_value" 
                                help="Rename Attribute Value in Item Attribute."
                            />
                        </div>

                        <div className="mt-10">
                            <h2 className={sectionTitleStyle}>Copy Fields to Variant</h2>
                            <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                                <Table 
                                    dataSource={settings.fields} 
                                    columns={columns} 
                                    pagination={{
                                        pageSize: 20,
                                        showSizeChanger: false,
                                        size: 'small',
                                        className: 'custom-table-pagination',
                                        position: ['bottomRight']
                                    }} 
                                    size="small"
                                    className="custom-variant-table"
                                    rowKey={(record, index) => index}
                                />
                                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-start">
                                    <button 
                                        onClick={handleAddRow}
                                        className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        <FiPlus size={14} /> Add Row
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-variant-table .ant-table-thead > tr > th {
                    background: #f9fafb !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #6b7280 !important;
                    padding: 8px 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }
                .custom-variant-table .ant-table-tbody > tr > td {
                    padding: 4px 16px !important;
                    border-bottom: 1px solid #f9fafb !important;
                }
                .custom-table-pagination {
                    margin: 12px 16px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                }
                .custom-table-pagination .ant-pagination-item {
                    border-radius: 4px !important;
                    border: 1px solid #e5e7eb !important;
                    height: 28px !important;
                    min-width: 28px !important;
                    line-height: 26px !important;
                    font-size: 12px !important;
                }
                .custom-table-pagination .ant-pagination-item-active {
                    background: #f9f9f9 !important;
                    border-color: #d1d5db !important;
                }
                .custom-table-pagination .ant-pagination-item-active a {
                    color: #111827 !important;
                    font-weight: 600 !important;
                }
                .custom-table-pagination .ant-pagination-prev,
                .custom-table-pagination .ant-pagination-next {
                    height: 28px !important;
                    line-height: 26px !important;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ItemVariantSettings;
