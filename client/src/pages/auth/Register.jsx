import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, notification, Spin } from 'antd';
import { LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../utility/api';
import { useAuth } from "../../context/auth.jsx";
import './style.css';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();
  const [mobileOtp, setMobileOtp] = useState(null);
  const [emailOtp, setEmailOtp] = useState(null);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const onFinish = async (values) => {
    if (!mobileVerified || !emailVerified) {
      notification.error({ message: 'Please verify your mobile and email before submitting.' });
      return;
    }
    setLoading(true);
    try {
      const url = `mongo/auth/register`;
      const res = await api.post(url, values);
      const responseData = res.data;
      if (responseData.success) {
        notification.success({ message: responseData.message });
        localStorage.setItem('userToken', responseData.token);
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('userData', JSON.stringify(responseData.user));
        setAuth({ ...auth, token: responseData.token, user: responseData.user });
        navigate('/dashboard');
      } else {
        notification.error({ message: responseData.message || 'Something went wrong! Please try again.' });
      }
    } catch (err) {
      notification.error({ message: 'Something went wrong!' });
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOtp = async () => {
    const mobileNumber = form.getFieldValue('mobile');
    if (!mobileNumber) {
      notification.error({ message: 'Please enter your mobile number first.' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('common/sendOtp', { mobile: mobileNumber });
      if (res.data.status) {
        setMobileOtp(res.data.otp);
        notification.success({ message: 'OTP sent to your mobile number.' });
      } else {
        notification.error({ message: 'Failed to send OTP to mobile.' });
      }
    } catch (_) {
      notification.error({ message: 'Failed to send OTP to mobile.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOtp = () => {
    const enteredOtp = form.getFieldValue('mobileOtp');
    if (enteredOtp === mobileOtp) {
      setMobileVerified(true);
      notification.success({ message: 'Mobile number verified.' });
    } else {
      notification.error({ message: 'Incorrect OTP. Please try again.' });
    }
  };

  const sendEmailOtp = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      notification.error({ message: 'Please enter your email first.' });
      return;
    }
    setLoading(true);
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const template = `
        <h1>OTP Verification</h1>
        <p>Hello User,</p>
        <p>Your OTP (One-Time Password) for verification is: <strong>${generatedOtp}</strong></p>
        <p>Please use this OTP to complete the verification process.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>Best regards,<br> Verification Team</p>
      `;
      const res = await api.post('common/send-mail', { sendTo: email, emailSubject: 'Candid Verification', template });
      if (res.data.status) {
        setEmailOtp(generatedOtp);
        notification.success({ message: 'OTP sent to your email address.' });
      } else {
        notification.error({ message: 'Failed to send OTP to email.' });
      }
    } catch (_) {
      notification.error({ message: 'Failed to send OTP to email.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = () => {
    const enteredOtp = form.getFieldValue('emailOtp');
    if (enteredOtp === emailOtp) {
      setEmailVerified(true);
      notification.success({ message: 'Email verified.' });
    } else {
      notification.error({ message: 'Incorrect OTP. Please try again.' });
    }
  };

  return (
    <div className="login-page">
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      )}

      <div className="auth-container">
        <div className="login-div card-glass auth-card">
          <Title level={3} style={{ marginBottom: '20px', textAlign: 'center', color: '#000' }}>
            Register for ShareYourHR ATS
          </Title>
          <Form layout="vertical" onFinish={onFinish} form={form}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }, { min: 3, message: 'Name must be at least 3 characters' }]}>
              <Input prefix={<i className="fas fa-user" style={{ color: '#888' }} />} placeholder="Name" autoComplete="new-password" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
            </Form.Item>
            <Form.Item label="Mobile Number" name="mobile" rules={[{ required: true, message: 'Please provide your mobile number' }, { pattern: /^[0-9]{10}$/, message: 'Mobile number must be exactly 10 digits' }]}>
              <Input prefix={<i className="fas fa-phone" style={{ color: '#888' }} />} placeholder="Mobile Number" autoComplete="new-password" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
            </Form.Item>
            {mobileVerified ? (
              <CheckCircleOutlined style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', fontSize: '2rem', color: 'green' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <Button type="default" onClick={sendMobileOtp} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white', marginRight: '10px' }}>
                  Send OTP
                </Button>
                <Input placeholder="Enter OTP" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0', marginRight: '10px' }} onChange={(e) => form.setFieldsValue({ mobileOtp: e.target.value })} />
                <Button type="default" onClick={verifyMobileOtp} style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}>
                  Verify OTP
                </Button>
              </div>
            )}
            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Please enter a valid email' }]}>
              <Input prefix={<i className="fas fa-envelope" style={{ color: '#888' }} />} placeholder="Email" autoComplete="new-password" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
            </Form.Item>
            {emailVerified ? (
              <CheckCircleOutlined style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', fontSize: '2rem', color: 'green' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <Button type="default" onClick={sendEmailOtp} style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white', marginRight: '10px' }}>
                  Send OTP
                </Button>
                <Input placeholder="Enter OTP" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0', marginRight: '10px' }} onChange={(e) => form.setFieldsValue({ emailOtp: e.target.value })} />
                <Button type="default" onClick={verifyEmailOtp} style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}>
                  Verify OTP
                </Button>
              </div>
            )}
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password prefix={<i className="fas fa-lock" style={{ color: '#888' }} />} placeholder="Password" autoComplete="new-password" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0' }} iconRender={(visible) => (visible ? <i className="fas fa-eye" /> : <i className="fas fa-eye-slash" />)} />
            </Form.Item>
            <Form.Item label="Confirm Password" name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: 'Please confirm your password' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject(new Error('The two passwords do not match')); } })]}>
              <Input.Password prefix={<i className="fas fa-lock" style={{ color: '#888' }} />} placeholder="Confirm Password" autoComplete="new-password" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0' }} iconRender={(visible) => (visible ? <i className="fas fa-eye" /> : <i className="fas fa-eye-slash" />)} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-btn w-100">
                Register {loading && <Spin indicator={<LoadingOutlined spin />} />}
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Text style={{ color: '#4D4D4D' }}>
              Already have an account?{' '}
              <a onClick={() => navigate('/')} style={{ color: 'green', fontWeight: 'bold', cursor: 'pointer' }}>
                Login
              </a>
            </Text>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;
