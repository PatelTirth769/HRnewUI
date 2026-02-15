import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import api from '../../utility/api';
import { useAuth } from '../../context/auth.jsx';
import Config from '../../utility/Config';
import { FaUsers, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './style.css';

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
    if (values.role == 'candidate') {
      try {
        const url = `mongo/auth/login`;
        const res = await api.post(url, values);
        const responseData = res.data;

        if (responseData.success) {
          // notification.success({
          //   message: responseData.message,
          // });
          localStorage.setItem('userToken', responseData.token);
          localStorage.setItem('isLogged', 'true');
          localStorage.setItem('userData', JSON.stringify(responseData.user));

          setAuth({
            ...auth,
            token: responseData.token,
            user: responseData.user,
          });
          navigate('/dashboard');
        } else {
          notification.error({
            message: responseData.message || 'Something went wrong! Please try again.',
          });
        }
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Something went wrong!',
        });
      }
    } else if (values.role == 'recruiter') {
      try {
        const url = `mongo/auth/login`;
        const res = await api.post(url, values);
        const responseData = res.data;

        if (responseData.success) {
          // notification.success({
          //   message: responseData.message,
          // });
          localStorage.setItem('userToken', responseData.token);
          localStorage.setItem('isLogged', 'true');
          localStorage.setItem('userData', JSON.stringify(responseData.user));

          setAuth({
            ...auth,
            token: responseData.token,
            user: responseData.user,
          });
          navigate('/dashboard');
          await api.get('/mailparser');
        } else {
          notification.error({
            message: responseData.message || 'Something went wrong! Please try again.',
          });
        }
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Something went wrong!',
        });
      }
    } else if (values.role == 'admin') {
      try {
        const url = `common/userAuth`;
        const apiToken = localStorage.getItem('apiToken');
        if (!apiToken) {
          throw new Error('API token is null');
        }
        const headers = {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiToken,
        };
        const bodyData = {
          username: values.email,
          password: values.password,
        };
        const res = await api.post(url, bodyData, headers, true);
        const responseData = res.data;
        if (responseData.responseStatus === 'Ok') {
          localStorage.setItem('userToken', responseData.userToken);
          localStorage.setItem('isLogged', 'true');
          localStorage.setItem('userData', JSON.stringify(responseData.userData));

          setAuth({
            ...auth,
            token: responseData.userToken,
            user: responseData.userData,
          });
          setLoading(false);
          navigate('/dashboard');
        } else if (responseData.status === 'error') {
          notification.error({
            message: responseData.message,
          });
          setLoading(false);
        } else {
          notification.error({
            message: 'Something went wrong! Please check credentials',
          });
        }
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Something went wrong!',
        });
      }
    } else if (values.role == 'agent') {
      navigate('/agent/dashboard');
    }
    setLoading(false);
    return;
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
      <div className="navbar-custom">
        <div onClick={() => navigate('/', { replace: true })}>
          <h4>Logo</h4>
        </div>

        <Text style={{ fontSize: '1rem', color: '#4D4D4D' }}>
          Don't have an account? &nbsp;
          <Button
            type="default"
            onClick={() => navigate('/register')}
            style={{
              borderColor: 'green',
              color: 'green',
              padding: '10px 20px',
            }}
          >
            Register
          </Button>
        </Text>
      </div>
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
        </div>
      </div>

      
    </div>
  );
};

export default LoginPage;
