import React, { useEffect, useMemo, useState } from 'react';
import SimpleDonut from '../components/charts/SimpleDonut';
import SimpleBars from '../components/charts/SimpleBars';
import GroupedMonthlyBars from '../components/charts/GroupedMonthlyBars';

const fyOptions = () => {
  const y = new Date().getFullYear();
  const start = new Date().getMonth() >= 3 ? y : y - 1;
  return [start - 1, start, start + 1];
};

const SAMPLE = [
  { ecode: 'E001', name: 'A', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: '1998-06-01', doj: '2024-04-10' },
  { ecode: 'E002', name: 'B', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: '1995-11-11', doj: '2024-05-05' },
  { ecode: 'E003', name: 'C', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: '1992-03-21', doj: '2024-06-15' },
  { ecode: 'E004', name: 'D', company: 'DCSAMAI', department: 'Sales', eType: 'WORKER', gender: 'Female', status: 'OnRoll', workingFor: 'Client', location: 'Kolkata', dob: '1989-08-09', doj: '2024-07-01' },
  { ecode: 'E005', name: 'E', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Nashik', dob: '1987-01-15', doj: '2024-08-18' },
  { ecode: 'E006', name: 'F', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Nashik', dob: '1985-12-05', doj: '2024-09-12', exitDate: '2024-10-12' },
  { ecode: 'E007', name: 'G', company: 'BOMBAIM', department: 'IT', eType: 'WORKER', gender: 'Male', status: 'OffRoll', workingFor: 'Client', location: 'Mumbai', dob: '1999-02-27', doj: '2024-09-20' },
  { ecode: 'E008', name: 'H', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: '1993-07-07', doj: '2024-10-05' },
  { ecode: 'E009', name: 'I', company: 'DCSAMAI', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Kolkata', dob: '1990-06-10', doj: '2024-04-25' },
  { ecode: 'E010', name: 'J', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Transgender', status: 'OnRoll', workingFor: 'Internal', location: 'Mumbai', dob: '1996-09-13', doj: '2024-05-22' },
  { ecode: 'E011', name: 'K', company: 'BOMBAIM', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: '1984-04-03', doj: '2024-06-02' },
  { ecode: 'E012', name: 'L', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Female', status: 'Left', workingFor: 'Internal', location: 'Nashik', dob: '1982-10-10', doj: '2024-06-10', exitDate: '2024-09-10' },
  { ecode: 'E013', name: 'M', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: '1997-12-12', doj: '2024-07-15' },
  { ecode: 'E014', name: 'N', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: '1991-01-01', doj: '2024-08-10' },
  { ecode: 'E015', name: 'O', company: 'BOMBAIM', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: '1994-05-17', doj: '2024-10-20' },
];

const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const makeEcode = (i) => `E${String(i).padStart(4, '0')}`;
const monthNames = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const fyMonths = (fyStartYear) => {
  const start = new Date(fyStartYear, 3, 1);
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i + 1, 0);
    months.push(d);
  }
  return months;
};
const makeEmployees = (n, fyStartYear) => {
  const companies = ['BOMBAIM', 'DCSAMAI', 'Kolkata_Frontend'];
  const departments = ['IT', 'HR', 'Sales', 'Finance'];
  const eTypes = ['STAFF', 'WORKER'];
  const genders = ['Male', 'Female', 'Transgender'];
  const statuses = ['OnRoll', 'OffRoll', 'Left'];
  const workingFor = ['Internal', 'Client'];
  const locations = ['Vasai', 'Kolkata', 'Mumbai', 'Nashik'];
  const start = new Date(fyStartYear, 3, 1);
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const age = randInt(20, 58);
    const dobYear = new Date().getFullYear() - age;
    const dob = new Date(dobYear, randInt(0, 11), randInt(1, 28));
    const doj = new Date(start.getFullYear(), randInt(3, 14), randInt(1, 28));
    const leftProb = Math.random() < 0.15;
    const exitDate = leftProb ? new Date(doj.getFullYear(), doj.getMonth() + randInt(1, 6), randInt(1, 28)) : undefined;
    arr.push({
      ecode: makeEcode(i),
      name: `Emp ${i}`,
      company: randItem(companies),
      department: randItem(departments),
      eType: randItem(eTypes),
      gender: randItem(genders),
      status: exitDate ? 'Left' : randItem(statuses.slice(0, 2)),
      workingFor: randItem(workingFor),
      location: randItem(locations),
      dob: dob.toISOString().slice(0, 10),
      doj: doj.toISOString().slice(0, 10),
      exitDate: exitDate ? exitDate.toISOString().slice(0, 10) : undefined,
    });
  }
  return arr;
};
const computeMIS = (filters, dataSet) => {
  const inRange = (date, from, to) => {
    const d = date ? new Date(date) : null;
    if (!d) return false;
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to)) return false;
    return true;
  };
  let base = dataSet.filter((e) => {
    if (filters.company !== 'ALL' && e.company !== filters.company) return false;
    if (filters.department !== 'ALL' && e.department !== filters.department) return false;
    if (filters.eType !== 'ALL' && e.eType !== filters.eType) return false;
    if (filters.workingFor !== 'ALL' && e.workingFor !== filters.workingFor) return false;
    if (filters.status !== 'ALL' && e.status !== filters.status) return false;
    if (filters.locations.length && !filters.locations.includes(e.location)) return false;
    if ((filters.fromDate || filters.toDate) && !inRange(e.doj, filters.fromDate, filters.toDate)) return false;
    return true;
  });
  const totalEmployees = base.length;
  const countBy = (field, allowed = null) => {
    const map = {};
    base.forEach((e) => {
      const key = e[field] || 'Unknown';
      if (allowed && !allowed.includes(key)) return;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  };
  const genderCounts = countBy('gender', ['Male','Female','Transgender']);
  const eTypeCounts = countBy('eType', ['STAFF','WORKER']);
  const statusCounts = countBy('status', ['OnRoll','OffRoll','Left']);
  const ageBuckets = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-30', min: 26, max: 30 },
    { label: '31-35', min: 31, max: 35 },
    { label: '36-40', min: 36, max: 40 },
    { label: '41-45', min: 41, max: 45 },
    { label: '46-50', min: 46, max: 50 },
    { label: '51-55', min: 51, max: 55 },
    { label: '56-60', min: 56, max: 60 },
  ];
  const ageGroups = ageBuckets.map((b) => ({ label: b.label, count: 0 }));
  const today = new Date();
  base.forEach((e) => {
    if (!e.dob) return;
    const age = Math.floor((today - new Date(e.dob)) / (365.25 * 24 * 3600 * 1000));
    const idx = ageBuckets.findIndex((b) => age >= b.min && age <= b.max);
    if (idx >= 0) ageGroups[idx].count += 1;
  });
  const months = fyMonths(Number(filters.fyStartYear));
  const monthlyStrength = months.map((endOfMonth, i) => {
    const label = monthNames[i];
    const monthStart = new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), 1);
    const newJoiners = base.filter((e) => e.doj && new Date(e.doj) >= monthStart && new Date(e.doj) <= endOfMonth).length;
    const leftEmployees = base.filter((e) => e.exitDate && new Date(e.exitDate) >= monthStart && new Date(e.exitDate) <= endOfMonth).length;
    const total = base.filter((e) => new Date(e.doj || '1900-01-01') <= endOfMonth && (!e.exitDate || new Date(e.exitDate) > endOfMonth)).length;
    return { month: label, total, new: newJoiners, left: leftEmployees };
  });
  return { totalEmployees, genderCounts, eTypeCounts, statusCounts, ageGroups, monthlyStrength };
};

