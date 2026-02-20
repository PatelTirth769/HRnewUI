import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';

const CompanyForm = ({ onSave, onCancel, initialData, loading }) => {
  const [activeTab, setActiveTab] = useState('Details');
  const [formData, setFormData] = useState({
    // Details
    company_name: '',
    abbr: '',
    default_currency: 'INR',
    country: 'India',
    domain: 'Services',
    is_group: 0,
    parent_company: '',
    default_letter_head: '',
    tax_id: '',
    date_of_establishment: '',
    default_holiday_list: '',

    // Address & Contact
    date_of_incorporation: '',
    phone_no: '',
    email: '',
    fax: '',
    website: '',
    company_description: '',
    registration_details: '',

    // Accounts - Chart of Accounts
    create_chart_of_accounts_based_on: 'Standard Template',
    chart_of_accounts: '', // Chart Of Accounts Template
    existing_company: '', // Existing Company

    // Accounts - Default Accounts
    default_bank_account: '',
    default_cash_account: '',
    default_receivable_account: '',
    default_payable_account: '',
    write_off_account: '',
    unrealized_profit_loss_account: '',
    default_expense_account: '', // COGS
    default_income_account: '',
    default_discount_account: '', // Payment Discount
    payment_terms: '', // Default Payment Terms Template
    cost_center: '', // Default Cost Center
    default_finance_book: '',

    // Accounts - Exchange Gain/Loss
    exchange_gain_loss_account: '',
    unrealized_exchange_gain_loss_account: '',

    // Accounts - Round Off
    round_off_account: '',
    round_off_cost_center: '',
    round_off_for_opening: '', // Round Off for Opening

    // Accounts - Deferred Accounting
    default_deferred_revenue_account: '',
    default_deferred_expense_account: '',

    // Accounts - Advance Payments
    book_advance_payments_in_separate_party_account: 0,
    default_advance_received_account: '',
    default_advance_paid_account: '',

    // Accounts - Exchange Rate Revaluation
    auto_create_exchange_rate_revaluation: 0,
    frequency: 'Daily',
    submit_err_journals: 0,

    // Accounts - Budget Detail
    exception_budget_approver_role: '',

    // Accounts - Fixed Asset Defaults
    accumulated_depreciation_account: '',
    disposal_account: '', // Gain/Loss on Asset Disposal
    depreciation_expense_account: '',
    depreciation_cost_center: '', // Asset Depreciation Cost Center
    series_for_depreciation_entry: '',
    capital_work_in_progress_account: '',
    expenses_included_in_asset_valuation: '',
    asset_received_but_not_billed: '',

    // Accounts - HRA Settings
    basic_component: '',
    hra_component: '',
    arrear_component: '',

    // Buying and Selling
    default_buying_terms: '',
    default_selling_terms: '',
    monthly_sales_target: '',
    default_warehouse_for_sales_return: '',
    total_monthly_sales: '',
    credit_limit: '',

    // HR & Payroll
    default_expense_claim_payable_account: '',
    default_payroll_payable_account: '',
    default_employee_advance_account: '',

    // Stock and Manufacturing
    enable_perpetual_inventory: 1, // Default checked
    enable_provisional_accounting_for_non_stock_items: 0,
    default_inventory_account: '',
    stock_adjustment_account: '',
    default_in_transit_warehouse: '',
    stock_received_but_not_billed: '',
    default_provisional_account: '',
    expenses_included_in_valuation: '',
    default_operating_cost_account: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabs = ['Details', 'Address & Contact', 'Accounts', 'Buying and Selling', 'HR & Payroll', 'Stock and Manufacturing'];

  const InputField = ({ label, name, type = "text", required = false, placeholder = "", readOnly = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] !== null && formData[name] !== undefined ? formData[name] : ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${readOnly ? 'bg-gray-100' : ''}`}
        required={required}
      />
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const CheckboxField = ({ label, name }) => (
    <div className="flex items-center mt-6">
      <input
        type="checkbox"
        name={name}
        checked={formData[name] === 1}
        onChange={handleInputChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
      />
      <label className="ml-2 block text-sm text-gray-900">
        {label}
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Edit Company' : 'New Company'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {initialData ? `Editing: ${initialData.company_name}` : 'Create new company master'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">

            {/* DETAILS TAB */}
            {activeTab === 'Details' && (
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Company Name" name="company_name" required />
                <InputField label="Abbreviation" name="abbr" required />
                <InputField label="Default Currency" name="default_currency" required />
                <InputField label="Tax ID" name="tax_id" />
                <InputField label="Country" name="country" required />
                <InputField label="Domain" name="domain" required />
                <CheckboxField label="Is Group" name="is_group" />
                <InputField label="Date of Establishment" name="date_of_establishment" type="date" />
                <InputField label="Default Holiday List" name="default_holiday_list" />
                <InputField label="Parent Company" name="parent_company" />
                <InputField label="Default Letter Head" name="default_letter_head" />
              </div>
            )}

            {/* ADDRESS & CONTACT TAB */}
            {activeTab === 'Address & Contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <InputField label="Date of Incorporation" name="date_of_incorporation" type="date" />
                  <InputField label="Fax" name="fax" />
                  <InputField label="Phone No" name="phone_no" />
                  <InputField label="Website" name="website" />
                  <InputField label="Email" name="email" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea
                    name="company_description"
                    value={formData.company_description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Details</label>
                  <textarea
                    name="registration_details"
                    value={formData.registration_details || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* ACCOUNTS TAB */}
            {activeTab === 'Accounts' && (
              <div className="space-y-8">

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Chart of Accounts</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <SelectField
                      label="Create Chart Of Accounts Based On"
                      name="create_chart_of_accounts_based_on"
                      options={['Standard Template', 'Existing Company']}
                    />
                    {formData.create_chart_of_accounts_based_on === 'Standard Template' ? (
                      <InputField label="Chart Of Accounts Template" name="chart_of_accounts" placeholder="e.g. India - Chart of Accounts" />
                    ) : (
                      <InputField label="Existing Company" name="existing_company" />
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Default Accounts</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Default Bank Account" name="default_bank_account" />
                    <InputField label="Default Cost of Goods Sold Account" name="default_expense_account" />

                    <InputField label="Default Cash Account" name="default_cash_account" />
                    <InputField label="Default Income Account" name="default_income_account" />

                    <InputField label="Default Receivable Account" name="default_receivable_account" />
                    <InputField label="Default Payment Discount Account" name="default_discount_account" />

                    <InputField label="Default Payable Account" name="default_payable_account" />
                    <InputField label="Default Payment Terms Template" name="payment_terms" />

                    <InputField label="Write Off Account" name="write_off_account" />
                    <InputField label="Default Cost Center" name="cost_center" />

                    <InputField label="Unrealized Profit / Loss Account" name="unrealized_profit_loss_account" />
                    <InputField label="Default Finance Book" name="default_finance_book" />
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Exchange Gain / Loss</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Exchange Gain / Loss Account" name="exchange_gain_loss_account" />
                    <InputField label="Unrealized Exchange Gain/Loss Account" name="unrealized_exchange_gain_loss_account" />
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Round Off</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Round Off Account" name="round_off_account" />
                    <InputField label="Round Off for Opening" name="round_off_for_opening" />
                    <InputField label="Round Off Cost Center" name="round_off_cost_center" />
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Deferred Accounting</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Default Deferred Revenue Account" name="default_deferred_revenue_account" />
                    <InputField label="Default Deferred Expense Account" name="default_deferred_expense_account" />
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Advance Payments</h3>
                  <div className="space-y-4">
                    <div>
                      <CheckboxField label="Book Advance Payments in Separate Party Account" name="book_advance_payments_in_separate_party_account" />
                      <div className="mt-2 ml-8 text-xs text-gray-500 space-y-1">
                        <p>Enabling this option will allow you to record -</p>
                        <p>1. Advances Received in a <strong>Liability Account</strong> instead of the Asset Account</p>
                        <p>2. Advances Paid in an <strong>Asset Account</strong> instead of the Liability Account</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <InputField label="Default Advance Received Account" name="default_advance_received_account" />
                      <InputField label="Default Advance Paid Account" name="default_advance_paid_account" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Exchange Rate Revaluation Settings</h3>
                  <div className="grid grid-cols-2 gap-6 items-start">
                    <div>
                      <CheckboxField label="Auto Create Exchange Rate Revaluation" name="auto_create_exchange_rate_revaluation" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-6">Frequency</label>
                      <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <CheckboxField label="Submit ERR Journals?" name="submit_err_journals" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Budget Detail</h3>
                  <InputField label="Exception Budget Approver Role" name="exception_budget_approver_role" />
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Fixed Asset Defaults</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Accumulated Depreciation Account" name="accumulated_depreciation_account" />
                    <InputField label="Gain/Loss Account on Asset Disposal" name="disposal_account" />

                    <InputField label="Depreciation Expense Account" name="depreciation_expense_account" />
                    <InputField label="Asset Depreciation Cost Center" name="depreciation_cost_center" />

                    <InputField label="Series for Asset Depreciation Entry" name="series_for_depreciation_entry" />
                    <InputField label="Capital Work In Progress Account" name="capital_work_in_progress_account" />

                    <InputField label="Expenses Included In Asset Valuation" name="expenses_included_in_asset_valuation" />
                    <InputField label="Asset Received But Not Billed" name="asset_received_but_not_billed" />
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">HRA Settings</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Basic Component" name="basic_component" />
                    <InputField label="Arrear Component" name="arrear_component" />
                    <InputField label="HRA Component" name="hra_component" />
                  </div>
                </section>
              </div>
            )}

            {/* BUYING AND SELLING TAB */}
            {activeTab === 'Buying and Selling' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Buying & Selling Settings</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Default Buying Terms" name="default_buying_terms" />
                    <InputField label="Default Selling Terms" name="default_selling_terms" />
                    <InputField label="Monthly Sales Target" name="monthly_sales_target" />
                    <InputField label="Default Warehouse for Sales Return" name="default_warehouse_for_sales_return" />
                    <InputField label="Total Monthly Sales" name="total_monthly_sales" readOnly />
                    <InputField label="Credit Limit" name="credit_limit" />
                  </div>
                </section>
              </div>
            )}

            {/* HR & PAYROLL TAB */}
            {activeTab === 'HR & Payroll' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">HR & Payroll Settings</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Default Expense Claim Payable Account" name="default_expense_claim_payable_account" />
                    <InputField label="Default Payroll Payable Account" name="default_payroll_payable_account" />
                    <InputField label="Default Employee Advance Account" name="default_employee_advance_account" />
                  </div>
                </section>
              </div>
            )}

            {/* STOCK AND MANUFACTURING TAB */}
            {activeTab === 'Stock and Manufacturing' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Stock Settings</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <CheckboxField label="Enable Perpetual Inventory" name="enable_perpetual_inventory" />
                      <CheckboxField label="Enable Provisional Accounting For Non Stock Items" name="enable_provisional_accounting_for_non_stock_items" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <InputField label="Default Inventory Account" name="default_inventory_account" />
                      <InputField label="Stock Received But Not Billed" name="stock_received_but_not_billed" />

                      <InputField label="Stock Adjustment Account" name="stock_adjustment_account" />
                      <InputField label="Default Provisional Account" name="default_provisional_account" />

                      <InputField label="Default In-Transit Warehouse" name="default_in_transit_warehouse" />
                      <InputField label="Expenses Included In Valuation" name="expenses_included_in_valuation" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 border-b pb-1">Manufacturing</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Default Operating Cost Account" name="default_operating_cost_account" />
                  </div>
                </section>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading && <Spin size="small" className="mr-2" />}
                Save Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;