import { useState, useEffect } from 'react';
import API from '../services/api';
import { useUserRole } from './useUserRole';
import { fetchInstructorGroupDetails } from '../utility/instructorHelper';

export function useInstructorGroups() {
    const { isInstructor } = useUserRole();
    const [instructorData, setInstructorData] = useState({
        studentGroups: [],
        programs: [],
        studentIds: [],
        studentMobiles: [],
        studentNames: [],
        loading: false
    });

    useEffect(() => {
        if (!isInstructor) return;
        
        let active = true;

        const fetchInstructorGroups = async () => {
            setInstructorData(prev => ({ ...prev, loading: true }));
            try {
                const userEmail = localStorage.getItem('user') || '';
                if (!userEmail) {
                    if (active) setInstructorData(prev => ({ ...prev, loading: false }));
                    return;
                }

                // 1. Get instructor ID from their email
                const instRes = await API.get(`/api/resource/Instructor?filters=[["instructor_email","=","${userEmail}"]]&fields=["name"]`);
                const instructorId = instRes.data?.data?.[0]?.name;
                if (!instructorId) {
                    console.warn('No instructor found for email:', userEmail);
                    if (active) setInstructorData(prev => ({ ...prev, loading: false }));
                    return;
                }

                // 2. Use our centralized helper
                const groupDetails = await fetchInstructorGroupDetails(instructorId);

                if (!active) return;

                const uniqueGroupNames = groupDetails.allGroups.map(g => g.name);
                const programsSet = new Set(groupDetails.allPrograms);
                const studentIds = groupDetails.studentIds;
                
                let studentMobiles = [];
                let studentNames = [];

                // 3. Fetch student details (mobile, name) for matching
                if (studentIds.length > 0) {
                    const studentDetailsRes = await API.get(`/api/resource/Student?filters=[["name","in",${JSON.stringify(studentIds)}]]&fields=["name","student_name","student_mobile_number","student_email_id"]&limit_page_length=None`);
                    const studentDetails = studentDetailsRes.data?.data || [];
                    studentMobiles = studentDetails.map(s => s.student_mobile_number).filter(Boolean);
                    studentNames = studentDetails.map(s => s.student_name).filter(Boolean);
                }

                if (active) {
                    setInstructorData({
                        studentGroups: uniqueGroupNames,
                        programs: Array.from(programsSet),
                        studentIds: studentIds,
                        studentMobiles: studentMobiles,
                        studentNames: studentNames,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Failed to load instructor groups/students:', error);
                if (active) {
                    setInstructorData(prev => ({ ...prev, loading: false }));
                }
            }
        };

        fetchInstructorGroups();

        return () => {
            active = false;
        };
    }, [isInstructor]);

    return instructorData;
}
