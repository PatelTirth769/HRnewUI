import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Typography, Button, Space } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { collection, query, orderBy, limit, onSnapshot, doc, writeBatch, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    
    // Get push notification status and request function
    const { permissionStatus, requestPermission } = usePushNotifications();

    const userEmail = localStorage.getItem('user');
    const navigate = useNavigate();

    useEffect(() => {
        if (!userEmail) return;
        
        // Listen to top 20 notifications for this user
        const q = query(
            collection(db, 'schooler_system', 'notifications', userEmail),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = [];
            let unread = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                notifs.push({ id: doc.id, ...data });
                if (!data.read) unread++;
            });
            setNotifications(notifs);
            setUnreadCount(unread);
        });

        return () => unsubscribe();
    }, [userEmail]);

    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
    };

    const markAllAsRead = async () => {
        if (!userEmail || unreadCount === 0) return;
        
        const batch = writeBatch(db);
        notifications.forEach((n) => {
            if (!n.read) {
                const ref = doc(db, 'schooler_system', 'notifications', userEmail, n.id);
                batch.update(ref, { read: true });
            }
        });
        
        try {
            await batch.commit();
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const markAsRead = async (id, read) => {
        if (read || !userEmail) return;
        try {
            await writeBatch(db).update(doc(db, 'schooler_system', 'notifications', userEmail, id), { read: true }).commit();
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    const onNotificationClick = (item) => {
        markAsRead(item.id, item.read);
        setOpen(false);
        if (item.clickUrl) {
            navigate(item.clickUrl);
        }
    };

    const getTypeColor = (type) => {
        switch(type) {
            case 'announcement': return '#6366f1';
            case 'homework': return '#ec4899';
            case 'classwork': return '#0ea5e9';
            case 'weekly_plan': return '#10b981';
            default: return '#888';
        }
    };

    const content = (
        <div style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-2 px-2 pt-2">
                <Text strong>Notifications</Text>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={markAllAsRead} icon={<CheckOutlined />}>
                        Mark all as read
                    </Button>
                )}
            </div>

            {permissionStatus === 'default' && (
                <div className="px-2 pb-2">
                    <Button type="primary" size="small" block onClick={requestPermission}>
                        Enable Push Notifications
                    </Button>
                </div>
            )}
            
            <List
                itemLayout="horizontal"
                dataSource={notifications}
                locale={{ emptyText: 'No notifications' }}
                renderItem={(item) => (
                    <List.Item 
                        className={`cursor-pointer hover:bg-gray-50 px-2 transition-colors ${!item.read ? 'bg-blue-50/50' : ''}`}
                        onClick={() => onNotificationClick(item)}
                        style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                        <List.Item.Meta
                            title={
                                <div className="flex justify-between">
                                    <Text strong={!item.read} style={{ color: getTypeColor(item.type) }}>{item.title}</Text>
                                    {!item.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
                                </div>
                            }
                            description={
                                <div className="flex flex-col gap-1">
                                    <Text type="secondary" className="text-sm line-clamp-2">{item.message}</Text>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        {item.createdAt ? dayjs(item.createdAt.toDate()).fromNow() : 'Just now'}
                                    </Text>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={handleOpenChange}
            placement="bottomRight"
            arrow={false}
        >
            <Badge count={unreadCount} size="small" offset={[-2, 4]} className="cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <BellOutlined style={{ fontSize: '18px' }} />
                </div>
            </Badge>
        </Popover>
    );
}
