import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, List, Avatar, Tag, Spin, notification, Empty, Descriptions, Divider, Button, Alert, Badge, Modal, Checkbox } from 'antd';
import { 
  BookOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  WalletOutlined,
  UserOutlined,
  NotificationOutlined,
  LoadingOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  LockOutlined,
  CreditCardOutlined,
  RightOutlined
} from '@ant-design/icons';
import API from '../../services/api';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user')?.trim() || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState({
    profile: null,
    attendance: 0,
    courses: 0,
    assignments: 0,
    fees: 0,
    schedule: [],
    notifications: [],
    permissions: {
      fees: true,
      attendance: true,
      schedule: true,
      assessments: true
    }
  });

  // Payment Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem('user')?.trim() || '';
      if (!email) {
        setError('No logged-in user email found.');
        setLoading(false);
        return;
      }
      
      // 1. Find Student Record
      let student = null;
      // Try Stage 1 & 2
      try {
        const resFilter = await API.get('/api/resource/Student', {
          params: {
            filters: `[["user","=","${email}"]]`,
            fields: '["name"]'
          }
        });
        if (resFilter.data?.data?.length > 0) student = resFilter.data.data[0];
      } catch (e) {}

      if (!student) {
        try {
          const resEmail = await API.get('/api/resource/Student', {
            params: {
              filters: `[["student_email_id","=","${email}"]]`,
              fields: '["name"]'
            }
          });
          if (resEmail.data?.data?.length > 0) student = resEmail.data.data[0];
        } catch (e) {}
      }

      // Stage 3 Scan
      if (!student) {
        try {
          const resAll = await API.get('/api/resource/Student', { params: { fields: '["name", "student_email_id", "user"]', limit_page_length: 500 } });
          student = (resAll.data?.data || []).find(s => 
            (s.user && s.user.toLowerCase() === email.toLowerCase()) || 
            (s.student_email_id && s.student_email_id.toLowerCase() === email.toLowerCase())
          );
        } catch (e) {}
      }

      if (!student) {
        setLoading(false);
        return;
      }

      // Fetch Full Profile
      const fullRes = await API.get(`/api/resource/Student/${encodeURIComponent(student.name)}`);
      const profile = fullRes.data?.data;
      const studentId = student.name;

      // Parallel Data Fetch with Individual Error Handling
      const [attRes, enrRes, feeRes, assRes, schRes] = await Promise.allSettled([
        API.get('/api/resource/Student Attendance', { params: { filters: JSON.stringify([["student", "=", studentId]]), limit_page_length: 1000 } }),
        API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program", "fee_structure"]) } })
          .catch(err => {
            if (err.response?.status === 417) {
              console.warn('[StudentDashboard] 417 Error on Enrollment fields. Retrying with basic fields...');
              return API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program"]) } });
            }
            throw err;
          }),
        API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), fields: JSON.stringify(["name", "due_date", "outstanding_amount", "total_amount"]) } })
          .catch(err => {
            if (err.response?.status === 417) {
              console.warn('[StudentDashboard] 417 Error on Fees fields. Retrying with basic fields...');
              return API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), fields: JSON.stringify(["name", "outstanding_amount"]) } });
            }
            throw err;
          }),
        API.get('/api/resource/Assessment Result', { params: { filters: JSON.stringify([["student", "=", studentId]]) } }),
        API.get('/api/resource/Course Schedule', { params: { filters: JSON.stringify([["schedule_date", "=", new Date().toISOString().split('T')[0]]]), fields: JSON.stringify(["course", "from_time", "to_time", "room"]), order_by: 'from_time asc' } })
      ]);

      const permissions = {
        attendance: attRes.status === 'fulfilled',
        enrollment: enrRes.status === 'fulfilled',
        fees: feeRes.status === 'fulfilled' || feeRes.reason?.response?.status === 403,
        assessments: assRes.status === 'fulfilled',
        schedule: schRes.status === 'fulfilled'
      };

      const attendanceList = attRes.status === 'fulfilled' ? (attRes.value.data?.data || []) : [];
      const presentDays = attendanceList.filter(a => a.status === 'Present').length;
      const feeList = feeRes.status === 'fulfilled' ? (feeRes.value.data?.data || []) : [];
      
      const enrollmentData = enrRes.status === 'fulfilled' ? (enrRes.value.data?.data || []) : [];
      console.log('[FeeDebug] Enrollment Data:', enrollmentData);

      let linkedFeeStructure = (enrollmentData.length > 0 && enrollmentData[0].fee_structure) 
        ? enrollmentData[0].fee_structure 
        : (profile.fee_structure || null);

      if (linkedFeeStructure) {
        console.log('[FeeDebug] Found in Enrollment/Profile:', linkedFeeStructure);
      }

      // Stage 3: Search for a Fee Structure record that matches the Program name
      const programToSearch = (enrollmentData.length > 0 && enrollmentData[0].program) 
        ? enrollmentData[0].program 
        : (profile.program || null);

      if (!linkedFeeStructure && programToSearch) {
        console.log('[FeeDebug] Stage 3: Searching by Program name:', programToSearch);
        try {
          const fsRes = await API.get('/api/resource/Fee Structure', {
            params: {
              filters: JSON.stringify([["program", "=", programToSearch]]),
              fields: JSON.stringify(["name"])
            }
          });
          if (fsRes.data?.data?.length > 0) {
            linkedFeeStructure = fsRes.data.data[0].name;
            console.log('[FeeDebug] Found in Fee Structure list:', linkedFeeStructure);
          } else {
            console.log('[FeeDebug] No Fee Structure found with program filter. Trying exact name match...');
            try {
              const fsExact = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(programToSearch)}`);
              if (fsExact.data?.data) {
                linkedFeeStructure = fsExact.data.data.name;
                console.log('[FeeDebug] Found via exact ID match:', linkedFeeStructure);
              }
            } catch (e) {
              console.log('[FeeDebug] Exact ID match failed:', e.response?.status || e.message);
            }
          }
        } catch (e) {
          console.error('[FeeDebug] Fee Structure search failed:', e.response?.status || e.message);
        }
      }

      let feeStructureDetails = null;
      if (linkedFeeStructure) {
        try {
          const fsFull = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(linkedFeeStructure)}`);
          feeStructureDetails = fsFull.data?.data;
          console.log('[FeeDebug] Fee Structure Details fetched:', feeStructureDetails);
        } catch (e) {
          console.error('[FeeDebug] Failed to fetch Fee Structure details:', e);
        }
      }

      if (!linkedFeeStructure) {
        console.warn('[FeeDebug] FINAL STATUS: Fee Structure NOT FOUND in any stage.');
      }
      
      setStudentData({
        profile,
        permissions,
        feeStructure: linkedFeeStructure,
        feeStructureDetails,
        attendance: attendanceList.length > 0 ? Math.round((presentDays / attendanceList.length) * 100) : 0,
        courses: enrollmentData.length || 0,
        assignments: assRes.status === 'fulfilled' ? (assRes.value.data?.data?.length || 0) : 0,
        fees: feeList.reduce((sum, f) => sum + (f.outstanding_amount || 0), 0),
        feeRecords: feeList,
        schedule: schRes.status === 'fulfilled' ? (schRes.value.data?.data || []) : [],
        notifications: [
          'Academic profile linked successfully.',
          'Always check your schedule for real-time updates.',
          'New features are being added to your student portal!'
        ]
      });

    } catch (err) {
      console.error('Dashboard Error:', err);
      setError('Critical error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (feeItem) => {
    setSelectedFee(feeItem);
    setTermsAccepted(false);
    setIsPaymentModalVisible(true);
  };

  const processPayment = () => {
    if (!termsAccepted) {
      notification.warning({ message: 'Action Required', description: 'Please accept the Terms & Conditions to proceed.' });
      return;
    }
    notification.success({ 
      message: 'Initiating Payment', 
      description: `Connecting to secure gateway for ₹${(selectedFee.amount || selectedFee.outstanding_amount || 0).toLocaleString()}...` 
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <Text type="secondary">Loading Academic Records...</Text>
      </div>
    );
  }

  const profile = studentData.profile;
  const studentName = profile ? `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim() : userEmail;
  const guardianName = (profile && profile.guardians && profile.guardians.length > 0) ? profile.guardians[0].guardian_name : 'N/A';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Student Dashboard</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Welcome back, <b>{studentName}</b>.</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<SyncOutlined />} onClick={fetchAllData} shape="round">Sync Data</Button>
          <Avatar size={64} src={profile?.image} icon={<UserOutlined />} style={{ border: '3px solid #1890ff', background: '#fff' }} />
        </div>
      </div>

      {!profile ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
          <Empty description={<span>No Profile Linked to <b>{userEmail}</b></span>} />
        </Card>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.attendance ? (
                  <Statistic title="ATTENDANCE" value={studentData.attendance} suffix="%" valueStyle={{ color: '#52c41a', fontWeight: 800 }} prefix={<CalendarOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.enrollment ? (
                  <Statistic title="PROGRAMS" value={studentData.courses} valueStyle={{ color: '#1890ff', fontWeight: 800 }} prefix={<BookOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.assessments ? (
                  <Statistic title="ASSESSMENTS" value={studentData.assignments} valueStyle={{ color: '#faad14', fontWeight: 800 }} prefix={<FileTextOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.fees ? (
                  <Statistic title="PENDING FEES" value={studentData.fees} valueStyle={{ color: '#ff4d4f', fontWeight: 800 }} prefix={<WalletOutlined />} precision={2} formatter={(value) => `₹${value.toLocaleString()}`} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24} lg={16}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card title={<span><IdcardOutlined style={{ color: '#1890ff', marginRight: '8px' }} /> Student Profile</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="large">
                    <Descriptions.Item label="Student ID"><Text strong>{profile.name}</Text></Descriptions.Item>
                    <Descriptions.Item label="Joining Date">{profile.joining_date}</Descriptions.Item>
                    <Descriptions.Item label="Program"><Tag color="blue">{profile.program || 'N/A'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Fee Structure">
                      <Text strong style={{ color: '#ff4d4f' }}>
                        <WalletOutlined style={{ marginRight: '8px' }} />
                        {studentData.feeStructure || 'Not Defined'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Gender">{profile.gender}</Descriptions.Item>
                    <Descriptions.Item label="Email"><MailOutlined style={{ color: '#888', marginRight: '8px' }} /> {profile.student_email_id}</Descriptions.Item>
                    <Descriptions.Item label="Mobile"><PhoneOutlined style={{ color: '#888', marginRight: '8px' }} /> {profile.student_mobile_number}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Badge status="processing" text="Active" /></Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title={<span><CalendarOutlined style={{ color: '#52c41a', marginRight: '8px' }} /> Today's Schedule</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  {studentData.permissions.schedule ? (
                    <List
                      dataSource={studentData.schedule}
                      locale={{ emptyText: 'No classes today.' }}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta avatar={<Avatar icon={<BookOutlined />} />} title={item.course} description={`${item.from_time} - ${item.to_time} | ${item.room || 'TBD'}`} />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="You do not have permission to view Course Schedules." />
                  )}
                </Card>

                <Card title={<span><WalletOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> Fee Details</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '24px' }}>
                  {studentData.feeRecords && studentData.feeRecords.length > 0 ? (
                    <List
                      dataSource={studentData.feeRecords}
                      renderItem={item => (
                        <List.Item extra={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span className="font-bold">₹{item.outstanding_amount.toLocaleString()}</span>
                            <Tag color={item.outstanding_amount === 0 ? "green" : "red"} style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>{item.outstanding_amount === 0 ? "PAID" : "UNPAID"}</Tag>
                            <Button 
                              type="primary" 
                              size="small" 
                              shape="round"
                              style={{ fontSize: '10px', height: '24px' }}
                              onClick={() => handlePayNow(item)}
                            >
                              PAY NOW
                            </Button>
                          </div>
                        }>
                          <List.Item.Meta 
                            title={<Text strong>{item.name}</Text>} 
                            description={`Due: ${item.due_date}`} 
                          />
                        </List.Item>
                      )}
                    />
                  ) : studentData.feeStructureDetails ? (
                    <div>
                      <Alert 
                        message="Scheduled Fees" 
                        description={`Showing components for: ${studentData.feeStructure}`} 
                        type="warning" 
                        showIcon 
                        style={{ marginBottom: '16px', borderRadius: '8px' }} 
                      />
                      <List
                        dataSource={studentData.feeStructureDetails.components}
                        renderItem={item => {
                          let dueDate = "";
                          const t = item.fees_category || "";
                          if (t.includes("Q1")) dueDate = "Payable by 10th March";
                          else if (t.includes("Q2")) dueDate = "Payable by 10th June";
                          else if (t.includes("Q3")) dueDate = "Payable by 10th Sep";
                          else if (t.includes("Q4")) dueDate = "Payable by 10th Dec";

                          return (
                            <List.Item extra={
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span className="font-bold">₹{item.amount.toLocaleString()}</span>
                                <Tag color="red" style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>UNPAID</Tag>
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  shape="round"
                                  style={{ fontSize: '10px', height: '24px' }}
                                  onClick={() => handlePayNow(item)}
                                >
                                  PAY NOW
                                </Button>
                              </div>
                            }>
                              <List.Item.Meta 
                                title={t} 
                                description={dueDate && <span style={{ fontSize: '10px', color: '#8c8c8c' }}>{dueDate}</span>}
                              />
                            </List.Item>
                          );
                        }}
                      />
                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', items: 'center', padding: '0 16px' }}>
                        <Text strong>Total Expected Amount</Text>
                        <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>₹{studentData.feeStructureDetails.total_amount?.toLocaleString()}</Text>
                      </div>
                    </div>
                  ) : (
                    <Empty description="No pending fees or defined fee structure found." />
                  )}
                </Card>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card title={<span><NotificationOutlined style={{ color: '#faad14', marginRight: '8px' }} /> Notifications</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <List
                    dataSource={studentData.notifications}
                    renderItem={item => (
                      <List.Item><Alert message={item} type="info" showIcon style={{ width: '100%', borderRadius: '8px' }} /></List.Item>
                    )}
                  />
                </Card>
                {profile.guardians && profile.guardians.length > 0 && (
                  <Card title={<span><UserOutlined style={{ color: '#722ed1', marginRight: '8px' }} /> Guardians</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <List dataSource={profile.guardians} renderItem={g => (
                      <List.Item><List.Item.Meta avatar={<Avatar icon={<UserOutlined />} />} title={g.guardian_name} description={<Tag color="purple">{g.relation}</Tag>} /></List.Item>
                    )} />
                  </Card>
                )}
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Compact Payment Modal */}
      <Modal
        title={null}
        visible={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
        width={800}
        centered
        bodyStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
      >
        <div style={{ background: '#1d4ed8', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '32px', paddingRight: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCardOutlined style={{ fontSize: '20px', opacity: 0.8 }} />
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fee Checkout</h2>
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => setIsPaymentModalVisible(false)}>
            <RightOutlined rotate={-45} style={{ fontSize: '20px' }} />
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {profile && selectedFee && (
            <>
              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar size={48} icon={<UserOutlined />} style={{ background: '#1d4ed8', color: 'white' }} />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1f2937', margin: 0 }}>{studentName}</h4>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile.program || 'General Program'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Guardian</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{guardianName}</span>
                </div>
              </div>

              {/* Detail Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px', paddingLeft: '8px', paddingRight: '8px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Student ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{profile.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Academic Session</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>2026 - 2027</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Fee Structure</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{studentData.feeStructure || 'Standard'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Term / Category</span>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 'bold', border: 'none', background: '#dbeafe', color: '#1e40af', fontSize: '11px' }}>{selectedFee.fees_category || selectedFee.name}</Tag>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Email Address</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{profile.student_email_id || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Mobile Number</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{profile.student_mobile_number || 'N/A'}</span>
                </div>
              </div>

              {/* Address Row */}
              <div style={{ marginBottom: '24px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'start', gap: '12px' }}>
                <InfoCircleOutlined style={{ color: '#60a5fa', marginTop: '4px' }} />
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Billing Address</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                    {profile.address_line1 || 'N/A'} {profile.address_line2 || ''}, {profile.city}, {profile.state} - {profile.pincode}
                  </span>
                </div>
              </div>

              {/* Footer Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
                <div style={{ flex: 1 }}>
                  <Checkbox 
                    checked={termsAccepted} 
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, lineHeight: 1.4 }}
                  >
                    I confirm all student and fee details are correct. I agree to the <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Terms</span>.
                  </Checkbox>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Payable Amount</span>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>₹{(selectedFee.amount || selectedFee.outstanding_amount || 0).toLocaleString()}</span>
                  </div>
                  <Button 
                    type="primary" 
                    size="large" 
                    style={{ height: '56px', paddingLeft: '32px', paddingRight: '32px', borderRadius: '12px', fontSize: '16px', fontWeight: 900, border: 'none', background: termsAccepted ? '#1d4ed8' : '#e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    onClick={processPayment}
                    disabled={!termsAccepted}
                  >
                    CONFIRM & PAY
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
