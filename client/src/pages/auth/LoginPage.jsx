import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import api from '../../utility/api';
import { useAuth } from '../../context/auth.jsx';
import Config from '../../utility/Config';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaServer, FaClock } from 'react-icons/fa';
import './style.css';
import API, { setActiveSystem } from '../../services/api';
import axios from 'axios';

const { Title, Text } = Typography;
const SCHOOLER_APP_URL = import.meta.env.VITE_SCHOOLER_APP_URL || 'http://localhost:5174';

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
  const [discoveredRole, setDiscoveredRole] = useState(null);
  const [discoveredSystem, setDiscoveredSystem] = useState(null);
  const emailInputValue = Form.useWatch('email', form);

  // Discover role as user types or on blur
  useEffect(() => {
    const fetchDiscoveredRole = async () => {
      const identifier = (emailInputValue || '').trim();
      if (!identifier || identifier.length < 3) {
        setDiscoveredRole(null);
        return;
      }
      try {
        const identifier = (emailInputValue || '').trim();
        const res = await axios.get(`/local-api/local/users/get-role/${encodeURIComponent(identifier)}`);
        setDiscoveredRole(res.data?.role);
        setDiscoveredSystem(res.data?.system);
      } catch (err) {
        setDiscoveredRole(null);
        setDiscoveredSystem(null);
      }
    };
    
    const timeoutId = setTimeout(fetchDiscoveredRole, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [emailInputValue]);

  // Systems state
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [loadingSystems, setLoadingSystems] = useState(true);

  const emailLower = (emailInputValue || '').toLowerCase();
  const isAdministratorLogin = emailLower.includes('administrator');

  // Determine the effective system for display and login
  let systemForDisplay = discoveredSystem || (isAdministratorLogin ? selectedSystem : null);
  if (!isAdministratorLogin && !discoveredSystem && emailLower) {
    if (emailLower.includes('lingayasvidyapeeth.edu.in')) {
      systemForDisplay = 'lingayas';
    } else if (emailLower.includes('lingayasgroup.org')) {
      systemForDisplay = 'ecommerce';
    } else if (emailLower.length > 5) { // Only default to preeshe if they've typed enough
      systemForDisplay = 'preeshe';
    }
  }

  const apiAuthenticate = async () => {
    const data = {
      user: Config.user,
      pass: Config.pass,
      key: Config.key,
    };
    try {
      const response = await api.post(`common/apiAuth`, data);

      if (response.data.responseStatus === 'Ok') {
        localStorage.setItem('apiToken', response.data.token);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      notification.error({
        message: 'API Error',
        description: 'API Server not connected',
        duration: 0,
      });
    }
  };

  useEffect(() => {
    apiAuthenticate();
    fetchSystems();
  }, []);

  // Fetch systems from backend
  const fetchSystems = async () => {
    setLoadingSystems(true);
    try {
      const res = await axios.get('/local-api/systems');
      const systemsList = res.data || [];
      const hiddenSystems = new Set(['celejor', 'celejio', 'bombiam', 'bombaim']);
      const filteredSystems = systemsList.filter((system) => {
        const code = (system?.code || '').toLowerCase();
        const name = (system?.name || '').toLowerCase();
        return !hiddenSystems.has(code) && !hiddenSystems.has(name);
      });

      setSystems(filteredSystems);
      // Auto-select first active system
      const firstActive = filteredSystems.find(s => s.status === 'active');
      if (firstActive) {
        setSelectedSystem(firstActive.code);
      }
    } catch (err) {
      console.error('Failed to fetch systems:', err);
      // Fallback: default to preeshe
      setSystems([{ name: 'Preeshe', code: 'preeshe', status: 'active', order: 1 }]);
      setSelectedSystem('preeshe');
    } finally {
      setLoadingSystems(false);
    }
  };

  const onFinish = async (values) => {
    if (isAdministratorLogin && !selectedSystem) {
      notification.warning({ message: 'Please select a system to log into' });
      return;
    }

    setLoading(true);

    // Use the system detected for display as the system to log into
    const systemToUse = systemForDisplay;

    // Set active system in api.js so all calls route through the proxy
    setActiveSystem(systemToUse);

    try {
      // ERPNext Login Endpoint (routed through proxy)
      const response = await API.post('/api/method/login', {
        usr: values.email,
        pwd: values.password
      });

      if (response.data.message === 'Logged In') {
        const mongoRole = response.data.mongo_role;
        // Fetch actual ERPNext roles for this user
        let isHRAdmin = false;
        try {
          const userRes = await API.get(`/api/resource/User/${encodeURIComponent(values.email)}`);
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
        localStorage.setItem('user', values.email);
        localStorage.setItem('userToken', 'session-active');
        localStorage.setItem('userRole', mongoRole || 'Employee');
        localStorage.setItem('userIsHRAdmin', isHRAdmin ? 'true' : 'false');
        localStorage.setItem('activeSystem', systemToUse);
        if (mongoRole) {
          localStorage.setItem('mongoRole', mongoRole);
        }

        // Find the selected system name for display
        const sys = systems.find(s => s.code === systemToUse);
        if (sys) {
          localStorage.setItem('activeSystemName', sys.name);
        }

        if ((systemToUse || '').toLowerCase() === 'schooler') {
          // Open Schooler frontend when Schooler is selected at login.
          window.location.href = SCHOOLER_APP_URL;
          return;
        }

        // Redirect based on role
        if (isHRAdmin) {
          navigate('/home');
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

  // System card color palette
  const systemColors = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', text: '#fff' },
  ];

  const getSystemColor = (index) => systemColors[index % systemColors.length];

  return (
    <div className="login-page">
      <div className="auth-container-multi">
        {/* ─── LEFT: Login Form ─── */}
        <div className="login-div card-glass auth-card">
          <Title level={3} className="auth-title">
            Login to your account
          </Title>

          <Form layout="vertical" onFinish={onFinish} form={form}>
            <Form.Item
              label="Email (Employee id or Phone No)"
              name="email"
              rules={[{ required: true, message: 'Email or ID is required' }]}
            >
              <Input
                prefix={<FaUser style={{ color: '#888' }} />}
                placeholder="Email (Employee id or Phone No)"
                autoComplete="new-password"
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
              />
              {(discoveredRole || (!isAdministratorLogin && systemForDisplay)) && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                  System: {systems.find(s => s.code === systemForDisplay)?.name || 'Detected'} {discoveredRole ? `| Role: ${discoveredRole}` : ''}
                </div>
              )}
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<FaLock style={{ color: '#888' }} />}
                placeholder="Password"
                autoComplete="new-password"
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
              <Button type="primary" htmlType="submit" className="auth-btn w-100" disabled={loading || (isAdministratorLogin && !selectedSystem)}>
                {loading ? (
                  <>Logging in... <Spin indicator={<LoadingOutlined spin />} /></>
                ) : (
                  isAdministratorLogin
                    ? (selectedSystem ? `Login to ${systems.find(s => s.code === selectedSystem)?.name || 'System'}` : 'Select a system →')
                    : 'Login'
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

        {/* ─── RIGHT: System Selector Panel ─── */}
        {isAdministratorLogin && (
          <div className="system-selector-panel card-glass">
          <div className="system-selector-header">
            <FaServer style={{ fontSize: '1.2rem', color: '#667eea' }} />
            <span className="system-selector-title">Select System</span>
          </div>
          <p className="system-selector-subtitle">
            Choose which system to access
          </p>

          {loadingSystems ? (
            <div className="system-loading">
              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 24, color: '#667eea' }} />} />
              <span>Loading systems...</span>
            </div>
          ) : (
            <div className="system-cards-list">
              {systems.map((sys, index) => {
                const isActive = sys.status === 'active';
                const isSelected = selectedSystem === sys.code;
                const colorSet = getSystemColor(index);

                return (
                  <div
                    key={sys.code}
                    className={`system-card ${isSelected ? 'system-card-selected' : ''} ${!isActive ? 'system-card-upcoming' : ''}`}
                    onClick={() => isActive && setSelectedSystem(sys.code)}
                    style={{
                      cursor: isActive ? 'pointer' : 'default',
                      opacity: isActive ? 1 : 0.55,
                    }}
                  >
                    <div className="system-card-icon" style={{ background: colorSet.bg }}>
                      {sys.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="system-card-info">
                      <div className="system-card-name">{sys.name}</div>
                      {isActive ? (
                        <span className="system-badge system-badge-active">Active</span>
                      ) : (
                        <span className="system-badge system-badge-upcoming">
                          <FaClock style={{ fontSize: '0.65rem', marginRight: '3px' }} />
                          Coming Soon
                        </span>
                      )}
                    </div>
                    {isSelected && isActive && (
                      <div className="system-card-check">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedSystem && (
            <div className="system-selected-info">
              Logging into: <strong>{systems.find(s => s.code === selectedSystem)?.name}</strong>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
