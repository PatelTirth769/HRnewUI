import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Select, DatePicker } from 'antd';
import { FiChevronLeft, FiSearch, FiPackage } from 'react-icons/fi';
import dayjs from 'dayjs';

/* ─── shared components ─── */
const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false, bg = 'bg-white', placeholder }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>}
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors cursor-text`}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

const DisplayField = ({ label, value, prefix = '' }) => (
    <div>
        <label className="block text-[13px] text-gray-400 mb-1 font-medium uppercase tracking-wider">{label}</label>
        <div className="text-[18px] font-bold text-gray-600 flex items-center gap-1">
            {prefix} {value || (prefix ? '0.00' : '0')}
        </div>
    </div>
);

export default function QuickStockBalance() {
    const [loading, setLoading] = useState(false);
    const [warehouseList, setWarehouseList] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    
    const [filters, setFilters] = useState({
        warehouse: '',
        date: dayjs().format('YYYY-MM-DD'),
        item_barcode: '',
        item_code: ''
    });

    const [stockData, setStockData] = useState({
        actual_qty: 0,
        stock_value: 0
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [whRes, itemRes] = await Promise.all([
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Item?fields=["name","item_name","image"]&limit_page_length=500')
            ]);
            setWarehouseList(whRes.data?.data || []);
            setItemsList(itemRes.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const fetchStockBalance = async (itemCode, warehouse) => {
        if (!itemCode || !warehouse) return;
        setLoading(true);
        try {
            // Fetch from Bin resource which tracks current item-warehouse stock
            const res = await API.get(`/api/resource/Bin?filters=[["item_code", "=", "${itemCode}"], ["warehouse", "=", "${warehouse}"]]&fields=["actual_qty", "valuation_rate"]`);
            if (res.data?.data?.[0]) {
                const b = res.data.data[0];
                setStockData({
                    actual_qty: b.actual_qty || 0,
                    stock_value: (b.actual_qty || 0) * (b.valuation_rate || 0)
                });
            } else {
                setStockData({ actual_qty: 0, stock_value: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch stock:', err);
            notification.error({ message: 'Failed to fetch stock data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filters.item_code && filters.warehouse) {
            fetchStockBalance(filters.item_code, filters.warehouse);
        } else {
            setStockData({ actual_qty: 0, stock_value: 0 });
        }
    }, [filters.item_code, filters.warehouse]);

    const handleBarcodeChange = (val) => {
        setFilters(p => ({ ...p, item_barcode: val }));
        // Simulate barcode lookup if needed - in many systems barcode is the item_code or a field in item
        // If an item matches this barcode, we select it
    };

    const selectedItem = itemsList.find(i => i.name === filters.item_code);

    return (
        <div className="p-6 max-w-[1240px] mx-auto text-gray-800">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Quick Stock Balance</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf2e9] text-[#e06c27] font-semibold tracking-wide uppercase">Not Saved</span>
            </div>

            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-8">
                    <div className="flex gap-10">
                        {/* Inputs Column */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1 font-medium">Warehouse <span className="text-[#E02424]">*</span></label>
                                <Select
                                    showSearch
                                    className="w-full h-[38px]"
                                    placeholder="Select Warehouse"
                                    value={filters.warehouse || undefined}
                                    onChange={v => setFilters(p => ({...p, warehouse: v}))}
                                    options={warehouseList.map(w => ({ value: w.name, label: w.name }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1 font-medium">Date <span className="text-[#E02424]">*</span></label>
                                <DatePicker 
                                    className="w-full h-[38px]" 
                                    value={filters.date ? dayjs(filters.date) : null} 
                                    onChange={(d) => setFilters(p => ({...p, date: d ? d.format('YYYY-MM-DD') : ''}))} 
                                />
                            </div>

                            <InputField 
                                label="Item Barcode" 
                                value={filters.item_barcode} 
                                onChange={handleBarcodeChange} 
                                bg="bg-gray-50/50" 
                            />

                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1 font-medium">Item Code <span className="text-[#E02424]">*</span></label>
                                <Select
                                    showSearch
                                    className="w-full h-[38px]"
                                    placeholder="Select Item"
                                    value={filters.item_code || undefined}
                                    onChange={v => setFilters(p => ({...p, item_code: v}))}
                                    options={itemsList.map(i => ({ value: i.name, label: i.name }))}
                                />
                            </div>
                        </div>

                        {/* Image / Icon Column */}
                        <div className="w-[180px] h-[180px] bg-gray-50 rounded flex items-center justify-center border border-gray-100 mt-6 relative overflow-hidden">
                            {selectedItem?.image ? (
                                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center gap-1 opacity-60">
                                    <FiPackage size={48} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">No Image</span>
                                </div>
                            )}
                            {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Spin size="small" /></div>}
                        </div>
                    </div>

                    {/* Footer Results Row */}
                    <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-x-12">
                        <DisplayField label="Available Quantity" value={stockData.actual_qty} />
                        <DisplayField label="Stock Value" prefix="₹" value={stockData.stock_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                {/* Save button as in mockup, though it might just refresh or do nothing for this utility */}
                <button className="px-6 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all shadow-md">
                    Save
                </button>
            </div>
        </div>
    );
}
