import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { useUserRole } from '../../hooks/useUserRole';
import { useInstructorGroups } from '../../hooks/useInstructorGroups';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
const GlobalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Target Type Config ───────────────────────────────────────────────────────
const TARGET_TYPES = [
  { value: 'All',          label: 'All School',        color: '#6366f1', bg: '#eef2ff' },
  { value: 'Board',        label: 'Board-wise',        color: '#0ea5e9', bg: '#e0f2fe' },
  { value: 'StudentGroup', label: 'Student Group-wise',color: '#10b981', bg: '#d1fae5' },
  { value: 'Program',      label: 'Class-wise',        color: '#f59e0b', bg: '#fef3c7' },
  { value: 'Student',      label: 'Student-wise',      color: '#ec4899', bg: '#fdf2f8' },
];

const TARGET_COLORS = {
  All:          { text: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  Board:        { text: '#0ea5e9', bg: '#e0f2fe', border: '#bae6fd' },
  StudentGroup: { text: '#10b981', bg: '#d1fae5', border: '#a7f3d0' },
  Program:      { text: '#f59e0b', bg: '#fef3c7', border: '#fde68a' },
  Student:      { text: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
};

const FIRESTORE_PATH = 'schooler_system/announcements/records';

// ─── Main Component ───────────────────────────────────────────────────────────
const Announcement = () => {
  const { isInstructor, isCoordinator } = useUserRole();
  const instructorData = useInstructorGroups();
  const coordinatorScope = useCoordinatorScope();

  // form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetType: (localStorage.getItem('userRole') === 'Instructor' || localStorage.getItem('userRole') === 'Coordinator') ? 'StudentGroup' : 'All',
    targetValue: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // States for Student-wise targeting
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupStudents, setGroupStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // dropdown options
  const [boards, setBoards] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // announcements list
  const [announcements, setAnnouncements] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch master data from ERPNext ─────────────────────────────────────────
  useEffect(() => {
    if (isCoordinator && coordinatorScope.loading) return;
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const [sgRes, pgRes] = await Promise.allSettled([
          API.get('/api/resource/Student Group?fields=["name","student_group_name","program"]&limit_page_length=None&order_by=name asc'),
          API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None&order_by=name asc'),
        ]);
        if (sgRes.status === 'fulfilled') setStudentGroups(sgRes.value.data?.data || []);
        if (pgRes.status === 'fulfilled') {
          const allPrograms = pgRes.value.data?.data || [];
          setPrograms(allPrograms);
          // Deduplicate boards from program's custom_board field
          const boardSet = new Set(
            allPrograms.map(p => p.custom_board).filter(Boolean)
          );
          setBoards([...boardSet].sort().map(b => ({ name: b })));
        }
      } catch (e) {
        console.error('Announcement: fetchMasters error', e);
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, [isCoordinator, coordinatorScope.loading]);

  // ── Fetch students when a Student Group is selected for Student-wise ────────
  useEffect(() => {
    if (form.targetType === 'Student' && selectedGroup) {
      const fetchGroupStudents = async () => {
        setLoadingStudents(true);
        try {
          const res = await API.get(`/api/resource/Student Group/${encodeURIComponent(selectedGroup)}`);
          const raw = res.data?.data?.students || [];
          let mapped = raw.map(s => ({
            id: s.student,
            name: s.student_name || s.student
          }));
          // Filter if instructor
          if (isInstructor && instructorData?.studentIds) {
            mapped = mapped.filter(s => instructorData.studentIds.includes(s.id));
          }
          setGroupStudents(mapped);
        } catch (err) {
          console.error("Error fetching student group members:", err);
          setError("Failed to fetch students for the selected group.");
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchGroupStudents();
    } else {
      setGroupStudents([]);
      setSelectedStudentIds([]);
    }
  }, [selectedGroup, form.targetType, isInstructor, instructorData?.studentIds]);

  // ── Fetch announcements from Firestore ─────────────────────────────────────
  const fetchAnnouncements = useCallback(async () => {
    setLoadingList(true);
    try {
      const ref = collection(db, FIRESTORE_PATH);
      const snap = await getDocs(ref);
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      setAnnouncements(sorted);
    } catch (e) {
      console.error('Announcement: fetchAnnouncements error', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { 
      if (isCoordinator && coordinatorScope.loading) return;
      fetchAnnouncements(); 
  }, [fetchAnnouncements, isCoordinator, coordinatorScope.loading]);

  // ── Handle form submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and Message are required.');
      return;
    }
    if (form.targetType === 'Student') {
      if (selectedStudentIds.length === 0) {
        setError('Please select at least one student.');
        return;
      }
    } else if (form.targetType !== 'All' && !form.targetValue) {
      setError('Please select a Target Value.');
      return;
    }
    setSubmitting(true);
    try {
      const ref = collection(db, FIRESTORE_PATH);
      const targetVal = form.targetType === 'Student' ? selectedStudentIds : (form.targetType === 'All' ? 'All' : form.targetValue);
      const targetValNames = form.targetType === 'Student'
        ? groupStudents.filter(s => selectedStudentIds.includes(s.id)).map(s => s.name)
        : null;

      await addDoc(ref, {
        title:       form.title.trim(),
        message:     form.message.trim(),
        targetType:  form.targetType,
        targetValue: targetVal,
        targetValueNames: targetValNames,
        createdAt:   serverTimestamp(),
        createdBy:   localStorage.getItem('user') || 'admin',
      });
      setSuccess('Announcement published successfully!');
      setForm({ title: '', message: '', targetType: 'All', targetValue: '' });
      setSelectedBoard('');
      setSelectedProgram('');
      setSelectedGroup('');
      setSelectedStudentIds([]);
      setGroupStudents([]);
      setStudentSearchQuery('');
      fetchAnnouncements();
    } catch (e) {
      console.error('Announcement: addDoc error', e);
      setError('Failed to save announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, FIRESTORE_PATH, id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Announcement: deleteDoc error', e);
      alert('Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    if (isCoordinator) {
      if (coordinatorScope.loading) return [];
      return announcements.filter(item => {
        if (item.createdBy === (localStorage.getItem('user') || '')) return true;
        if (item.targetType === 'All') return true;
        if (item.targetType === 'Board' && coordinatorScope.boards?.includes(item.targetValue)) return true;
        if (item.targetType === 'Program' && coordinatorScope.programs?.includes(item.targetValue)) return true;
        if (item.targetType === 'StudentGroup') {
           const sg = studentGroups.find(g => (g.student_group_name || g.name) === item.targetValue || g.name === item.targetValue);
           if (sg && coordinatorScope.programs?.includes(sg.program)) return true;
        }
        if (item.targetType === 'Student') return true; // Let coordinators see student specific announcements for now
        return false;
      });
    }

    if (!isInstructor) return announcements;
    if (isInstructor && instructorData && instructorData.programs.length === 0) return announcements;
    return announcements.filter(item => {
      if (item.createdBy === (localStorage.getItem('user') || '')) return true;
      if (item.targetType === 'All') return true;
      if (item.targetType === 'StudentGroup' && instructorData?.studentGroups?.includes(item.targetValue)) return true;
      if (item.targetType === 'Program' && instructorData?.programs?.includes(item.targetValue)) return true;
      if (item.targetType === 'Board') {
        const instProgs = programs.filter(p => instructorData?.programs?.includes(p.name));
        const instBoards = instProgs.map(p => p.custom_board).filter(Boolean);
        if (instBoards.includes(item.targetValue)) return true;
      }
      if (item.targetType === 'Student') {
        if (Array.isArray(item.targetValue)) {
          return item.targetValue.some(id => instructorData?.studentIds?.includes(id));
        }
        return instructorData?.studentIds?.includes(item.targetValue);
      }
      return false;
    });
  }, [announcements, isInstructor, instructorData, programs, studentGroups, isCoordinator, coordinatorScope]);

  // ── Target value options ───────────────────────────────────────────────────
  const targetValueOptions = () => {
    if (form.targetType === 'Board') {
      if (isCoordinator) {
        return boards.filter(b => coordinatorScope.boards?.includes(b.name)).map(b => b.name);
      }
      if (isInstructor && instructorData && instructorData.programs.length > 0) {
        const instProgs = programs.filter(p => instructorData?.programs?.includes(p.name));
        const instBoards = instProgs.map(p => p.custom_board).filter(Boolean);
        return boards.filter(b => instBoards.includes(b.name)).map(b => b.name);
      }
      return boards.map(b => b.name);
    }
    if (form.targetType === 'StudentGroup') {
      if (isCoordinator) {
        return studentGroups.filter(g => coordinatorScope.programs?.includes(g.program)).map(g => g.student_group_name || g.name);
      }
      if (isInstructor && instructorData && instructorData.studentGroups.length > 0) {
        return studentGroups.filter(g => instructorData?.studentGroups?.includes(g.name)).map(g => g.student_group_name || g.name);
      }
      return studentGroups.map(g => g.student_group_name || g.name);
    }
    if (form.targetType === 'Program') {
      if (isCoordinator) {
        return programs.filter(p => coordinatorScope.programs?.includes(p.name)).map(p => p.name);
      }
      if (isInstructor && instructorData && instructorData.programs.length > 0) {
        return programs.filter(p => instructorData?.programs?.includes(p.name)).map(p => p.name);
      }
      return programs.map(p => p.name);
    }
    return [];
  };

  // ── Cascading selection options for Student-wise ──────────────────────────
  const getStudentWiseBoards = () => {
    if (isCoordinator) {
        return boards.filter(b => coordinatorScope.boards?.includes(b.name)).map(b => b.name);
    }
    if (isInstructor && instructorData && instructorData.programs.length > 0) {
      const instProgs = programs.filter(p => instructorData?.programs?.includes(p.name));
      const instBoards = instProgs.map(p => p.custom_board).filter(Boolean);
      return boards.filter(b => instBoards.includes(b.name)).map(b => b.name);
    }
    return boards.map(b => b.name);
  };

  const getStudentWisePrograms = () => {
    if (!selectedBoard) return [];
    if (isCoordinator) {
      return programs.filter(p => 
        p.custom_board === selectedBoard && 
        coordinatorScope.programs?.includes(p.name)
      ).map(p => p.name);
    }
    if (isInstructor && instructorData && instructorData.programs.length > 0) {
      return programs.filter(p => 
        p.custom_board === selectedBoard && 
        instructorData?.programs?.includes(p.name)
      ).map(p => p.name);
    }
    return programs.filter(p => p.custom_board === selectedBoard).map(p => p.name);
  };

  const getStudentWiseGroups = () => {
    if (!selectedProgram) return [];
    if (isCoordinator) {
      return studentGroups.filter(g => 
        g.program === selectedProgram && 
        coordinatorScope.programs?.includes(g.program)
      ).map(g => g.name);
    }
    if (isInstructor && instructorData && instructorData.studentGroups.length > 0) {
      return studentGroups.filter(g => 
        g.program === selectedProgram && 
        instructorData?.studentGroups?.includes(g.name)
      ).map(g => g.name);
    }
    return studentGroups.filter(g => g.program === selectedProgram).map(g => g.name);
  };

  // ── Format timestamp ───────────────────────────────────────────────────────
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const targetCfg = (type) => TARGET_COLORS[type] || TARGET_COLORS.All;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
            color: '#fff',
          }}>
            <BellIcon />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.5px' }}>
              Announcement Manager
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14, marginTop: 2 }}>
              Publish targeted announcements to students, guardians &amp; instructors
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 28, alignItems: 'start' }}>

          {/* ── Create Form ────────────────────────────────────────────────── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
            border: '1px solid #e8e8f5',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>
                ✏️ Create Announcement
              </h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Fill in the details and choose who should see it
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Title */}
              <label style={labelStyle}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Annual Sports Day – 20 June"
                style={inputStyle}
              />

              {/* Message */}
              <label style={labelStyle}>Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write the announcement details here…"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />

              {/* Target Type */}
              <label style={labelStyle}>Audience</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {((isInstructor || isCoordinator) ? TARGET_TYPES.filter(t => t.value !== 'All') : TARGET_TYPES).map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, targetType: t.value, targetValue: '' }));
                      setSelectedBoard('');
                      setSelectedProgram('');
                      setSelectedGroup('');
                      setSelectedStudentIds([]);
                      setGroupStudents([]);
                      setStudentSearchQuery('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: `2px solid ${form.targetType === t.value ? t.color : '#e5e7eb'}`,
                      background: form.targetType === t.value ? t.bg : '#fff',
                      color: form.targetType === t.value ? t.color : '#6b7280',
                      fontWeight: form.targetType === t.value ? 700 : 500,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Target Value & Cascading selections */}
              {form.targetType !== 'All' && form.targetType !== 'Student' && (
                <>
                  <label style={labelStyle}>Target Value *</label>
                  {loadingMasters ? (
                    <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Loading options…</div>
                  ) : (
                    <select
                      value={form.targetValue}
                      onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">-- Select --</option>
                      {targetValueOptions().map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {form.targetType === 'Student' && (
                <>
                  {/* Cascading selectors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Select Board *</label>
                      <select
                        value={selectedBoard}
                        onChange={e => {
                          setSelectedBoard(e.target.value);
                          setSelectedProgram('');
                          setSelectedGroup('');
                        }}
                        style={{ ...inputStyle, marginBottom: 8, cursor: 'pointer' }}
                      >
                        <option value="">-- Select Board --</option>
                        {getStudentWiseBoards().map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Select Class *</label>
                      <select
                        value={selectedProgram}
                        disabled={!selectedBoard}
                        onChange={e => {
                          setSelectedProgram(e.target.value);
                          setSelectedGroup('');
                        }}
                        style={{ ...inputStyle, marginBottom: 8, cursor: !selectedBoard ? 'not-allowed' : 'pointer' }}
                      >
                        <option value="">-- Select Class --</option>
                        {getStudentWisePrograms().map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Select Student Group *</label>
                    <select
                      value={selectedGroup}
                      disabled={!selectedProgram}
                      onChange={e => setSelectedGroup(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 8, cursor: !selectedProgram ? 'not-allowed' : 'pointer' }}
                    >
                      <option value="">-- Select Group --</option>
                      {getStudentWiseGroups().map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Student Checklist section */}
                  {selectedGroup && (
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      background: '#fcfcfd',
                      marginBottom: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                          Students List
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const filteredIds = groupStudents
                                .filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.id.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                .map(s => s.id);
                              setSelectedStudentIds(prev => {
                                const newIds = new Set(prev);
                                filteredIds.forEach(id => newIds.add(id));
                                return Array.from(newIds);
                              });
                            }}
                            style={{
                              padding: '2px 8px', borderRadius: 4, border: '1px solid #d1d5db',
                              background: '#fff', fontSize: 11, color: '#4b5563', cursor: 'pointer'
                            }}
                          >
                            Select Filtered
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentIds([]);
                            }}
                            style={{
                              padding: '2px 8px', borderRadius: 4, border: '1px solid #d1d5db',
                              background: '#fff', fontSize: 11, color: '#4b5563', cursor: 'pointer'
                            }}
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Search box */}
                      <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        value={studentSearchQuery}
                        onChange={e => setStudentSearchQuery(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          border: '1px solid #d1d5db', fontSize: 12, marginBottom: 10,
                          background: '#fff', outline: 'none', boxSizing: 'border-box'
                        }}
                      />

                      {/* Checklist Container */}
                      {loadingStudents ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0', color: '#9ca3af' }}>
                          <SpinnerIcon /> <span style={{ fontSize: 12 }}>Loading group students...</span>
                        </div>
                      ) : groupStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
                          No active students found in this group.
                        </div>
                      ) : (
                        <>
                          <div style={{
                            maxHeight: 180, overflowY: 'auto', border: '1px solid #f3f4f6',
                            borderRadius: 8, background: '#fff', padding: '4px 8px'
                          }}>
                            {groupStudents.filter(s => {
                              const q = studentSearchQuery.toLowerCase();
                              return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
                            }).map(student => {
                              const isChecked = selectedStudentIds.includes(student.id);
                              return (
                                <label
                                  key={student.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px',
                                    borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
                                    fontSize: 12, userSelect: 'none',
                                    background: isChecked ? '#fdf2f8' : 'transparent',
                                    color: isChecked ? '#db2777' : '#374151',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = isChecked ? '#fdf2f8' : '#f9fafb'}
                                  onMouseLeave={e => e.currentTarget.style.background = isChecked ? '#fdf2f8' : 'transparent'}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedStudentIds(prev => 
                                        prev.includes(student.id)
                                          ? prev.filter(id => id !== student.id)
                                          : [...prev, student.id]
                                      );
                                    }}
                                    style={{
                                      accentColor: '#ec4899', cursor: 'pointer', width: 14, height: 14
                                    }}
                                  />
                                  <span style={{ fontWeight: isChecked ? 600 : 400 }}>
                                    {student.id} - {student.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginTop: 8 }}>
                            <span>Total group size: {groupStudents.length}</span>
                            <span style={{ fontWeight: 600, color: '#db2777' }}>
                              {selectedStudentIds.length} student(s) selected
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Feedback */}
              {error   && <div style={alertStyle('#fef2f2', '#dc2626', '#fecaca')}>{error}</div>}
              {success && <div style={alertStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>{success}</div>}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: submitting
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #6366f1, #818cf8)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? <><SpinnerIcon /> Publishing…</> : '🔔 Publish Announcement'}
              </button>
            </form>
          </div>

          {/* ── Announcements List ─────────────────────────────────────────── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
            border: '1px solid #e8e8f5',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f1f8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e1b4b' }}>
                  📢 Published Announcements
                </h2>
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 12 }}>
                  {filteredAnnouncements.length} total
                </p>
              </div>
              <button
                onClick={fetchAnnouncements}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #e8e8f5',
                  background: '#fafafa', color: '#6366f1', fontWeight: 600, fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>

            <div style={{ padding: '12px 16px', maxHeight: 560, overflowY: 'auto' }}>
              {loadingList ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                  <SpinnerIcon />
                  <p style={{ marginTop: 12, fontSize: 13 }}>Loading announcements…</p>
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 13 }}>No announcements found.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredAnnouncements.map(ann => {
                    const cfg = targetCfg(ann.targetType);
                    return (
                      <div
                        key={ann.id}
                        style={{
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 14,
                          padding: '16px',
                          background: cfg.bg,
                          position: 'relative',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        {/* Badge + Delete */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: cfg.text + '20',
                              color: cfg.text,
                              fontSize: 11,
                              fontWeight: 700,
                              border: `1px solid ${cfg.border}`,
                            }}>
                              {ann.targetType === 'All' ? '🌐 All School' :
                               ann.targetType === 'Board' ? '🏫 Board' :
                               ann.targetType === 'StudentGroup' ? '👥 Student Group' :
                               ann.targetType === 'Student' ? '👤 Student-wise' : '📚 Class'}
                            </span>
                            {ann.targetValue && ann.targetValue !== 'All' && (
                              ann.targetType === 'Student' ? (
                                <span
                                  title={ann.targetValueNames ? ann.targetValueNames.join(', ') : (Array.isArray(ann.targetValue) ? ann.targetValue.join(', ') : ann.targetValue)}
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    background: '#fff',
                                    color: '#374151',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    border: '1px solid #e5e7eb',
                                    cursor: 'help',
                                  }}
                                >
                                  {Array.isArray(ann.targetValue) ? (
                                    ann.targetValue.length === 1
                                      ? (ann.targetValueNames?.[0] || ann.targetValue[0])
                                      : `${ann.targetValue.length} Students`
                                  ) : (
                                    ann.targetValueNames?.[0] || ann.targetValue
                                  )}
                                </span>
                              ) : (
                                <span style={{
                                  padding: '3px 10px',
                                  borderRadius: 20,
                                  background: '#fff',
                                  color: '#374151',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  border: '1px solid #e5e7eb',
                                }}>
                                  {ann.targetValue}
                                </span>
                              )
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(ann.id)}
                            disabled={deletingId === ann.id}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 8,
                              border: '1px solid #fecaca',
                              background: '#fff',
                              color: '#ef4444',
                              cursor: deletingId === ann.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: deletingId === ann.id ? 0.5 : 1,
                              flexShrink: 0,
                            }}
                            title="Delete announcement"
                          >
                            {deletingId === ann.id ? <SpinnerIcon /> : <TrashIcon />}
                          </button>
                        </div>

                        {/* Title */}
                        <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                          {ann.title}
                        </h3>

                        {/* Message */}
                        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                          {ann.message}
                        </p>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                          <span>By: {ann.createdBy || 'Admin'}</span>
                          <span>{fmtDate(ann.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ann-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #e5e7eb',
  fontSize: 13,
  color: '#1f2937',
  background: '#fafafa',
  marginBottom: 16,
  outline: 'none',
  transition: 'border-color 0.18s',
  boxSizing: 'border-box',
};

const alertStyle = (bg, text, border) => ({
  padding: '10px 14px',
  borderRadius: 10,
  background: bg,
  color: text,
  border: `1px solid ${border}`,
  fontSize: 13,
  marginBottom: 14,
  fontWeight: 500,
});

export default Announcement;
