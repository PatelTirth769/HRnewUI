import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function SalaryComponent() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [formTab, setFormTab] = useState('overview');

    const defaultForm = {
        salary_component: '',
        salary_component_abbr: '',
        type: 'Earning',
        description: '',
        component_type: '',
        depends_on_payment_days: 1,
        variable_based_on_taxable_salary: 0,
        is_income_tax_component: 0,
        exempted_from_income_tax: 0,
        is_tax_applicable: 1,
        deduct_full_tax_on_selected_payroll_date: 0,
        round_to_the_nearest_integer: 0,
        statistical_component: 0,
        do_not_include_in_total: 0,
        remove_if_zero_valued: 1,
        disabled: 0,
        condition: '',
        amount: '',
        amount_based_on_formula: 0,
        formula: '',
        is_flexible_benefit: 0,
        max_benefit_amount: '',
        accounts: [],
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Salary Component?fields=["name","salary_component_abbr","type","description","disabled"]&limit_page_length=None&order_by=name asc');
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Salary Components' });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Salary Component/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                salary_component: d.name || '',
                salary_component_abbr: d.salary_component_abbr || '',
                type: d.type || 'Earning',
                description: d.description || '',
                component_type: d.component_type || '',
                depends_on_payment_days: d.depends_on_payment_days ?? 1,
                variable_based_on_taxable_salary: d.variable_based_on_taxable_salary ?? 0,
                is_income_tax_component: d.is_income_tax_component ?? 0,
                exempted_from_income_tax: d.exempted_from_income_tax ?? 0,
                is_tax_applicable: d.is_tax_applicable ?? 0,
                deduct_full_tax_on_selected_payroll_date: d.deduct_full_tax_on_selected_payroll_date ?? 0,
                round_to_the_nearest_integer: d.round_to_the_nearest_integer ?? 0,
                statistical_component: d.statistical_component ?? 0,
                do_not_include_in_total: d.do_not_include_in_total ?? 0,
                remove_if_zero_valued: d.remove_if_zero_valued ?? 0,
                disabled: d.disabled ?? 0,
                condition: d.condition || '',
                amount: d.amount || '',
                amount_based_on_formula: d.amount_based_on_formula ?? 0,
                formula: d.formula || '',
                is_flexible_benefit: d.is_flexible_benefit ?? 0,
                max_benefit_amount: d.max_benefit_amount || '',
                accounts: d.accounts || [],
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterType && d.type !== filterType) return false;
        if (filterStatus === 'Enabled' && d.disabled) return false;
        if (filterStatus === 'Disabled' && !d.disabled) return false;
        return true;
    });
    const hasActiveFilters = searchId || filterType || filterStatus;
    const clearFilters = () => { setSearchId(''); setFilterType(''); setFilterStatus(''); };

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setFormTab('overview'); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setFormTab('overview'); setView('form'); await fetchSingle(record.name); };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.salary_component.trim()) { notification.warning({ message: 'Please enter a Component Name' }); return; }
        if (!formData.salary_component_abbr.trim()) { notification.warning({ message: 'Please enter an Abbreviation' }); return; }
        setSaving(true);
        try {
            const payload = {
                salary_component_abbr: formData.salary_component_abbr,
                type: formData.type,
                description: formData.description,
                component_type: formData.component_type,
                depends_on_payment_days: formData.depends_on_payment_days,
                variable_based_on_taxable_salary: formData.variable_based_on_taxable_salary,
                is_income_tax_component: formData.is_income_tax_component,
                exempted_from_income_tax: formData.exempted_from_income_tax,
                is_tax_applicable: formData.is_tax_applicable,
                deduct_full_tax_on_selected_payroll_date: formData.deduct_full_tax_on_selected_payroll_date,
                round_to_the_nearest_integer: formData.round_to_the_nearest_integer,
                statistical_component: formData.statistical_component,
                do_not_include_in_total: formData.do_not_include_in_total,
                remove_if_zero_valued: formData.remove_if_zero_valued,
                disabled: formData.disabled,
                condition: formData.condition,
                amount: formData.amount ? parseFloat(formData.amount) : 0,
                amount_based_on_formula: formData.amount_based_on_formula,
                formula: formData.formula,
                is_flexible_benefit: formData.is_flexible_benefit,
                max_benefit_amount: formData.max_benefit_amount ? parseFloat(formData.max_benefit_amount) : 0,
                accounts: formData.accounts.filter(a => a.company || a.account),
            };
            if (editingRecord) {
                await API.put(`/api/resource/Salary Component/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post('/api/resource/Salary Component', { salary_component: formData.salary_component, ...payload });
                notification.success({ message: `"${formData.salary_component}" created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: editingRecord ? 'Update Failed' : 'Create Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ───────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Salary Component/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // helpers
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
    const Checkbox = ({ label, field, hint }) => (
        <label className="flex items-start gap-2 cursor-pointer py-1">
            <input type="checkbox" className="mt-1 accent-blue-600" checked={!!formData[field]} onChange={(e) => updateForm(field, e.target.checked ? 1 : 0)} />
            <div>
                <span className="text-sm text-gray-700">{label}</span>
                {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
            </div>
        </label>
    );

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        const formTabs = [
            { key: 'overview', label: 'Overview' },
            { key: 'condition', label: 'Condition & Formula' },
            { key: 'flexible', label: 'Flexible Benefits' },
        ];
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">{editingRecord ? editingRecord.name : 'New Salary Component'}</h1>
                        {editingRecord
                            ? <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">Editing</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Salary Component</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    {formTabs.map(t => (
                        <button key={t.key}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${formTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFormTab(t.key)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* ═════ TAB: OVERVIEW ═════ */}
                {formTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input type="text"
                                        className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${editingRecord ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        value={formData.salary_component}
                                        onChange={(e) => updateForm('salary_component', e.target.value)}
                                        disabled={!!editingRecord}
                                        placeholder="e.g. Basic Salary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Abbr <span className="text-red-500">*</span></label>
                                    <input type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                        value={formData.salary_component_abbr}
                                        onChange={(e) => updateForm('salary_component_abbr', e.target.value)}
                                        placeholder="e.g. BS"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Type <span className="text-red-500">*</span></label>
                                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                        value={formData.type} onChange={(e) => updateForm('type', e.target.value)}>
                                        <option value="Earning">Earning</option>
                                        <option value="Deduction">Deduction</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Description</label>
                                    <textarea className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[100px]"
                                        rows={5} value={formData.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Enter description..." />
                                </div>
                                {formData.type === 'Deduction' && (
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Component Type</label>
                                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                            value={formData.component_type} onChange={(e) => updateForm('component_type', e.target.value)}>
                                            <option value=""></option>
                                            <option value="Provident Fund">Provident Fund</option>
                                            <option value="Professional Tax">Professional Tax</option>
                                            <option value="Income Tax">Income Tax</option>
                                            <option value="ESI">ESI</option>
                                            <option value="Gratuity">Gratuity</option>
                                            <option value="Labour Welfare Fund">Labour Welfare Fund</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {/* Right Column - Checkboxes */}
                            <div className="space-y-2">
                                <Checkbox label="Depends on Payment Days" field="depends_on_payment_days" />
                                {formData.type === 'Earning' && (
                                    <>
                                        <Checkbox label="Is Tax Applicable" field="is_tax_applicable" />
                                        <Checkbox label="Deduct Full Tax on Selected Payroll Date" field="deduct_full_tax_on_selected_payroll_date" />
                                    </>
                                )}
                                {formData.type === 'Deduction' && (
                                    <>
                                        <Checkbox label="Variable Based On Taxable Salary" field="variable_based_on_taxable_salary"
                                            hint="If enabled, the component will be considered as a tax component and the amount will be auto-calculated as per the configured income tax slabs" />
                                        <Checkbox label="Is Income Tax Component" field="is_income_tax_component"
                                            hint="If enabled, the component will be considered in the Income Tax Deductions report" />
                                        <Checkbox label="Exempted from Income Tax" field="exempted_from_income_tax"
                                            hint="If checked, the full amount will be deducted from taxable income before calculating income tax without any declaration or proof submission." />
                                    </>
                                )}
                                <Checkbox label="Round to the Nearest Integer" field="round_to_the_nearest_integer" />
                                <Checkbox label="Statistical Component" field="statistical_component"
                                    hint="If enabled, the value specified or calculated in this component will not contribute to the earnings or deductions. However, its value can be referenced by other components that can be added and deducted." />
                                <Checkbox label="Do Not Include in Total" field="do_not_include_in_total" />
                                <Checkbox label="Remove if Zero Valued" field="remove_if_zero_valued"
                                    hint="If enabled, the component will not be displayed in the salary slip if the amount is zero" />
                                <Checkbox label="Disabled" field="disabled" />
                            </div>
                        </div>

                        {/* ─── ACCOUNTS SECTION ─── */}
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-1">Accounts</h3>
                            <p className="text-xs text-gray-400 mb-3">Accounts</p>
                            <div className="border border-gray-200 rounded overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="w-8 px-3 py-2"><input type="checkbox" className="accent-blue-600" disabled /></th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600 w-10">No.</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Company</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Account</th>
                                            <th className="w-10 px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.accounts.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-400">
                                                    <div className="text-2xl mb-1">📋</div>
                                                    No Data
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.accounts.map((acc, idx) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-center"><input type="checkbox" className="accent-blue-600" /></td>
                                                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                                                            value={acc.company || ''}
                                                            onChange={(e) => { const u = [...formData.accounts]; u[idx] = { ...u[idx], company: e.target.value }; updateForm('accounts', u); }}
                                                            placeholder="Enter Company" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                                                            value={acc.account || ''}
                                                            onChange={(e) => { const u = [...formData.accounts]; u[idx] = { ...u[idx], account: e.target.value }; updateForm('accounts', u); }}
                                                            placeholder="Enter Account" />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-red-400 hover:text-red-600 text-xs"
                                                            onClick={() => updateForm('accounts', formData.accounts.filter((_, i) => i !== idx))}>✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="mt-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                                onClick={() => updateForm('accounts', [...formData.accounts, { company: '', account: '' }])}>
                                Add Row
                            </button>
                        </div>
                    </>
                )}

                {/* ═════ TAB: CONDITION & FORMULA ═════ */}
                {formTab === 'condition' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Condition</label>
                                <textarea className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400 min-h-[120px]"
                                    rows={5} value={formData.condition} onChange={(e) => updateForm('condition', e.target.value)} placeholder="e.g. base > 10000" />
                            </div>
                            <hr />
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                                <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                    value={formData.amount} onChange={(e) => updateForm('amount', e.target.value)} placeholder="0" />
                            </div>
                            <Checkbox label="Amount based on formula" field="amount_based_on_formula" />
                            {!!formData.amount_based_on_formula && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Formula</label>
                                    <textarea className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400 min-h-[80px]"
                                        rows={3} value={formData.formula} onChange={(e) => updateForm('formula', e.target.value)} placeholder="e.g. base * .2" />
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Help</h3>
                            <p className="text-sm text-gray-600 mb-2 font-medium">Notes:</p>
                            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1.5 mb-5">
                                <li>Use field <code className="bg-gray-200 px-1 rounded text-xs">base</code> for using base salary of the Employee</li>
                                <li>Use Salary Component abbreviations in conditions and formulas. <span className="text-gray-400">BS = Basic Salary</span></li>
                                <li>Use field name for employee details in conditions. <span className="text-gray-400">Employment Type = employment_type, Branch = branch</span></li>
                                <li>Use field name from Salary Slip in conditions and formulas. <span className="text-gray-400">Payment Days = payment_days, leave without pay = leave_without_pay</span></li>
                                <li>Direct Amount can also be entered based on Condition. See example 3</li>
                            </ol>
                            <h4 className="text-base font-semibold text-gray-800 mb-2">Examples</h4>
                            <div className="space-y-3 text-sm">
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium text-gray-700">1. Calculating Basic Salary based on <code className="text-blue-600 bg-blue-50 px-1 rounded text-xs">base</code></p>
                                    <p className="text-gray-500 ml-4">Condition: <code className="text-xs">base &lt; 10000</code></p>
                                    <p className="text-gray-500 ml-4">Formula: <code className="text-xs">base * .2</code></p>
                                </div>
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium text-gray-700">2. Calculating HRA based on Basic Salary (<code className="text-blue-600 bg-blue-50 px-1 rounded text-xs">BS</code>)</p>
                                    <p className="text-gray-500 ml-4">Condition: <code className="text-xs">BS &gt; 2000</code></p>
                                    <p className="text-gray-500 ml-4">Formula: <code className="text-xs">BS * .1</code></p>
                                </div>
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium text-gray-700">3. Calculating TDS based on Employment Type (<code className="text-blue-600 bg-blue-50 px-1 rounded text-xs">employment_type</code>)</p>
                                    <p className="text-gray-500 ml-4">Condition: <code className="text-xs">employment_type=="Intern"</code></p>
                                    <p className="text-gray-500 ml-4">Amount: <code className="text-xs">1000</code></p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═════ TAB: FLEXIBLE BENEFITS ═════ */}
                {formTab === 'flexible' && (
                    <div className="max-w-md space-y-4">
                        <Checkbox label="Is Flexible Benefit" field="is_flexible_benefit" />
                        {!!formData.is_flexible_benefit && (
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Max Benefit Amount (Yearly)</label>
                                <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                    value={formData.max_benefit_amount} onChange={(e) => updateForm('max_benefit_amount', e.target.value)} placeholder="0" />
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Save bar */}
                <div className="mt-8 pt-4 border-t flex justify-end gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                    <button className="px-6 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Component</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Salary Component
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search by ID / Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Type</option>
                    <option value="Earning">Earning</option>
                    <option value="Deduction">Deduction</option>
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Status</option>
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading from ERPNext...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No salary components found</p>
                        <p className="text-sm">Click "+ Add Salary Component" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Abbreviation</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                    <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.name}</td>
                                    <td className="px-4 py-3">{row.salary_component_abbr || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${row.type === 'Earning' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{row.type}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${row.disabled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{row.disabled ? 'Disabled' : 'Enabled'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{row.description || '-'}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                        <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} components ({data.filter(d => d.type === 'Earning').length} Earning, {data.filter(d => d.type === 'Deduction').length} Deduction)</span>
                    <span>Source: ERPNext → /api/resource/Salary Component</span>
                </div>
            )}
        </div>
    );
}
