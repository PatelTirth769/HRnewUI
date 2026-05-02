import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notification, Table, Switch, Spin } from 'antd';
import { FiSlash, FiCheckCircle } from 'react-icons/fi';

const RESTRICTIONS_PATH = 'schooler_system/enquiry_management/class_restrictions';
const CLASSES = [
    'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
];


export default function ClassRestrictionSetup() {
    const [restrictions, setRestrictions] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRestrictions();
    }, []);

    const fetchRestrictions = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, RESTRICTIONS_PATH));
            const data = {};
            snap.docs.forEach(d => {
                data[d.id] = d.data().isDisabled;
            });
            setRestrictions(data);
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to load restrictions' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (className, checked) => {
        try {
            await setDoc(doc(db, RESTRICTIONS_PATH, className), {
                isDisabled: checked,
                updated_at: new Date().toISOString()
            }, { merge: true });
            
            setRestrictions(prev => ({ ...prev, [className]: checked }));
            notification.success({ 
                message: `Class ${className} ${checked ? 'Disabled' : 'Enabled'}`,
                description: `Enquiries for ${className} are now ${checked ? 'restricted' : 'active'}.`
            });
        } catch (err) {
            notification.error({ message: 'Update failed' });
        }
    };

    const columns = [
        {
            title: 'Class Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-bold text-gray-700 uppercase tracking-wide">{text}</span>
        },
        {
            title: 'Disable for Enquiry',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <div className="flex items-center justify-end gap-3">
                    <span className={`text-[11px] font-black ${restrictions[record.name] ? 'text-red-500' : 'text-gray-400'}`}>
                        {restrictions[record.name] ? 'YES' : 'NO'}
                    </span>
                    <Switch 
                        checked={restrictions[record.name] || false} 
                        onChange={(checked) => handleToggle(record.name, checked)}
                        className={restrictions[record.name] ? 'bg-red-500' : 'bg-gray-300'}
                    />
                </div>
            )
        }
    ];

    const dataSource = CLASSES.map(c => ({ key: c, name: c }));

    return (
        <div className="p-6 max-w-[1000px] mx-auto font-inter">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Class Restriction Setup</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span className="text-blue-600 font-bold">Class Restriction Setup</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-1 bg-red-500"></div> {/* Top accent bar */}
                {loading ? (
                    <div className="p-20 text-center"><Spin size="large" /></div>
                ) : (
                    <Table 
                        dataSource={dataSource} 
                        columns={columns} 
                        pagination={false}
                        className="custom-restriction-table"
                    />
                )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1"><FiCheckCircle /></div>
                <div>
                    <p className="text-sm font-bold text-blue-800 uppercase">Automatic Enforcement</p>
                    <p className="text-[12px] text-blue-600 leading-relaxed">
                        Classes marked as <b>YES</b> will be automatically hidden from the "Enquiry Class" dropdown in the Enquiry form. 
                        Use this to control intake when a specific class reaches its maximum capacity.
                    </p>
                </div>
            </div>
        </div>
    );
}
