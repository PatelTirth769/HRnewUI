import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, VAPID_KEY, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import API from '../services/api';

export function usePushNotifications() {
    const [permissionStatus, setPermissionStatus] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [token, setToken] = useState(null);

    const saveTokenToFirestore = async (currentToken) => {
        const userEmail = localStorage.getItem('user');
        const userRole = localStorage.getItem('userRole') || 'Student';
        if (!userEmail) return;

        try {
            let program = null;
            let board = null;
            let studentGroupIds = [];
            let studentIds = [];
            
            if (userRole === 'Student') {
                const res = await API.get(`/api/resource/Student?filters=[["student_email_id","=","${encodeURIComponent(userEmail)}"]]&fields=["name","program"]`);
                if (res.data?.data?.length > 0) {
                    const studentId = res.data.data[0].name;
                    studentIds.push(studentId);
                    program = res.data.data[0].program;
                    
                    if (program) {
                        try {
                            const progRes = await API.get(`/api/resource/Program/${encodeURIComponent(program)}`);
                            board = progRes.data?.data?.custom_board || null;
                        } catch (e) {}
                    }

                    try {
                        const sgRes = await API.get(`/api/resource/Student Group?filters=[["Student Group Student","student","=","${encodeURIComponent(studentId)}"]]&fields=["name"]`);
                        if (sgRes.data?.data) {
                            studentGroupIds = sgRes.data.data.map(g => g.name);
                        }
                    } catch (e) {}
                }
            } else if (userRole === 'Guardian') {
                const res = await API.get(`/api/resource/Guardian?filters=[["email_address","=","${encodeURIComponent(userEmail)}"]]&fields=["name"]`);
                if (res.data?.data?.length > 0) {
                    const guardianId = res.data.data[0].name;
                    try {
                        const stuRes = await API.get(`/api/resource/Student?filters=[["Student Guardian","guardian","=","${encodeURIComponent(guardianId)}"]]&fields=["name"]`);
                        const sIds = stuRes.data?.data?.map(s => s.name) || [];
                        studentIds = sIds;
                        
                        for (const sId of sIds) {
                            try {
                                const sData = await API.get(`/api/resource/Student/${encodeURIComponent(sId)}`);
                                const p = sData.data?.data?.program;
                                if (p && !program) program = p; 
                                
                                const sgRes = await API.get(`/api/resource/Student Group?filters=[["Student Group Student","student","=","${encodeURIComponent(sId)}"]]&fields=["name"]`);
                                if (sgRes.data?.data) {
                                    studentGroupIds = [...new Set([...studentGroupIds, ...sgRes.data.data.map(g => g.name)])];
                                }
                            } catch (e) {}
                        }
                    } catch (e) {}
                }
            }

            const tokenDocRef = doc(db, 'schooler_system', 'fcm_tokens', 'records', currentToken);
            await setDoc(tokenDocRef, {
                token: currentToken,
                userEmail,
                role: userRole,
                program,
                board,
                studentIds,
                studentGroupIds,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error('[PushNotif] Failed to save FCM token:', e);
        }
    };

    const requestPermission = async () => {
        if (!messaging) return false;
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission === 'granted') {
                const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
                if (currentToken) {
                    setToken(currentToken);
                    await saveTokenToFirestore(currentToken);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('[PushNotif] Error requesting permission', error);
            return false;
        }
    };

    useEffect(() => {
        if (permissionStatus === 'granted' && !token && messaging) {
            requestPermission();
        }
    }, [permissionStatus, token]);

    return { permissionStatus, requestPermission, token };
}
