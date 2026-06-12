import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Checkbox, Input, notification, Alert, Progress, Popconfirm } from 'antd';
import { 
    ArrowLeftOutlined, 
    SearchOutlined, 
    CheckCircleOutlined, 
    PlusOutlined, 
    InfoCircleOutlined, 
    DeleteOutlined, 
    SaveOutlined,
    BookOutlined
} from '@ant-design/icons';
import API from '../../services/api';

// Subject Presets mapped from Excel Sheet
const SUBJECT_PRESETS = [
    {
        id: 'std_1_2',
        name: 'Std. 1 & 2',
        subjects: ['English', 'Maths', 'EVS', 'Hindi', 'Gujarati', 'Computer', 'G.K.', 'Dance', 'Sports', 'Game', 'Drawing', 'Library', 'R.W.', 'Art', 'Assembly', 'W.T.', 'Yoga', 'CCA', 'CLUB']
    },
    {
        id: 'std_3_5',
        name: 'Std. 3 - 5',
        subjects: ['English', 'Maths', 'EVS', 'Hindi', 'Gujarati', 'Computer', 'G.K.', 'Dance', 'Sports', 'Game', 'Drawing', 'Library', 'R.W.', 'Robotics', 'Assembly', 'W.T.', 'Yoga', 'CCA', 'CLUB']
    },
    {
        id: 'std_6_8',
        name: 'Std. 6 - 8',
        subjects: ['English', 'Maths', 'Science', 'S.S.', 'Hindi', 'Gujarati', 'Computer', 'Skill', 'G.K.', 'Robotics', 'Dance', 'Sports', 'Game', 'Library', 'Assembly', 'W.T.', 'Yoga', 'CCA', 'CLUB']
    },
    {
        id: 'std_9',
        name: 'Std. 9',
        subjects: ['English', 'Maths', 'Science', 'S.S.', 'Gujarati', 'Computer', 'Dance', 'Sports', 'Game', 'Library', 'Skill', 'Art', 'Assembly', 'W.T.', 'Yoga', 'CCA', 'CLUB']
    },
    {
        id: 'std_10',
        name: 'Std. 10',
        subjects: ['English', 'Maths', 'Science', 'S.S.', 'Hindi', 'Gujarati', 'Computer', 'Game', 'W.T.', 'Yoga']
    },
    {
        id: 'std_11_12_sci',
        name: 'Std. 11 & 12 Science',
        subjects: ['Maths', 'Bio', 'Chemistry', 'Physics', 'English', 'P.E.', 'CS', 'Library']
    },
    {
        id: 'std_11_12_comm',
        name: 'Std. 11 & 12 Commerce',
        subjects: ['Accountancy', 'Economics', 'B.St.', 'English', 'P.E.', 'CS', 'Library']
    },
    {
        id: 'std_11_12_hum',
        name: 'Std. 11 & 12 Humanities',
        subjects: ['Sociology', 'Economics', 'Political Science', 'English', 'P.E.', 'CS', 'Library']
    }
];

