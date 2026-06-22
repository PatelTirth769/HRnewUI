import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import * as XLSX from 'xlsx';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CoordinatorSetup = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [erpUsers, setErpUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  const [form, setForm] = useState({
    id: null,
    email: '',
    selectedBoards: [],
    selectedPrograms: [],
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch ERP Users and Masters
  useEffect(() => {
        const fetchCoordinatorsSource = async () => {
            try {
                // 1. Fetch from Firebase
                const usersSnap = await getDocs(query(collection(db, 'schooler_users'), where('role', '==', 'Coordinator')));
                const fbUsers = usersSnap.docs.map(d => ({ email: d.data().email || d.data().username, first_name: d.data().email || d.data().username, last_name: '' }));
                
                // 2. Fetch from ERPNext via Role Profile (if available)
                const rpRes = await API.get('/api/resource/User?filters=[["role_profile_name","=","Coordinator"]]&fields=["name","email","first_name","last_name"]&limit_page_length=None').catch(() => ({data:{data:[]}}));
                const rpUsers = rpRes.data?.data || [];

                // 3. Fetch from ERPNext via Module Profile (if available)
                const mpRes = await API.get('/api/resource/User?filters=[["module_profile","=","Coordinator"]]&fields=["name","email","first_name","last_name"]&limit_page_length=None').catch(() => ({data:{data:[]}}));
                const mpUsers = mpRes.data?.data || [];

                // 4. Try fetching Has Role
                let hrUsers = [];
                const rolesRes = await API.get('/api/resource/Has Role?filters=[["role","=","Coordinator"]]&fields=["parent"]&limit_page_length=None').catch(() => null);
                if (rolesRes && rolesRes.data?.data) {
                    const emails = rolesRes.data.data.map(r => r.parent);
                    if (emails.length > 0) {
                        const hrRes = await API.get(`/api/resource/User?filters=[["name","in",${JSON.stringify(emails)}]]&fields=["name","email","first_name","last_name"]&limit_page_length=None`).catch(() => ({data:{data:[]}}));
                        hrUsers = hrRes.data?.data || [];
                    }
                }

                // Combine and deduplicate by email
                const allCoordUsers = [...fbUsers, ...rpUsers, ...mpUsers, ...hrUsers];
                const uniqueUsersMap = new Map();
                allCoordUsers.forEach(u => {
                    if (u.email && !uniqueUsersMap.has(u.email)) {
                        uniqueUsersMap.set(u.email, u);
                    }
                });

                const finalUsers = Array.from(uniqueUsersMap.values());
                setErpUsers(finalUsers);
                
                if (finalUsers.length === 0) {
                    setError("No users found with the 'Coordinator' role. Please ensure you have assigned the Coordinator role/profile to users in ERPNext.");
                }

            } catch (err) {
                console.error("Failed to fetch coordinators", err);
                setError("Failed to fetch coordinators. Please check your connection.");
            }
        };

        fetchCoordinatorsSource();

        const fetchMasters = async () => {
            setLoadingMasters(true);
            try {
                const progRes = await API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None&order_by=name asc').catch(() => ({data:{data:[]}}));
                const allProgs = progRes.data?.data || [];
                setPrograms(allProgs);
                const bSet = new Set(allProgs.map(p => p.custom_board).filter(Boolean));
                setBoards([...bSet].sort());
            } catch (err) {
                console.error('CoordinatorSetup master fetch error:', err);
                setError("Failed to fetch programs/boards from ERPNext.");
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
  }, []);

  // Fetch Coordinators
  const fetchCoordinators = async () => {
    setLoadingList(true);
    try {
      const snap = await getDocs(collection(db, 'schooler_system/coordinators/data'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoordinators(list);
    } catch (err) {
      console.error('Fetch coordinators error:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleBoardToggle = (board) => {
    setForm(prev => {
      const newBoards = prev.selectedBoards.includes(board)
        ? prev.selectedBoards.filter(b => b !== board)
        : [...prev.selectedBoards, board];
      return { ...prev, selectedBoards: newBoards };
    });
  };

  const handleProgramToggle = (prog) => {
    setForm(prev => {
      const newProgs = prev.selectedPrograms.includes(prog)
        ? prev.selectedPrograms.filter(p => p !== prog)
        : [...prev.selectedPrograms, prog];
      return { ...prev, selectedPrograms: newProgs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email) return setError('Please select a user.');
    if (form.selectedBoards.length === 0 && form.selectedPrograms.length === 0) {
      return setError('Please select at least one board or program.');
    }

    setSubmitting(true);
    try {
      const data = {
        email: form.email,
        boards: form.selectedBoards,
        programs: form.selectedPrograms,
        updatedAt: serverTimestamp(),
      };
      
      if (form.id) {
        await updateDoc(doc(db, 'schooler_system/coordinators/data', form.id), data);
        setSuccess('Coordinator updated successfully.');
      } else {
        // Check if user already exists
        const q = query(collection(db, 'schooler_system/coordinators/data'), where('email', '==', form.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setError('This user is already a coordinator. Edit their existing record instead.');
          setSubmitting(false);
          return;
        }
        data.createdAt = serverTimestamp();
        data.createdBy = localStorage.getItem('user') || 'admin';
        await addDoc(collection(db, 'schooler_system/coordinators/data'), data);
        setSuccess('Coordinator added successfully.');
      }
      
      setForm({ id: null, email: '', selectedBoards: [], selectedPrograms: [] });
      fetchCoordinators();
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to save coordinator setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coord) => {
    setForm({
      id: coord.id,
      email: coord.email,
      selectedBoards: coord.boards || [],
      selectedPrograms: coord.programs || [],
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this coordinator?')) return;
    try {
      await deleteDoc(doc(db, 'schooler_system/coordinators/data', id));
      setCoordinators(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete.');
    }
  };

  const handleExport = (format) => {
    if (!coordinators || coordinators.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = coordinators.map(c => ({
      Email: c.email || '-',
      Boards: c.boards?.length ? c.boards.join(', ') : 'None',
      Programs: c.programs?.length ? c.programs.join(', ') : 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coordinators");

    if (format === 'csv') {
        XLSX.writeFile(workbook, `Coordinators_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
        XLSX.writeFile(workbook, `Coordinators_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  // Filter programs based on selected boards
  const availablePrograms = programs.filter(p => form.selectedBoards.includes(p.custom_board));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
            color: '#fff',
          }}>
            <ShieldIcon />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.5px' }}>
              Coordinator Setup
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14, marginTop: 2 }}>
              Assign Board and Program access scope to Coordinator users
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>
              {form.id ? 'Edit Coordinator Scope' : 'Add New Coordinator'}
            </h2>
            {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', color: '#10b981', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Select ERPNext User
                </label>
                <select
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loadingMasters || form.id !== null}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none' }}
                >
                  <option value="">-- Select User --</option>
                  {erpUsers.map(u => (
                    <option key={u.email} value={u.email}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Assign Boards
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  {boards.map(b => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={form.selectedBoards.includes(b)}
                        onChange={() => handleBoardToggle(b)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Assign Programs (Classes)
                </label>
                {form.selectedBoards.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Please select boards first</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    {availablePrograms.map(p => (
                      <label key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={form.selectedPrograms.includes(p.name)}
                          onChange={() => handleProgramToggle(p.name)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Saving...' : form.id ? 'Update Scope' : 'Add Coordinator'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() => setForm({ id: null, email: '', selectedBoards: [], selectedPrograms: [] })}
                    style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Active Coordinators ({coordinators.length})
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleExport('csv')} style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#2563eb' }}>
                  <DownloadIcon /> CSV
                </button>
                <button onClick={() => handleExport('excel')} style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#16a34a' }}>
                  <DownloadIcon /> Excel
                </button>
              </div>
            </div>
            
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
            ) : coordinators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No coordinators configured yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coordinators.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, border: '1px solid #f1f5f9', borderRadius: 12, background: '#fafaf9' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{c.email}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
                        <strong>Boards:</strong> {c.boards?.length ? c.boards.join(', ') : 'None'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        <strong>Programs:</strong> {c.programs?.length ? c.programs.join(', ') : 'None'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(c)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', color: '#4f46e5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Edit Scope"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Delete Coordinator"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSetup;
