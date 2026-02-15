import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin } from 'antd';
import { LoadingOutlined, GoogleOutlined, LinkedinOutlined } from '@ant-design/icons'; // Added Google and LinkedIn Icons
import loginBg from '../../../assets/images/grievance-login.png';
import Footer from '../../../Components/footer/Footer';
import logoSmall from '../../../assets/images/logo-small.png';
import api from '../../../utility/api';
import { useAuth } from '../../../context/auth.jsx';

const { Title, Text } = Typography;

const Grievancelogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const url = `mongo/auth/login`;
      const res = await api.post(url, values);
      const responseData = res.data;
      if (responseData.success === true) {
        notification.success({
          message: responseData.message,
        });
        setLoading(false);
        localStorage.setItem('userToken', responseData.token);
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('userData', JSON.stringify(responseData.user));

        setAuth({
          ...auth,
          token: responseData.token,
          user: responseData.user,
        });
        navigate('/grievance/dashboard');
      } else if (responseData.status === 'error') {
        notification.error({
          message: responseData.message,
        });
        setLoading(false);
      } else {
        notification.error({
          message: 'Something went wrong! Please try again',
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

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      const url = `mongo/auth/login`;
      const values = {
        email: 'anonymous@example.com',
        password: 'anonymousPassword',
      };
      const res = await api.post(url, values);
      const responseData = res.data;
      if (responseData.success === true) {
        notification.success({
          message: responseData.message,
        });
        setLoading(false);
        localStorage.setItem('userToken', responseData.token);
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('userData', JSON.stringify(responseData.user));

        setAuth({
          ...auth,
          token: responseData.token,
          user: responseData.user,
        });
        navigate('/grievance/dashboard');
      } else if (responseData.status === 'error') {
        notification.error({
          message: responseData.message,
        });
        setLoading(false);
      } else {
        notification.error({
          message: 'Something went wrong! Please try again',
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
      <div className="page-container">
        <div className="login-container-div">
          <div
            className="login-div"
            style={{ gap: '3rem', display: 'flex', flexDirection: 'column' }}
          >
            <Title
              level={2}
              style={{
                marginBottom: '20px',
                textAlign: 'center',
                color: '#4D4D4D',
              }}
            >
              Grievance Login
            </Title>

            <Form onFinish={onFinish}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Email is required' }]}
              >
                <Input autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%', backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                >
                  Login
                </Button>
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  marginTop: '20px',
                  gap: '10px',
                }}
              >
                <Button
                  type="primary"
                  onClick={handleAnonymousLogin}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Anonymous Login
                </Button>
                <Button
                  type="primary"
                  icon={<GoogleOutlined />}
                  style={{
                    backgroundColor: '#db4437',
                    borderColor: '#db4437',
                  }}
                ></Button>
                <Button
                  type="primary"
                  icon={<LinkedinOutlined />}
                  style={{
                    backgroundColor: '#0077b5',
                    borderColor: '#0077b5',
                  }}
                ></Button>
              </div>
            </Form>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={loginBg} width="80%" alt="Interview" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Grievancelogin;
