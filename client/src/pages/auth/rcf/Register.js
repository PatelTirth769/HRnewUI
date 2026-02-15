import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import logoRcf from '../../../assets/images/rcf-logo.png';
import api from '../../../utility/api';
import { useAuth } from '../../../context/auth.jsx';
import RcfFooter from '../../../Components/footer/RcfFooter';
import Config from '../../../utility/Config';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
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

  const onFinish = async (data) => {
    setLoading(true);
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
      const res = await api.post(url, data, headers, true);
      const responseData = res.data;
      if (responseData.responseStatus === 'Ok') {
        setTimeout(() => {
          notification.success({
            message: responseData.message,
          });
        }, 1000);

        localStorage.setItem('userToken', responseData.userToken);
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('userData', JSON.stringify(responseData.userData));

        setAuth({
          ...auth,
          token: responseData.userToken,
          user: responseData.userData,
        });
        setLoading(false);
        navigate('/rcf/admin/dashboard');
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
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="navbar-custom">
        <div onClick={() => navigate('/', { replace: true })}>
          <img src={logoRcf} alt="logo" style={{ width: '220px' }} />
        </div>
      </div>
      <div className="h-100 pt-3">
        <div
          className="login-div"
          style={{
            maxWidth: '400px',
            margin: '0 auto',
            padding: '25px 35px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Title
            level={3}
            style={{
              marginBottom: '20px',
              textAlign: 'center',
              color: '#000',
            }}
          >
            Register your account
          </Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Enter Name"
              name="username"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input
                prefix={<i className="fas fa-envelope" style={{ color: '#888' }} />}
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
              label="Email"
              name="username"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input
                prefix={<i className="fas fa-envelope" style={{ color: '#888' }} />}
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
              label="Mobile No."
              name="username"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input
                prefix={<i className="fas fa-envelope" style={{ color: '#888' }} />}
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
                prefix={<i className="fas fa-lock" style={{ color: '#888' }} />}
                placeholder="Password"
                autoComplete="new-password"
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
                iconRender={(visible) =>
                  visible ? <i className="fas fa-eye" /> : <i className="fas fa-eye-slash" />
                }
              />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<i className="fas fa-lock" style={{ color: '#888' }} />}
                placeholder="Password"
                autoComplete="new-password"
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
                iconRender={(visible) =>
                  visible ? <i className="fas fa-eye" /> : <i className="fas fa-eye-slash" />
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-100"
                style={{
                  backgroundColor: 'green',
                  borderColor: 'green',
                  padding: '10px 0',
                  borderRadius: '4px',
                }}
              >
                Login {loading && <Spin indicator={<LoadingOutlined spin />} />}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <RcfFooter />
    </div>
  );
};

export default Register;
