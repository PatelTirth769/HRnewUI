import React, { useState } from 'react';
import { Card, Typography, Checkbox, Divider, Button, message } from 'antd';

const { Title, Text } = Typography;

const RecruitmentSettings = () => {
  const [enforceStaffPlanning, setEnforceStaffPlanning] = useState(false);

  const handleSave = () => {
    // Here we can later integrate with a backend API
    console.log("Saving settings. Enforce Staff Planning:", enforceStaffPlanning);
    message.success("Recruitment settings saved successfully.");
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafafa', minHeight: '100%' }}>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} style={{ margin: 0 }}>Recruitment Settings</Title>
        <Button type="primary" onClick={handleSave} style={{ backgroundColor: '#111827' }}>
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
        </div>
        <Divider />
      </Card>
    </div>
  );
};

export default RecruitmentSettings;
