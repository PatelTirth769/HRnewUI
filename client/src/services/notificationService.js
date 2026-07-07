import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Triggers a push notification fan-out by writing to the pending triggers collection.
 * 
 * @param {Object} payload 
 * @param {string} payload.type - 'announcement', 'homework', 'classwork', 'weekly_plan'
 * @param {string} payload.title - Notification title
 * @param {string} payload.message - Notification body
 * @param {string} payload.targetType - 'All', 'Board', 'Program', 'StudentGroup', 'Student'
 * @param {string|Array} payload.targetValue - The value to match (e.g. board name, program name, array of student IDs)
 * @param {string} payload.clickUrl - The URL to open when clicked
 */
export const triggerNotification = async (payload) => {
    try {
        const ref = collection(db, 'schooler_system', 'notification_triggers', 'pending');
        await addDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
            createdBy: localStorage.getItem('user') || 'system',
            status: 'pending'
        });
        console.log('[NotificationService] Trigger saved successfully');
    } catch (e) {
        console.error('[NotificationService] Failed to save trigger', e);
    }
};
