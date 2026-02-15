import React, { useRef, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin, Checkbox, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/auth.jsx';
import api from '../../../utility/api';
import Config from '../../../utility/Config';
import interview_image from '../../../assets/media/graphics.png';
import Footer from '../../../Components/footer/Footer';
import logoSmall from '../../../assets/images/logo-small.png';

const { Title, Text } = Typography;

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isPanNeed, setIsPanNeed] = useState(true);
  const [auth, setAuth] = useAuth();
  const userRef = useRef();
  const passRef = useRef();

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
      } else {
        notification.error({
          message: 'API Error',
          description: 'API Authentication Failed',
          duration: 0,
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      notification.error({
        message: 'API Error',
        description: 'API Authentication Failed',
        duration: 0,
      });
    }
  };

  useEffect(() => {
    apiAuthenticate();
  }, []);
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const url = `common/register`;
      const apiToken = localStorage.getItem('apiToken');
      if (!apiToken) {
        throw new Error('API token is null');
      }
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiToken,
      };
      const res = await api.post(url, values, headers, true);
      const responseData = res.data;
      if (responseData.responseStatus === 'Ok') {
        setTimeout(() => {
          notification.success({
            message: responseData.message,
          });
        }, 1000);
        setLoading(false);
        navigate('/login');
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
      <div className="navbar-custom">
        <div
          onClick={() => {
            navigate('/', { replace: true });
          }}
        >
          <img src={logoSmall} alt="logo" style={{ width: '120px', height: 'auto' }} />
        </div>
      </div>
      <div className="page-container">
        <div className="login-container-div">
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={interview_image} width="100%" alt="Register" />
          </div>
          <div className="register-div">
            <Title
              level={2}
              style={{
                marginBottom: '20px',
                textAlign: 'center',
                color: '#4D4D4D',
              }}
            >
              Register for <br />
              recruiter
            </Title>

            <Form onFinish={onFinish} className="mb-8">
              <div style={{ display: 'flex', gap: '10px' }}>
                <Form.Item
                  name="name"
                  rules={[
                    { required: true, message: 'Name is required' },
                    { min: 3, message: 'Name must be at least 3 characters' },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input className="my-4" type="text" placeholder="Name" />
                </Form.Item>
                <Form.Item
                  name="mobile"
                  rules={[
                    { required: true, message: 'Mobile number is required' },
                    {
                      pattern: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit mobile number',
                    },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input className="my-4" type="tel" placeholder="Mobile Number" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input className="my-4" type="email" placeholder="Email" />
                </Form.Item>
                <Form.Item
                  name="pan"
                  dependencies={['panExempt']}
                  rules={[
                    ({ getFieldValue }) => ({
                      required: getFieldValue('panExempt') === false && isPanNeed,
                      message: 'PAN is required',
                    }),
                    {
                      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: 'Please enter a valid PAN',
                    },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input className="my-4" type="text" placeholder="PAN" />
                  <Checkbox
                    name="panExempt"
                    defaultChecked={false}
                    onClick={() => {
                      setIsPanNeed(!isPanNeed);
                    }}
                  >
                    I don't have a PAN
                  </Checkbox>
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Password is required' }]}
                  style={{ flex: 1 }}
                >
                  <Input.Password className="my-4" placeholder="Password" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match'));
                      },
                    }),
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input.Password className="my-4" placeholder="Confirm Password" />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Form.Item
                  name="company"
                  rules={[{ required: true, message: 'Company is required' }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    className="my-4"
                    placeholder="Company"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'option1', label: 'option1' },
                      { value: 'option2', label: 'option2' },
                      { value: 'Option3', label: 'Option3' },
                      { value: 'option4', label: 'option4', disabled: true },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="role"
                  rules={[{ required: true, message: 'Role is required' }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    className="my-4"
                    placeholder="Role"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'option1', label: 'option1' },
                      { value: 'option2', label: 'option2' },
                      { value: 'Option3', label: 'Option3' },
                      { value: 'option4', label: 'option4', disabled: true },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item>
                <Button
                  className="btn w-100 text-capitalize text-white bg-orange"
                  style={{ fontSize: '1rem' }}
                  type="primary"
                  htmlType="submit"
                >
                  Register{'  '}
                  {loading && <Spin indicator={<LoadingOutlined spin />} />}
                </Button>
              </Form.Item>
              <Text style={{ fontSize: '1.5rem', color: '#4D4D4D' }}>
                Already have an account? &nbsp;
                <Link to="/login" style={{ color: '#893DFF' }}>
                  Login
                </Link>
              </Text>
            </Form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
