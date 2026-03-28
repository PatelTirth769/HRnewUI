import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const TABS = [
    'Invoice and Billing', 'Credit Limits', 'POS', 'Assets', 
    'Accounts Closing', 'Chart Of Accounts', 'Banking', 'Reports', 'Payment Request'
];

const AccountSettings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab ] = useState('Invoice and Billing');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await API.get('/api/resource/Accounts Settings');
            setSettings(response.data.data || {});
        } catch (err) {
            console.error('Error fetching account settings:', err);
            notification.error({ message: 'Error', description: 'Failed to load accounting settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put('/api/resource/Accounts Settings', settings);
            notification.success({ message: 'Success', description: 'Account Settings updated successfully.' });
        } catch (err) {
            console.error('Error saving account settings:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // --- Styling Classes from Education module ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider border-b border-gray-100 pb-2 mt-8 first:mt-0";
    const checkboxLabelStyle = "text-sm font-medium text-gray-700 cursor-pointer select-none";
    const helpTextStyle = "text-[12px] text-gray-400 mt-1 ml-6 italic";

    const CheckboxField = ({ label, name, helpText }) => (
        <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id={name}
                    checked={!!settings[name]}
                    onChange={e => updateField(name, e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={name} className={checkboxLabelStyle}>{label}</label>
            </div>
            {helpText && <p className={helpTextStyle}>{helpText}</p>}
        </div>
    );

    if (loading) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20">
                <Spin size="large" tip="Loading Accounting Settings..." />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center"
                        title="Go Back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Accounts Settings</span>
                    <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#F2F4F7] text-[#344054] font-medium border border-[#EAECF0]">Draft / Saved</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" 
                        onClick={handleSave} 
                        disabled={saving}
                    >
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            {/* Tab Bar Container */}
            <div className="flex gap-6 mb-8 border-b border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-all relative px-1 ${
                            activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[500px]">
                {/* --- Invoice and Billing Tab --- */}
                {activeTab === 'Invoice and Billing' && (
                    <div className="space-y-6">
                        <section>
                            <h3 className={sectionTitleStyle}>Invoice Cancellation</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div>
                                    <CheckboxField name="unlink_payment_on_cancellation_of_invoice" label="Unlink Payment on Cancellation of Invoice" />
                                    <CheckboxField name="unlink_advance_payment_on_cancellation_of_order" label="Unlink Advance Payment on Cancellation of Order" />
                                </div>
                                <div>
                                    <CheckboxField name="delete_accounting_and_stock_ledger_entries_on_deletion_of_transaction" label="Delete Accounting and Stock Ledger Entries on deletion of Transaction" />
                                    <CheckboxField name="enable_immutable_ledger" label="Enable Immutable Ledger" helpText="On enabling this cancellation entries will be posted on the actual cancellation date and reports will consider cancelled entries as well" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Invoicing Features</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div>
                                    <CheckboxField name="check_supplier_invoice_number_uniqueness" label="Check Supplier Invoice Number Uniqueness" helpText="Enabling this ensures each Purchase Invoice has a unique value in Supplier Invoice No. field within a particular fiscal year" />
                                    <CheckboxField name="automatically_fetch_payment_terms_from_order" label="Automatically Fetch Payment Terms from Order" helpText="Payment Terms from orders will be fetched into the invoices as is" />
                                </div>
                                <div>
                                    <CheckboxField name="enable_common_party_accounting" label="Enable Common Party Accounting" />
                                    <CheckboxField name="allow_multi_currency_invoices_against_single_party_account" label="Allow multi-currency invoices against single party account" helpText="Enabling this will allow creation of multi-currency invoices against single party account in company currency" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Journals</h3>
                            <CheckboxField name="merge_similar_account_heads" label="Merge Similar Account Heads" helpText="Rows with Same Account heads will be merged on Ledger" />
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Deferred Accounting Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelStyle}>Book Deferred Entries Based On</label>
                                        <select className={inputStyle} value={settings.book_deferred_entries_based_on || 'Days'} onChange={e => updateField('book_deferred_entries_based_on', e.target.value)}>
                                            <option value="Days">Days</option>
                                            <option value="Months">Months</option>
                                        </select>
                                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">If "Months" is selected, a fixed amount will be booked as deferred revenue or expense for each month irrespective of the number of days in a month. It will be prorated if deferred revenue or expense is not booked for an entire month</p>
                                    </div>
                                </div>
                                <div>
                                    <CheckboxField name="automatically_process_deferred_accounting_entry" label="Automatically Process Deferred Accounting Entry" />
                                    <CheckboxField name="book_deferred_entries_via_journal_entry" label="Book Deferred Entries Via Journal Entry" helpText="If this is unchecked, direct GL entries will be created to book deferred revenue or expense" />
                                    <CheckboxField name="submit_journal_entries" label="Submit Journal Entries" helpText="If this is unchecked Journal Entries will be saved in a Draft state and will have to be submitted manually" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Tax Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelStyle}>Determine Address Tax Category From</label>
                                        <select className={inputStyle} value={settings.determine_address_tax_category_from || 'Billing Address'} onChange={e => updateField('determine_address_tax_category_from', e.target.value)}>
                                            <option value="Billing Address">Billing Address</option>
                                            <option value="Shipping Address">Shipping Address</option>
                                        </select>
                                        <p className="text-[11px] text-gray-400 mt-2">Address used to determine Tax Category in transactions</p>
                                    </div>
                                </div>
                                <div>
                                    <CheckboxField name="automatically_add_taxes_and_charges_from_item_tax_template" label="Automatically Add Taxes and Charges from Item Tax Template" />
                                    <CheckboxField name="book_tax_loss_on_early_payment_discount" label="Book Tax Loss on Early Payment Discount" helpText="Split Early Payment Discount Loss into Income and Tax Loss" />
                                    <CheckboxField name="round_tax_amount_row_wise" label="Round Tax Amount Row-wise" helpText="Tax Amount will be rounded on a row(items) level" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Print Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div>
                                    <CheckboxField name="show_inclusive_tax_in_print" label="Show Inclusive Tax in Print" />
                                    <CheckboxField name="show_taxes_as_table_in_print" label="Show Taxes as Table in Print" />
                                </div>
                                <div>
                                    <CheckboxField name="show_payment_schedule_in_print" label="Show Payment Schedule in Print" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Currency Exchange Settings</h3>
                            <CheckboxField name="allow_stale_exchange_rates" label="Allow Stale Exchange Rates" />
                            {!settings.allow_stale_exchange_rates && (
                                <div className="ml-6 mt-2 max-w-[200px] animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className={labelStyle}>Stale Days</label>
                                    <input 
                                        type="number" 
                                        className={inputStyle} 
                                        value={settings.stale_days || 1} 
                                        onChange={e => updateField('stale_days', parseInt(e.target.value))} 
                                    />
                                </div>
                            )}
                        </section>

                        <section>
                            <h3 className={sectionTitleStyle}>Payment Reconciliations</h3>
                            <CheckboxField name="auto_reconcile_payments" label="Auto Reconcile Payments" />
                        </section>
                    </div>
                )}

                {/* --- Credit Limits Tab --- */}
                {activeTab === 'Credit Limits' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Credit Limit Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className={labelStyle}>Over Billing Allowance (%)</label>
                                    <input type="number" step="0.01" className={inputStyle} value={settings.over_billing_allowance || 0} onChange={e => updateField('over_billing_allowance', parseFloat(e.target.value))} />
                                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">The percentage you are allowed to bill more against the amount ordered. For example, if the order value is $100 for an item and tolerance is set as 10%, then you are allowed to bill up to $110</p>
                                </div>
                                <div>
                                    <label className={labelStyle}>Role Allowed to Over Bill</label>
                                    <input className={inputStyle} value={settings.role_allowed_to_over_bill || ''} onChange={e => updateField('role_allowed_to_over_bill', e.target.value)} placeholder="e.g. Accounts Manager" />
                                    <p className="text-[11px] text-gray-400 mt-2">Users with this role are allowed to over bill above the allowance percentage</p>
                                </div>
                                <div className="col-start-2">
                                    <label className={labelStyle}>Role allowed to bypass Credit Limit</label>
                                    <input className={inputStyle} value={settings.role_allowed_to_bypass_credit_limit || ''} onChange={e => updateField('role_allowed_to_bypass_credit_limit', e.target.value)} placeholder="e.g. CEO" />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* --- POS Tab --- */}
                {activeTab === 'POS' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>POS Setting</h3>
                            <CheckboxField name="create_ledger_entries_for_change_amount" label="Create Ledger Entries for Change Amount" helpText="If enabled, ledger entries will be posted for change amount in POS transactions" />
                        </section>
                    </div>
                )}

                {/* --- Assets Tab --- */}
                {activeTab === 'Assets' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Asset Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <CheckboxField 
                                    name="calculate_daily_depreciation" 
                                    label="Calculate daily depreciation using total days in depreciation period" 
                                    helpText="Enable this option to calculate daily depreciation by considering the total number of days in the entire depreciation period, (including leap years) while using daily pro-rata based depreciation"
                                />
                                <CheckboxField 
                                    name="book_asset_depreciation_entry_automatically" 
                                    label="Book Asset Depreciation Entry Automatically" 
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Accounts Closing Tab --- */}
                {activeTab === 'Accounts Closing' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Period Closing Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className={labelStyle}>Accounts Frozen Till Date</label>
                                    <input type="date" className={inputStyle} value={settings.accounts_frozen_till_date || ''} onChange={e => updateField('accounts_frozen_till_date', e.target.value)} />
                                    <p className="text-[11px] text-gray-400 mt-2 italic">Accounting entries are frozen up to this date. Nobody can create or modify entries except users with the role specified below</p>
                                </div>
                                <div>
                                    <label className={labelStyle}>Role Allowed to Set Frozen Accounts and Edit Frozen Entries</label>
                                    <input className={inputStyle} value={settings.role_allowed_to_set_frozen_accounts_and_edit_frozen_entries || ''} onChange={e => updateField('role_allowed_to_set_frozen_accounts_and_edit_frozen_entries', e.target.value)} placeholder="e.g. System Manager" />
                                    <p className="text-[11px] text-gray-400 mt-2 italic">Users with this role are allowed to set frozen accounts and create / modify accounting entries against frozen accounts</p>
                                </div>
                                <div className="col-span-2">
                                    <CheckboxField 
                                        name="ignore_account_closing_balance" 
                                        label="Ignore Account Closing Balance" 
                                        helpText="Financial reports will be generated using GL Entry doctypes (should be enabled if Period Closing Voucher is not posted for all years sequentially or missing)"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Chart Of Accounts Tab --- */}
                {activeTab === 'Chart Of Accounts' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Chart of Accounts Settings</h3>
                            <CheckboxField 
                                name="show_balances_in_chart_of_accounts" 
                                label="Show Balances in Chart Of Accounts" 
                            />
                        </section>
                    </div>
                )}

                {/* --- Banking Tab --- */}
                {activeTab === 'Banking' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Banking Settings</h3>
                            <div className="space-y-4">
                                <CheckboxField 
                                    name="enable_automatic_party_matching" 
                                    label="Enable Automatic Party Matching" 
                                    helpText="Auto match and set the Party in Bank Transactions"
                                />
                                <CheckboxField 
                                    name="enable_fuzzy_matching" 
                                    label="Enable Fuzzy Matching" 
                                    helpText="Approximately match the description/party name against parties"
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Reports Tab --- */}
                {activeTab === 'Reports' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Remarks Column Length</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div>
                                    <label className={labelStyle}>General Ledger</label>
                                    <input type="number" className={inputStyle} value={settings.general_ledger_remarks_column_length || 0} onChange={e => updateField('general_ledger_remarks_column_length', parseInt(e.target.value))} />
                                    <p className="text-[11px] text-gray-400 mt-2 italic">Truncates 'Remarks' column to set character length</p>
                                </div>
                                <div>
                                    <label className={labelStyle}>Accounts Receivable/Payable</label>
                                    <input type="number" className={inputStyle} value={settings.receivable_payable_remarks_column_length || 0} onChange={e => updateField('receivable_payable_remarks_column_length', parseInt(e.target.value))} />
                                    <p className="text-[11px] text-gray-400 mt-2 italic">Truncates 'Remarks' column to set character length</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Payment Request Tab --- */}
                {activeTab === 'Payment Request' && (
                    <div className="space-y-8">
                        <section>
                            <h3 className={sectionTitleStyle}>Payment Request Settings</h3>
                            <CheckboxField 
                                name="create_in_draft_status" 
                                label="Create in Draft Status" 
                            />
                        </section>
                    </div>
                )}
            </div>
            
            {/* Standard Footer matching screenshots */}
            <div className="mt-10 border-t border-gray-100 pt-10">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 italic text-[13px] text-gray-500">
                    <strong>Note:</strong> These are global settings that affect all accounting transactions. Changing them may impact how financial data is calculated and displayed across the system.
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
