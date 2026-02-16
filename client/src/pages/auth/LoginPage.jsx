import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import api from '../../utility/api';
import { useAuth } from '../../context/auth.jsx';
import Config from '../../utility/Config';
import { FaUsers, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './style.css';
import API from '../../services/api';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

    // ... other roles (candidate, recruiter) kept as is or ignored for now

    if (values.role == 'admin') {
      try {
        // ERPNext Login Endpoint
        const response = await API.post('/api/method/login', {
          usr: values.email,
          pwd: values.password
        });

        if (response.data.message === 'Logged In') {
          notification.success({
            message: 'Login Successful',
            description: `Welcome back, ${response.data.full_name}`,
          });

          // Store basic user info 
          localStorage.setItem('isLogged', 'true');
          localStorage.setItem('user', values.email);

          // Redirect to Employee Master
          navigate('/employee-master');
        }
      } catch (err) {
        console.error("Login Error:", err);
        const status = err.response?.status;
        let errorMsg = 'Login Failed';

        if (status === 401) {
          errorMsg = "Invalid Username or Password. Please check if your 'Administrator' username is capitalized.";
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }

        notification.error({
          message: 'Login Failed',
          description: errorMsg
        });
      }
    }
    // ... keep other roles logic if necessary, or just return
    else if (values.role == 'agent') {
      navigate('/agent/dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const linkedInCode = urlParams.get('code');

    if (linkedInCode) {
      const fetchLinkedInData = async () => {
        try {
          // Get access token
          const accessTokenResponse = await api.post('/linkedin/getAccessToken', {
            code: linkedInCode,
          });
          const accessToken = accessTokenResponse.data.accessToken;
          setAccessToken(accessToken);

          // Get profile data
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
      <div className="auth-container">
        <div className="login-div card-glass auth-card">
          <Title level={3} className="auth-title">
            Login to your account
          </Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Role is required' }]}
            >
              <Select
                prefix={<FaUsers style={{ color: '#888' }} />}
                placeholder="I am"
              >
                <Select.Option value="admin">Admin</Select.Option>
                <Select.Option value="recruiter">Recruiter</Select.Option>
                <Select.Option value="agent">Agent</Select.Option>
                <Select.Option value="candidate">Candidate</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input
                prefix={<FaUser style={{ color: '#888' }} />}
                placeholder="Email"
                autoComplete="new-password"
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
            {/* <Form.Item>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-start justify-content-center">
                  <input className="mx-2" type="checkbox" />

                  <span>Keep me logged in</span>
                </div>
                <Link to="/rcf/forgotpassword" style={{ color: "#4D4D4D" }}>
                  Forgot Password?
                </Link>
              </div>
            </Form.Item> */}
            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-btn w-100">
                Login {loading && <Spin indicator={<LoadingOutlined spin />} />}
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
