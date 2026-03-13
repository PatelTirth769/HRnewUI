import React, { useState, useEffect } from 'react';
import { Card, Typography, Checkbox, Divider, Button, message, Spin } from 'antd';

const { Title, Text } = Typography;

const RecruitmentSettings = () => {
  const [enforceStaffPlanning, setEnforceStaffPlanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/local-api/recruitment-settings')
      .then(res => res.json())
      .then(data => {
        setEnforceStaffPlanning(!!data.enforceStaffPlanning);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load recruitment settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/local-api/recruitment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enforceStaffPlanning }),
      });
      if (!res.ok) throw new Error('Save failed');
      message.success('Recruitment settings saved successfully.');
    } catch (err) {
      console.error('Error saving recruitment settings:', err);
      message.error('Failed to save recruitment settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafafa', minHeight: '100%' }}>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0 }}>Recruitment Settings</Title>
        <Button type="primary" onClick={handleSave} loading={saving} style={{ backgroundColor: '#111827' }}>
           Save
        </Button>
      </div>
      
      <Card style={{ borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderColor: '#f0f0f0' }}>
        <div className="mb-6">
          <Title level={5}>Staff Planning</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Configure settings associated with staff planning.
          </Text>
          <Checkbox 
             checked={enforceStaffPlanning} 
             onChange={(e) => setEnforceStaffPlanning(e.target.checked)}
          >
             Enforce Staff Planning
          </Checkbox>
          <div style={{ marginTop: '8px', marginLeft: '24px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              If enabled, Job Requisitions and Job Openings can only be created if a matching Staffing Plan exists with available vacancies.
            </Text>
          </div>
        </div>
        <Divider />
      </Card>
    </div>
  );
};

export default RecruitmentSettings;
