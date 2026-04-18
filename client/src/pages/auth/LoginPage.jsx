import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import api from '../../utility/api';
import { useAuth } from '../../context/auth.jsx';
import Config from '../../utility/Config';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './style.css';
import API, { setActiveSystem } from '../../services/api';
import axios from 'axios';
import ssvLogo from '../../assets/images/SSVLOGO.png';

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
  const [discoveredRole, setDiscoveredRole] = useState(null);
  const emailInputValue = Form.useWatch('email', form);

  // Discover role as user types or on blur (local role hint, purely visual)
  useEffect(() => {
    const fetchDiscoveredRole = async () => {
      const identifier = (emailInputValue || '').trim();
      if (!identifier || identifier.length < 3) {
        setDiscoveredRole(null);
        return;
      }
      try {
        const res = await axios.get(`/local-api/local/users/get-role/${encodeURIComponent(identifier)}`);
        setDiscoveredRole(res.data?.role);
      } catch (err) {
        setDiscoveredRole(null);
      }
    };
    
    const timeoutId = setTimeout(fetchDiscoveredRole, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [emailInputValue]);

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
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    // Enforce our active system configuration to schooler.
    setActiveSystem('schooler');

    try {
      // ERPNext Login Endpoint (routed through proxy to schooler)
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
        localStorage.setItem('activeSystem', 'schooler');
        localStorage.setItem('activeSystemName', 'Schooler');

        if (mongoRole) {
          localStorage.setItem('mongoRole', mongoRole);
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
              {discoveredRole && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                  Schooler User | Role: {discoveredRole}
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
    </div>
  );
};

export default LoginPage;
