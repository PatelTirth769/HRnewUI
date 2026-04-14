import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin, Tooltip, Tabs, Dropdown, Button, Space } from 'antd';
import { 
    FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, 
    FiInfo, FiSave, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';
import { Modal } from 'antd';
import API from '../../services/api';

const StockSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});
    const [docFields, setDocFields] = useState([]);
    const [allRoles, setAllRoles] = useState([]);

    // Linked data
    const valuationMethods = ['FIFO', 'LIFO', 'Moving Average'];
    const itemNamingOptions = ['Item Code', 'Naming Series'];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchDocTypeMeta = async () => {
        try {
            const res = await API.get('/api/resource/DocType/Stock Settings');
            const fields = res?.data?.data?.fields || [];
            setDocFields(Array.isArray(fields) ? fields : []);
        } catch (err) {
            // Non-fatal: screen can still work with hardcoded fieldnames
            setDocFields([]);
        }
    };

    const fieldnameByLabel = (label) => {
        if (!label || !Array.isArray(docFields) || docFields.length === 0) return null;
        const f = docFields.find(df => (df?.label || '').trim() === label.trim());
        return f?.fieldname || null;
    };

    const docFieldByFieldname = (fieldname) => {
        if (!fieldname || !Array.isArray(docFields) || docFields.length === 0) return null;
        return docFields.find(df => df?.fieldname === fieldname) || null;
    };

    const optionsFromDocField = (fieldname) => {
        const df = docFieldByFieldname(fieldname);
        const raw = df?.options;
        if (!raw || typeof raw !== 'string') return [];
        // ERPNext stores Select options as newline-separated
        return raw.split('\n').map(s => s.trim()).filter(Boolean);
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // Load single doc (best for Single DocTypes)
            try {
                const res = await API.post('/api/method/frappe.desk.form.load.getdoc', {
                    doctype: 'Stock Settings',
                    name: 'Stock Settings'
                });
                const doc = res.data?.docs?.[0] || res.data?.message?.docs?.[0];
                setSettings(doc || {});
            } catch (methodErr) {
                // Fallbacks (older/custom instances)
                try {
                    const response = await API.get('/api/resource/Stock Settings');
                    setSettings(response.data.data || {});
                } catch (resErr) {
                    const fallback = await API.get('/api/method/frappe.client.get?doctype=Stock Settings');
                    setSettings(fallback.data.message || {});
                }
            }
            fetchDocTypeMeta();
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

    const fetchRoles = async () => {
        try {
            const res = await API.get('/api/resource/Role?fields=["name"]&limit=0');
            const roles = (res.data?.data || []).map(r => r.name).sort();
            setAllRoles(roles);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save single doc (ERPNext-standard)
            const payload = {
                doc: {
                    doctype: 'Stock Settings',
                    name: 'Stock Settings',
                    ...settings
                },
                action: 'Save'
            };
            await API.post('/api/method/frappe.desk.form.save.savedocs', payload);
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
    const helpTextStyle = "text-[11px] text-gray-400 mt-1 leading-relaxed";

    const isEnabled = (value) => value === 1 || value === true || value === '1';

    const CheckboxField = ({ label, name, help, onChange }) => {
        const handleChange = (e) => {
            const checked = e.target.checked ? 1 : 0;
            if (onChange) {
                onChange(checked);
            } else {
                updateField(name, checked);
            }
        };

        return (
            <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded-sm border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer transition-all active:scale-95" 
                        checked={isEnabled(settings?.[name])} 
                        onChange={handleChange} 
                    />
                    <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
                </label>
                {help && <p className={helpTextStyle + " ml-7"}>{help}</p>}
            </div>
        );
    };

    const NumberField = ({ label, name, help, placeholder = "0.000" }) => (
        <div className="mb-4">
            <label className={labelStyle}>{label}</label>
            <input 
                type="number"
                step="0.001"
                className={inputStyle} 
                value={settings[name] || 0} 
                onChange={e => updateField(name, parseFloat(e.target.value) || 0)}
                placeholder={placeholder}
            />
            {help && <p className={helpTextStyle}>{help}</p>}
        </div>
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

    const LinkField = ({ label, name, placeholder, help }) => (
        <div className="mb-4">
            <label className={labelStyle}>{label}</label>
            <input 
                className={inputStyle} 
                value={settings[name] || ''} 
                onChange={e => updateField(name, e.target.value)}
                placeholder={placeholder || `Select ${label}...`}
            />
            {help && <p className={helpTextStyle}>{help}</p>}
        </div>
    );
    
    const DateField = ({ label, name, help }) => (
        <div className="mb-4">
            <label className={labelStyle}>{label}</label>
            <input 
                type="date"
                className={inputStyle} 
                value={settings[name] || ''} 
                onChange={e => updateField(name, e.target.value)}
            />
            {help && <p className={helpTextStyle}>{help}</p>}
        </div>
    );

    const resolveFieldname = (label, fallbackFieldname) => fieldnameByLabel(label) || fallbackFieldname;

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
        { 
            key: 'validations', 
            label: 'Stock Validations', 
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    <div className="grid grid-cols-2 gap-x-12">
                        <div className="space-y-4">
                            <h2 className={sectionTitleStyle}>Stock Transactions Settings</h2>
                            <NumberField 
                                label="Over Delivery/Receipt Allowance (%)" 
                                name="over_delivery_receipt_allowance" 
                                help="The percentage you are allowed to receive or deliver more against the quantity ordered. For example, if you have ordered 100 units, and your Allowance is 10%, then you are allowed to receive 110 units."
                            />
                            <NumberField 
                                label="Over Transfer Allowance" 
                                name="over_transfer_allowance" 
                                help="The percentage you are allowed to transfer more against the quantity ordered. For example, if you have ordered 100 units, and your Allowance is 10%, then you are allowed transfer 110 units."
                            />
                            <NumberField 
                                label="Over Picking Allowance" 
                                name="over_picking_allowance" 
                                help="The percentage you are allowed to pick more items in the pick list than the ordered quantity."
                            />
                            <SelectField 
                                label="Role Allowed to Over Transfer" 
                                name="role_allowed_to_over_transfer" 
                                options={allRoles}
                                help="Users with this role are allowed to over transfer against orders above the allowance percentage"
                            />
                            <SelectField 
                                label="Role Allowed to Over Picking" 
                                name="role_allowed_to_over_picking" 
                                options={allRoles}
                                help="Users with this role are allowed to over pick items against orders above the allowance percentage"
                            />
                        </div>
                        <div className="space-y-4">
                            <h2 className={sectionTitleStyle}>&nbsp;</h2>
                            <SelectField 
                                label="Role Allowed to Over Deliver/Receive" 
                                name="role_allowed_to_over_deliver_receive" 
                                options={allRoles}
                                help="Users with this role are allowed to over deliver/receive against orders above the allowance percentage"
                            />
                            <CheckboxField 
                                label="Allow Negative Stock" 
                                name="allow_negative_stock" 
                                onChange={(checked) => {
                                    if (checked === 1) {
                                        // Update state optimistically to show the checkbox as checked
                                        updateField('allow_negative_stock', 1);
                                        Modal.confirm({
                                            title: 'Confirm',
                                            className: 'custom-confirm-modal',
                                            icon: <FiAlertCircle className="text-yellow-500" size={24} />,
                                            content: 'Using negative stock disables FIFO/Moving average valuation when inventory is negative. This is considered dangerous from accounting point of view. Do you still want to enable negative inventory?',
                                            okText: 'Yes',
                                            cancelText: 'No',
                                            onOk: () => {}, // Already set to 1
                                            onCancel: () => updateField('allow_negative_stock', 0), // Revert on cancel
                                            okButtonProps: { className: 'bg-gray-900 hover:bg-gray-800 text-white border-none h-9 text-sm font-medium px-6' },
                                            cancelButtonProps: { className: 'h-9 text-sm font-medium px-6' }
                                        });
                                    } else {
                                        updateField('allow_negative_stock', 0);
                                    }
                                }}
                            />
                            <CheckboxField label="Show Barcode Field in Stock Transactions" name="show_barcode_field_in_stock_transactions" />
                            <CheckboxField label="Convert Item Description to Clean HTML in Transactions" name="convert_item_description_to_clean_html" />
                            <CheckboxField 
                                label="Allow Internal Transfers at Arm's Length Price" 
                                name="allow_internal_transfers_at_arms_length_price" 
                                help="If enabled, the item rate won't adjust to the valuation rate during internal transfers, but accounting will still use the valuation rate."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 mt-8">
                        <div className="space-y-4">
                            <h2 className={sectionTitleStyle}>Quality Inspection Settings</h2>
                            <SelectField 
                                label="Action If Quality Inspection Is Not Submitted" 
                                name="action_if_quality_inspection_is_not_submitted" 
                                options={['Stop', 'Warn']} 
                            />
                        </div>
                        <div className="space-y-4 pt-4">
                            <h2 className={sectionTitleStyle}>&nbsp;</h2>
                            <SelectField 
                                label="Action If Quality Inspection Is Rejected" 
                                name="action_if_quality_inspection_is_rejected" 
                                options={['Stop', 'Warn']} 
                            />
                        </div>
                    </div>
                </div>
            )
        },
        { 
            key: 'reservation', 
            label: 'Stock Reservation', 
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {(() => {
                        const enableStockReservationFn = resolveFieldname('Enable Stock Reservation', 'enable_stock_reservation');
                        const allowPartialReservationFn = resolveFieldname('Allow Partial Reservation', 'allow_partial_reservation');
                        const autoReserveOnPurchaseFn = resolveFieldname(
                            'Auto Reserve Stock for Sales Order on Purchase',
                            'auto_reserve_stock_for_sales_order_on_purchase'
                        );
                        const autoReserveSerialBatchFn = resolveFieldname(
                            'Auto Reserve Serial and Batch Nos',
                            'auto_reserve_serial_and_batch_nos'
                        );
                        const pickSerialBatchBasedOnFn = resolveFieldname(
                            'Pick Serial / Batch Based On',
                            'pick_serial_batch_based_on'
                        );

                        const stockReservationEnabled = isEnabled(settings?.[enableStockReservationFn]);
                        const serialBatchEnabled = isEnabled(settings?.[autoReserveSerialBatchFn]);

                        return (
                            <>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-4">
                            <h2 className={sectionTitleStyle}>Stock Reservation</h2>
                            <CheckboxField
                                label="Enable Stock Reservation"
                                name={enableStockReservationFn}
                                help="Allows to keep aside a specific quantity of inventory for a particular order."
                            />
                                    </div>

                                    {/* Show dependent settings only when enabled */}
                                    {stockReservationEnabled ? (
                                        <div className="space-y-4">
                                            <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                            <CheckboxField
                                                label="Allow Partial Reservation"
                                                name={allowPartialReservationFn}
                                                help="Partial stock can be reserved. For example, if you have a Sales Order of 100 units and the Available Stock is 90 units then a Stock Reservation Entry will be created for 90 units."
                                            />
                                            <CheckboxField
                                                label="Auto Reserve Stock for Sales Order on Purchase"
                                                name={autoReserveOnPurchaseFn}
                                                help="Stock will be reserved on submission of Purchase Receipt created against Material Request for Sales Order."
                                            />
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                </div>

                                {/* Serial/Batch section depends on Enable Stock Reservation */}
                                {stockReservationEnabled ? (
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8">
                                        <div className="space-y-4">
                                            <h2 className={sectionTitleStyle}>Serial and Batch Reservation</h2>
                                            <CheckboxField
                                                label="Auto Reserve Serial and Batch Nos"
                                                name={autoReserveSerialBatchFn}
                                                help="Serial and Batch Nos will be auto-reserved based on Pick Serial / Batch Based On."
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                            {serialBatchEnabled ? (() => {
                                                const opts = optionsFromDocField(pickSerialBatchBasedOnFn);
                                                if (!pickSerialBatchBasedOnFn || opts.length === 0) return null;
                                                return (
                                                    <SelectField
                                                        label="Pick Serial / Batch Based On"
                                                        name={pickSerialBatchBasedOnFn}
                                                        options={opts}
                                                        help="Used to auto-reserve Serial and Batch Nos."
                                                    />
                                                );
                                            })() : null}
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        );
                    })()}
                </div>
            )
        },
        { 
            key: 'batch', 
            label: 'Serial & Batch Item', 
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {(() => {
                        const autoCreateBundleFn = resolveFieldname('Auto Create Serial and Batch Bundle For Outward', 'auto_create_serial_and_batch_bundle_for_outward');
                        const pickBasedOnFn = resolveFieldname('Pick Serial / Batch Based On', 'pick_serial_batch_based_on');
                        const disableSelectorFn = resolveFieldname('Disable Serial No And Batch Selector', 'disable_serial_no_and_batch_selector');
                        const hasNamingSeriesFn = resolveFieldname('Have Default Naming Series for Batch ID?', 'has_default_naming_series_for_batch_id');
                        const namingSeriesPrefixFn = resolveFieldname('Naming Series Prefix', 'naming_series_prefix');
                        const useSerialBatchFieldsFn = resolveFieldname('Use Serial / Batch Fields', 'use_serial_batch_fields');
                        const doNotUpdateFn = resolveFieldname('Do Not Update Serial / Batch on Creation of Auto Bundle', 'do_not_update_serial_batch_on_creation_of_auto_bundle');
                        const allowExistingSerialFn = resolveFieldname('Allow existing Serial No to be Manufactured/Received again', 'allow_existing_serial_no_to_be_manufactured_received_again');

                        const autoCreateEnabled = isEnabled(settings?.[autoCreateBundleFn]);
                        const hasNamingSeriesEnabled = isEnabled(settings?.[hasNamingSeriesFn]);

                        return (
                            <>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-4">
                                        <h2 className={sectionTitleStyle}>Serial & Batch Item Settings</h2>
                                        <CheckboxField
                                            label="Auto Create Serial and Batch Bundle For Outward"
                                            name={autoCreateBundleFn}
                                        />
                                        
                                        {autoCreateEnabled && (
                                            (() => {
                                                const opts = optionsFromDocField(pickBasedOnFn);
                                                return (
                                                    <SelectField
                                                        label="Pick Serial / Batch Based On"
                                                        name={pickBasedOnFn}
                                                        options={opts.length > 0 ? opts : ['FIFO', 'LIFO', 'Expiry']}
                                                        help="Used to auto-pick Serial and Batch Nos."
                                                    />
                                                );
                                            })()
                                        )}

                                        {hasNamingSeriesEnabled && (
                                            <div className="mt-4">
                                                <LinkField
                                                    label="Naming Series Prefix"
                                                    name={namingSeriesPrefixFn}
                                                    placeholder="BATCH-"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                        <CheckboxField
                                            label="Disable Serial No And Batch Selector"
                                            name={disableSelectorFn}
                                        />
                                        <CheckboxField
                                            label="Have Default Naming Series for Batch ID?"
                                            name={hasNamingSeriesFn}
                                        />
                                        <CheckboxField
                                            label="Use Serial / Batch Fields"
                                            name={useSerialBatchFieldsFn}
                                            help="On submission of the stock transaction, system will auto create the Serial and Batch Bundle based on the Serial No / Batch fields."
                                        />
                                        <CheckboxField
                                            label="Do Not Update Serial / Batch on Creation of Auto Bundle"
                                            name={doNotUpdateFn}
                                            help="If enabled, do not update serial / batch values in the stock transactions on creation of auto Serial / Batch Bundle."
                                        />
                                        <CheckboxField
                                            label="Allow existing Serial No to be Manufactured/Received again"
                                            name={allowExistingSerialFn}
                                        />
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )
        },
        { 
            key: 'planning', 
            label: 'Stock Planning', 
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {(() => {
                        const autoIndentFn = resolveFieldname('Raise Material Request When Stock Reaches Re-order Level', 'auto_indent');
                        const notifyEmailFn = resolveFieldname('Notify by Email on Creation of Automatic Material Request', 'notify_by_email_on_creation_of_automatic_material_request');
                        const transferDeliveryNoteFn = resolveFieldname('Allow Material Transfer from Delivery Note to Sales Invoice', 'allow_transfer_from_delivery_note_to_sales_invoice');
                        const transferPurchaseFn = resolveFieldname('Allow Material Transfer from Purchase Receipt to Purchase Invoice', 'allow_transfer_from_purchase_receipt_to_purchase_invoice');

                        return (
                            <>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-4">
                                        <h2 className={sectionTitleStyle}>Auto Material Request</h2>
                                        <CheckboxField
                                            label="Raise Material Request When Stock Reaches Re-order Level"
                                            name={autoIndentFn}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                        <CheckboxField
                                            label="Notify by Email on Creation of Automatic Material Request"
                                            name={notifyEmailFn}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-8">
                                    <div className="space-y-4">
                                        <h2 className={sectionTitleStyle}>Inter Warehouse Transfer Settings</h2>
                                        <CheckboxField
                                            label="Allow Material Transfer from Delivery Note to Sales Invoice"
                                            name={transferDeliveryNoteFn}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                        <CheckboxField
                                            label="Allow Material Transfer from Purchase Receipt to Purchase Invoice"
                                            name={transferPurchaseFn}
                                        />
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )
        },
        { 
            key: 'closing', 
            label: 'Stock Closing', 
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {(() => {
                        const stockFrozenUptoFn = resolveFieldname('Stock Frozen Upto', 'stock_frozen_upto');
                        const roleAllowedBackdatedFn = resolveFieldname('Role Allowed to Create/Edit Back-dated Transactions', 'role_allowed_to_create_edit_back_dated_transactions');
                        const freezeStocksOlderThanFn = resolveFieldname('Freeze Stocks Older Than (Days)', 'freeze_stocks_older_than');

                        return (
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                    <h2 className={sectionTitleStyle}>Control Historical Stock Transactions</h2>
                                    <DateField
                                        label="Stock Frozen Upto"
                                        name={stockFrozenUptoFn}
                                        help="No stock transactions can be created or modified before this date."
                                    />
                                    <NumberField
                                        label="Freeze Stocks Older Than (Days)"
                                        name={freezeStocksOlderThanFn}
                                        placeholder="0"
                                        help="Stock transactions that are older than the mentioned days cannot be modified."
                                    />
                                </div>
                                <div className="space-y-4 pt-4">
                                    <h2 className={sectionTitleStyle}>&nbsp;</h2>
                                    <SelectField
                                        label="Role Allowed to Create/Edit Back-dated Transactions"
                                        name={roleAllowedBackdatedFn}
                                        options={allRoles}
                                        help="If mentioned, the system will allow only the users with this Role to create or modify any stock transaction earlier than the latest stock transaction for a specific item and warehouse. If set as blank, it allows all users to create/edit back-dated transactions."
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )
        }
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
