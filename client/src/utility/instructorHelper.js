import API from '../services/api';

/**
 * Resolves the logged-in user's Instructor document ID (primary key name) from ERPNext
 * using their user email.
 * @param {string} userEmail 
 * @returns {Promise<string|null>}
 */
export async function resolveInstructorId(userEmail) {
    if (!userEmail) return null;
    try {
        // Stage 0: Direct match on instructor_email field
        const emailRes = await API.get(`/api/resource/Instructor?filters=[["instructor_email","=","${userEmail}"]]&fields=["name"]`);
        if (emailRes.data.data?.[0]) return emailRes.data.data[0].name;
    } catch (e) {
        console.log("Lookup by instructor_email failed:", e.message);
    }

    try {
        // Stage 1: Try nested filter on employee.user_id
        const nestedRes = await API.get(`/api/resource/Instructor?filters=[["employee.user_id","=","${userEmail}"]]&fields=["name"]`);
        if (nestedRes.data.data?.[0]) return nestedRes.data.data[0].name;
    } catch (e) {
        console.log("Nested filter failed:", e.message);
    }

    // Stage 2: Try direct match on prefix variations
    const emailPrefix = userEmail.split('@')[0];
    const nameWithSpace = emailPrefix.length > 3 ? emailPrefix.slice(0, 3) + " " + emailPrefix.slice(3) : emailPrefix;
    for (const term of [emailPrefix, nameWithSpace]) {
        try {
            const res = await API.get(`/api/resource/Instructor?filters=[["name","=","${term}"]]&fields=["name"]`);
            if (res.data.data?.[0]) return res.data.data[0].name;

            const resName = await API.get(`/api/resource/Instructor?filters=[["instructor_name","=","${term}"]]&fields=["name"]`);
            if (resName.data.data?.[0]) return resName.data.data[0].name;
        } catch (e) {
            console.log(`Search for ${term} failed:`, e.message);
        }
    }

    try {
        // Stage 3: Try finding employee by user_id
        const empRes = await API.get(`/api/resource/Employee?filters=[["user_id","=","${userEmail}"]]&fields=["name"]`);
        const employeeName = empRes.data.data?.[0]?.name;
        if (employeeName) {
            const insRes = await API.get(`/api/resource/Instructor?filters=[["employee","=","${employeeName}"]]&fields=["name"]`);
            if (insRes.data.data?.[0]) return insRes.data.data[0].name;
        }
    } catch (e) {
        console.log("Employee search failed:", e.message);
    }

    return null;
}

/**
 * Fetches all Student Group names and details associated with the given instructor ID
 * (both where they are Class Teacher or Subject Teacher).
 * @param {string} instructorId 
 * @returns {Promise<{
 *   classTeacherGroups: Array<{name: string, student_group_name: string, program: string}>,
 *   subjectTeacherGroups: Array<{name: string, student_group_name: string, program: string}>,
 *   allGroups: Array<{name: string, student_group_name: string, program: string}>,
 *   allPrograms: Array<string>,
 *   studentIds: Array<string>
 * }>}
 */
export async function fetchInstructorGroupDetails(instructorId) {
    if (!instructorId) {
        return { classTeacherGroups: [], subjectTeacherGroups: [], allGroups: [], allPrograms: [], studentIds: [] };
    }

    try {
        // Fetch groups where Class Teacher
        const ctRes = await API.get(`/api/resource/Student Group?filters=[["custom_class_teacher","=","${instructorId}"]]&fields=["name","student_group_name","program"]&limit_page_length=None`);
        const classTeacherGroups = ctRes.data.data || [];

        // Fetch groups where Subject Teacher
        const stRes = await API.get(`/api/resource/Student Group?filters=[["Student Group Instructor","instructor","=","${instructorId}"]]&fields=["name","student_group_name","program"]&limit_page_length=None`);
        const subjectTeacherGroups = stRes.data.data || [];

        // Merge groups uniquely
        const mergedMap = new Map();
        [...classTeacherGroups, ...subjectTeacherGroups].forEach(g => mergedMap.set(g.name, g));
        const allGroups = Array.from(mergedMap.values());

        // Unique program names
        const allPrograms = Array.from(new Set(allGroups.map(g => g.program).filter(Boolean)));

        // Fetch student IDs in parallel for each group
        const groupDetailPromises = allGroups.map(g => API.get(`/api/resource/Student Group/${encodeURIComponent(g.name)}`));
        const groupDetails = await Promise.all(groupDetailPromises);
        const studentIds = Array.from(new Set(
            groupDetails.flatMap(res => (res.data.data?.students || []).map(s => s.student).filter(Boolean))
        ));

        return {
            classTeacherGroups,
            subjectTeacherGroups,
            allGroups,
            allPrograms,
            studentIds
        };
    } catch (err) {
        console.error("Error fetching instructor group details:", err);
        return { classTeacherGroups: [], subjectTeacherGroups: [], allGroups: [], allPrograms: [], studentIds: [] };
    }
}
