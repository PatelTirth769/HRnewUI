import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Alert, Dropdown, Popover, Select, Button, Space, Modal, notification } from 'antd';
import { FilterOutlined, EllipsisOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const RecruitmentDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters state (matching HR Dashboard logic)
    const [companies, setCompanies] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [tempFilters, setTempFilters] = useState({});

    // Fetch master list of companies
    const fetchCompanies = () => {
        const systemCode = localStorage.getItem('activeSystem') || 'preeshe';
        fetch(`/local-api/erp-proxy/${systemCode}/api/resource/Company?fields=["name"]`)
            .then(res => res.json())
            .then(resData => {
                if (resData.data && resData.data.length > 0) {
                    const firstCompany = resData.data[0].name;
                    setCompanies(resData.data.map(c => c.name));
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedFilters(prev => ({ ...prev, Company: firstCompany, date: today }));
                    setTempFilters(prev => ({ ...prev, Company: firstCompany, date: today }));
                }
            })
            .catch(err => console.error("Error fetching companies:", err));
    };

    // Fetch dashboard KPIs
    const fetchDashboardData = (filters = selectedFilters) => {
        setLoading(true);
        const systemCode = localStorage.getItem('activeSystem') || 'preeshe';
        const queryParams = new URLSearchParams({ ...filters, systemCode }).toString();
        
        fetch(`/local-api/recruitment-dashboard?${queryParams}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch recruitment dashboard data");
                return res.json();
            })
            .then(fetchedData => {
                setData(fetchedData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching Recruitment Dashboard data:", err);
                setError(err.message);
                setLoading(false);
                notification.error({
                    message: 'Dashboard Error',
                    description: err.message
                });
            });
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedFilters.Company) {
            fetchDashboardData(selectedFilters);
        }
    }, [selectedFilters]);

    const handleApplyFilters = () => {
        setSelectedFilters({ ...tempFilters });
        notification.success({
            message: 'Filters Applied',
            description: `Showing data for ${tempFilters.Company}`,
            placement: 'bottomRight',
            duration: 2
        });
    };

    const filterContent = (
        <div className="w-[320px] font-sans">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-200">
                <span className="text-gray-800 font-medium text-[15px]">Set Filters</span>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-[14px] w-24">Company</span>
                    <div className="flex-1 flex gap-2">
                        <Select defaultValue="Equals" className="w-[100px]" options={[{ value: 'Equals', label: 'Equals' }]} disabled />
                        <Select 
                            className="flex-1" 
                            showSearch
                            value={tempFilters.Company}
                            onChange={(val) => setTempFilters(prev => ({ ...prev, Company: val }))}
                            options={companies.map(c => ({ value: c, label: c }))}
                            optionFilterProp="children"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-[14px] w-24">Date</span>
                    <div className="flex-1 flex gap-2">
                        <Select defaultValue="Till Date" className="w-[100px]" options={[{ value: 'Till Date', label: 'Till Date' }]} disabled />
                        <input
                            type="date"
                            className="flex-1 bg-white border border-[#d9d9d9] rounded px-3 py-[4px] text-[14px] text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors h-[32px]"
                            value={tempFilters.date || ''}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, date: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-100">
                <Button type="link" className="text-blue-500 px-0 hover:text-blue-600">+ Add a Filter</Button>
                <div className="space-x-4">
                    <span className="text-gray-500 cursor-pointer hover:text-gray-700 text-sm">Clear Filters</span>
                    <Button type="primary" className="bg-[#111827] hover:bg-gray-800" onClick={handleApplyFilters}>Apply Filters</Button>
                </div>
            </div>
        </div>
    );

    const renderTrend = (trendString) => {
        if (!trendString) return null;
        const isUp = trendString.includes('↑') || trendString.includes('since') && !trendString.includes('↓');
        const isDown = trendString.includes('↓');
        let icon = null;
        let colorClass = 'text-gray-400';

        if (isUp && !trendString.includes('0 %')) {
            icon = <ArrowUpOutlined className="mr-1 text-[10px]" />;
            colorClass = 'text-green-500 bg-green-50 px-1 py-0.5 rounded';
        } else if (isDown) {
            icon = <ArrowDownOutlined className="mr-1 text-[10px]" />;
            colorClass = 'text-red-500 bg-red-50 px-1 py-0.5 rounded';
        }

        return (
            <div className={`text-[12px] font-medium mt-3 flex items-center ${colorClass}`}>
                {icon}
                <span>{trendString.replace(/[↑↓]/g, '').trim()}</span>
            </div>
        );
    };

    const StatCard = ({ title, value, trendStr, onClick }) => (
        <Card 
            className={`rounded-lg shadow-sm w-full h-full border border-gray-200 ${onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-md transition-all' : ''}`} 
            bodyStyle={{ padding: '20px' }}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <Text className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{title}</Text>
                <EllipsisOutlined className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            <div className="text-[28px] font-medium text-gray-800 leading-none mt-2">
                {value}
            </div>
            {renderTrend(trendStr)}
        </Card>
    );

    return (
        <div className="p-8 bg-[#fbfcfd] min-h-[calc(100vh-64px)] font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Recruitment Dashboard</Title>
                    {data?.stats?.lastSynced && (
                        <Text className="text-gray-400 text-sm mt-1 block">Last synced {data.stats.lastSynced}</Text>
                    )}
                </div>
                <Space size="middle">
                    <Popover
                        content={filterContent}
                        trigger="click"
                        placement="bottomRight"
                        overlayInnerStyle={{ padding: '16px', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    >
                        <Button
                            icon={<FilterOutlined />}
                            className="flex items-center justify-center rounded-md border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
                            style={{ width: '36px', height: '36px' }}
                        />
                    </Popover>
                    <Button 
                        icon={<EllipsisOutlined />} 
                        className="flex items-center justify-center rounded-md border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 bg-gray-50"
                        style={{ width: '36px', height: '36px' }}
                    />
                </Space>
            </div>

            {loading && !data ? (
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" />
                </div>
            ) : error ? (
                <Alert message="Error Loading Dashboard" description={error} type="error" showIcon />
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="JOB OPENINGS" 
                        value={data.jobOpenings?.value} 
                        trendStr={data.jobOpenings?.trend} 
                        onClick={() => {
                            const qs = new URLSearchParams();
                            if (selectedFilters.Company) qs.append('company', selectedFilters.Company);
                            qs.append('status', 'Open');
                            navigate(`/recruitment/job-opening?${qs.toString()}`);
                        }}
                    />
                    <StatCard 
                        title="TOTAL APPLICANTS (THIS MONTH)" 
                        value={data.totalApplicants?.value} 
                        trendStr={data.totalApplicants?.trend} 
                        onClick={() => {
                            const qs = new URLSearchParams();
                            qs.append('timeFilter', 'this_month');
                            navigate(`/recruitment/job-applicant?${qs.toString()}`);
                        }}
                    />
                    <StatCard 
                        title="ACCEPTED JOB APPLICANTS" 
                        value={data.acceptedApplicants?.value} 
                        trendStr={data.acceptedApplicants?.trend} 
                        onClick={() => {
                            const qs = new URLSearchParams();
                            qs.append('status', 'Accepted');
                            navigate(`/recruitment/job-applicant?${qs.toString()}`);
                        }}
                    />
                    <StatCard 
                        title="REJECTED JOB APPLICANTS" 
                        value={data.rejectedApplicants?.value} 
                        trendStr={data.rejectedApplicants?.trend} 
                        onClick={() => {
                            const qs = new URLSearchParams();
                            qs.append('status', 'Rejected');
                            navigate(`/recruitment/job-applicant?${qs.toString()}`);
                        }}
                    />
                    <StatCard 
                        title="JOB OFFERS (THIS MONTH)" 
                        value={data.jobOffers?.value} 
                        trendStr={data.jobOffers?.trend} 
                        onClick={() => {
                            const qs = new URLSearchParams();
                            qs.append('timeFilter', 'this_month');
                            navigate(`/recruitment/job-offer?${qs.toString()}`);
                        }}
                    />
                    <StatCard 
                        title="APPLICANT-TO-HIRE PERCENTAGE" 
                        value={data.applicantToHirePercentage?.value} 
                        trendStr={null} 
                    />
                    <StatCard 
                        title="JOB OFFER ACCEPTANCE RATE" 
                        value={data.jobOfferAcceptanceRate?.value} 
                        trendStr={null} 
                    />
                    <StatCard 
                        title="TIME TO FILL" 
                        value={data.timeToFill?.value} 
                        trendStr={null} 
                    />
                </div>
            ) : null}
        </div>
    );
};

export default RecruitmentDashboard;
