import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
// import logoHR from "../../assets/images/logo-small.png";
import logoHR from '../../assets/images/rcf-logo.png';
import api from '../../utility/api';
import { useAuth } from '../../context/auth.jsx';
import Footer from '../../Components/footer/Footer';
import Config from '../../utility/Config';

const { Title, Text } = Typography;

const Login = () => {
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
        // setTimeout(() => {
        //   notification.success({
        //     message: responseData.message,
        //   });
        // }, 1000);

        localStorage.setItem('userToken', responseData.userToken);
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('userData', JSON.stringify(responseData.userData));

        setAuth({
          ...auth,
          token: responseData.userToken,
          user: responseData.userData,
        });
        setLoading(false);
        navigate('/hradmin/dashboard');
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
          <img src={logoHR} alt="logo" style={{ width: '220px' }} />
        </div>

        {/* <Text style={{ fontSize: "1rem", color: "#4D4D4D" }}>
          Don't have an account? &nbsp;
          <Button
            type="default"
            onClick={() => navigate("//register")}
            style={{
              borderColor: "green",
              color: "green",
              padding: "10px 20px",
            }}
          >
            Register
          </Button>
        </Text> */}
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
            Login to your account
          </Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="username"
              rules={[{ required: true, message: 'Username is required' }]}
            >
              <Input
                prefix={<i className="fas fa-user" style={{ color: '#888' }} />}
                placeholder="Email"
                autoComplete="new-password"
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
                type="email"
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
              <Button
                type="primary"
                htmlType="submit"
                className="w-100"
                x
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

      <Footer />
    </div>
  );
};

export default Login;
