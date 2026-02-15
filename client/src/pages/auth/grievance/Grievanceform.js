import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloseOutlined, UploadOutlined } from '@ant-design/icons';
import { Form, Input, Button, Typography, notification, Spin, Select, DatePicker } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/auth.jsx';
import api from '../../../utility/api';
import Footer from '../../../Components/footer/Footer';
import logoSmall from '../../../assets/images/logo-small.png';
import UploadFile from '../../../Components/upload/UploadFile';
const { Title } = Typography;

const Grievanceform = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAuth();
  const [datesAndDetails, setDatesAndDetails] = useState([{ date: '', details: '' }]);
  const [grievanceOptions, setGrievanceOptions] = useState([]);

  useEffect(() => {
    if (auth && auth.user) {
      const userId = auth.user._id;
    }
  }, []);

  useEffect(() => {
    const fetchGrievanceOptions = async () => {
      try {
        const response = await api.get('mongo/process-data', {}, false);
        const options = response.data?.processes.map((option) => ({
          value: option.ProcessName,
          label: option.ProcessName,
        }));
        setGrievanceOptions(options);
      } catch (err) {
        console.error(err);
        notification.error({
          message: 'Failed to load grievance types',
        });
      }
    };

    fetchGrievanceOptions();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const url = `mongo/grievances`;
      if (values.attachment) {
        values.attachment = values.attachment.file.response.url;
      }

      const res = await api.post(url, { ...values, datesAndDetails }, {}, false);
      const responseData = res.data;
      if (responseData.success) {
        setTimeout(() => {
          notification.success({
            message: 'Request Submitted successfully',
          });
        }, 1000);
        setLoading(false);
        navigate('/grievance/login');
      } else {
        notification.error({
          message: responseData.message || 'Something went wrong! Please try again',
        });
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Something went wrong!',
      });
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    setDatesAndDetails([...datesAndDetails, { date: '', details: '' }]);
  };

  const handleInputChange = (index, field, value) => {
    const newDatesAndDetails = [...datesAndDetails];
    newDatesAndDetails[index][field] = value;
    setDatesAndDetails(newDatesAndDetails);
  };

  // Function to handle deleting an item
  const handleDelete = (index) => {
    const newDatesAndDetails = [...datesAndDetails];
    newDatesAndDetails.splice(index, 1); // Remove item at the specified index
    setDatesAndDetails(newDatesAndDetails);
  };

  return (
    <div className="page-wrapper">
      <div className="navbar-custom">
        <div>
          <img src={logoSmall} alt="logo" style={{ width: '120px', height: 'auto' }} />
        </div>
        <div className="back-btn-container">
          <Button type="primary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
            Back
          </Button>
        </div>
      </div>
      <div className="page-container w-100">
        <Title
          level={2}
          style={{
            marginBottom: '20px',
            textAlign: 'center',
            color: '#4D4D4D',
          }}
        >
          Grievance Form
        </Title>

        <Form onFinish={onFinish} className="mb-5">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Form.Item
              label="Who is filling?"
              name="whoIsFilling"
              rules={[
                { required: true, message: 'Filler is required' },
                { min: 3, message: 'Name must be at least 3 characters' },
              ]}
              style={{ flex: 1 }}
            >
              <Input type="text" placeholder="Who is filling?" />
            </Form.Item>
            <Form.Item
              label="Against whom?"
              name="againstWhom"
              rules={[
                { required: true, message: 'Filler is required' },
                { min: 3, message: 'Name must be at least 3 characters' },
              ]}
              style={{ flex: 1 }}
            >
              <Input type="text" placeholder="Against whom?" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item
              label="Type of Grievance"
              name="typeOfGrievance"
              rules={[{ required: true, message: 'Type is required' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Type of Grievance"
                style={{ flex: 1 }}
                options={grievanceOptions}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Description is required' },
              {
                min: 10,
                message: 'Description must be at least 10 characters',
              },
            ]}
            style={{ flex: 1 }}
          >
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>
          <Form.Item name="attachment" label="Attachment">
            <UploadFile />
          </Form.Item>
          <label className="text-center" style={{ display: 'block', marginBottom: '10px' }}>
            Details
          </label>
          {datesAndDetails.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                justifyContent: 'start',
                marginBottom: '10px',
              }}
            >
              <Form.Item
                label="Date"
                rules={[{ required: true, message: 'Date is required' }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  placeholder="Select Date"
                  value={item.date}
                  onChange={(date) => handleInputChange(index, 'date', date)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                label="Details"
                rules={[{ required: true, message: 'Details are required' }]}
                style={{ flex: 2 }}
              >
                <Input.TextArea
                  placeholder="Details"
                  value={item.details}
                  onChange={(e) => handleInputChange(index, 'details', e.target.value)}
                  rows={3}
                />
              </Form.Item>

              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleDelete(index)}
                style={{ alignSelf: 'center' }}
              ></Button>
            </div>
          ))}

          <Button
            type="dashed"
            onClick={handleAddMore}
            style={{ marginBottom: '10px', width: '100%' }}
          >
            Add More Detail
          </Button>

          <Form.Item>
            <Button
              className="btn w-100 text-capitalize text-white bg-orange"
              style={{ fontSize: '1rem' }}
              type="primary"
              htmlType="submit"
            >
              Submit Application{'  '}
              {loading && <Spin indicator={<LoadingOutlined spin />} />}
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Footer />
    </div>
  );
};

export default Grievanceform;
