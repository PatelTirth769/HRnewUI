import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin, Modal } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { useAuth } from '../../context/auth.jsx';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './style.css';
import API, { setActiveSystem } from '../../services/api';
import ssvLogo from '../../assets/images/finalssvloginlogo-removebg-preview.png';
import axios from 'axios';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [isGuardianSelectionVisible, setIsGuardianSelectionVisible] = useState(false);
  const [guardianStudents, setGuardianStudents] = useState([]);
  const [selectedGuardianStudent, setSelectedGuardianStudent] = useState(null);
  const emailInputValue = Form.useWatch('email', form);

  // Discover role as user types or on blur (local role hint, purely visual)
  useEffect(() => {
    const fetchDiscoveredAccounts = async () => {
      const identifier = (emailInputValue || '').trim();
      if (!identifier || identifier.length < 3) {
        setDiscoveredAccounts([]);
        return;
      }
      try {
        const res = await axios.get(`/local-api/local/users/get-role/${encodeURIComponent(identifier)}`);
        setDiscoveredAccounts(res.data?.accounts || []);
        setSelectedAccountIndex(0);
      } catch (err) {
        setDiscoveredAccounts([]);
      }
    };
    
    const timeoutId = setTimeout(fetchDiscoveredAccounts, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [emailInputValue]);

  const handleGuardianSelectionConfirm = () => {
    if (selectedGuardianStudent) {
        localStorage.setItem('guardian_active_ward', selectedGuardianStudent);
    }
    setIsGuardianSelectionVisible(false);
    navigate('/guardian-dashboard');
  };

  const onFinish = async (values) => {
    setLoading(true);
    // Enforce our active system configuration to schooler.
    setActiveSystem('schooler');

    try {
      let loginUsr = values.email;
      console.log('--- DEBUG LOGIN ---');
      console.log('values.email:', values.email);
      console.log('discoveredAccounts:', discoveredAccounts);
      console.log('selectedAccountIndex:', selectedAccountIndex);
      if (discoveredAccounts.length > 1) {
          loginUsr = discoveredAccounts[selectedAccountIndex]?.email || values.email;
      }
      console.log('FINAL loginUsr:', loginUsr);

      // ERPNext Login Endpoint (routed through proxy to schooler)
      const response = await API.post('/api/method/login', {
        usr: loginUsr,
        pwd: values.password
      });

      if (response.data.message === 'Logged In') {
        const mongoRole = response.data.mongo_role;
        const resolvedUserId = response.data.resolved_user_id || values.email;
        
        // Fetch actual ERPNext roles for this user
        let isHRAdmin = false;
        try {
          const userRes = await API.get(`/api/resource/User/${encodeURIComponent(resolvedUserId)}`);
          const userData = userRes.data?.data;
          const roles = userData?.roles?.map(r => r.role) || [];

          console.log("PARSED ROLES ARRAY:", roles);

          // User is HR Admin if they have any of these roles
          const adminRoles = ['HR Manager', 'HR User', 'System Manager', 'Administrator', 'HR'];
          
          // Check both ERPNext roles AND the mongoRole deduced by our proxy
          isHRAdmin = roles.some(r => adminRoles.includes(r)) || adminRoles.includes(mongoRole);
          
          console.log("IS HR ADMIN EVALUATED TO:", isHRAdmin, "(based on roles:", roles, "and mongoRole:", mongoRole, ")");
        } catch (roleErr) {
          console.error('Could not fetch User doctype:', roleErr);
          isHRAdmin = false;
        }

        notification.success({
          message: 'Login Successful',
          description: `Welcome back, ${response.data.full_name}${mongoRole ? `. Your local role is: ${mongoRole}` : ''}`,
        });

        // Store basic user info 
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('user', resolvedUserId);
        localStorage.setItem('userToken', 'session-active');
        localStorage.setItem('userRole', mongoRole || 'Employee');
        localStorage.setItem('userIsHRAdmin', isHRAdmin ? 'true' : 'false');
        localStorage.setItem('activeSystem', 'schooler');
        localStorage.setItem('activeSystemName', 'Schooler');
        localStorage.setItem('login_input', values.email);

        if (mongoRole) {
          localStorage.setItem('mongoRole', mongoRole);
        }

        // Redirect based on role
        if (isHRAdmin) {
          navigate('/home');
        } else if (mongoRole === 'Attendance manager') {
          navigate('/education/student-attendance');
        } else if (mongoRole === 'Student') {
          navigate('/student-dashboard');
        } else if (mongoRole === 'Instructor') {
          navigate('/instructor-dashboard');
        } else if (mongoRole === 'Coordinator') {
          navigate('/coordinator-dashboard');
        } else if (mongoRole === 'Guardian') {
          // Fetch Guardian profile to check for multiple students
          try {
            const loginInput = values.email;
            const guardRes = await API.get(`/api/resource/Guardian?or_filters=[["email_address","=","${resolvedUserId}"],["mobile_number","=","${resolvedUserId}"],["email_address","=","${loginInput}"],["mobile_number","=","${loginInput}"]]&fields=["name"]`);
            if (guardRes.data?.data?.length > 0) {
                const guardianId = guardRes.data.data[0].name;
                localStorage.setItem('guardian_profile_id', guardianId);
                const fullGuard = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardianId)}`);
                const students = fullGuard.data?.data?.students || [];
                
                if (students.length > 1) {
                    setGuardianStudents(students);
                    setSelectedGuardianStudent(students[0].student); // Select first by default
                    setIsGuardianSelectionVisible(true);
                    setLoading(false);
                    return; // Pause the login flow here!
                } else if (students.length === 1) {
                    localStorage.setItem('guardian_active_ward', students[0].student);
                }
            }
          } catch (err) {
            console.error('Error fetching Guardian for login selection', err);
          }
          navigate('/guardian-dashboard');
        } else {
          navigate('/employee-self-service');
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      const status = err.response?.status;
      let errorMsg = 'Login Failed';

      if (status === 401) {
        errorMsg = "Invalid Username or Password.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      notification.error({
        message: 'Login Failed',
        description: errorMsg
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const linkedInCode = urlParams.get('code');

    if (linkedInCode) {
      const fetchLinkedInData = async () => {
        try {
          const accessTokenResponse = await api.post('/linkedin/getAccessToken', {
            code: linkedInCode,
          });
          const accessToken = accessTokenResponse.data.accessToken;
          setAccessToken(accessToken);

          const profileResponse = await api.post('/linkedin/getProfileData', {
            accessToken,
          });
          const profileData = profileResponse.data;
          setProfile(profileData);
        } catch (error) {
          console.error('Error fetching LinkedIn data:', error);
          setErrorMessage('Failed to fetch LinkedIn data');
        }
      };

      fetchLinkedInData();
    }
  }, [location]);

  return (
    <div className="login-page">
      <img src={ssvLogo} alt="SSV Logo" className="login-page-logo-bg" />
      <div className="auth-container" style={{maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'center'}}>
        {/* ─── LEFT: Login Form ─── */}
        <div className="login-div card-glass auth-card" style={{ flex: '1 1 auto', borderRight: 'none', borderRadius: '16px'}}>
          <Title level={3} className="auth-title">
            Login to Schooler
          </Title>

          <Form layout="vertical" onFinish={onFinish} form={form}>
            <Form.Item
              label="Email (Employee id or Phone No)"
              name="email"
              rules={[{ required: true, message: 'Email or ID is required' }]}
              extra={
                <div style={{ marginTop: '4px' }}>
                  {discoveredAccounts.length === 1 && (
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                      System: {discoveredAccounts[0].system ? (discoveredAccounts[0].system.charAt(0).toUpperCase() + discoveredAccounts[0].system.slice(1)) : 'Schooler'} | Role: {discoveredAccounts[0].role}
                    </div>
                  )}
                  {discoveredAccounts.length > 1 && (
                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                        Multiple accounts found. Please select which one to log into:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {discoveredAccounts.map((acc, index) => (
                          <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#334155', margin: 0 }}>
                            <input 
                              type="radio" 
                              name="accountSelection"
                              checked={selectedAccountIndex === index}
                              onChange={() => setSelectedAccountIndex(index)}
                              style={{ accentColor: '#10b981', width: '16px', height: '16px', margin: 0 }}
                            />
                            <span>Login as <strong>{acc.role}</strong> (System: {acc.system ? (acc.system.charAt(0).toUpperCase() + acc.system.slice(1)) : 'Schooler'}) {acc.name ? <span style={{ color: '#64748b' }}>({acc.name})</span> : ''}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <Input
                prefix={<FaUser style={{ color: '#888' }} />}
                placeholder="Email (Employee id or Phone No)"
                autoComplete="username"
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<FaLock style={{ color: '#888' }} />}
                placeholder="Password"
                autoComplete="current-password"

                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
                iconRender={(visible) =>
                  visible ? <FaEye /> : <FaEyeSlash />
                }
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-btn w-100" disabled={loading}>
                {loading ? (
                  <>Logging in... <Spin indicator={<LoadingOutlined spin />} /></>
                ) : (
                  'Login'
                )}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-3">
            <Text style={{ fontSize: '0.9rem', color: '#4D4D4D' }}>
              Don't have an account? &nbsp;
              <Link to="/register" style={{ color: 'green', fontWeight: 'bold' }}>
                Register
              </Link>
            </Text>
          </div>
        </div>
      </div>

      <Modal
        title="Select Student Profile"
        open={isGuardianSelectionVisible}
        onCancel={() => setIsGuardianSelectionVisible(false)} // Or enforce selection without cancel
        footer={null}
        closable={false}
        maskClosable={false}
        width={400}
      >
        <div style={{ marginBottom: '16px', color: '#475569' }}>
          You are linked to multiple students. Please select which student's record you want to view:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {guardianStudents.map((ward, index) => (
            <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: selectedGuardianStudent === ward.student ? '#ecfdf5' : '#fff', borderColor: selectedGuardianStudent === ward.student ? '#10b981' : '#e2e8f0', transition: 'all 0.2s' }}>
              <input 
                type="radio" 
                name="guardianStudentSelection"
                checked={selectedGuardianStudent === ward.student}
                onChange={() => setSelectedGuardianStudent(ward.student)}
                style={{ accentColor: '#10b981', width: '18px', height: '18px', margin: 0 }}
              />
              <span style={{ fontWeight: '600', color: '#1e293b' }}>
                {ward.student_name || ward.student}
              </span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={handleGuardianSelectionConfirm} style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 'bold', padding: '0 24px' }}>
            Continue
          </Button>
        </div>
      </Modal>

      {/* ─── COMPLIANCE FOOTER ─── */}
      <footer className="login-footer" style={{
        textAlign: 'center',
        padding: '24px 10px',
        width: '100%',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(229, 231, 235, 0.5)',
        fontSize: '13px',
        color: '#4B5563',
        marginTop: 'auto'
      }}>
        <div style={{ marginBottom: '8px' }}>
          &copy; {new Date().getFullYear()} Shree Saraswati Vidhyalay. All rights reserved.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a href="/policies.html#terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Terms & Conditions</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <a href="/policies.html#privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Privacy Policy</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <a href="/policies.html#refund" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Refund Policy</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <a href="/policies.html#shipping" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Shipping Policy</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <a href="/policies.html#contact" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
