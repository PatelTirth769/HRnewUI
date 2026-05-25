import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, Col, Row, Statistic, Button, Table, Tag, Empty, Spin } from 'antd';
import { 
    FileTextOutlined, 
    CalendarOutlined, 
    HistoryOutlined, 
    PlusOutlined, 
    ArrowRightOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';

const RECORDS_PATH = 'schooler_system/certificates/records';

export default function CertificatesDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        bonafide: 0,
        trial: 0,
        transfer: 0
    });
    const [recentRecords, setRecentRecords] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const recordsRef = collection(db, RECORDS_PATH);
                const qAll = query(recordsRef, orderBy('created_at', 'desc'));
                const snapshot = await getDocs(qAll);
                
                const allDocs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || Date.now())
                    };
                });

                // Stats
                const total = allDocs.length;
                const todayStr = dayjs().format('YYYY-MM-DD');
                const today = allDocs.filter(d => dayjs(d.created_at).format('YYYY-MM-DD') === todayStr).length;
                const bonafide = allDocs.filter(d => d.type === 'Bonafide' || !d.type).length;
                const trial = allDocs.filter(d => d.type === 'Trial').length;
                const transfer = allDocs.filter(d => d.type === 'Transfer').length;

                setStats({ total, today, bonafide, trial, transfer });

                // Recent 5
                setRecentRecords(allDocs.slice(0, 5));

                // Process chart data (last 6 months)
                const monthCounts = {};
                for (let i = 5; i >= 0; i--) {
                    const m = dayjs().subtract(i, 'month').format('MMM YYYY');
                    monthCounts[m] = 0;
                }

                allDocs.forEach(d => {
                    const m = dayjs(d.created_at).format('MMM YYYY');
                    if (monthCounts[m] !== undefined) {
                        monthCounts[m]++;
                    }
                });

                const formattedChartData = Object.keys(monthCounts).map(month => ({
                    name: month,
                    Certificates: monthCounts[month]
                }));
                
                setChartData(formattedChartData);
            } catch (error) {
                console.error("Error fetching certificates dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const recentColumns = [
        {
            title: 'Certificate No',
            dataIndex: 'certificateNo',
            key: 'certificateNo',
            render: (text) => <span className="font-bold text-gray-700">{text}</span>
        },
        {
            title: 'Student Name',
            dataIndex: 'studentName',
            key: 'studentName',
            render: (text) => <span className="font-semibold">{text}</span>
        },
        {
            title: 'GR No',
            dataIndex: 'grNo',
            key: 'grNo'
        },
        {
            title: 'Standard',
            dataIndex: 'std',
            key: 'std'
        },
        {
            title: 'Issue Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => dayjs(text).format('DD MMM YYYY')
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (text) => {
                const type = text || 'Bonafide';
                const colorMap = {
                    'Bonafide': 'orange',
                    'Trial': 'cyan',
                    'Transfer': 'magenta'
                };
                return <Tag color={colorMap[type] || 'blue'} className="rounded font-semibold">{type}</Tag>;
            }
        }
    ];

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-5">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <SafetyCertificateOutlined className="text-red-700" style={{ fontSize: '32px' }} />
                        Certificates Overview
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                        Create, track, print and manage students' official certificates.
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Button 
                        icon={<HistoryOutlined />} 
                        onClick={() => navigate('/certificates/records')}
                        size="large"
                        className="border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-700 font-semibold"
                    >
                        View History
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        className="bg-red-700 hover:bg-red-800 border-none font-semibold text-white"
                        onClick={() => navigate('/certificates/bonafide')}
                        size="large"
                    >
                        Issue Bonafide Certificate
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <Row gutter={[20, 20]} className="mb-8">
                <Col xs={24} sm={4}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-red-700">
                        <Statistic
                            title={<span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Total Certificates</span>}
                            value={stats.total}
                            prefix={<FileTextOutlined className="text-red-700 mr-2" />}
                            valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={5}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-indigo-600">
                        <Statistic
                            title={<span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Issued Today</span>}
                            value={stats.today}
                            prefix={<CalendarOutlined className="text-indigo-600 mr-2" />}
                            valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={5}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-amber-500">
                        <Statistic
                            title={<span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Bonafide Type</span>}
                            value={stats.bonafide}
                            prefix={<SafetyCertificateOutlined className="text-amber-500 mr-2" />}
                            valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={5}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-teal-600">
                        <Statistic
                            title={<span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Trial Type</span>}
                            value={stats.trial}
                            prefix={<SafetyCertificateOutlined className="text-teal-600 mr-2" />}
                            valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={5}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-rose-600">
                        <Statistic
                            title={<span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Transfer Type</span>}
                            value={stats.transfer}
                            prefix={<SafetyCertificateOutlined className="text-rose-600 mr-2" />}
                            valueStyle={{ color: '#111827', fontWeight: 800, fontSize: '24px' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content Dashboard Grid */}
            <Row gutter={[24, 24]}>
                {/* Chart */}
                <Col xs={24} lg={16}>
                    <Card title={<span className="font-bold text-gray-800">Monthly Issuance Trend</span>} bordered={false} className="shadow-sm h-[430px]">
                        <div className="h-[330px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                                    <YAxis fontSize={11} allowDecimals={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }} />
                                    <Bar dataKey="Certificates" fill="#b91c1c" radius={[4, 4, 0, 0]} maxBarSize={45} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Actions & Help */}
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-bold text-gray-800">Quick Actions</span>} bordered={false} className="shadow-sm h-[430px] flex flex-col justify-between">
                        <div className="flex flex-col gap-2.5 w-full">
                            <div 
                                className="flex justify-between items-center p-2.5 rounded-xl border border-gray-100 hover:border-red-700 bg-gray-50 hover:bg-red-50/20 cursor-pointer transition-all duration-200 group"
                                onClick={() => navigate('/certificates/bonafide')}
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-[13px]">Create Bonafide Certificate</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Select student and generate Bonafide PDF</p>
                                </div>
                                <ArrowRightOutlined className="text-gray-400 group-hover:text-red-700 transition-colors" />
                            </div>

                            <div 
                                className="flex justify-between items-center p-2.5 rounded-xl border border-gray-100 hover:border-red-700 bg-gray-50 hover:bg-red-50/20 cursor-pointer transition-all duration-200 group"
                                onClick={() => navigate('/certificates/trial')}
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-[13px]">Create Trial Certificate</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Select student and generate Trial PDF</p>
                                </div>
                                <ArrowRightOutlined className="text-gray-400 group-hover:text-red-700 transition-colors" />
                            </div>

                            <div 
                                className="flex justify-between items-center p-2.5 rounded-xl border border-gray-100 hover:border-red-700 bg-gray-50 hover:bg-red-50/20 cursor-pointer transition-all duration-200 group"
                                onClick={() => navigate('/certificates/transfer')}
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-[13px]">Create Transfer Certificate</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Select student and generate Transfer PDF</p>
                                </div>
                                <ArrowRightOutlined className="text-gray-400 group-hover:text-red-700 transition-colors" />
                            </div>

                            <div 
                                className="flex justify-between items-center p-2.5 rounded-xl border border-gray-100 hover:border-red-700 bg-gray-50 hover:bg-red-50/20 cursor-pointer transition-all duration-200 group"
                                onClick={() => navigate('/certificates/records')}
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-[13px]">Search Certificate Records</h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">View and download historical certificates</p>
                                </div>
                                <ArrowRightOutlined className="text-gray-400 group-hover:text-red-700 transition-colors" />
                            </div>
                        </div>

                        <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 mt-auto">
                            <h4 className="font-bold text-red-950 text-xs flex items-center gap-1.5">
                                <SafetyCertificateOutlined /> SSV Campus Standard Templates
                            </h4>
                            <p className="text-[10px] text-red-800 mt-0.5 leading-relaxed">
                                Our templates are dynamically customized based on the gender and profile details retrieved directly from ERPNext, maintaining layout fidelity and professional quality.
                            </p>
                        </div>
                    </Card>
                </Col>

                {/* Recent Issuances */}
                <Col xs={24}>
                    <Card title={<span className="font-bold text-gray-800">Recently Issued Certificates</span>} bordered={false} className="shadow-sm overflow-hidden">
                        <Table
                            columns={recentColumns}
                            dataSource={recentRecords}
                            rowKey="id"
                            pagination={false}
                            locale={{
                                emptyText: <Empty description="No certificates issued recently." />
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
