import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Spin, notification, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EllipsisOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import API, { getActiveSystem } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    if (num >= 10000000) return '₹ ' + (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return '₹ ' + (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return '₹ ' + (num / 1000).toFixed(2) + ' K';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
};

const ERPPayrollDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [data, setData] = useState({
        totalDeclarations: 0,
        totalSalaryStructure: 0,
        totalIncentiveLastMonth: 0,
        totalOutgoingSalaryLastMonth: 0
    });
    const [context, setContext] = useState({
        period: 'Last Month',
        company: 'All Companies'
    });
    const [lastUpdated, setLastUpdated] = useState('');

    const fetchCompanies = async () => {
        try {
            const res = await API.get('/api/resource/Company?fields=["name"]');
            if (res.data && res.data.data) {
                const companyList = res.data.data.map(c => c.name);
                setCompanies(companyList);
                if (companyList.length > 0 && !selectedCompany) {
                    setSelectedCompany(companyList[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    };

    const fetchData = async (company = selectedCompany) => {
        setLoading(true);
        try {
            const systemCode = getActiveSystem() || 'preeshe';
            let url = `/local-api/payroll-dashboard?systemCode=${systemCode}`;
            if (company) url += `&company=${encodeURIComponent(company)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const resData = await response.json();
            
            if (resData && resData.stats) {
                setData(resData.stats);
                if (resData.context) {
                    setContext(resData.context);
                }
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('Failed to fetch payroll dashboard data:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to load payroll dashboard statistics.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchData(selectedCompany);
        }
    }, [selectedCompany]);

    const StatCard = ({ title, value, subtext, isLoading }) => (
        <Card 
            className="rounded-lg shadow-sm w-full h-full border border-gray-200 hover:shadow-md transition-shadow" 
            bodyStyle={{ padding: '20px' }}
        >
            <Spin spinning={isLoading}>
                <div className="flex justify-between items-start mb-2">
                    <Text className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{title}</Text>
                    <EllipsisOutlined className="text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
                <div className="text-[28px] font-medium text-gray-800 leading-none mt-2">
                    {value}
                </div>
                {subtext && (
                    <div className="text-[12px] font-medium mt-3 flex items-center text-gray-400">
                        <span>{subtext}</span>
                    </div>
                )}
            </Spin>
        </Card>
    );

    const handleCardClick = (route) => {
        if (!selectedCompany) {
            navigate(route);
        } else {
            navigate(`${route}?company=${encodeURIComponent(selectedCompany)}`);
        }
    };

    return (
        <div className="p-8 bg-[#fbfcfd] min-h-[calc(100vh-64px)] font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Payroll Dashboard</Title>
                    {lastUpdated && <Text className="text-gray-400 text-xs mt-1 block">Last updated at {lastUpdated}</Text>}
                </div>
                <Space size="middle">
                    <Select
                        placeholder="Select Company"
                        style={{ width: 220 }}
                        value={selectedCompany}
                        onChange={setSelectedCompany}
                        suffixIcon={<FilterOutlined />}
                        className="rounded-md overflow-hidden border-gray-100"
                    >
                        {companies.map(c => (
                            <Option key={c} value={c}>{c}</Option>
                        ))}
                    </Select>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={() => fetchData(selectedCompany)}
                        loading={loading}
                        className="flex items-center justify-center rounded-md border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 bg-gray-50"
                        style={{ width: '36px', height: '36px' }}
                    />
                    <Button 
                        icon={<EllipsisOutlined />} 
                        className="flex items-center justify-center rounded-md border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 bg-gray-50"
                        style={{ width: '36px', height: '36px' }}
                    />
                </Space>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => handleCardClick('/erp-payroll/tax-exemption-declaration')} className="cursor-pointer">
                    <StatCard 
                        title="TOTAL DECLARATION SUBMITTED" 
                        value={data.totalDeclarations} 
                        isLoading={loading}
                    />
                </div>
                <div onClick={() => handleCardClick('/erp-payroll/salary-structure')} className="cursor-pointer">
                    <StatCard 
                        title="TOTAL SALARY STRUCTURE" 
                        value={data.totalSalaryStructure} 
                        isLoading={loading}
                        subtext="Live from ERPNext" 
                    />
                </div>
                <div onClick={() => handleCardClick('/erp-payroll/employee-incentive')} className="cursor-pointer">
                    <StatCard 
                        title="TOTAL INCENTIVE GIVEN(LAST MONTH)" 
                        value={formatINR(data.totalIncentiveLastMonth)} 
                        isLoading={loading}
                        subtext={context.period} 
                    />
                </div>
                <div onClick={() => handleCardClick('/erp-payroll/salary-slip')} className="cursor-pointer">
                    <StatCard 
                        title="TOTAL OUTGOING SALARY(LAST MONTH)" 
                        value={formatINR(data.totalOutgoingSalaryLastMonth)} 
                        isLoading={loading}
                        subtext={context.period} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ERPPayrollDashboard;
