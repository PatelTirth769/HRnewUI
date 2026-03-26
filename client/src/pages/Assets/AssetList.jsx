import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const getStatusColor = (status) => {
    switch (status) {
        case 'Submitted': return 'bg-[#EBF5FF] text-[#2B6CB0] font-medium';
        case 'Cancelled': return 'bg-[#F3F4F6] text-[#374151] font-medium';
        case 'Draft': return 'bg-[#FCE8E8] text-[#E02424] font-medium';
        case 'Receipted': return 'bg-green-100 text-green-800 font-medium';
        default: return 'bg-gray-100 text-gray-700 font-medium';
    }
};

const AssetList = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const navigate = useNavigate();

    // Filters
    const [searchId, setSearchId] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    useEffect(() => {
        fetchMasters();
        fetchAssets();
    }, [filterCompany]); // re-fetch when filter overrides

    const fetchMasters = async () => {
        try {
            const res = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
            setCompanies((res.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchAssets = async () => {
        try {
            setLoading(true);
            let url = '/api/resource/Asset?fields=["name","item_name","status","company","location","item_code"]&limit_page_length=None&order_by=modified desc';
            
            let filters = [];
            if (filterCompany) filters.push(`["company","=","${filterCompany}"]`);
            // we will do text filtering locally for searchId or we could do it in API. Local is fine for ID.
            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const response = await API.get(url);
            setAssets(response.data.data || []);
        } catch (err) {
            console.error('Error fetching assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = assets.filter(a => {
        if (searchId && !a.name.toLowerCase().includes(searchId.toLowerCase()) && !(a.item_name || '').toLowerCase().includes(searchId.toLowerCase())) return false;
        return true;
    });

    const hasActiveFilters = searchId || filterCompany;
    const clearFilters = () => { setSearchId(''); setFilterCompany(''); fetchAssets(); };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Assets</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchAssets}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={() => navigate('/assets/asset/new')}>
                        <span>+</span> Add Asset
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search ID or Item Name"
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 max-w-[200px]">
                        <select
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={filterCompany}
                            onChange={e => setFilterCompany(e.target.value)}
                        >
                            <option value="">Company</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex gap-2 shrink-0">
                        {hasActiveFilters && (
                            <button className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 shrink-0 ml-2" onClick={clearFilters}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden mt-0">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium w-6"><input type="checkbox" className="rounded border-gray-300 disabled:opacity-50" disabled /></th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Status</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">ID</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Item Name</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Item Code</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Company</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Assets Found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => {
                                    const statusColor = getStatusColor(row.status || 'Draft');
                                    return (
                                        <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => navigate(`/assets/asset/edit/${row.name}`)}>
                                            <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" /></td>
                                            <td className="px-4 py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide flex w-max items-center justify-center ${statusColor}`}>
                                                    {row.status || 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.item_name || '-'}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.item_code}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.location}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssetList;
