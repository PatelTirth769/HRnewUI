import React, { useState, useEffect, useRef } from 'react';
import { notification, Spin, Popconfirm, Tabs, Dropdown, Button, Space, Modal } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiUserPlus, FiPaperclip, FiTag, FiShare2, FiMonitor, FiFolder, FiLink2, FiCamera } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import API from '../../services/api';

const WebsiteItem = () => {
    const location = useLocation();
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [linkInputMode, setLinkInputMode] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [fileInputRef] = useState(React.createRef());
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Master data
    const [itemGroups, setItemGroups] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const init = {
        web_item_name: '', item_code: '', item_name: '', item_group: '',
        stock_uom: 'Nos', route: '', published: 1, description: '',
        // Display Images
        website_image: '', image_description: '', slideshow: '', thumbnail: '', image_alt: '',
        // Stock Information
        website_warehouse: '', on_backorder: 0,
        // Display Information
        short_website_description: '', short_description_for_list_view: '',
        website_description: '',
        // Website Specifications
        website_specifications: [],
        // Display Additional Information
        add_section_with_tabs: 0,
        tabs: [],
        // Recommended Items
        recommended_items: [],
        // Offers
        website_item_offers: [],
        // Search and SEO
        ranking: 0,
        website_item_groups: [],
        // Advanced Display Content
        website_content: ''
    };

    const [formData, setFormData] = useState(init);

    // Handle ?open=... query param coming from Item.jsx
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const openName = params.get('open');
        if (openName) {
            setEditingRecord(openName);
            setView('form');
        }
    }, [location.search]);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else {
            fetchMasters();
            if (editingRecord) fetchDetails(editingRecord);
            else setFormData(init);
        }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Website Item?fields=["name","web_item_name","item_code","item_group","published","route"]&order_by=modified desc&limit_page_length=100');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [ig, wh] = await Promise.all([
                API.get('/api/resource/Item Group?fields=["name"]'),
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=500')
            ]);
            setItemGroups(ig.data.data || []);
            setWarehouses(wh.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Website Item/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.website_specifications) d.website_specifications = [];
            if (!d.tabs) d.tabs = [];
            if (!d.recommended_items) d.recommended_items = [];
            if (!d.website_item_offers) d.website_item_offers = [];
            if (!d.website_item_groups) d.website_item_groups = [];
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.web_item_name || !formData.item_code) {
            notification.warning({ message: 'Website Item Name and Item Code are required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Website Item/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Website Item', formData);
                notification.success({ message: 'Created.' });
            }
            setView('list');
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Save Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Website Item/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    // ─── List View ───
    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Website Items</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    + New Website Item
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Item Code</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Item Group</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Route</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => {
                                if (!search) return true;
                                const s = search.toLowerCase();
                                return (r.name || '').toLowerCase().includes(s)
                                    || (r.web_item_name || '').toLowerCase().includes(s)
                                    || (r.item_code || '').toLowerCase().includes(s);
                            }).map(r => (
                                <tr key={r.name} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-5 py-4">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm">{r.web_item_name || r.name}</button>
                                    </td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{r.item_code}</td>
                                    <td className="px-5 py-4 text-gray-500">{r.item_group}</td>
                                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">{r.route}</td>
                                    <td className="px-5 py-4 text-center">
                                        {r.published
                                            ? <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">Published</span>
                                            : <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">Unpublished</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {!loading && records.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Website Items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </Spin>
            </div>
        </div>
    );

    // ─── Form View ───

    const viewMenuItems = [{ key: 'view', label: 'View' }];
    const actionMenuItems = [{ key: 'placeholder', label: 'No actions available' }];

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {/* Main Fields */}
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={lbl}>Website Item Name *</label>
                            <input className={inp} value={formData.web_item_name} onChange={e => setFormData({ ...formData, web_item_name: e.target.value })} placeholder="Website display name" />
                            <p className="text-[11px] text-gray-400 mt-0.5">Website display name</p>
                        </div>
                        <div>
                            <label className={lbl}>Item Code *</label>
                            <input className={inp} value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })} />
                        </div>
                        <div>
                            <label className={lbl}>Item Description</label>
                            <input className={inp} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={lbl}>Route</label>
                            <textarea className={`${inp} h-20 resize-none`} value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} />
                        </div>
                        <div>
                            <label className={lbl}>Item Name</label>
                            <input className={`${inp} bg-gray-50`} value={formData.item_name} disabled />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={lbl}>Item Group</label>
                                <select className={inp} value={formData.item_group} onChange={e => setFormData({ ...formData, item_group: e.target.value })}>
                                    <option value="">Select</option>
                                    {itemGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={lbl}>Stock UOM</label>
                                <input className={`${inp} bg-gray-50`} value={formData.stock_uom} disabled />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="wi_published" checked={!!formData.published} onChange={e => setFormData({ ...formData, published: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                        <label htmlFor="wi_published" className="text-sm font-semibold text-gray-700">Published</label>
                    </div>

                    {/* Display Images */}
                    <div className={sec}><span>Display Images</span></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className={lbl}>Image Description</label>
                                <input className={inp} value={formData.image_description} onChange={e => setFormData({ ...formData, image_description: e.target.value })} placeholder="Smooth companion for morning breakfast" />
                            </div>
                            <div>
                                <label className={lbl}>Image Alternative Text</label>
                                <input className={inp} value={formData.image_alt} onChange={e => setFormData({ ...formData, image_alt: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={lbl}>Slideshow</label>
                                <input className={inp} value={formData.slideshow} onChange={e => setFormData({ ...formData, slideshow: e.target.value })} placeholder="Show a slideshow at the top of the page" />
                            </div>
                            <div>
                                <label className={lbl}>Thumbnail</label>
                                <input className={inp} value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="/files/image_small.jpeg" />
                            </div>
                        </div>
                    </div>

                    {/* Stock Information */}
                    <div className={sec}><span>Stock Information</span></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className={lbl}>Website Warehouse</label>
                            <select className={inp} value={formData.website_warehouse} onChange={e => setFormData({ ...formData, website_warehouse: e.target.value })}>
                                <option value="">Select</option>
                                {warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-0.5">Show Stock availability based on this warehouse.</p>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" id="wi_backorder" checked={!!formData.on_backorder} onChange={e => setFormData({ ...formData, on_backorder: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                            <label htmlFor="wi_backorder" className="text-sm font-semibold text-gray-700">On Backorder</label>
                            <p className="text-[11px] text-gray-400 ml-2">Indicate that Item is available on backorder and not usually pre-stocked</p>
                        </div>
                    </div>

                    {/* Display Information */}
                    <div className={sec}><span>Display Information</span></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className={lbl}>Short Website Description</label>
                                <textarea className={`${inp} h-28 resize-none`} value={formData.short_website_description} onChange={e => setFormData({ ...formData, short_website_description: e.target.value })} />
                            </div>
                            <div>
                                <label className={lbl}>Short Description for List View</label>
                                <input className={inp} value={formData.short_description_for_list_view} onChange={e => setFormData({ ...formData, short_description_for_list_view: e.target.value })} />
                            </div>
                            <div>
                                <label className={lbl}>Website Description</label>
                                <textarea className={`${inp} h-40 resize-none`} value={formData.website_description} onChange={e => setFormData({ ...formData, website_description: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={lbl}>Website Specifications</label>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={`${th} w-10 text-center`}></th>
                                            <th className={th}>Label</th>
                                            <th className={th}>Description</th>
                                            <th className={`${th} w-10`}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.website_specifications || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                                <td className="px-4 py-2 text-center text-sm text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-2">
                                                    <input className={ri} value={row.label || ''} onChange={e => chRow('website_specifications', i, 'label', e.target.value)} />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input className={ri} value={row.description || ''} onChange={e => chRow('website_specifications', i, 'description', e.target.value)} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => rmRow('website_specifications', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(formData.website_specifications || []).length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white border-t-0">
                                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-sm font-medium text-gray-400">No Data</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => addRow('website_specifications', { label: '', description: '' })} className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
                                <button className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Copy From Item Group</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'additional',
            label: 'Additional Info',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {/* Display Additional Information */}
                    <div className={sec}><span>Display Additional Information</span></div>
                    <div className="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="wi_add_tabs" checked={!!formData.add_section_with_tabs} onChange={e => setFormData({ ...formData, add_section_with_tabs: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                        <label htmlFor="wi_add_tabs" className="text-sm font-semibold text-gray-700">Add Section with Tabs</label>
                    </div>
                    {!!formData.add_section_with_tabs && (
                        <>
                            <label className="block text-xs text-gray-600 font-semibold mb-2">Tabs</label>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={`${th} w-10 text-center`}>No.</th>
                                            <th className={th}>Label</th>
                                            <th className={th}>Content</th>
                                            <th className={`${th} w-10`}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.tabs || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                                <td className="px-4 py-2 text-center text-sm text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-2"><input className={ri} value={row.label || ''} onChange={e => chRow('tabs', i, 'label', e.target.value)} /></td>
                                                <td className="px-4 py-2"><textarea className={`${ri} h-16`} value={row.content || ''} onChange={e => chRow('tabs', i, 'content', e.target.value)} /></td>
                                                <td className="px-4 py-2 text-center"><button onClick={() => rmRow('tabs', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(formData.tabs || []).length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white">
                                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-sm font-medium text-gray-400">No Data</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => addRow('tabs', { label: '', content: '' })} className="mt-2 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
                        </>
                    )}

                    {/* Recommended Items */}
                    <div className={sec}><span>Recommended Items</span></div>
                    <label className="block text-xs text-gray-600 font-semibold mb-2">Recommended/Similar Items</label>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={`${th} w-10 text-center`}>No.</th>
                                    <th className={th}>Website Item</th>
                                    <th className={th}>Website Item Name</th>
                                    <th className={`${th} w-10`}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.recommended_items || []).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                        <td className="px-4 py-2 text-center text-sm text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-2"><input className={ri} value={row.website_item || ''} onChange={e => chRow('recommended_items', i, 'website_item', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input className={ri} value={row.website_item_name || ''} onChange={e => chRow('recommended_items', i, 'website_item_name', e.target.value)} /></td>
                                        <td className="px-4 py-2 text-center"><button onClick={() => rmRow('recommended_items', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(formData.recommended_items || []).length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 bg-white">
                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="text-sm font-medium text-gray-400">No Data</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => addRow('recommended_items', { website_item: '', website_item_name: '' })} className="mt-2 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>

                    {/* Offers */}
                    <div className={sec}><span>Offers</span></div>
                    <label className="block text-xs text-gray-600 font-semibold mb-2">Offers to Display</label>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={`${th} w-10 text-center`}>No.</th>
                                    <th className={th}>Offer Title</th>
                                    <th className={th}>Offer Subtitle</th>
                                    <th className={`${th} w-10`}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(formData.website_item_offers || []).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                        <td className="px-4 py-2 text-center text-sm text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-2"><input className={ri} value={row.offer_title || ''} onChange={e => chRow('website_item_offers', i, 'offer_title', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input className={ri} value={row.offer_subtitle || ''} onChange={e => chRow('website_item_offers', i, 'offer_subtitle', e.target.value)} /></td>
                                        <td className="px-4 py-2 text-center"><button onClick={() => rmRow('website_item_offers', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(formData.website_item_offers || []).length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 bg-white">
                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span className="text-sm font-medium text-gray-400">No Data</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => addRow('website_item_offers', { offer_title: '', offer_subtitle: '' })} className="mt-2 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>

                    {/* Search and SEO */}
                    <div className={sec}><span>Search and SEO</span></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className={lbl}>Ranking</label>
                            <input type="number" className={inp} value={formData.ranking} onChange={e => setFormData({ ...formData, ranking: parseInt(e.target.value) || 0 })} />
                            <p className="text-[11px] text-gray-400 mt-0.5">Items with higher ranking will be shown higher</p>
                            <button className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded shadow-sm text-sm transition">Set Meta Tags</button>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 font-semibold mb-1">Website Item Groups</label>
                            <p className="text-[11px] text-gray-500 mb-2">List this Item in multiple groups on the website.</p>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={th}>Item Group *</th>
                                            <th className={`${th} w-10`}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.website_item_groups || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                                <td className="px-4 py-2">
                                                    <select className={ri} value={row.item_group || ''} onChange={e => chRow('website_item_groups', i, 'item_group', e.target.value)}>
                                                        <option value="">Select</option>
                                                        {itemGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2 text-center"><button onClick={() => rmRow('website_item_groups', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(formData.website_item_groups || []).length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white">
                                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-sm font-medium text-gray-400">No Data</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => addRow('website_item_groups', { item_group: '' })} className="mt-2 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
                        </div>
                    </div>

                    {/* Advanced Display Content */}
                    <div className={sec}><span>Advanced Display Content</span></div>
                    <div>
                        <label className={lbl}>Website Content</label>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 border border-gray-200">Preview</span>
                        </div>
                        <textarea className={`${inp} font-mono text-xs h-40 resize-y`} value={formData.website_content || ''} onChange={e => setFormData({ ...formData, website_content: e.target.value })} />
                        <p className="text-[11px] text-gray-400 mt-1">You can use any valid Bootstrap 4 markup in this field. It will be shown on your Item Page.</p>
                        <button className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded text-xs transition">Expand</button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord ? (formData.web_item_name || editingRecord) : 'New Website Item'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${formData.published ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {formData.published ? 'Published' : 'Unpublished'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
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

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    <button className="px-5 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>

                    {editingRecord && (
                        <Popconfirm title="Delete this website item?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="flex gap-6 relative items-start">
                {/* Left Sidebar */}
                <div className="w-[200px] flex-shrink-0 space-y-6 shrink-0 sticky top-6">
                    <div className="flex flex-col gap-4">
                        <span className="font-semibold text-gray-800 text-sm">See on Website</span>
                        <div 
                            className="bg-gray-100/80 rounded-xl aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-200/80 transition group relative overflow-hidden"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            {!formData.website_image ? (
                                <span className="text-5xl text-gray-400 font-medium tracking-tighter group-hover:scale-105 transition-transform duration-300">
                                    {(formData.web_item_name || formData.item_name || 'wi').substring(0, 2).toLowerCase()}
                                </span>
                            ) : (
                                <img src={formData.website_image} alt="Website Item" className="w-full h-full object-cover" />
                            )}
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                            <button className="flex items-center justify-between px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full group">
                                <span className="flex items-center gap-2"><FiUserPlus className="text-gray-400 group-hover:text-gray-600" /> Assigned To</span>
                                <span className="text-gray-400 text-lg leading-none">+</span>
                            </button>
                            <button className="flex items-center justify-between px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full group">
                                <span className="flex items-center gap-2"><FiPaperclip className="text-gray-400 group-hover:text-gray-600" /> Attachments</span>
                                <span className="text-gray-400 text-lg leading-none">+</span>
                            </button>
                            <button className="flex items-center justify-between px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full group">
                                <span className="flex items-center gap-2"><FiTag className="text-gray-400 group-hover:text-gray-600" /> Tags</span>
                                <span className="text-gray-400 text-lg leading-none">+</span>
                            </button>
                            <button className="flex items-center justify-between px-2 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-md transition-colors w-full group">
                                <span className="flex items-center gap-2"><FiShare2 className="text-gray-400 group-hover:text-gray-600" /> Share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Tabs defaultActiveKey="details" items={tabItems} className="custom-wi-tabs" />
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <Modal
                title={<span className="text-lg font-bold">Upload</span>}
                open={isUploadModalOpen}
                onCancel={() => {
                    setIsUploadModalOpen(false);
                    setLinkInputMode(false);
                    setLinkUrl('');
                }}
                footer={
                    <div className="flex items-center justify-end gap-3 mt-6">
                        {linkInputMode && (
                            <Button className="bg-white border-gray-300 text-gray-800 font-medium px-4 h-9" onClick={() => setLinkInputMode(false)}>Back</Button>
                        )}
                        <Button className="bg-gray-100 border-none hover:bg-gray-200 text-gray-800 font-medium px-4 h-9">Set all private</Button>
                        <Button type="primary" onClick={() => setIsUploadModalOpen(false)} className="bg-gray-900 border-none hover:bg-gray-800 font-medium px-6 h-9">Upload</Button>
                    </div>
                }
                centered
                width={600}
                className="upload-modal"
            >
                <Spin spinning={isUploadingImage} tip="Uploading Image...">
                    <div className="border border-dashed border-gray-300 rounded-lg bg-white p-12 flex flex-col items-center justify-center mt-4">
                        {!linkInputMode ? (
                            <>
                                <p className="text-gray-600 font-medium mb-8 text-[15px]">Drag and drop files here or upload from</p>
                                <div className="flex gap-8">
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => !isUploadingImage && fileInputRef.current?.click()}>
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 group-hover:bg-gray-100 transition-all">
                                            <FiMonitor size={20} className="text-gray-600 group-hover:text-blue-600" />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">My Device</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 group-hover:bg-gray-100 transition-all">
                                            <FiFolder size={20} className="text-gray-600" />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">Library</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => !isUploadingImage && setLinkInputMode(true)}>
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 group-hover:bg-gray-100 transition-all">
                                            <FiLink2 size={20} className="text-gray-600 group-hover:text-blue-600" />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">Link</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-gray-300 group-hover:bg-gray-100 transition-all">
                                            <FiCamera size={20} className="text-gray-600" />
                                        </div>
                                        <span className="text-xs text-gray-600 font-medium">Camera</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full max-w-md flex flex-col gap-4 animate-fade-in">
                                <label className="block text-[13px] text-gray-500 font-medium">Image URL</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" 
                                    placeholder="https://example.com/image.png"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    disabled={isUploadingImage}
                                />
                                <Button 
                                    type="primary"
                                    className="bg-blue-600 hover:bg-blue-700 mx-auto mt-2" 
                                    disabled={isUploadingImage || !linkUrl}
                                    onClick={() => {
                                        if (linkUrl) {
                                            setFormData(prev => ({ ...prev, website_image: linkUrl }));
                                            setIsUploadModalOpen(false);
                                            setLinkInputMode(false);
                                            setLinkUrl('');
                                        }
                                    }}
                                >
                                    Set Image from Link
                                </Button>
                            </div>
                        )}
                    </div>
                </Spin>
                
                {/* Hidden file input for "My Device" */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            try {
                                setIsUploadingImage(true);
                                const fData = new FormData();
                                fData.append('file', file);
                                fData.append('is_private', 0); // Upload as public image
                                
                                const response = await API.post('/api/method/upload_file', fData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                
                                if (response.data?.message?.file_url) {
                                    setFormData(prev => ({ ...prev, website_image: response.data.message.file_url }));
                                    setIsUploadModalOpen(false);
                                } else {
                                    notification.error({ message: 'Upload format unknown', description: 'Server returned success without file_url' });
                                }
                            } catch (err) {
                                const msg = err.response?.data?.exc 
                                            ? 'Server Error check console' 
                                            : err.message;
                                notification.error({ message: 'Image Upload Failed', description: msg });
                            } finally {
                                setIsUploadingImage(false);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }
                        }
                    }}
                />
            </Modal>

            <style>{`
                .custom-wi-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f3f4f6; }
                .custom-wi-tabs .ant-tabs-tab { padding: 12px 0; margin: 0 32px 0 0; color: #6b7280; font-size: 14px; }
                .custom-wi-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #111827 !important; font-weight: 700; }
                .custom-wi-tabs .ant-tabs-ink-bar { background: #111827; height: 3px !important; border-radius: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default WebsiteItem;
