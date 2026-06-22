import React, { useState, useEffect } from 'react';
import { Card, Typography, Switch, notification, Spin } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { Title, Text } = Typography;

const DashboardFeesManage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enableFees, setEnableFees] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'schooler_system', 'dashboard_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEnableFees(docSnap.data().ENABLE_ONLINE_FEE_PAYMENT === true);
                }
            } catch (error) {
                console.error("Error fetching dashboard settings:", error);
                notification.error({ message: "Error loading settings" });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async (checked) => {
        setEnableFees(checked);
        setSaving(true);
        try {
            const docRef = doc(db, 'schooler_system', 'dashboard_settings');
            await setDoc(docRef, { ENABLE_ONLINE_FEE_PAYMENT: checked }, { merge: true });
            notification.success({ 
                message: "Settings Updated", 
                description: `Dashboard Fees tab has been ${checked ? 'enabled' : 'disabled'} for students and guardians.` 
            });
        } catch (error) {
            console.error("Error updating dashboard settings:", error);
            notification.error({ message: "Failed to update settings" });
            setEnableFees(!checked); // Revert on failure
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh]"><Spin size="large" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <Card className="rounded-2xl shadow-sm border-gray-100">
                <div className="flex flex-col gap-6">
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Dashboard Fees Manage</Title>
                        <Text type="secondary">
                            Control the visibility of the Fees tab across Student and Guardian dashboards.
                        </Text>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <div className="font-semibold text-lg text-gray-800">Enable Online Fee Payment Tab</div>
                            <div className="text-gray-500 text-sm mt-1">
                                When enabled, students and guardians will see the "Fees" tab and can make payments.
                            </div>
                        </div>
                        <Switch 
                            checked={enableFees} 
                            onChange={handleToggle} 
                            loading={saving}
                            className={enableFees ? "bg-blue-600" : "bg-gray-300"}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DashboardFeesManage;