const EmployeeMIS = () => {
  const [filters, setFilters] = useState({
    company: 'ALL',
    department: 'ALL',
    eType: 'ALL',
    workingFor: 'ALL',
    locations: [],
    status: 'ALL',
    fyStartYear: fyOptions()[1],
    fromDate: '',
    toDate: '',
  });

  const [data, setData] = useState({
    totalEmployees: 0,
    genderCounts: {},
    eTypeCounts: {},
    statusCounts: {},
    ageGroups: [],
    monthlyStrength: [],
  });
  const [dataset, setDataset] = useState(SAMPLE);
  const [genCount, setGenCount] = useState(150);
  const [showGenderDonut, setShowGenderDonut] = useState(true);
  const [showEtypeDonut, setShowEtypeDonut] = useState(true);
  const [showStatusDonut, setShowStatusDonut] = useState(true);
  const [showAgeBars, setShowAgeBars] = useState(true);
  const [showMonthlyBars, setShowMonthlyBars] = useState(true);
  const [personalizeVisible, setPersonalizeVisible] = useState(false);

  const apply = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (Array.isArray(v)) params.append(k, v.join(','));
        else if (v) params.append(k, v);
      });
      const res = await fetch(`http://localhost:5000/api/employee/mis?${params.toString()}`);
      const json = await res.json();
      if (json && json.totalEmployees !== undefined) {
        setData(json);
        return;
      }
    } catch (_) {}
    const local = computeMIS(filters, dataset);
    setData(local);
  };

  useEffect(() => {
    apply();
    // eslint-disable-next-line
  }, []);

  const locationOptions = ['Vasai', 'Kolkata', 'Mumbai', 'Nashik'];

  const onSelectLocation = (loc) => {
    setFilters((f) => {
      const has = f.locations.includes(loc);
      const next = has ? f.locations.filter((x) => x !== loc) : [...f.locations, loc];
      return { ...f, locations: next };
    });
  };

  const totalApplied = useMemo(() => data.totalEmployees, [data]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold text-gray-900">Employee MIS</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" onClick={()=>setPersonalizeVisible(true)}>Personalize</button>
          <input type="number" min="10" className="border rounded px-2 py-1 w-20 text-sm" value={genCount} onChange={(e)=>setGenCount(Number(e.target.value||0))} />
          <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" onClick={()=>{ const arr = makeEmployees(genCount, filters.fyStartYear); setDataset(arr); const d = computeMIS(filters, arr); setData(d); }}>Generate Demo Data</button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <div className="text-sm">F.Y.</div>
          <select className="border rounded px-2 py-2 w-full text-sm" value={filters.fyStartYear} onChange={(e)=>setFilters({ ...filters, fyStartYear: Number(e.target.value) })}>
            {fyOptions().map((y)=>(<option key={y} value={y}>{`${y}-${String(y+1).slice(-2)}`}</option>))}
          </select>
        </div>
        <div>
          <div className="text-sm">Company</div>
          <select className="border rounded px-2 py-2 w-full text-sm" value={filters.company} onChange={(e)=>setFilters({ ...filters, company: e.target.value })}>
            {['ALL','BOMBAIM','DCSAMAI','Kolkata_Frontend'].map((v)=>(<option key={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <div className="text-sm">Department</div>
          <select className="border rounded px-2 py-2 w-full text-sm" value={filters.department} onChange={(e)=>setFilters({ ...filters, department: e.target.value })}>
            {['ALL','IT','HR','Sales','Finance'].map((v)=>(<option key={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <div className="text-sm">Etype</div>
          <select className="border rounded px-2 py-2 w-full text-sm" value={filters.eType} onChange={(e)=>setFilters({ ...filters, eType: e.target.value })}>
            {['ALL','STAFF','WORKER'].map((v)=>(<option key={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <div className="text-sm">Working For</div>
          <select className="border rounded px-2 py-2 w-full text-sm" value={filters.workingFor} onChange={(e)=>setFilters({ ...filters, workingFor: e.target.value })}>
            {['ALL','Client','Internal'].map((v)=>(<option key={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <div className="text-sm">Working Location</div>
          <div className="border rounded w-full text-sm p-2">
            <div className="flex flex-wrap gap-2">
              {locationOptions.map((loc)=> (
                <button key={loc} className={`px-2 py-1 rounded border ${filters.locations.includes(loc)?'bg-blue-600 text-white border-blue-600':'bg-white'}`} onClick={()=>onSelectLocation(loc)}>{loc}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-sm">From</div>
          <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={filters.fromDate} onChange={(e)=>setFilters({ ...filters, fromDate: e.target.value })} />
        </div>
        <div>
          <div className="text-sm">To</div>
          <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={filters.toDate} onChange={(e)=>setFilters({ ...filters, toDate: e.target.value })} />
        </div>
        <div className="flex items-end">
          <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm" onClick={apply}>Apply</button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="text-sm">Applied Filters:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {filters.company !== 'ALL' && (<span className="px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">{filters.company}</span>)}
          {filters.department !== 'ALL' && (<span className="px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">{filters.department}</span>)}
          {filters.eType !== 'ALL' && (<span className="px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">{filters.eType}</span>)}
          {filters.workingFor !== 'ALL' && (<span className="px-2 py-1 rounded bg-gray-100 text-gray-700 border">{filters.workingFor}</span>)}
          {filters.locations.map((l)=> (<span key={l} className="px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200">{l}</span>))}
          {filters.fromDate && (<span className="px-2 py-1 rounded bg-gray-100 text-gray-700 border">From {filters.fromDate}</span>)}
          {filters.toDate && (<span className="px-2 py-1 rounded bg-gray-100 text-gray-700 border">To {filters.toDate}</span>)}
        </div>
      </div>
      <div className="mt-2 text-sm font-medium">Total Employees {totalApplied}</div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showGenderDonut && (
          <div className="bg-white rounded border p-4">
            <div className="font-semibold mb-3">Gender wise</div>
            <SimpleDonut data={data.genderCounts} colors={["#60a5fa","#fb7185","#fbbf24"]} totalLabel={data.totalEmployees} />
          </div>
        )}
        {showEtypeDonut && (
          <div className="bg-white rounded border p-4">
            <div className="font-semibold mb-3">Etype wise</div>
            <SimpleDonut data={data.eTypeCounts} colors={["#f59e0b","#10b981"]} totalLabel={data.totalEmployees} />
          </div>
        )}
        {showStatusDonut && (
          <div className="bg-white rounded border p-4">
            <div className="font-semibold mb-3">Status wise</div>
            <SimpleDonut data={data.statusCounts} colors={["#22c55e","#f97316","#ef4444"]} totalLabel={data.totalEmployees} />
          </div>
        )}
      </div>

      {showAgeBars && (
        <div className="mt-6 bg-white rounded border p-4">
          <div className="font-semibold mb-3">Age wise detail</div>
          <SimpleBars data={data.ageGroups || []} />
        </div>
      )}

      {showMonthlyBars && (
        <div className="mt-6 bg-white rounded border p-4">
          <div className="font-semibold mb-1">Employee Strength</div>
          <div className="text-xs text-gray-500">Note: Total Employee not included New and Left Employee of month</div>
          <div className="mt-4">
            <GroupedMonthlyBars data={data.monthlyStrength || []} />
          </div>
        </div>
      )}

      {personalizeVisible && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[520px] p-4">
            <div className="text-lg font-semibold mb-3">Personalize Employee MIS</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={showGenderDonut} onChange={()=>setShowGenderDonut(v=>!v)} /> Gender wise</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showEtypeDonut} onChange={()=>setShowEtypeDonut(v=>!v)} /> Etype wise</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showStatusDonut} onChange={()=>setShowStatusDonut(v=>!v)} /> Status wise</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showAgeBars} onChange={()=>setShowAgeBars(v=>!v)} /> Age wise detail</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showMonthlyBars} onChange={()=>setShowMonthlyBars(v=>!v)} /> Employee Strength</label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={()=>setPersonalizeVisible(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMIS;