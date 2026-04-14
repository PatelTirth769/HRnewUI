import React, { useEffect, useMemo, useState } from 'react';
import { notification, Select } from 'antd';
import API from '../../services/api';

const InputField = ({
    label,
    value,
    required = false,
    onChange,
    type = 'text',
    disabled = false
}) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options = [], disabled = false }) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <select
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value ?? ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
        >
            <option value="">Select...</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    </div>
);

const CheckboxField = ({ label, checked, onChange, disabled = false }) => (
    <label className={`flex items-center gap-2 py-1 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-[#1C1F26] focus:ring-[#1C1F26] focus:ring-offset-0 disabled:bg-gray-100"
            checked={!!checked}
            disabled={disabled}
            onChange={(e) => onChange && onChange(e.target.checked ? 1 : 0)}
        />
        <span className="text-sm text-gray-700">{label}</span>
    </label>
);

const isEnabled = (value) => value === 1 || value === true || value === '1';

export default function WarehouseMaster() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const [searchName, setSearchName] = useState('');

    const [formData, setFormData] = useState({});
    const [companies, setCompanies] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [docFields, setDocFields] = useState([]);
    const [accountsList, setAccountsList] = useState([]);
    const [accountSearch, setAccountSearch] = useState('');
    const [accountOptionsLoading, setAccountOptionsLoading] = useState(false);
    const [warehouseTypeOptions, setWarehouseTypeOptions] = useState([]);
    const [warehouseTypeSearch, setWarehouseTypeSearch] = useState('');
    const [warehouseTypeOptionsLoading, setWarehouseTypeOptionsLoading] = useState(false);

    const defaultForm = useMemo(() => {
        return {
            name: '',
            warehouse_name: '',
            is_group: 0,
            is_rejected_warehouse: 0,
            company: '',
            parent_warehouse: '',
            account: '',
            phone_no: '',
            mobile_no: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
            warehouse_type: '',
            default_in_transit_warehouse: ''
        };
    }, []);

    const updateField = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

    useEffect(() => {
        fetchMasters();
        fetchData();
        fetchDocTypeMeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Accounts / Warehouse Type dropdown options are loaded dynamically (search + filters)

    useEffect(() => {
        // When we have masters, set default company for new forms.
        if (view === 'form' && !editingRecord && companies?.length && !formData.company) {
            setFormData((p) => ({ ...p, company: p.company || companies[0].name }));
        }
    }, [companies, view, editingRecord, formData.company]);

    const fetchDocTypeMeta = async () => {
        try {
            const res = await API.get('/api/resource/DocType/Warehouse');
            const fields = res?.data?.data?.fields || [];
            setDocFields(Array.isArray(fields) ? fields : []);
        } catch (err) {
            // If permissions differ, fallback mapping will still work.
            setDocFields([]);
        }
    };

    const optionsFromDocField = (fieldname) => {
        if (!fieldname || !Array.isArray(docFields) || docFields.length === 0) return [];
        const df = docFields.find((d) => d?.fieldname === fieldname);
        const raw = df?.options;
        if (!raw || typeof raw !== 'string') return [];
        // ERPNext stores Select options as newline-separated
        return raw.split('\n').map((s) => s.trim()).filter(Boolean);
    };

    const fieldnameByLabel = (label, fallback) => {
        if (!label || !Array.isArray(docFields) || docFields.length === 0) return fallback;
        const f = docFields.find((df) => (df?.label || '').trim().toLowerCase() === label.trim().toLowerCase());
        return f?.fieldname || fallback;
    };

    const warehouseNameField = fieldnameByLabel('Warehouse Name', 'warehouse_name');
    const isGroupField = fieldnameByLabel('Is Group Warehouse', 'is_group');
    const parentWarehouseField = fieldnameByLabel('Parent Warehouse', 'parent_warehouse');
    const accountField = fieldnameByLabel('Account', 'account');
    const companyField = fieldnameByLabel('Company', 'company');
    const rejectedField = fieldnameByLabel('Is Rejected Warehouse', 'is_rejected_warehouse');

    const phoneField = fieldnameByLabel('Phone No', 'phone_no');
    const mobileField = fieldnameByLabel('Mobile No', 'mobile_no');
    const addressLine1Field = fieldnameByLabel('Address Line 1', 'address_line1');
    const addressLine2Field = fieldnameByLabel('Address Line 2', 'address_line2');
    const cityField = fieldnameByLabel('City', 'city');
    const stateField = fieldnameByLabel('State', 'state');
    const pinField = fieldnameByLabel('PIN', 'pincode');

    const warehouseTypeField = fieldnameByLabel('Warehouse Type', 'warehouse_type');
    const inTransitField = fieldnameByLabel('Default In-Transit Warehouse', 'default_in_transit_warehouse');
    
    const accountSelectOptions = useMemo(() => {
        return (accountsList || []).map((a) => ({
            value: a.name,
            label: a.account_name || a.name
        }));
    }, [accountsList]);

    const warehouseTypeSelectOptions = useMemo(() => {
        return (warehouseTypeOptions || []).map((w) => ({
            value: w.name,
            label: w.name
        }));
    }, [warehouseTypeOptions]);

    const fetchAccountOptions = async (term = '') => {
        try {
            setAccountOptionsLoading(true);
            const filters = [
                ['is_group', '=', 0],
                ['account_type', '=', 'Stock']
            ];

            const companyValue = formData?.[companyField];
            if (companyValue) {
                filters.push(['company', '=', companyValue]);
            }

            const search = (term || '').trim();
            if (search) {
                // Search on account_name (ERPNext Link field uses account_name search)
                filters.push(['account_name', 'like', `%${search}%`]);
            }

            const filtersStr = JSON.stringify(filters);
            const url = `/api/resource/Account?fields=["name","account_name"]&limit_page_length=25&order_by=account_name asc&filters=${encodeURIComponent(filtersStr)}`;
            const accRes = await API.get(url);
            setAccountsList(accRes.data?.data || []);
        } catch (err) {
            console.error('Fetch accounts failed:', err);
            setAccountsList([]);
        } finally {
            setAccountOptionsLoading(false);
        }
    };

    const fetchWarehouseTypeOptions = async (term = '') => {
        try {
            setWarehouseTypeOptionsLoading(true);
            const search = (term || '').trim();
            const filters = [];
            if (search) {
                filters.push(['name', 'like', `%${search}%`]);
            }
            const filtersStr = filters.length ? JSON.stringify(filters) : '[]';
            const url = `/api/resource/Warehouse Type?fields=["name"]&limit_page_length=25&order_by=name asc&filters=${encodeURIComponent(filtersStr)}`;
            const whTypeRes = await API.get(url);
            setWarehouseTypeOptions(whTypeRes.data?.data || []);
        } catch (err) {
            console.error('Fetch warehouse types failed:', err);
            setWarehouseTypeOptions([]);
        } finally {
            setWarehouseTypeOptionsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            // Load first list for current company on open
            fetchAccountOptions(accountSearch);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountSearch, formData?.[companyField], companyField]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWarehouseTypeOptions(warehouseTypeSearch);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warehouseTypeSearch]);

    const fetchMasters = async () => {
        try {
            const [whRes, cmpRes] = await Promise.all([
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name","company"]&limit_page_length=500'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500')
            ]);
            setWarehousesList(whRes.data?.data || []);
            setCompanies(cmpRes.data?.data || []);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const url =
                '/api/resource/Warehouse?fields=["name","warehouse_name","company"]&limit_page_length=500&order_by=modified desc';
            const res = await API.get(url);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch warehouses failed:', err);
            notification.error({ message: 'Failed to load Warehouses' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Warehouse/${encodeURIComponent(name)}`);
            if (res.data?.data) {
                setFormData({ ...defaultForm, ...res.data.data });
            }
        } catch (err) {
            console.error('Fetch single warehouse failed:', err);
            notification.error({ message: 'Failed to load Warehouse details' });
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    const handleSave = async () => {
        if (!formData[warehouseNameField] && !formData.name) {
            notification.warning({ message: 'Warehouse Name is required' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                [warehouseNameField]: formData[warehouseNameField] ?? formData.name ?? formData.warehouse_name ?? '',
                name: formData.name ?? formData[warehouseNameField] ?? '',
                [companyField]: formData[companyField] ?? '',
                [isGroupField]: isEnabled(formData?.[isGroupField]) ? 1 : 0,
                [parentWarehouseField]: formData[parentWarehouseField] ?? '',
                [accountField]: formData[accountField] ?? '',
                [rejectedField]: isEnabled(formData?.[rejectedField]) ? 1 : 0,
                [phoneField]: formData[phoneField] ?? '',
                [mobileField]: formData[mobileField] ?? '',
                [addressLine1Field]: formData[addressLine1Field] ?? '',
                [addressLine2Field]: formData[addressLine2Field] ?? '',
                [cityField]: formData[cityField] ?? '',
                [stateField]: formData[stateField] ?? '',
                [pinField]: formData[pinField] ?? '',
                [warehouseTypeField]: formData[warehouseTypeField] ?? '',
                [inTransitField]: formData[inTransitField] ?? ''
            };

            if (editingRecord) {
                await API.put(`/api/resource/Warehouse/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Warehouse', payload);
                const createdName = res?.data?.data?.name || payload.name || payload[warehouseNameField];
                notification.success({ message: `"${createdName}" created successfully!` });
            }

            setView('list');
            setEditingRecord(null);
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            const errMsg =
                err?.response?.data?._server_messages || err?.response?.data?.message || err?.message || 'Save Failed';
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Warehouse/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            const errMsg =
                err?.response?.data?._server_messages || err?.response?.data?.exc || err?.message || 'Delete Failed';
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchName.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => {
            const n = (d.warehouse_name || d.name || '').toLowerCase();
            return n.includes(term);
        });
    }, [data, searchName]);

    const companyWarehouses = useMemo(() => {
        const company = formData?.[companyField];
        const list = warehousesList || [];
        return !company ? list : list.filter((w) => !w.company || w.company === company);
    }, [warehousesList, formData, companyField]);

    const warehouseOptions = useMemo(() => {
        return companyWarehouses.map((w) => ({
            value: w.name,
            label: w.warehouse_name || w.name
        }));
    }, [companyWarehouses]);

    if (view === 'form') {
        const isGroup = isEnabled(formData?.[isGroupField]);
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <style>{`
                    details summary { list-style: none; }
                    details summary::-webkit-details-marker { display: none; }
                `}</style>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 relative">
                        <button className="text-gray-500 hover:text-gray-700 text-lg transition-colors p-1" onClick={() => setView('list')}>
                            ←
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Warehouse'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#E02424] font-medium tracking-wide uppercase shadow-sm">
                                Not Saved
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-5 py-2 min-w-[100px] bg-gray-100/80 text-gray-600 text-sm font-medium rounded shadow-sm border border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                            onClick={() => setView('list')}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-6 py-2 min-w-[100px] bg-[#1C1F26] text-white text-[14px] font-medium rounded shadow-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <InputField
                                    label="Warehouse Name"
                                    value={formData?.[warehouseNameField] ?? formData.name ?? ''}
                                    required
                                    onChange={(v) => {
                                        updateField('name', v);
                                        updateField('warehouse_name', v);
                                        updateField(warehouseNameField, v);
                                    }}
                                    disabled={!!editingRecord}
                                />

                                <CheckboxField
                                    label="Is Group Warehouse"
                                    checked={isEnabled(formData?.[isGroupField])}
                                    onChange={(v) => updateField(isGroupField, v)}
                                    disabled={!!editingRecord && false}
                                />

                                <SelectField
                                    label="Parent Warehouse"
                                    value={formData?.[parentWarehouseField] ?? ''}
                                    options={warehouseOptions}
                                    disabled={isGroup}
                                    onChange={(v) => updateField(parentWarehouseField, v)}
                                />

                                <CheckboxField
                                    label="Is Rejected Warehouse"
                                    checked={isEnabled(formData?.[rejectedField])}
                                    onChange={(v) => updateField(rejectedField, v)}
                                />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Account</label>
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Select Account..."
                                        value={formData?.[accountField] ?? undefined}
                                        loading={accountOptionsLoading}
                                        filterOption={false}
                                        onSearch={(v) => setAccountSearch(v)}
                                        onChange={(v) => updateField(accountField, v)}
                                        options={accountSelectOptions}
                                        className="w-full"
                                    />
                                </div>

                                <SelectField
                                    label="Company"
                                    value={formData?.[companyField] ?? ''}
                                    disabled={!!editingRecord}
                                    options={(companies || []).map((c) => ({ value: c.name, label: c.name }))}
                                    onChange={(v) => updateField(companyField, v)}
                                />

                                <div className="text-xs text-gray-400 leading-relaxed">
                                    If blank, parent Warehouse Account or company default will be considered in transactions.
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <details className="group" open>
                            <summary className="cursor-pointer text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span>Warehouse Contact Info</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">^</span>
                            </summary>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                    <InputField
                                        label="Phone No"
                                        value={formData?.[phoneField] ?? ''}
                                        onChange={(v) => updateField(phoneField, v)}
                                    />
                                    <InputField
                                        label="Mobile No"
                                        value={formData?.[mobileField] ?? ''}
                                        onChange={(v) => updateField(mobileField, v)}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <InputField
                                        label="Address Line 1"
                                        value={formData?.[addressLine1Field] ?? ''}
                                        onChange={(v) => updateField(addressLine1Field, v)}
                                    />
                                    <InputField
                                        label="Address Line 2"
                                        value={formData?.[addressLine2Field] ?? ''}
                                        onChange={(v) => updateField(addressLine2Field, v)}
                                    />
                                    <InputField
                                        label="City"
                                        value={formData?.[cityField] ?? ''}
                                        onChange={(v) => updateField(cityField, v)}
                                    />
                                    <InputField
                                        label="State"
                                        value={formData?.[stateField] ?? ''}
                                        onChange={(v) => updateField(stateField, v)}
                                    />
                                    <InputField
                                        label="PIN"
                                        value={formData?.[pinField] ?? ''}
                                        onChange={(v) => updateField(pinField, v)}
                                    />
                                </div>
                            </div>
                        </details>

                        <details className="group" open>
                            <summary className="cursor-pointer text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span>Transit</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">^</span>
                            </summary>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Warehouse Type</label>
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Select Warehouse Type..."
                                            value={formData?.[warehouseTypeField] ?? undefined}
                                            loading={warehouseTypeOptionsLoading}
                                            filterOption={false}
                                            onSearch={(v) => setWarehouseTypeSearch(v)}
                                            onChange={(v) => updateField(warehouseTypeField, v)}
                                            options={warehouseTypeSelectOptions}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <SelectField
                                        label="Default In-Transit Warehouse"
                                        value={formData?.[inTransitField] ?? ''}
                                        options={warehouseOptions}
                                        onChange={(v) => updateField(inTransitField, v)}
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <style>{`
                details summary { list-style: none; }
                details summary::-webkit-details-marker { display: none; }
            `}</style>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Warehouse</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button
                        className="px-5 py-2 bg-[#1C1F26] text-white rounded text-[14px] font-medium hover:bg-black flex items-center gap-2 shadow-sm transition-colors"
                        onClick={handleNew}
                    >
                        + Add Warehouse
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[360px]">
                        <input
                            type="text"
                            placeholder="Search by warehouse name..."
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                        />
                    </div>
                    <div className="flex-1 text-right text-xs text-gray-400">
                        {filteredData.length} of {data.length} results
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-3.5 font-medium">Warehouse</th>
                                <th className="px-6 py-3.5 font-medium w-32 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400">
                                        No Warehouses found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 group transition-colors">
                                        <td
                                            className="px-6 py-3.5 font-medium text-gray-900 cursor-pointer"
                                            onClick={() => handleEdit(row)}
                                        >
                                            {row.warehouse_name || row.name}
                                        </td>
                                        <td className="px-6 py-3.5 flex items-center justify-end h-full gap-3">
                                            <button
                                                className="text-blue-600 hover:text-blue-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(row);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-[#E02424] hover:text-red-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(row);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

