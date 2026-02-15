import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Dropdown, Menu, Select } from 'antd';
import { loginUser } from '../../../assets/js/httpHandler';
import { useNotifier } from '../../../assets/js/utils';
import interview_image from '../../../assets/media/graphics.png';
import Footer from '../../../Components/footer/Footer';
import logoSmall from '../../../assets/images/logo-small.png';

const { Title, Text } = Typography;

// Define menu items for the dropdowns
const menu1 = (
  <Menu>
    <Menu.Item key="1">Option 1</Menu.Item>
    <Menu.Item key="2">Option 2</Menu.Item>
    <Menu.Item key="3">Option 3</Menu.Item>
  </Menu>
);

const menu2 = (
  <Menu>
    <Menu.Item key="1">Option A</Menu.Item>
    <Menu.Item key="2">Option B</Menu.Item>
    <Menu.Item key="3">Option C</Menu.Item>
  </Menu>
);

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const userRef = useRef();
  const passRef = useRef();

  const login = () => {
    const username = userRef.current.input.value;
    const password = passRef.current.input.value;
    const candidate_cred = {
      username: 'ramchandra',
      password: 'ramchandra@123',
    };
    loginUser(notifier, candidate_cred, dispatch, navigate);
  };

  const defaultLogin = () => {
    const company1_cred = { username: 'company1', password: 'comp1@123' };
    loginUser(notifier, company1_cred, dispatch, () => navigate('/admin'));
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
          <div className="login-div ">
            <Title
              level={2}
              style={{
                marginBottom: '20px',
                textAlign: 'center',
                color: '#4D4D4D',
              }}
            >
              Recruiter Login
            </Title>

            <Form>
              <Form.Item label="Username">
                <Input ref={userRef} autoComplete="new-password" />
              </Form.Item>
              <Form.Item label="Password">
                <Input.Password ref={passRef} autoComplete="new-password" />
              </Form.Item>
              <Form.Item label="Company">
                <Select
                  className="ant-input"
                  placeholder="Options"
                  style={{ width: 120 }}
                  options={[
                    { value: 'option1', label: 'option1' },
                    { value: 'option2', label: 'option2' },
                    { value: 'Option3', label: 'Option3' },
                    { value: 'option4', label: 'option4', disabled: true },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Role">
                <Select
                  className="ant-input"
                  placeholder="Options"
                  style={{ width: 120 }}
                  options={[
                    { value: 'option1', label: 'option1' },
                    { value: 'option2', label: 'option2' },
                    { value: 'Option3', label: 'Option3' },
                    { value: 'option4', label: 'option4', disabled: true },
                  ]}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={login}>
                  Login
                </Button>
              </Form.Item>
              <Form.Item></Form.Item>
            </Form>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Text style={{ fontSize: '1rem', color: '#4D4D4D' }}>
                Doesn't have an account yet? &nbsp;
                <Link to="/recruiter/register" style={{ color: '#893DFF' }}>
                  Register
                </Link>
              </Text>
              <br />
            </div>
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={interview_image} width="80%" alt="Interview" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