const ClasswiseSubjectAllocationTool = () => {
    const navigate = useNavigate();

    // Data lists from ERPNext
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [companies, setCompanies] = useState([]);
    
    // UI state
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchProgram, setSearchProgram] = useState('');
    const [searchCourse, setSearchCourse] = useState('');
    const [filterBoard, setFilterBoard] = useState('All');
    const [newCourseName, setNewCourseName] = useState('');
    const [creatingCourse, setCreatingCourse] = useState(false);

    // Bulk selection state
    const [selectedPrograms, setSelectedPrograms] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [activePreset, setActivePreset] = useState(null);

    // Active inspection class state (for single class editing/unassigning)
    const [activeProgram, setActiveProgram] = useState(null);
    const [activeProgramCourses, setActiveProgramCourses] = useState([]);
    const [loadingActiveCourses, setLoadingActiveCourses] = useState(false);
    const [savingActiveCourses, setSavingActiveCourses] = useState(false);

    // Logs and progress
    const [missingSubjects, setMissingSubjects] = useState([]);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressStatus, setProgressStatus] = useState('normal'); // 'normal', 'active', 'success', 'exception'
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [progRes, courseRes, companyRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name","program_abbreviation","department","custom_board"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Course?fields=["name","course_name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc')
            ]);
            setPrograms(progRes.data.data || []);
            setCourses(courseRes.data.data || []);
            setCompanies((companyRes.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Error fetching data:', err);
            notification.error({
                message: 'Fetch Failed',
                description: 'Failed to load Programs or Courses from ERPNext.'
            });
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch courses currently assigned to a specific active program
    const handleSelectProgram = async (programName) => {
        setActiveProgram(programName);
        setLoadingActiveCourses(true);
        try {
            const res = await API.get(`/api/resource/Program/${encodeURIComponent(programName)}`);
            const currentCourses = res.data.data.courses || [];
            setActiveProgramCourses(currentCourses.map(c => ({
                course: c.course,
                course_name: c.course_name || c.course || '',
                mandatory: c.mandatory,
                name: c.name // child record name in ERPNext
            })));
        } catch (err) {
            console.error('Error fetching program courses:', err);
            notification.error({
                message: 'Failed to fetch current subjects',
                description: err.message
            });
        } finally {
            setLoadingActiveCourses(false);
        }
    };

    // Remove subject from active class list locally (before saving)
    const handleRemoveActiveCourse = (courseId) => {
        setActiveProgramCourses(prev => prev.filter(c => c.course !== courseId));
    };

    // Save modifications to the active program's subjects (unassign action)
    const handleSaveActiveCourses = async () => {
        if (!activeProgram) return;

        setSavingActiveCourses(true);
        try {
            // Fetch original details to preserve fields like department & abbreviation
            const res = await API.get(`/api/resource/Program/${encodeURIComponent(activeProgram)}`);
            const origDoc = res.data.data;

            const payload = {
                program_name: origDoc.name,
                program_abbreviation: origDoc.program_abbreviation,
                department: origDoc.department || null,
                courses: activeProgramCourses.map(c => ({
                    course: c.course,
                    mandatory: c.mandatory ? 1 : 0
                }))
            };

            await API.put(`/api/resource/Program/${encodeURIComponent(activeProgram)}`, payload);
            
            notification.success({
                message: 'Class Updated',
                description: `Successfully updated subjects for "${activeProgram}". Removed unassigned subjects.`
            });

            // Reload details
            handleSelectProgram(activeProgram);
        } catch (err) {
            console.error('Error saving class subjects:', err);
            notification.error({
                message: 'Failed to update class subjects',
                description: err.response?.data?._server_messages || err.message
            });
        } finally {
            setSavingActiveCourses(false);
        }
    };

    // Auto-match preset strings to actual ERP Course records
    const applyPreset = (presetId) => {
        const preset = SUBJECT_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        setActivePreset(presetId);
        setLogs([]);
        setProgressPercent(0);

        // Find course matches (case-insensitive fuzzy match)
        const matchedCourseNames = [];
        const unmatchedNames = [];

        preset.subjects.forEach(subjectName => {
            const cleanSub = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const foundCourse = courses.find(c => {
                const cleanName = (c.course_name || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return cleanName === cleanSub || cleanName.includes(cleanSub) || cleanSub.includes(cleanName);
            });

            if (foundCourse) {
                matchedCourseNames.push(foundCourse.name);
            } else {
                unmatchedNames.push(subjectName);
            }
        });

        setSelectedCourses(matchedCourseNames);
        setMissingSubjects(unmatchedNames);

        // Auto-select programs that match the preset standard name
        const cleanPresetName = preset.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedPrograms = programs.filter(p => {
            const cleanProgName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanPresetName.includes('std12') || cleanPresetName.includes('std1')) {
                return cleanProgName.includes('std1') || cleanProgName.includes('std2') || cleanProgName.includes('standard1') || cleanProgName.includes('standard2');
            }
            if (cleanPresetName.includes('std35')) {
                return cleanProgName.includes('std3') || cleanProgName.includes('std4') || cleanProgName.includes('std5');
            }
            if (cleanPresetName.includes('std68')) {
                return cleanProgName.includes('std6') || cleanProgName.includes('std7') || cleanProgName.includes('std8');
            }
            if (cleanPresetName.includes('std9')) {
                return cleanProgName.includes('std9') && !cleanProgName.includes('std10');
            }
            if (cleanPresetName.includes('std10')) {
                return cleanProgName.includes('std10');
            }
            if (cleanPresetName.includes('science')) {
                return (cleanProgName.includes('11') || cleanProgName.includes('12')) && (cleanProgName.includes('sci') || cleanProgName.includes('science'));
            }
            if (cleanPresetName.includes('commerce')) {
                return (cleanProgName.includes('11') || cleanProgName.includes('12')) && (cleanProgName.includes('com') || cleanProgName.includes('commerce'));
            }
            if (cleanPresetName.includes('humanities')) {
                return (cleanProgName.includes('11') || cleanProgName.includes('12')) && (cleanProgName.includes('hum') || cleanProgName.includes('arts') || cleanProgName.includes('humanities'));
            }
            return false;
        }).map(p => p.name);

        setSelectedPrograms(matchedPrograms);

        // If exactly one program was matched, set it as active class to show its subjects too
        if (matchedPrograms.length === 1) {
            handleSelectProgram(matchedPrograms[0]);
        } else if (matchedPrograms.length > 0) {
            // Otherwise inspect the first one
            handleSelectProgram(matchedPrograms[0]);
        }

        if (unmatchedNames.length > 0) {
            notification.warning({
                message: 'Missing Subjects',
                description: `${unmatchedNames.length} subjects in this preset do not exist in ERPNext yet. You can auto-create them below.`,
                duration: 6
            });
        } else {
            notification.success({
                message: 'Preset Applied',
                description: `All ${preset.subjects.length} subjects mapped successfully to ERPNext. Matched ${matchedPrograms.length} classes.`
            });
        }
    };

    // Auto-create missing preset subjects in ERPNext
    const autoCreateMissingSubjects = async () => {
        if (missingSubjects.length === 0) return;
        setCreatingCourse(true);
        setLogs(prev => [...prev, `Starting bulk creation of missing subjects in ERPNext...`]);

        try {
            const newlyCreated = [];
            for (const subName of missingSubjects) {
                setLogs(prev => [...prev, `Creating Course: "${subName}"...`]);
                const payload = { course_name: subName };
                const res = await API.post('/api/resource/Course', payload);
                newlyCreated.push({
                    name: res.data.data.name,
                    course_name: subName
                });
                setLogs(prev => [...prev, `✓ Created Course "${subName}" in ERPNext.`]);
            }

            // Refresh courses list
            const courseRes = await API.get('/api/resource/Course?fields=["name","course_name"]&limit_page_length=None&order_by=name asc');
            const updatedCourses = courseRes.data.data || [];
            setCourses(updatedCourses);

            // Re-apply selection for the newly created courses
            const newSelections = [...selectedCourses, ...newlyCreated.map(nc => nc.name)];
            setSelectedCourses(newSelections);
            setMissingSubjects([]);

            setLogs(prev => [...prev, `✓ Bulk subject creation completed successfully.`]);
            notification.success({
                message: 'Subjects Created',
                description: `Successfully created ${newlyCreated.length} subjects in ERPNext.`
            });
        } catch (err) {
            console.error('Error creating subjects:', err);
            setLogs(prev => [...prev, `✕ Error creating subjects: ${err.message}`]);
            notification.error({
                message: 'Creation Failed',
                description: err.response?.data?._server_messages || err.message
            });
        } finally {
            setCreatingCourse(false);
        }
    };

    // Quick add a single subject
    const quickCreateSubject = async () => {
        if (!newCourseName.trim()) {
            notification.warning({ message: 'Subject name is required.' });
            return;
        }
        setCreatingCourse(true);
        try {
            const payload = { course_name: newCourseName.trim() };
            const res = await API.post('/api/resource/Course', payload);
            const newCourse = res.data.data;
            
            notification.success({
                message: 'Subject Created',
                description: `Subject "${newCourse.name}" registered in ERPNext successfully.`
            });

            // Refresh list
            const courseRes = await API.get('/api/resource/Course?fields=["name","course_name"]&limit_page_length=None&order_by=name asc');
            const updatedCourses = courseRes.data.data || [];
            setCourses(updatedCourses);

            // Auto-check the newly created subject
            setSelectedCourses(prev => [...prev, newCourse.name]);
            setNewCourseName('');
        } catch (err) {
            console.error('Error creating single subject:', err);
            notification.error({
                message: 'Failed to Create Subject',
                description: err.response?.data?._server_messages || err.message
            });
        } finally {
            setCreatingCourse(false);
        }
    };

    // Bulk Allocation implementation
    const handleAssignSubjects = async () => {
        if (selectedPrograms.length === 0) {
            notification.warning({ message: 'No classes selected.', description: 'Please check at least one target class.' });
            return;
        }
        if (selectedCourses.length === 0) {
            notification.warning({ message: 'No subjects selected.', description: 'Please check at least one subject to assign.' });
            return;
        }

        const confirmMsg = `This will assign ${selectedCourses.length} subjects to ${selectedPrograms.length} classes. Existing subjects on these classes will be preserved. Proceed?`;
        if (!window.confirm(confirmMsg)) return;

        setSaving(true);
        setProgressStatus('active');
        setProgressPercent(0);
        setLogs([]);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < selectedPrograms.length; i++) {
            const programName = selectedPrograms[i];
            setLogs(prev => [...prev, `[${i + 1}/${selectedPrograms.length}] Fetching class details for: "${programName}"...`]);

            try {
                // Fetch Program document
                const res = await API.get(`/api/resource/Program/${encodeURIComponent(programName)}`);
                const programDoc = res.data.data;

                const currentCourses = programDoc.courses || [];
                const updatedCourses = [...currentCourses];

                selectedCourses.forEach(courseId => {
                    const exists = currentCourses.some(c => c.course === courseId);
                    if (!exists) {
                        updatedCourses.push({
                            course: courseId,
                            mandatory: 1
                        });
                    }
                });

                const payload = {
                    program_name: programDoc.name,
                    program_abbreviation: programDoc.program_abbreviation,
                    department: programDoc.department || null,
                    courses: updatedCourses.map(c => ({
                        course: c.course,
                        mandatory: c.mandatory ? 1 : 0
                    }))
                };

                await API.put(`/api/resource/Program/${encodeURIComponent(programName)}`, payload);
                successCount++;
                setLogs(prev => [...prev, `✓ Success: Assigned to "${programName}".`]);
            } catch (err) {
                console.error(`Error assigning to ${programName}:`, err);
                failCount++;
                setLogs(prev => [...prev, `✕ Failed: Could not assign to "${programName}". Reason: ${err.message}`]);
            }

            const percent = Math.round(((i + 1) / selectedPrograms.length) * 100);
            setProgressPercent(percent);
        }

        setSaving(false);
        if (failCount === 0) {
            setProgressStatus('success');
            notification.success({
                message: 'Allocation Completed',
                description: `Successfully allocated subjects to all ${successCount} classes.`
            });
            setLogs(prev => [...prev, `🎉 Subject allocation finished successfully.`]);
            
            // Reload active inspected program to show updated subject list
            if (activeProgram) {
                handleSelectProgram(activeProgram);
            }
        } else {
            setProgressStatus('exception');
            notification.warning({
                message: 'Allocation Completed with errors',
                description: `Updated ${successCount} classes. Failed for ${failCount} classes.`
            });
        }
    };

    // Filter helpers
    const filteredPrograms = programs.filter(p => {
        const query = searchProgram.toLowerCase();
        const matchSearch = (p.name || '').toLowerCase().includes(query) || (p.program_abbreviation || '').toLowerCase().includes(query);
        const matchBoard = filterBoard === 'All' || p.custom_board === filterBoard;
        return matchSearch && matchBoard;
    });

    const filteredCourses = courses.filter(c => {
        const query = searchCourse.toLowerCase();
        return (c.name || '').toLowerCase().includes(query) || (c.course_name || '').toLowerCase().includes(query);
    });

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Header section */}
            <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <ArrowLeftOutlined className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Classwise Subject Allocation Tool</h1>
                        <p className="text-sm text-gray-400 mt-1">Bulk-allocate or manage standard-wise subject courses for your school</p>
                    </div>
                </div>
                <Button 
                    className="h-10 px-5 text-[13px] font-semibold bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 rounded"
                    onClick={fetchData}
                    disabled={loadingData || saving}
                >
                    ⟳ Refresh Data
                </Button>
            </div>

            {loadingData ? (
                <Card className="rounded-xl border-gray-200 text-center py-20">
                    <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 font-semibold italic text-sm">Fetching classes and subjects from ERPNext...</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Top Preset Card */}
                    <Card className="rounded-xl border-gray-200 shadow-sm" title={<span className="text-gray-700 font-bold text-[13px] uppercase tracking-wider">Step 1: Apply Standard Presets</span>}>
                        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                            <InfoCircleOutlined className="text-blue-500" />
                            <span>Select a standard to auto-select standard-wise subjects. Click any class in the list below to view or edit its current subjects.</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {SUBJECT_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    className={`px-4 py-2 text-sm font-semibold border rounded-lg transition-all ${
                                        activePreset === p.id 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => applyPreset(p.id)}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>

                        {missingSubjects.length > 0 && (
                            <Alert
                                className="mt-6 rounded-lg border-amber-200 bg-amber-50"
                                type="warning"
                                showIcon
                                message={
                                    <div>
                                        <p className="font-bold text-amber-800 text-[13px] mb-1">Missing Subjects in ERPNext</p>
                                        <p className="text-[12px] text-amber-700 mb-3">
                                            The following subjects in this preset are not found in your ERP: <strong>{missingSubjects.join(', ')}</strong>.
                                        </p>
                                        <Button
                                            type="primary"
                                            size="small"
                                            className="bg-amber-600 border-amber-600 hover:bg-amber-700 rounded font-semibold text-xs h-7"
                                            onClick={autoCreateMissingSubjects}
                                            loading={creatingCourse}
                                        >
                                            Auto-Create Missing Subjects in ERP
                                        </Button>
                                    </div>
                                }
                            />
                        )}
                    </Card>

                    {/* Three-Column Responsive Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* Column 1: Classes (Programs) - span 4 */}
                        <div className="md:col-span-4">
                            <Card 
                                className="rounded-xl border-gray-200 shadow-sm flex flex-col h-[550px]"
                                bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 20 }}
                                title={
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-bold text-[13px] uppercase tracking-wider">Classes (Programs)</span>
                                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{selectedPrograms.length} checked</span>
                                    </div>
                                }
                            >
                                <div className="mb-4 flex flex-col gap-2">
                                    <select 
                                        value={filterBoard} 
                                        onChange={e => setFilterBoard(e.target.value)} 
                                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 h-9 text-sm focus:outline-none focus:border-blue-400 bg-white"
                                    >
                                        <option value="All">All Boards</option>
                                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Search classes..."
                                            prefix={<SearchOutlined className="text-gray-400" />}
                                            value={searchProgram}
                                            onChange={e => setSearchProgram(e.target.value)}
                                            className="rounded-lg h-9 border-gray-200"
                                        />
                                        <Button 
                                            className="text-xs font-semibold h-9"
                                            onClick={() => setSelectedPrograms(filteredPrograms.map(p => p.name))}
                                        >
                                            All
                                        </Button>
                                        <Button 
                                            className="text-xs font-semibold h-9"
                                            onClick={() => { setSelectedPrograms([]); setActivePreset(null); }}
                                        >
                                            None
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50 space-y-2">
                                    {filteredPrograms.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 italic text-sm">No classes found</div>
                                    ) : (
                                        filteredPrograms.map(p => (
                                            <div 
                                                key={p.name}
                                                onClick={() => handleSelectProgram(p.name)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white cursor-pointer transition-all ${
                                                    activeProgram === p.name 
                                                        ? 'border-blue-500 ring-2 ring-blue-100 scale-[1.01]' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={selectedPrograms.includes(p.name)}
                                                    onClick={(e) => e.stopPropagation()} // Prevent triggering active class click
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedPrograms([...selectedPrograms, p.name]);
                                                        } else {
                                                            setSelectedPrograms(selectedPrograms.filter(id => id !== p.name));
                                                            setActivePreset(null);
                                                        }
                                                    }}
                                                />
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-bold text-gray-800 text-[13px]">{p.name}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{p.department || 'No Dept'}</span>
                                                        {p.custom_board && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm font-bold truncate max-w-[80px]">{p.custom_board}</span>}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto shrink-0">
                                                    {p.program_abbreviation || '-'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Column 2: Currently Assigned Subjects (Active Program) - span 4 */}
                        <div className="md:col-span-4">
                            <Card 
                                className="rounded-xl border-gray-200 shadow-sm flex flex-col h-[550px]"
                                bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 20 }}
                                title={
                                    <div className="flex items-center gap-2">
                                        <BookOutlined className="text-blue-500" />
                                        <span className="text-gray-700 font-bold text-[13px] uppercase tracking-wider truncate">
                                            {activeProgram ? `Assigned to: ${activeProgram}` : 'Current Class Subjects'}
                                        </span>
                                    </div>
                                }
                            >
                                {!activeProgram ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 bg-gray-50/50 border border-dashed border-gray-250 rounded-lg">
                                        <InfoCircleOutlined className="text-3xl text-gray-300 mb-3" />
                                        <p className="font-semibold text-sm mb-1 text-gray-500">No Class Selected</p>
                                        <p className="text-xs">Click on a class card from the list on the left to see, unselect, or unassign its subjects.</p>
                                    </div>
                                ) : loadingActiveCourses ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                                        <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-xs font-semibold">Fetching subjects...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <div className="text-xs text-gray-400 mb-3">
                                            Below are the subjects assigned to <strong>{activeProgram}</strong>. Click the trash icon to unassign.
                                        </div>
                                        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/30 space-y-2 mb-4">
                                            {activeProgramCourses.length === 0 ? (
                                                <div className="text-center py-12 text-gray-400 italic text-xs">No subjects currently assigned</div>
                                            ) : (
                                                activeProgramCourses.map(c => (
                                                    <div 
                                                        key={c.course}
                                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 bg-white shadow-xs"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-700 text-[13px]">{c.course_name}</span>
                                                            <span className="text-[9px] text-gray-400 font-mono">{c.course}</span>
                                                        </div>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleRemoveActiveCourse(c.course)}
                                                            title="Unassign Subject"
                                                            className="hover:bg-red-50 flex items-center justify-center h-8 w-8 rounded-md"
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined />}
                                                className="w-full bg-blue-600 hover:bg-blue-700 border-0 h-10 font-bold text-xs rounded-lg"
                                                onClick={handleSaveActiveCourses}
                                                loading={savingActiveCourses}
                                                disabled={activeProgramCourses.length === 0 && activeProgramCourses.length === origCoursesLength(activeProgram)}
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Column 3: Available Subjects (Courses) - span 4 */}
                        <div className="md:col-span-4">
                            <Card 
                                className="rounded-xl border-gray-200 shadow-sm flex flex-col h-[550px]"
                                bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 20 }}
                                title={
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-bold text-[13px] uppercase tracking-wider">Available Subjects</span>
                                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">{selectedCourses.length} checked</span>
                                    </div>
                                }
                            >
                                <div className="mb-4 flex gap-2">
                                    <Input
                                        placeholder="Search subjects..."
                                        prefix={<SearchOutlined className="text-gray-400" />}
                                        value={searchCourse}
                                        onChange={e => setSearchCourse(e.target.value)}
                                        className="rounded-lg h-9 border-gray-200"
                                    />
                                    <Button 
                                        className="text-xs font-semibold h-9"
                                        onClick={() => setSelectedCourses(courses.map(c => c.name))}
                                    >
                                        All
                                    </Button>
                                    <Button 
                                        className="text-xs font-semibold h-9"
                                        onClick={() => { setSelectedCourses([]); setActivePreset(null); }}
                                    >
                                        None
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50 space-y-2 mb-4">
                                    {filteredCourses.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 italic text-sm">No subjects found</div>
                                    ) : (
                                        filteredCourses.map(c => (
                                            <label 
                                                key={c.name}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white cursor-pointer hover:border-green-400 transition-colors ${
                                                    selectedCourses.includes(c.name) ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={selectedCourses.includes(c.name)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedCourses([...selectedCourses, c.name]);
                                                        } else {
                                                            setSelectedCourses(selectedCourses.filter(id => id !== c.name));
                                                            setActivePreset(null);
                                                        }
                                                    }}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 text-[13px]">{c.course_name || c.name}</span>
                                                    <span className="text-[10px] text-gray-400 italic font-mono">{c.name}</span>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>

                                {/* Quick Subject Creator */}
                                <div className="pt-3 border-t border-gray-100 flex gap-2">
                                    <Input
                                        placeholder="Add single missing subject..."
                                        value={newCourseName}
                                        onChange={e => setNewCourseName(e.target.value)}
                                        className="rounded-lg h-9"
                                        onPressEnter={quickCreateSubject}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        className="bg-gray-950 border-0 h-9 font-semibold text-xs px-4"
                                        onClick={quickCreateSubject}
                                        loading={creatingCourse}
                                    >
                                        Create
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Progress log and Allocator button */}
                    <Card className="rounded-xl border-gray-200 shadow-sm" title={<span className="text-gray-700 font-bold text-[13px] uppercase tracking-wider">Step 2: Allocate Subjects</span>}>
                        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-800">Allocation Summary:</h4>
                                <p className="text-xs text-gray-500">
                                    This will add the <strong className="text-green-600">{selectedCourses.length} checked subjects</strong> to the <strong className="text-blue-600">{selectedPrograms.length} checked classes</strong>.
                                </p>
                            </div>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                className="bg-gray-950 border-0 h-11 px-8 rounded-lg font-bold text-sm shadow-md hover:bg-black transition-colors"
                                onClick={handleAssignSubjects}
                                loading={saving}
                                disabled={selectedPrograms.length === 0 || selectedCourses.length === 0}
                            >
                                Assign Subjects to Classes
                            </Button>
                        </div>

                        {/* Progress Bar & Realtime logs */}
                        {(saving || logs.length > 0) && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                        <span>ALLOCATION PROGRESS</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                    <Progress 
                                        percent={progressPercent} 
                                        status={progressStatus} 
                                        strokeColor={{ '0%': '#10B981', '100%': '#3B82F6' }}
                                        showInfo={false}
                                    />
                                </div>

                                <div className="bg-gray-950 text-emerald-400 font-mono text-xs p-4 rounded-lg h-44 overflow-y-auto space-y-1 custom-scrollbar shadow-inner">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={log.startsWith('✕') ? 'text-rose-400 font-bold' : log.startsWith('✓') ? 'text-emerald-400' : 'text-gray-300'}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

// Simple helper to enable/disable single save button based on changes
const origCoursesLength = (programName) => {
    // Just a fallback check, button can always be enabled
    return -1;
};

export default ClasswiseSubjectAllocationTool;
