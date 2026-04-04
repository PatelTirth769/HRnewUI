import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs, Dropdown, Button, Space, Popconfirm, Modal } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiTrash2, FiCopy, FiArrowDown, FiArrowUp, FiMove, FiChevronUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const SalesOrder = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showPOModal, setShowPOModal] = useState(false);
    const [poSelectedItems, setPOSelectedItems] = useState([]);
    const [poAgainstDefaultSupplier, setPOAgainstDefaultSupplier] = useState(true);

    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const initialFormState = {
        naming_series: 'SAL-ORD-.YYYY.-',
        transaction_date: new Date().toISOString().split('T')[0],
        po_no: '',
        customer: '',
        delivery_date: '',
        company: '',
        order_type: 'Sales',
        cost_center: '',
        project: '',
        currency: 'INR',
        selling_price_list: 'Standard Selling',
        ignore_pricing_rule: 0,
        scan_barcode: '',
        set_warehouse: '',
        total_qty: 0,
        total: 0,
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        taxes_and_charges: '',
        total_taxes_and_charges: 0,
        grand_total: 0,
        rounding_adjustment: 0,
        rounded_total: 0,
        disable_rounded_total: 0,
        advance_paid: 0,
        apply_discount_on: 'Grand Total',
        additional_discount_percentage: 0,
        coupon_code: '',
        discount_amount: 0,
        docstatus: 0,
        // Terms
        payment_terms_template: '',
        tc_name: '',
        terms: '',
        payment_schedule: [],
        // More Info
        status: 'Draft',
        campaign: '',
        source: '',
        territory: '',
        letter_head: '',
        select_print_heading: '',
        group_same_items: 0,
        // Commission
        sales_partner: '',
        amount_eligible_for_commission: 0,
        commission_rate: 0,
        total_commission: 0,
        sales_team: [],
        // Auto Repeat
        from_date: '',
        to_date: '',
        auto_repeat: '',
        // Additional Info
        is_internal_customer: 0,

        items: [],
        taxes: []
    };

    const itemTemplate = {
        item_code: '',
        item_name: '',
        delivery_date: '',
        ensure_delivery_based_on_produced_serial_no: 0,
        description: '',
        image: '',
        qty: 1,
        uom: 'Nos',
        price_list_rate: 0,
        margin_type: '',
        discount_percentage: 0,
        discount_amount: 0,
        rate: 0,
        amount: 0,
        item_tax_template: '',
        billed_amt: 0,
        valuation_rate: 0,
        gross_profit: 0,
        delivered_by_supplier: 0,
        supplier: '',
        weight_per_unit: 0,
        weight_uom: '',
        total_weight: 0,
        against_blanket_order: 0,
        bom_no: '',
        projected_qty: 0,
        work_order_qty: 0,
        ordered_qty: 0,
        delivered_qty: 0,
        production_plan_qty: 0,
        picked_qty: 0,
        material_request: '',
        material_request_item: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    useEffect(() => {
        if (view === 'form') calculateTotals();
    }, [formData.items, formData.taxes, formData.discount_amount, formData.disable_rounded_total]);

    const calculateTotals = () => {
        setFormData(prev => {
            let totalQty = 0, totalVal = 0, itemsChanged = false;
            const mappedItems = (prev.items || []).map(row => {
                const qty = parseFloat(row.qty) || 0;
                const priceListRate = parseFloat(row.price_list_rate) || 0;
                const discountPercent = parseFloat(row.discount_percentage) || 0;
                const discountAmt = parseFloat(row.discount_amount) || 0;
                
                let rate = priceListRate;
                if (discountPercent) {
                    rate = priceListRate * (1 - discountPercent / 100);
                } else if (discountAmt) {
                    rate = priceListRate - (discountAmt / (qty || 1));
                } else {
                    rate = parseFloat(row.rate) || 0;
                }

                const amt = qty * rate;
                const weight = qty * (parseFloat(row.weight_per_unit) || 0);
                const valuationRate = parseFloat(row.valuation_rate) || 0;
                const grossProfit = amt - (qty * valuationRate);
                
                totalQty += qty; totalVal += amt;
                
                if (row.rate !== rate || row.amount !== amt || row.total_weight !== weight || row.gross_profit !== grossProfit) {
                    itemsChanged = true;
                    return { ...row, rate, amount: amt, total_weight: weight, gross_profit: grossProfit };
                }
                return row;
            });

            const taxes = prev.taxes || [];
            let totalTaxes = 0;
            taxes.forEach(r => { totalTaxes += parseFloat(r.tax_amount) || 0; });
            
            const disc = parseFloat(prev.discount_amount) || 0;
            const grandTotal = totalVal + totalTaxes - disc;
            let roundedTotal = grandTotal, roundingAdj = 0;
            if (!prev.disable_rounded_total) {
                roundedTotal = Math.round(grandTotal);
                roundingAdj = roundedTotal - grandTotal;
            }

            if (
                itemsChanged ||
                prev.total_qty !== totalQty ||
                prev.total !== totalVal ||
                prev.grand_total !== grandTotal ||
                prev.rounded_total !== roundedTotal
            ) {
                return {
                    ...prev,
                    items: itemsChanged ? mappedItems : prev.items,
                    total_qty: totalQty,
                    total: totalVal,
                    total_taxes_and_charges: totalTaxes,
                    grand_total: grandTotal,
                    rounded_total: roundedTotal,
                    rounding_adjustment: roundingAdj
                };
            }
            return prev;
        });
    };

    const fetchItemDefaults = async (item_code, i) => {
        if (!item_code) return;
        try {
            const [itemRes, priceRes] = await Promise.all([
                API.get(`/api/resource/Item/${encodeURIComponent(item_code)}?fields=["*"]`),
                API.get(`/api/resource/Item Price?fields=["price_list_rate"]&filters=[["item_code","=","${item_code}"],["price_list","=","${formData.selling_price_list || 'Standard Selling'}"]]`)
            ]);

            const itm = itemRes.data.data;
            const prices = priceRes.data.data || [];
            const sellPrice = prices.length > 0 ? prices[0].price_list_rate : itm.valuation_rate;

            setFormData(prev => {
                const newItems = [...(prev.items || [])];
                if (!newItems[i]) return prev;
                newItems[i] = {
                    ...newItems[i],
                    item_code: item_code,
                    item_name: itm.item_name || '',
                    description: itm.description || itm.item_name || '',
                    uom: itm.stock_uom || 'Nos',
                    weight_per_unit: itm.weight_per_unit || 0,
                    weight_uom: itm.weight_uom || '',
                    image: itm.image || '',
                    price_list_rate: sellPrice || 0,
                    rate: sellPrice || 0,
                    valuation_rate: itm.valuation_rate || 0,
                    projected_qty: itm.projected_qty || 0,
                    actual_qty: itm.actual_qty || 0,
                    ordered_qty: itm.ordered_qty || 0,
                    work_order_qty: itm.work_order_qty || 0,
                    delivered_qty: itm.delivered_qty || 0,
                    total_weight: (newItems[i].qty || 0) * (itm.weight_per_unit || 0)
                };
                return { ...prev, items: newItems };
            });
        } catch (err) {
            console.error('Failed to fetch item details', err);
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Sales Order?fields=["name","customer","transaction_date","grand_total","docstatus"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch sales orders' });
        } finally { setLoading(false); }
    };

    const fetchDropdownData = async () => {
        try {
            const [c, co, itm, s] = await Promise.all([
                API.get('/api/resource/Customer?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Item?fields=["name","item_name","item_group","image"]&limit_page_length=None'),
                API.get('/api/resource/Supplier?fields=["name"]')
            ]);
            setCustomers(c.data.data || []);
            setCompanies(co.data.data || []);
            setItemsList(itm.data.data || []);
            setSuppliers(s.data.data || []);
        } catch (err) { console.error(err); }
    };

    const SearchableItemSelect = ({ value, onChange, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        
        const filteredItems = itemsList.filter(i => 
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (i.item_name && i.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 50);

        const handleSelect = (itemCode) => {
            onChange(itemCode);
            setIsOpen(false);
            setSearchTerm('');
        };

        return (
            <div className="relative w-full">
                <input
                    type="text"
                    className={rowInputStyle}
                    value={isOpen ? searchTerm : (value || '')}
                    onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    disabled={disabled}
                    placeholder="Item Code"
                />
                {isOpen && (
                    <div className="absolute z-[9999] mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-h-96 flex flex-col scale-in-center">
                        <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Matching Items</span>
                            <span className="text-[10px] text-gray-300 pr-1">{filteredItems.length} found</span>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            {filteredItems.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 italic text-xs">No items found</div>
                            ) : filteredItems.map(item => (
                                <div 
                                    key={item.name}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex gap-3 items-center group"
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item.name); }}
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-xl font-serif">{item.name[0]}</span>}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700">{item.name}</div>
                                        <div className="text-[11px] text-gray-500 truncate">{item.item_name}, {item.item_group}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t bg-gray-50 hover:bg-gray-100 cursor-pointer text-blue-600 flex items-center gap-2 pl-3 transition-colors group">
                            <span className="text-lg group-hover:scale-125 transition-transform">+</span>
                            <span className="text-[11px] font-bold tracking-tight">Create a new Item</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const SearchableSupplierSelect = ({ value, onChange, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        
        const filtered = (suppliers || []).filter(s => 
            s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 50);

        return (
            <div className="relative w-full">
                <input
                    type="text"
                    className={inputStyle}
                    value={isOpen ? searchTerm : (value || '')}
                    onChange={e => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    disabled={disabled}
                    placeholder="Search supplier..."
                />
                {isOpen && (
                    <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-h-60 flex flex-col scale-in-center">
                        <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 pl-1 uppercase">Matches</span>
                            <span className="text-[10px] text-gray-300 pr-1">{filtered.length}</span>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            {filtered.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 italic text-xs">No suppliers found</div>
                            ) : filtered.map(s => (
                                <div 
                                    key={s.name}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
                                    onMouseDown={(e) => { e.preventDefault(); onChange(s.name); setIsOpen(false); }}
                                >
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Sales Order/${encodeURIComponent(name)}`);
            const d = res.data.data;
            if (!d.items) d.items = [];
            if (!d.taxes) d.taxes = [];
            if (!d.payment_schedule) d.payment_schedule = [];
            if (!d.sales_team) d.sales_team = [];
            setFormData(d);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally { setLoading(false); }
    };

    const parseFrappeError = (err) => {
        console.error("ERPNext API Error:", err.response?.data);
        if (err.response?.data?._server_messages) {
            try {
                const messages = JSON.parse(err.response.data._server_messages);
                let text = '';
                messages.forEach(m => {
                    try {
                        const mObj = JSON.parse(m);
                        if (mObj.message) text += mObj.message.replace(/<[^>]+>/g, '') + '\n'; // strip HTML
                    } catch { text += m + '\n'; }
                });
                return text.trim() || 'Server validation failed.';
            } catch (e) {
                return String(err.response.data._server_messages);
            }
        }
        if (err.response?.data?.exception) {
            const lines = String(err.response.data.exception).split('\n');
            const errorLine = lines.find(l => l.includes('Error:') || l.includes('Exception:'));
            return errorLine ? errorLine.replace(/<[^>]+>/g, '') : 'Server exception occurred. Check console.';
        }
        return err.message || 'Operation failed.';
    };

    const validateForm = () => {
        console.log("Validating form data:", formData);
        if (!formData.customer) { console.log("Validation failed: customer"); return 'Customer is required.'; }
        if (!formData.company) { console.log("Validation failed: company"); return 'Company is required.'; }
        if (!formData.delivery_date) { console.log("Validation failed: delivery_date"); return 'Delivery Date on the main form is required.'; }
        if (!formData.items || formData.items.length === 0) { console.log("Validation failed: items length"); return 'At least one item is required in the Items table.'; }
        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.item_code) { console.log(`Validation failed: item_code on row ${i}`); return `Items Row ${i + 1}: Item Code is required.`; }
            if (!item.qty || parseFloat(item.qty) <= 0) { console.log(`Validation failed: qty on row ${i}`); return `Items Row ${i + 1}: Quantity must be greater than 0.`; }
            if (!item.delivery_date) { console.log(`Validation failed: delivery_date on row ${i}`); return `Items Row ${i + 1}: Delivery Date is required.`; }
        }
        console.log("Validation passed.");
        return null; // Valid
    };

    const handleSave = async () => {
        console.log("handleSave triggered");
        const errorMsg = validateForm();
        if (errorMsg) {
            console.warn("Validation Error blocked save:", errorMsg);
            notification.warning({ message: 'Validation Error', description: errorMsg, duration: 4 });
            return;
        }

        console.log("Proceeding to save API request...");
        setSaving(true);
        try {
            console.log("Sending payload:", formData);
            if (editingRecord) {
                await API.put(`/api/resource/Sales Order/${encodeURIComponent(editingRecord)}`, formData);
                console.log("Update success");
                notification.success({ message: 'Sales Order updated.' });
                fetchDetails(editingRecord);
            } else {
                const res = await API.post('/api/resource/Sales Order', formData);
                console.log("Create success response:", res.data);
                notification.success({ message: 'Sales Order created.' });
                setEditingRecord(res.data.data.name);
            }
        } catch (err) {
            console.error("Save caught error:", err);
            notification.error({ message: 'Save Failed', description: parseFrappeError(err), duration: 6 });
        } finally { 
            console.log("Resetting saving state");
            setSaving(false); 
        }
    };

    const handleDocAction = (action) => {
        setConfirmAction(action);
    };

    const handleConfirmAction = async () => {
        const isSubmit = confirmAction === 'submit';
        setSaving(true);
        setConfirmAction(null);
        try {
            const endpoint = isSubmit ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(endpoint, { doc: { ...formData, doctype: 'Sales Order' } });
            notification.success({ message: `Sales Order has been ${isSubmit ? 'submitted' : 'cancelled'} successfully` });
            fetchDetails(editingRecord);
        } catch (err) {
            notification.error({ message: 'Action Failed', description: parseFrappeError(err), duration: 6 });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this Sales Order?')) return;
        try {
            await API.delete(`/api/resource/Sales Order/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Sales Order deleted.' });
            setView('list');
        } catch (err) { notification.error({ message: 'Delete Failed', description: err.message }); }
    };

    const handleAddRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const handleRemoveRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const handleRowChange = (k, i, f, v) => setFormData(p => {
        const a = [...(p[k] || [])];
        if (a[i]) a[i] = { ...a[i], [f]: v };
        return { ...p, [k]: a };
    });

    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200 relative z-0">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-sm font-medium text-gray-400">No Data</span>
        </div>
    );

    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const rowInputStyle = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";

    const [collapsedSections, setCollapsedSections] = useState({
        description: false,
        image: true,
        shopping_cart: true
    });

    const toggleSection = (s) => setCollapsedSections(p => ({ ...p, [s]: !p[s] }));

    const handleModalAction = (action) => {
        const i = editingItemIndex;
        if (i === null) return;
        const newItems = [...formData.items];
        
        if (action === 'delete') {
            newItems.splice(i, 1);
            setFormData({ ...formData, items: newItems });
            setIsItemModalVisible(false);
            setEditingItemIndex(null);
        } else if (action === 'duplicate') {
            newItems.splice(i + 1, 0, { ...newItems[i] });
            setFormData({ ...formData, items: newItems });
            setEditingItemIndex(i + 1);
        } else if (action === 'insert_below') {
            newItems.splice(i + 1, 0, { ...itemTemplate, delivery_date: formData.delivery_date });
            setFormData({ ...formData, items: newItems });
            setEditingItemIndex(i + 1);
        } else if (action === 'insert_above') {
            newItems.splice(i, 0, { ...itemTemplate, delivery_date: formData.delivery_date });
            setFormData({ ...formData, items: newItems });
            setEditingItemIndex(i);
        }
    };

    const renderItemModal = () => {
        if (editingItemIndex === null || !isItemModalVisible) return null;
        const item = formData.items[editingItemIndex];
        const updateItem = (f, v) => handleRowChange('items', editingItemIndex, f, v);

        return (
            <Modal
                title={
                    <div className="flex items-center justify-between w-full pr-8">
                        <span className="text-lg font-bold text-gray-800">Editing Row #{editingItemIndex + 1}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleModalAction('delete')} className="p-2 text-white bg-red-500 rounded hover:bg-red-600 transition shadow-sm" title="Delete"><FiTrash2 /></button>
                            <button onClick={() => handleModalAction('insert_below')} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition border border-gray-200 text-gray-700 shadow-sm">Insert Below</button>
                            <button onClick={() => handleModalAction('insert_above')} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition border border-gray-200 text-gray-700 shadow-sm">Insert Above</button>
                            <button onClick={() => handleModalAction('duplicate')} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition border border-gray-200 text-gray-700 shadow-sm flex items-center gap-1.5"><FiCopy /> Duplicate</button>
                            <Dropdown menu={{ items: [{ key: 'move', label: 'Move' }] }}>
                                <button className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition border border-gray-200 text-gray-700 shadow-sm flex items-center gap-1.5">Move <FiChevronDown /></button>
                            </Dropdown>
                        </div>
                    </div>
                }
                open={isItemModalVisible}
                onCancel={() => setIsItemModalVisible(false)}
                footer={null}
                width={1000}
                className="item-editor-modal"
                centered
            >
                <div className="max-h-[75vh] overflow-y-auto px-1 space-y-8 pb-10 custom-scrollbar">
                    {/* Section 1: Basic */}
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Item Code *</label>
                                <div className="flex gap-2">
                                    <SearchableItemSelect 
                                        value={item.item_code} 
                                        onChange={val => {
                                            updateItem('item_code', val);
                                            fetchItemDefaults(val, editingItemIndex);
                                        }}
                                        disabled={!isDraft}
                                    />
                                    <button className="px-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 italic font-serif text-gray-400">i→</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <input type="checkbox" id="serial_check" checked={!!item.ensure_delivery_based_on_produced_serial_no} onChange={e => updateItem('ensure_delivery_based_on_produced_serial_no', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                                <label htmlFor="serial_check" className="text-[13px] font-medium text-gray-700">Ensure Delivery Based on Produced Serial No</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Delivery Date *</label>
                                <input type="date" className={inputStyle} value={item.delivery_date} onChange={e => updateItem('delivery_date', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Item Name</label>
                                <input className={`${inputStyle} bg-gray-50 text-gray-500`} value={item.item_name} disabled />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Description & Image */}
                    <div className="border-t border-gray-100 pt-6">
                        <button onClick={() => toggleSection('description')} className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 outline-none">
                            {collapsedSections.description ? <FiChevronRight /> : <FiChevronDown />} Description
                        </button>
                        {!collapsedSections.description && (
                            <textarea className={`${inputStyle} h-32 resize-none mb-6`} value={item.description} onChange={e => updateItem('description', e.target.value)} placeholder="Item description..."></textarea>
                        )}

                        <button onClick={() => toggleSection('image')} className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 outline-none">
                            {collapsedSections.image ? <FiChevronRight /> : <FiChevronDown />} Image
                        </button>
                        {!collapsedSections.image && (
                            <div className="h-40 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-6">
                                {item.image ? <img src={item.image} alt="Preview" className="h-full object-contain" /> : 'Drag and drop or click to upload'}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Qty & Rate */}
                    <div className="space-y-6">
                        <div className="text-[13px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Quantity and Rate</div>
                        <div className="grid grid-cols-2 gap-8">
                            <div><label className={labelStyle}>Quantity *</label><input type="number" className={inputStyle} value={item.qty} onChange={e => updateItem('qty', e.target.value)} /></div>
                            <div><label className={labelStyle}>UOM *</label><input className={`${inputStyle} bg-gray-50 text-gray-500`} value={item.uom} disabled /></div>
                        </div>
                        <div className="max-w-sm">
                            <label className={labelStyle}>Price List Rate ({formData.currency})</label>
                            <input type="number" className={inputStyle} value={item.price_list_rate} onChange={e => updateItem('price_list_rate', e.target.value)} />
                        </div>
                    </div>

                    {/* Section 4: Discount & Margin */}
                    <div className="space-y-6">
                        <div onClick={() => toggleSection('discount_margin')} className="flex items-center gap-2 text-[13px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2 cursor-pointer">
                            Discount and Margin <FiChevronDown className="ml-auto opacity-30" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Margin Type</label>
                                    <select className={inputStyle} value={item.margin_type} onChange={e => updateItem('margin_type', e.target.value)}>
                                        <option value="">Select Margin Type</option>
                                        <option value="Percentage">Percentage</option>
                                        <option value="Amount">Amount</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div><label className={labelStyle}>Discount (%) on Price List Rate</label><input type="number" className={inputStyle} value={item.discount_percentage} onChange={e => updateItem('discount_percentage', e.target.value)} /></div>
                                <div><label className={labelStyle}>Discount Amount</label><input type="number" className={inputStyle} value={item.discount_amount} onChange={e => updateItem('discount_amount', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Rate & Amount */}
                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Rate ({formData.currency})</label><input type="number" className={inputStyle} value={item.rate} onChange={e => updateItem('rate', e.target.value)} /></div>
                            <div><label className={labelStyle}>Amount ({formData.currency})</label><div className={`${inputStyle} bg-gray-50 font-bold text-gray-900`}>₹ {Number(item.amount).toFixed(2)}</div></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pt-6">
                                <input type="checkbox" id="free_item" className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                                <label htmlFor="free_item" className="text-[13px] font-medium text-gray-700">Is Free Item</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="grant_commission" defaultChecked className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                                <label htmlFor="grant_commission" className="text-[13px] font-medium text-gray-700">Grant Commission</label>
                            </div>
                            <div><label className={labelStyle}>Item Tax Template</label><input className={inputStyle} value={item.item_tax_template} onChange={e => updateItem('item_tax_template', e.target.value)} /></div>
                        </div>
                    </div>

                    {/* Section 6: Stats */}
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Billed Amt</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>₹ {Number(item.billed_amt || 0).toFixed(2)}</div></div>
                            <div><label className={labelStyle}>Projected Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>{item.projected_qty || 0}</div></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Valuation Rate</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>₹ {Number(item.valuation_rate || 0).toFixed(2)}</div></div>
                            <div><label className={labelStyle}>Actual Stock Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>{item.actual_qty || 0}</div></div>
                            <div><label className={labelStyle}>Gross Profit</label><div className={`${inputStyle} bg-gray-50 text-gray-400 font-semibold ${Number(item.gross_profit) >= 0 ? 'text-green-600' : 'text-red-500'}`}>₹ {Number(item.gross_profit || 0).toFixed(2)}</div></div>
                        </div>
                    </div>

                    {/* Section 7: Drop Ship */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Drop Ship <FiChevronDown className="ml-auto opacity-30" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="drop_ship" checked={!!item.delivered_by_supplier} onChange={e => updateItem('delivered_by_supplier', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                                <label htmlFor="drop_ship" className="text-[13px] font-medium text-gray-700 italic">Supplier delivers to Customer</label>
                            </div>
                            {!!item.delivered_by_supplier && (
                                <div className="max-w-md animate-in slide-in-from-top-2 duration-300">
                                    <label className={labelStyle}>Supplier</label>
                                    <SearchableSupplierSelect value={item.supplier} onChange={v => updateItem('supplier', v)} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 8: Weight */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Item Weight Details <FiChevronDown className="ml-auto opacity-30" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><label className={labelStyle}>Weight Per Unit</label><input type="number" className={inputStyle} value={item.weight_per_unit} onChange={e => updateItem('weight_per_unit', e.target.value)} /></div>
                                <div><label className={labelStyle}>Total Weight</label><div className={`${inputStyle} bg-gray-50 text-gray-700 font-medium`}>{Number(item.total_weight).toFixed(3)}</div></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className={labelStyle}>Weight UOM</label><input className={`${inputStyle} bg-gray-50 text-gray-500`} value={item.weight_uom} disabled /></div>
                            </div>
                        </div>
                    </div>

                    {/* Section 9: Warehouse/Ref */}
                    <div className="space-y-6">
                        <div className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-2">Warehouse and Reference</div>
                        <div className="grid grid-cols-2 gap-8">
                             <div></div>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" id="blanket_order_chk" checked={!!item.against_blanket_order} onChange={e => updateItem('against_blanket_order', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                                <label htmlFor="blanket_order_chk" className="text-[13px] font-medium text-gray-700">Against Blanket Order</label>
                            </div>
                        </div>
                        {!!item.against_blanket_order && (
                            <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                <div><label className={labelStyle}>Blanket Order</label><input className={inputStyle} value={item.blanket_order} onChange={e => updateItem('blanket_order', e.target.value)} placeholder="Search blanket order..." /></div>
                                <div><label className={labelStyle}>Blanket Order Rate</label><input type="number" className={inputStyle} value={item.blanket_order_rate} onChange={e => updateItem('blanket_order_rate', e.target.value)} /></div>
                            </div>
                        )}
                        <div className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-2 mt-8">Available Quantity</div>
                        <div className="grid grid-cols-2 gap-8 uppercase tracking-wider text-[10px] text-gray-400 font-bold">
                            <div>Qty (Warehouse)</div>
                            <div>Qty (Company)</div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className={`${inputStyle} bg-gray-50 flex items-center`}>0</div>
                            <div className={`${inputStyle} bg-gray-50 flex items-center`}>0</div>
                        </div>
                    </div>

                    {/* Section 10: Manufacturing */}
                    <div className="space-y-6">
                        <div className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-2">Manufacturing Section</div>
                        <div className="max-w-md"><label className={labelStyle}>BOM No</label><input className={inputStyle} value={item.bom_no} onChange={e => updateItem('bom_no', e.target.value)} placeholder="Search BOM..." /></div>
                        
                        <div className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-2 mt-8">Planning</div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><label className={labelStyle}>Projected Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                                <div><label className={labelStyle}>Ordered Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                                <div><label className={labelStyle}>Production Plan Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className={labelStyle}>Work Order Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                                <div><label className={labelStyle}>Delivered Qty</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                                <div><label className={labelStyle}>Picked Qty (in Stock UOM)</label><div className={`${inputStyle} bg-gray-50 text-gray-500`}>0</div></div>
                            </div>
                        </div>
                    </div>

                    {/* Section 11: Other */}
                    <div className="border-t border-gray-100 pt-6">
                        <button onClick={() => toggleSection('shopping_cart')} className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 outline-none">
                            {collapsedSections.shopping_cart ? <FiChevronRight /> : <FiChevronDown />} Shopping Cart
                        </button>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id="page_break" className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                        <label htmlFor="page_break" className="text-[13px] font-medium text-gray-700">Page Break</label>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="text-[13px] font-bold text-gray-800 border-b border-gray-100 pb-2">Inter Transfer Reference</div>
                        <div className="grid grid-cols-2 gap-8 pb-10">
                            <div><label className={labelStyle}>Material Request</label><input className={inputStyle} value={item.material_request} onChange={e => updateItem('material_request', e.target.value)} /></div>
                            <div><label className={labelStyle}>Material Request Item</label><input className={inputStyle} value={item.material_request_item} onChange={e => updateItem('material_request_item', e.target.value)} /></div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-4 right-10 flex gap-2">
                    <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold text-sm border border-gray-300 shadow-sm" onClick={() => setIsItemModalVisible(false)}>Close</button>
                </div>
                <style>{`
                    .item-editor-modal .ant-modal-content { padding: 24px; border-radius: 12px; }
                    .item-editor-modal .ant-modal-header { border-bottom: none; margin-bottom: 0; padding-bottom: 20px; }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
                `}</style>
            </Modal>
        );
    };

    if (view === 'list') {
        const filtered = records.filter(r => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (r.name || '').toLowerCase().includes(s) || (r.customer || '').toLowerCase().includes(s);
        });
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Sales Orders</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={fetchRecords} disabled={loading}>{loading ? '⟳' : '⟳ Refresh'}</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>+ Add Sales Order</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Sales Order or Customer..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} records</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Customer</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-right">Grand Total</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Sales Orders found.</td></tr>
                            ) : filtered.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4"><button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>{r.name}</button></td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{r.customer}</td>
                                    <td className="px-5 py-4 text-gray-500">{r.transaction_date}</td>
                                    <td className="px-5 py-4 text-gray-900 font-semibold text-right">₹ {Number(r.grand_total).toFixed(2)}</td>
                                    <td className="px-5 py-4 text-center">
                                        {r.docstatus === 0 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">Draft</span>}
                                        {r.docstatus === 1 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">Submitted</span>}
                                        {r.docstatus === 2 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-300">Cancelled</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const isDraft = formData.docstatus === 0;
    const isSubmitted = formData.docstatus === 1;

    const getStatusLabel = () => {
        if (!editingRecord) return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4] ml-2">Not Saved</span>;
        if (isDraft) return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-red-50 text-red-600 font-medium border border-red-200 ml-2">Draft</span>;
        if (formData.docstatus === 2) return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide text-gray-500 ml-2">Cancelled</span>;
        // Submitted states - check formData.status for granular status
        const st = (formData.status || '').toLowerCase();
        if (st === 'to bill') return <span className="text-orange-500 font-medium text-[13px] ml-3">• To Bill</span>;
        if (st === 'to deliver') return <span className="text-orange-500 font-medium text-[13px] ml-3">To Deliver</span>;
        if (st === 'completed') return <span className="text-green-600 font-medium text-[13px] ml-3">Completed</span>;
        if (st === 'closed') return <span className="text-gray-500 font-medium text-[13px] ml-3">Closed</span>;
        if (st === 'on hold') return <span className="text-yellow-600 font-medium text-[13px] ml-3">On Hold</span>;
        if (isSubmitted) return <span className="text-orange-500 font-medium text-[13px] ml-3">To Deliver and Bill</span>;
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide text-gray-500 ml-2">{formData.status || 'Unknown'}</span>;
    };

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {editingRecord && isDraft && (
                        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] px-4 py-3 rounded-md text-[13px] font-medium flex justify-between items-center mt-2 mb-6">
                            <span>Submit this document to confirm</span>
                        </div>
                    )}
                    {/* Top Fields */}
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>Series *</label>
                            <input className={inputStyle} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Date *</label>
                            <input type="date" className={inputStyle} value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Customer's Purchase Order</label>
                            <input className={inputStyle} value={formData.po_no} onChange={e => setFormData({ ...formData, po_no: e.target.value })} disabled={!isDraft} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>Customer *</label>
                            <select className={inputStyle} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} disabled={!isDraft}>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Delivery Date</label>
                            <input type="date" className={inputStyle} value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Company *</label>
                            <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} disabled={!isDraft}>
                                <option value="">Select Company</option>
                                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="max-w-xs">
                        <label className={labelStyle}>Order Type *</label>
                        <select className={inputStyle} value={formData.order_type} onChange={e => setFormData({ ...formData, order_type: e.target.value })} disabled={!isDraft}>
                            <option value="Sales">Sales</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Shopping Cart">Shopping Cart</option>
                        </select>
                    </div>

                    {/* Accounting Dimensions */}
                    <div className={sectionTitleStyle}><span>Accounting Dimensions</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelStyle}>Cost Center</label><input className={inputStyle} value={formData.cost_center} onChange={e => setFormData({ ...formData, cost_center: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Project</label><input className={inputStyle} value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })} disabled={!isDraft} /></div>
                    </div>

                    {/* Currency & Price List */}
                    <div className={sectionTitleStyle}><span>Currency and Price List</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelStyle}>Currency *</label><input className={inputStyle} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} disabled={!isDraft} /></div>
                        <div className="space-y-2">
                            <div><label className={labelStyle}>Price List *</label><input className={inputStyle} value={formData.selling_price_list} onChange={e => setFormData({ ...formData, selling_price_list: e.target.value })} disabled={!isDraft} /></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="so_ignore_pricing" checked={!!formData.ignore_pricing_rule} onChange={e => setFormData({ ...formData, ignore_pricing_rule: e.target.checked ? 1 : 0 })} className="w-3 h-3 text-blue-600 rounded" disabled={!isDraft} />
                                <label htmlFor="so_ignore_pricing" className="text-xs font-medium text-gray-500">Ignore Pricing Rule</label>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className={sectionTitleStyle}><span>Items</span></div>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div><label className={labelStyle}>Scan Barcode</label><input className={inputStyle} value={formData.scan_barcode} onChange={e => setFormData({ ...formData, scan_barcode: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Set Source Warehouse</label><input className={inputStyle} value={formData.set_warehouse} onChange={e => setFormData({ ...formData, set_warehouse: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="border border-gray-200 rounded-md bg-[#F9FAFB] relative overflow-visible">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={`${thStyle} w-8 text-center`}><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" /></th>
                                    <th className={`${thStyle} w-10 text-center`}>No.</th>
                                    <th className={`${thStyle}`}>Item Code *</th>
                                    <th className={thStyle}>Delivery Date *</th>
                                    <th className={`${thStyle} text-right`}>Quantity *</th>
                                    <th className={`${thStyle} text-right`}>Rate ({formData.currency})</th>
                                    <th className={`${thStyle} text-right`}>Amount ({formData.currency})</th>
                                    <th className={`${thStyle} w-10 text-center text-gray-400 font-normal`}><FiChevronDown className="inline" /> ⚙️</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.length === 0 ? null : formData.items.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0 group">
                                        <td className={`${tdStyle} text-center`}><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" /></td>
                                        <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                                        <td className={`${tdStyle} font-bold`}>
                                            <SearchableItemSelect 
                                                value={row.item_code} 
                                                onChange={val => {
                                                    handleRowChange('items', i, 'item_code', val);
                                                    fetchItemDefaults(val, i);
                                                }}
                                                disabled={!isDraft}
                                            />
                                        </td>
                                        <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.delivery_date || ''} onChange={e => handleRowChange('items', i, 'delivery_date', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={`${tdStyle} font-bold`}><input type="number" className={`${rowInputStyle} text-right font-bold text-gray-800`} value={row.qty || ''} onChange={e => handleRowChange('items', i, 'qty', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><div className="flex items-center justify-end"><span className="text-gray-400 mr-1">₹</span><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.rate || ''} onChange={e => handleRowChange('items', i, 'rate', e.target.value)} disabled={!isDraft} /></div></td>
                                        <td className={`${tdStyle} text-right font-semibold text-gray-800`}>₹ {Number(row.amount || 0).toFixed(2)}</td>
                                        <td className={`${tdStyle} text-center`}>
                                            <div className="flex items-center gap-1 justify-center">
                                                <button onClick={() => { setEditingItemIndex(i); setIsItemModalVisible(true); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors" title="Edit row">✎</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.items.length === 0 && renderEmptyTable()}
                    </div>
                    {isDraft && (
                        <div className="flex gap-2 mt-3">
                            <button type="button" onClick={() => handleAddRow('items', { ...itemTemplate, delivery_date: formData.delivery_date || '' })} className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
                            <button type="button" className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Multiple</button>
                            <div className="ml-auto flex gap-2">
                                <button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Download</button>
                                <button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Upload</button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-8 mt-6">
                        <div><label className={labelStyle}>Total Quantity</label><div className={`${inputStyle} bg-gray-50 border-transparent font-semibold`}>{formData.total_qty}</div></div>
                        <div><label className={labelStyle}>Total ({formData.currency})</label><div className={`${inputStyle} bg-gray-50 border-transparent font-bold text-gray-900 text-right`}>₹ {Number(formData.total).toFixed(2)}</div></div>
                    </div>

                    {/* Taxes */}
                    <div className={sectionTitleStyle}>Taxes</div>
                    <div className="grid grid-cols-3 gap-6">
                        <div><label className={labelStyle}>Tax Category</label><input className={inputStyle} value={formData.tax_category} onChange={e => setFormData({ ...formData, tax_category: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Shipping Rule</label><input className={inputStyle} value={formData.shipping_rule} onChange={e => setFormData({ ...formData, shipping_rule: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Incoterm</label><input className={inputStyle} value={formData.incoterm} onChange={e => setFormData({ ...formData, incoterm: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="max-w-sm mt-4"><label className={labelStyle}>Sales Taxes and Charges Template</label><input className={inputStyle} value={formData.taxes_and_charges} onChange={e => setFormData({ ...formData, taxes_and_charges: e.target.value })} disabled={!isDraft} /></div>

                    <div className="mt-6">
                        <label className="block text-sm text-gray-800 font-semibold mb-2">Sales Taxes and Charges</label>
                        <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className={`${thStyle} w-10 text-center`}>No.</th>
                                        <th className={thStyle}>Type *</th>
                                        <th className={thStyle}>Account Head *</th>
                                        <th className={`${thStyle} text-right`}>Tax Rate</th>
                                        <th className={`${thStyle} text-right`}>Amount</th>
                                        <th className={`${thStyle} text-right`}>Total</th>
                                        <th className={`${thStyle} w-10`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.taxes.length === 0 ? null : formData.taxes.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                            <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                            <td className={tdStyle}><select className={rowInputStyle} value={row.charge_type || ''} onChange={e => handleRowChange('taxes', i, 'charge_type', e.target.value)} disabled={!isDraft}><option value="Actual">Actual</option><option value="On Net Total">On Net Total</option><option value="On Previous Row Amount">On Previous Row Amount</option></select></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.account_head || ''} onChange={e => handleRowChange('taxes', i, 'account_head', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><input type="number" className={`${rowInputStyle} text-right w-20`} value={row.rate || ''} onChange={e => handleRowChange('taxes', i, 'rate', e.target.value)} disabled={!isDraft} /><span className="text-gray-400 ml-1">%</span></div></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><span className="text-gray-400 mr-1">₹</span><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.tax_amount || ''} onChange={e => handleRowChange('taxes', i, 'tax_amount', e.target.value)} disabled={!isDraft} /></div></td>
                                            <td className={`${tdStyle} text-right font-semibold text-gray-800`}>₹ {Number(row.total || 0).toFixed(2)}</td>
                                            <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('taxes', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.taxes.length === 0 && renderEmptyTable()}
                        </div>
                        {isDraft && <button onClick={() => handleAddRow('taxes', { charge_type: 'Actual', account_head: '', rate: 0, tax_amount: 0, total: 0 })} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                        <div className="grid grid-cols-2 gap-8 mt-6"><div></div><div><label className={labelStyle}>Total Taxes and Charges ({formData.currency})</label><div className={`${inputStyle} bg-gray-50 border-transparent font-bold text-gray-900 text-right`}>₹ {Number(formData.total_taxes_and_charges).toFixed(2)}</div></div></div>
                    </div>

                    {/* Totals */}
                    <div className={sectionTitleStyle}>Totals</div>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div></div>
                        <div className="space-y-3 bg-gray-50 p-4 border rounded-md">
                            <div><label className={labelStyle}>Grand Total ({formData.currency})</label><div className={`${inputStyle} text-right font-bold text-[15px]`}>₹ {Number(formData.grand_total).toFixed(2)}</div></div>
                            {!formData.disable_rounded_total && (<div><label className={labelStyle}>Rounding Adjustment ({formData.currency})</label><div className={`${inputStyle} text-right text-gray-500`}>₹ {Number(formData.rounding_adjustment).toFixed(2)}</div></div>)}
                            <div><label className={labelStyle}>Rounded Total ({formData.currency})</label><div className={`${inputStyle} text-right font-black text-[16px] text-gray-900 tracking-tight`}>₹ {Number(formData.rounded_total).toFixed(2)}</div></div>
                            <div><label className={labelStyle}>Advance Paid</label><div className={`${inputStyle} text-right text-gray-500`}>₹ {Number(formData.advance_paid).toFixed(2)}</div></div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="so_disable_rounded" checked={!!formData.disable_rounded_total} onChange={e => setFormData({ ...formData, disable_rounded_total: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" disabled={!isDraft} />
                                <label htmlFor="so_disable_rounded" className="text-sm font-semibold text-gray-700">Disable Rounded Total</label>
                            </div>
                        </div>
                    </div>

                    {/* Additional Discount */}
                    <div className={sectionTitleStyle}><span>Additional Discount</span></div>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Apply Additional Discount On</label><select className={inputStyle} value={formData.apply_discount_on} onChange={e => setFormData({ ...formData, apply_discount_on: e.target.value })} disabled={!isDraft}><option value="Grand Total">Grand Total</option><option value="Net Total">Net Total</option></select></div>
                            <div><label className={labelStyle}>Coupon Code</label><input className={inputStyle} value={formData.coupon_code} onChange={e => setFormData({ ...formData, coupon_code: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Additional Discount Percentage</label><input type="number" className={inputStyle} value={formData.additional_discount_percentage} onChange={e => setFormData({ ...formData, additional_discount_percentage: e.target.value })} disabled={!isDraft} /></div>
                            <div><label className={labelStyle}>Additional Discount Amount ({formData.currency})</label><input type="number" className={inputStyle} value={formData.discount_amount} onChange={e => setFormData({ ...formData, discount_amount: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'terms',
            label: 'Terms',
            children: (
                <div className="space-y-6 animate-fade-in mt-2">
                    <h2 className="text-sm font-bold text-gray-800">Payment Terms</h2>
                    <div className="max-w-md"><label className={labelStyle}>Payment Terms Template</label><input className={inputStyle} value={formData.payment_terms_template} onChange={e => setFormData({ ...formData, payment_terms_template: e.target.value })} disabled={!isDraft} /></div>
                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-2">Payment Schedule</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Payment Term</th>
                                        <th className={thStyle}>Description</th>
                                        <th className={thStyle}>Due Date *</th>
                                        <th className={`${thStyle} text-right`}>Invoice Portion</th>
                                        <th className={`${thStyle} text-right`}>Payment Amount *</th>
                                        <th className={`${thStyle} w-10`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(formData.payment_schedule || []).length === 0 ? null : (formData.payment_schedule || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.payment_term || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_term', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.description || ''} onChange={e => handleRowChange('payment_schedule', i, 'description', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.due_date || ''} onChange={e => handleRowChange('payment_schedule', i, 'due_date', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.invoice_portion || ''} onChange={e => handleRowChange('payment_schedule', i, 'invoice_portion', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.payment_amount || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_amount', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}>{isDraft && <button onClick={() => handleRemoveRow('payment_schedule', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition">✕</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(formData.payment_schedule || []).length === 0 && renderEmptyTable()}
                        </div>
                        {isDraft && <button onClick={() => handleAddRow('payment_schedule', { payment_term: '', description: '', due_date: '', invoice_portion: 0, payment_amount: 0 })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                    </div>
                    <div className="h-px bg-gray-200 my-6"></div>
                    <h2 className="text-sm font-bold text-gray-800">Terms and Conditions</h2>
                    <div className="max-w-md"><label className={labelStyle}>Terms</label><input className={inputStyle} value={formData.tc_name} onChange={e => setFormData({ ...formData, tc_name: e.target.value })} disabled={!isDraft} /></div>
                    <div><label className={labelStyle}>Term Details</label><textarea className={`${inputStyle} h-48 resize-none`} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} disabled={!isDraft} placeholder="Enter terms and conditions..."></textarea></div>
                </div>
            )
        },
        {
            key: 'more_info',
            label: 'More Info',
            children: (
                <div className="space-y-8 animate-fade-in mt-2">
                    {/* Status */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Status</div>
                        <div className="p-4">
                            <div className="max-w-md">
                                <label className={labelStyle}>Status *</label>
                                <input className={`${inputStyle} bg-gray-50`} value={formData.status} disabled />
                            </div>
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Commission</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div><label className={labelStyle}>Sales Partner</label><input className={inputStyle} value={formData.sales_partner} onChange={e => setFormData({ ...formData, sales_partner: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Amount Eligible for Commission</label><div className={`${inputStyle} bg-gray-50`}>₹ {Number(formData.amount_eligible_for_commission || 0).toFixed(2)}</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div></div>
                                <div className="space-y-4">
                                    <div><label className={labelStyle}>Commission Rate</label><input type="number" className={inputStyle} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} disabled={!isDraft} /></div>
                                    <div><label className={labelStyle}>Total Commission</label><div className={`${inputStyle} bg-gray-50`}>₹ {Number(formData.total_commission || 0).toFixed(2)}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Team */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Sales Team</div>
                        <div className="p-4">
                            <label className="block text-xs text-gray-600 font-semibold mb-2">Sales Team</label>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={`${thStyle} w-10 text-center`}>No.</th>
                                            <th className={thStyle}>Sales Person *</th>
                                            <th className={`${thStyle} text-right`}>Contribution (%)</th>
                                            <th className={`${thStyle} text-right`}>Contribution to Net Total</th>
                                            <th className={`${thStyle} text-right`}>Commission Rate</th>
                                            <th className={`${thStyle} text-right`}>Incentives</th>
                                            <th className={`${thStyle} w-10`}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.sales_team || []).length === 0 ? null : (formData.sales_team || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                                <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                                <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.sales_person || ''} onChange={e => handleRowChange('sales_team', i, 'sales_person', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.allocated_percentage || ''} onChange={e => handleRowChange('sales_team', i, 'allocated_percentage', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={`${tdStyle} text-right text-gray-700`}>₹ {Number(row.allocated_amount || 0).toFixed(2)}</td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.commission_rate || ''} onChange={e => handleRowChange('sales_team', i, 'commission_rate', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.incentives || ''} onChange={e => handleRowChange('sales_team', i, 'incentives', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('sales_team', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(formData.sales_team || []).length === 0 && renderEmptyTable()}
                            </div>
                            {isDraft && <button onClick={() => handleAddRow('sales_team', { sales_person: '', allocated_percentage: 0, allocated_amount: 0, commission_rate: 0, incentives: 0 })} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                        </div>
                    </div>

                    {/* Auto Repeat */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Auto Repeat</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div><label className={labelStyle}>From Date</label><input type="date" className={inputStyle} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Auto Repeat</label><input className={inputStyle} value={formData.auto_repeat} onChange={e => setFormData({ ...formData, auto_repeat: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="max-w-md">
                                <label className={labelStyle}>To Date</label>
                                <input type="date" className={inputStyle} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} disabled={!isDraft} />
                            </div>
                        </div>
                    </div>

                    {/* Print Settings */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Print Settings</div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className={labelStyle}>Letter Head</label><input className={inputStyle} value={formData.letter_head} onChange={e => setFormData({ ...formData, letter_head: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Print Heading</label><input className={inputStyle} value={formData.select_print_heading} onChange={e => setFormData({ ...formData, select_print_heading: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="so_group_same" checked={!!formData.group_same_items} onChange={e => setFormData({ ...formData, group_same_items: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                <label htmlFor="so_group_same" className="text-sm font-semibold text-gray-700">Group same items</label>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Additional Info</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="so_is_internal" checked={!!formData.is_internal_customer} onChange={e => setFormData({ ...formData, is_internal_customer: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                    <label htmlFor="so_is_internal" className="text-sm font-semibold text-gray-700">Is Internal Customer</label>
                                </div>
                                <div><label className={labelStyle}>Source</label><input className={inputStyle} value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div></div>
                                <div><label className={labelStyle}>Campaign</label><input className={inputStyle} value={formData.campaign} onChange={e => setFormData({ ...formData, campaign: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const actionMenuItems = [
        { key: 'placeholder1', label: 'Action 1' },
        { key: 'placeholder2', label: 'Action 2' },
    ];

    const viewMenuItems = [
        { key: 'view', label: 'View' },
    ];

    const handleCreateMenuClick = ({ key }) => {
        if (key === 'purchase_order') {
            setPOSelectedItems((formData.items || []).map(() => true));
            setShowPOModal(true);
        } else {
            notification.info({ message: `"${key}" action is not implemented yet.` });
        }
    };

    const handleCreatePurchaseOrder = async () => {
        const selectedItems = (formData.items || []).filter((_, i) => poSelectedItems[i]);
        if (selectedItems.length === 0) {
            notification.warning({ message: 'Please select at least one item.' });
            return;
        }
        setSaving(true);
        try {
            const res = await API.post('/api/method/erpnext.selling.doctype.sales_order.sales_order.make_purchase_order', {
                source_name: editingRecord,
                selected_items: selectedItems.map(item => item.item_code),
                against_default_supplier: poAgainstDefaultSupplier ? 1 : 0
            });
            const poData = res.data.message;
            if (poData && poData.name) {
                notification.success({ message: `Purchase Order ${poData.name} created successfully` });
                setShowPOModal(false);
                navigate(`/buying/purchase-order?edit=${poData.name}`);
            } else {
                notification.success({ message: 'Purchase Order created.' });
                setShowPOModal(false);
                navigate('/buying/purchase-order');
            }
        } catch (err) {
            console.error('PO Creation error:', err);
            // Fallback: navigate to PO page with pre-filled data via sessionStorage
            const poPayload = {
                supplier: selectedItems[0]?.supplier || '',
                schedule_date: formData.delivery_date || formData.transaction_date,
                customer: formData.customer || '',
                customer_name: formData.customer_name || '',
                sales_order: editingRecord,
                items: selectedItems.map(item => ({
                    item_code: item.item_code,
                    item_name: item.item_name,
                    schedule_date: item.delivery_date || formData.delivery_date,
                    qty: item.qty,
                    rate: item.rate,
                    amount: item.amount,
                    uom: item.uom || 'Nos',
                    stock_uom: item.stock_uom || 'Nos',
                    conversion_factor: 1,
                    sales_order: editingRecord,
                    sales_order_item: item.name || '',
                }))
            };
            sessionStorage.setItem('po_from_so', JSON.stringify(poPayload));
            setShowPOModal(false);
            navigate('/buying/purchase-order?from_so=1');
        } finally { setSaving(false); }
    };

    const createMenuItems = [
        { key: 'pick_list', label: 'Pick List' },
        { key: 'sales_invoice', label: 'Sales Invoice' },
        { key: 'material_request', label: 'Material Request' },
        { key: 'request_raw_materials', label: 'Request for Raw Materials' },
        { key: 'purchase_order', label: 'Purchase Order' },
        { key: 'project', label: 'Project' },
        { key: 'payment_request', label: 'Payment Request' },
        { key: 'payment', label: 'Payment' },
    ];

    const statusMenuItems = [
        { key: 'hold', label: 'Hold' },
        { key: 'close', label: 'Close' },
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord ? editingRecord : 'New Sales Order'}
                    </span>
                    <div className="flex items-center gap-2">
                        {getStatusLabel()}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <>
                            <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300">
                                    View <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                                    Actions <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Button className="h-8 text-[13px] border-gray-300">Duplicate</Button>
                        </>
                    )}

                    {isSubmitted && (
                        <>
                            <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                                    Status <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Dropdown menu={{ items: createMenuItems, onClick: handleCreateMenuClick }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-[#1a202c] text-white border-[#1a202c] hover:!text-white hover:!border-[#1a202c] hover:!bg-[#2d3748] font-medium transition-colors">
                                    Create <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Button className="h-8 text-[13px] border-gray-300 font-medium">Update Items</Button>
                        </>
                    )}

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    {isDraft && (
                        <button className="px-5 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    )}
                    
                    {editingRecord && isDraft && (
                        <Popconfirm title="Delete this order?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                    {editingRecord && isDraft && (
                        <button className="px-6 py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-70 ml-2" onClick={() => handleDocAction('submit')} disabled={saving}>Submit</button>
                    )}
                    {editingRecord && (isSubmitted || formData.docstatus === 2) && (
                        <Button className="h-8 text-[13px] border-gray-300 ml-2" onClick={() => handleDocAction('cancel')} disabled={saving} loading={saving}>Cancel</Button>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? <div className="flex justify-center items-center h-40"><Spin size="large" /></div> : <Tabs defaultActiveKey="details" items={tabItems} className="custom-so-tabs" />}
            </div>
            {renderItemModal()}

            <Modal
                title="Confirm"
                open={!!confirmAction}
                onOk={handleConfirmAction}
                onCancel={() => setConfirmAction(null)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ style: { background: '#111827', borderColor: '#111827', color: 'white' } }}
                centered
            >
                <div className="py-4 text-base text-gray-800">
                    {confirmAction === 'submit' ? 'Permanently Submit' : 'Cancel'} {editingRecord}?
                </div>
            </Modal>

            {/* Select Items for Purchase Order Modal */}
            <Modal
                title="Select Items"
                open={showPOModal}
                onCancel={() => setShowPOModal(false)}
                footer={null}
                width={800}
                centered
            >
                <div className="space-y-4 py-2">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="against_default_supplier" checked={poAgainstDefaultSupplier} onChange={e => setPOAgainstDefaultSupplier(e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
                        <label htmlFor="against_default_supplier" className="text-sm font-semibold text-gray-700">Against Default Supplier</label>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Select Items</div>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-3 py-2 w-10 text-center"><input type="checkbox" className="w-3.5 h-3.5" checked={poSelectedItems.every(Boolean)} onChange={e => setPOSelectedItems(poSelectedItems.map(() => e.target.checked))} /></th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase">Item</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase">Item Name</th>
                                    <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase">Pending Qty</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase">UOM</th>
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase">Supplier</th>
                                    <th className="px-3 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.items || []).map((item, i) => (
                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                        <td className="px-3 py-2 text-center"><input type="checkbox" className="w-3.5 h-3.5" checked={!!poSelectedItems[i]} onChange={e => { const c = [...poSelectedItems]; c[i] = e.target.checked; setPOSelectedItems(c); }} /></td>
                                        <td className="px-3 py-2 font-medium text-gray-800">{item.item_code}</td>
                                        <td className="px-3 py-2 text-gray-600">{item.item_name}</td>
                                        <td className="px-3 py-2 text-right text-gray-700">{item.qty}</td>
                                        <td className="px-3 py-2 text-gray-600">{item.uom || 'Nos'}</td>
                                        <td className="px-3 py-2 text-gray-600">{item.supplier || ''}</td>
                                        <td className="px-3 py-2 text-center text-gray-400">✎</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button 
                            className="px-6 py-2 bg-[#111827] text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-60"
                            onClick={handleCreatePurchaseOrder}
                            disabled={saving}
                        >
                            {saving ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Creating...</span> : 'Create Purchase Order'}
                        </button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-so-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f3f4f6; }
                .custom-so-tabs .ant-tabs-tab { padding: 12px 0; margin: 0 32px 0 0; color: #6b7280; font-size: 14px; }
                .custom-so-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #111827 !important; font-weight: 700; }
                .custom-so-tabs .ant-tabs-ink-bar { background: #111827; height: 3px !important; border-radius: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SalesOrder;
