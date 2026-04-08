import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin, Tooltip, Tabs, Dropdown, Button, Space } from 'antd';
import { 
    FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, 
    FiInfo, FiSave, FiChevronDown 
} from 'react-icons/fi';
import API from '../../services/api';

const StockSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});

    // Linked data
    const valuationMethods = ['FIFO', 'LIFO', 'Moving Average'];
    const itemNamingOptions = ['Item Code', 'Naming Series'];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // Try standard resource first
            try {
                const response = await API.get('/api/resource/Stock Settings');
                setSettings(response.data.data || {});
            } catch (resErr) {
                console.warn('Resource API failed for Stock Settings, trying method fallback...', resErr);
                // Fallback for Single DocTypes
                const fallback = await API.get('/api/method/frappe.client.get?doctype=Stock Settings');
                setSettings(fallback.data.message || {});
            }
        } catch (err) {
            console.error('Error fetching stock settings:', err);
            notification.error({ 
                message: 'Error', 
                description: 'Failed to load stock settings. Please check your connection.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put('/api/resource/Stock Settings', settings);
            notification.success({ message: 'Success', description: 'Stock Settings updated successfully.' });
        } catch (err) {
            console.error('Error saving stock settings:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Styling derived from StockEntry/Item
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 bg-gray-50 p-2 border-b rounded-t text-[13px] mt-8 first:mt-0";

    const CheckboxField = ({ label, name }) => (
        <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" 
                checked={!!settings[name]} 
                onChange={e => updateField(name, e.target.checked ? 1 : 0)} 
            />
            <span className="text-sm font-semibold text-gray-700">{label}</span>
        </label>
    );

    const SelectField = ({ label, name, options, help }) => (
        <div>
            <label className={labelStyle}>
                {label} {help && (
                    <Tooltip title={help}>
                        <FiInfo className="inline text-gray-400 cursor-help ml-1" size={12} />
                    </Tooltip>
                )}
            </label>
            <select className={inputStyle} value={settings[name] || ''} onChange={e => updateField(name, e.target.value)}>
                <option value="">Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const LinkField = ({ label, name, placeholder }) => (
        <div>
            <label className={labelStyle}>{label}</label>
            <input 
                className={inputStyle} 
                value={settings[name] || ''} 
                onChange={e => updateField(name, e.target.value)}
                placeholder={placeholder || `Select ${label}...`}
            />
        </div>
    );

    const tabItems = [
        {
            key: 'defaults',
            label: 'Defaults',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <h2 className={sectionTitleStyle}>Item Defaults</h2>
                            <SelectField label="Item Naming By" name="item_naming_by" options={itemNamingOptions} />
                            <SelectField 
                                label="Default Valuation Method" 
                                name="valuation_method" 
                                options={valuationMethods}
                                help="Valuation method for items if not specified in the item record"
                            />
                            <LinkField label="Default Item Group" name="default_item_group" />
                        </div>
                        <div className="space-y-6">
                            <h2 className={sectionTitleStyle}>&nbsp;</h2>
                            <LinkField label="Default Warehouse" name="default_warehouse" placeholder="Stores - Ketty" />
                            <LinkField label="Sample Retention Warehouse" name="sample_retention_warehouse" />
                            <LinkField label="Default Stock UOM" name="stock_uom" placeholder="Nos" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8">
                        <div>
                            <h2 className={sectionTitleStyle}>Price List Defaults</h2>
                            <CheckboxField label="Auto Insert Item Price If Missing" name="auto_insert_item_price_if_missing" />
                            <CheckboxField label="Update Existing Price List Rate" name="update_existing_price_list_rate" />
                        </div>
                        <div>
                            <h2 className={sectionTitleStyle}>Stock UOM Quantity</h2>
                            <CheckboxField label="Allow to Edit Stock UOM Qty for Sales Documents" name="allow_with_edit_stock_uom_qty_for_sales_documents" />
                            <CheckboxField label="Allow to Edit Stock UOM Qty for Purchase Documents" name="allow_with_edit_stock_qty_for_purchase_documents" />
                        </div>
                    </div>
                </div>
            )
        },
        { key: 'validations', label: 'Stock Validations', children: <div className="py-20 text-center text-gray-400 italic">No configuration fields in this section.</div> },
        { key: 'reservation', label: 'Stock Reservation', children: <div className="py-20 text-center text-gray-400 italic">No configuration fields in this section.</div> },
        { key: 'batch', label: 'Serial & Batch Item', children: <div className="py-20 text-center text-gray-400 italic">No configuration fields in this section.</div> },
        { key: 'planning', label: 'Stock Planning', children: <div className="py-20 text-center text-gray-400 italic">No configuration fields in this section.</div> },
        { key: 'closing', label: 'Stock Closing', children: <div className="py-20 text-center text-gray-400 italic">No configuration fields in this section.</div> }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 bg-gray-50/20 min-h-screen">
            {/* Standard Header matching StockEntry.jsx */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-2 rounded-t-lg">
                <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 mr-1" onClick={() => navigate(-1)}>
                        <FiChevronLeft size={18} />
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Stock Settings
                    </span>
                    <div className="flex gap-2 ml-1">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#F2F4F7] text-[#344054] font-bold border border-[#EAECF0]">Saved</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: [{ key: 'refresh', label: 'Refresh', onClick: fetchSettings }] }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300">
                            View <FiChevronDown />
                        </Button>
                    </Dropdown>

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
                    <Tabs defaultActiveKey="defaults" items={tabItems} className="custom-stock-tabs" />
                )}
            </div>

            <style jsx global>{`
                .custom-stock-tabs .ant-tabs-nav {
                    margin-bottom: 24px !important;
                }
                .custom-stock-tabs .ant-tabs-tab {
                    padding: 8px 0 12px 0 !important;
                    margin: 0 40px 0 0 !important;
                }
                .custom-stock-tabs .ant-tabs-tab-btn {
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #6b7280 !important;
                }
                .custom-stock-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600 !important;
                    color: #111827 !important;
                }
                .custom-stock-tabs .ant-tabs-ink-bar {
                    background: #111827 !important;
                    height: 2px !important;
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

export default StockSettings;
