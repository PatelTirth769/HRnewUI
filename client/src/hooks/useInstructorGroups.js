import { useState, useEffect } from 'react';
import API from '../services/api';
import { useUserRole } from './useUserRole';

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

                // 2. Fetch student groups (Class teacher or Subject teacher)
                const [sgCtRes, sgStRes] = await Promise.all([
                    API.get(`/api/resource/Student Group?filters=[["custom_class_teacher","=","${instructorId}"]]&fields=["name","program"]&limit_page_length=None`),
                    API.get(`/api/resource/Student Group?filters=[["Student Group Instructor","instructor","=","${instructorId}"]]&fields=["name","program"]&limit_page_length=None`)
                ]);

                if (!active) return;

                const groupsMap = new Map();
                const programsSet = new Set();

                const addGroup = (sg) => {
                    groupsMap.set(sg.name, sg);
                    if (sg.program) programsSet.add(sg.program);
                };

                (sgCtRes.data?.data || []).forEach(addGroup);
                (sgStRes.data?.data || []).forEach(addGroup);

                const uniqueGroups = Array.from(groupsMap.values());
                const uniqueGroupNames = uniqueGroups.map(g => g.name);

                // 3. Fetch details for each group to get student IDs
                const studentIdsSet = new Set();
                await Promise.all(uniqueGroupNames.map(async (groupName) => {
                    try {
                        const detailRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(groupName)}`);
                        const students = detailRes.data?.data?.students || [];
                        students.forEach(s => {
                            if (s.student) studentIdsSet.add(s.student);
                        });
                    } catch (err) {
                        console.error('Error fetching student group details:', groupName, err);
                    }
                }));

                if (!active) return;

                const studentIds = Array.from(studentIdsSet);
                let studentMobiles = [];
                let studentNames = [];

                // 4. Fetch student details (mobile, name) for matching
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
