import React, { useEffect, useState } from 'react';
import { Card, Col, Row, message, Button, Spin, Timeline, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../../utility/api';
import { useAuth } from '../../../context/auth.jsx';
import { LogoutOutlined } from '@ant-design/icons';
import logoSmall from '../../../assets/images/logo-small.png';
import Footer from '../../../Components/footer/Footer';

const { Header, Content } = Layout;

const GrievanceDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [auth, setAuth] = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`mongo/grievances`, {}, false);
      setData(response.data.data);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch grievances');
      setLoading(false);
    }
  };

  const handleSubmitRequest = () => {
    navigate('/grievance/form');
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('isLogged');
    localStorage.removeItem('userData');
    navigate('/grievance/login');
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: '#001529', padding: '0 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <img src={logoSmall} alt="logo" style={{ width: '120px', height: 'auto' }} />
          <h1 style={{ color: '#fff', textAlign: 'center', margin: 0 }}>Grievance Dashboard</h1>
          <div>
            <Button
              type="primary"
              onClick={handleSubmitRequest}
              style={{
                marginRight: '10px',
              }}
            >
              Submit Request
            </Button>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Header>
      <Content style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {data.map((grievance) => (
              <Col xs={24} sm={12} md={8} key={grievance._id}>
                <Card title={grievance.typeOfGrievance} bordered={false} hoverable>
                  <p>
                    <strong>Status:</strong> {grievance.status}
                  </p>
                  <p>
                    <strong>Filed By:</strong> {grievance.whoIsFilling}
                  </p>
                  <p>
                    <strong>Against:</strong> {grievance.againstWhom}
                  </p>
                  <p>
                    <strong>Description:</strong> {grievance.description}
                  </p>

                  <p>
                    <strong>Attachment:</strong>{' '}
                    <a href={grievance.attachment} target="_blank" rel="noopener noreferrer">
                      View Attachment
                    </a>
                  </p>
                  <p>
                    <strong>Dates and Details:</strong>
                  </p>
                  <Timeline>
                    {grievance.datesAndDetails.map((detail, index) => (
                      <Timeline.Item key={index}>
                        <p>
                          <strong>Date:</strong> {new Date(detail.date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Details:</strong> {detail.details}
                        </p>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>
      <Footer />
    </Layout>
  );
};

export default GrievanceDashboard;
