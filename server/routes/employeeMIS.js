const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const sampleEmployees = [
  { ecode: 'E001', name: 'A', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: new Date('1998-06-01'), doj: new Date('2024-04-10') },
  { ecode: 'E002', name: 'B', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: new Date('1995-11-11'), doj: new Date('2024-05-05') },
  { ecode: 'E003', name: 'C', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: new Date('1992-03-21'), doj: new Date('2024-06-15') },
  { ecode: 'E004', name: 'D', company: 'DCSAMAI', department: 'Sales', eType: 'WORKER', gender: 'Female', status: 'OnRoll', workingFor: 'Client', location: 'Kolkata', dob: new Date('1989-08-09'), doj: new Date('2024-07-01') },
  { ecode: 'E005', name: 'E', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Nashik', dob: new Date('1987-01-15'), doj: new Date('2024-08-18') },
  { ecode: 'E006', name: 'F', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Nashik', dob: new Date('1985-12-05'), doj: new Date('2024-09-12'), exitDate: new Date('2024-10-12') },
  { ecode: 'E007', name: 'G', company: 'BOMBAIM', department: 'IT', eType: 'WORKER', gender: 'Male', status: 'OffRoll', workingFor: 'Client', location: 'Mumbai', dob: new Date('1999-02-27'), doj: new Date('2024-09-20') },
  { ecode: 'E008', name: 'H', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: new Date('1993-07-07'), doj: new Date('2024-10-05') },
  { ecode: 'E009', name: 'I', company: 'DCSAMAI', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Kolkata', dob: new Date('1990-06-10'), doj: new Date('2024-04-25') },
  { ecode: 'E010', name: 'J', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Transgender', status: 'OnRoll', workingFor: 'Internal', location: 'Mumbai', dob: new Date('1996-09-13'), doj: new Date('2024-05-22') },
  { ecode: 'E011', name: 'K', company: 'BOMBAIM', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: new Date('1984-04-03'), doj: new Date('2024-06-02') },
  { ecode: 'E012', name: 'L', company: 'BOMBAIM', department: 'Finance', eType: 'STAFF', gender: 'Female', status: 'Left', workingFor: 'Internal', location: 'Nashik', dob: new Date('1982-10-10'), doj: new Date('2024-06-10'), exitDate: new Date('2024-09-10') },
  { ecode: 'E013', name: 'M', company: 'BOMBAIM', department: 'HR', eType: 'STAFF', gender: 'Male', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: new Date('1997-12-12'), doj: new Date('2024-07-15') },
  { ecode: 'E014', name: 'N', company: 'BOMBAIM', department: 'IT', eType: 'STAFF', gender: 'Female', status: 'OnRoll', workingFor: 'Internal', location: 'Vasai', dob: new Date('1991-01-01'), doj: new Date('2024-08-10') },
  { ecode: 'E015', name: 'O', company: 'BOMBAIM', department: 'Sales', eType: 'WORKER', gender: 'Male', status: 'OnRoll', workingFor: 'Client', location: 'Mumbai', dob: new Date('1994-05-17'), doj: new Date('2024-10-20') },
];

const fyMonths = (fyStartYear) => {
  const start = new Date(fyStartYear, 3, 1); // Apr 1
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i + 1, 0); // end of month
    months.push(d);
  }
  return months;
};

router.get('/mis', async (req, res) => {
  try {
    const {
      company,
      department,
      eType,
      workingFor,
      locations,
      status,
      fromDate,
      toDate,
      fyStartYear,
    } = req.query;

    const query = {};
    if (company && company !== 'ALL') query.company = company;
    if (department && department !== 'ALL') query.department = department;
    if (eType && eType !== 'ALL') query.eType = eType;
    if (workingFor && workingFor !== 'ALL') query.workingFor = workingFor;
    if (status && status !== 'ALL') query.status = status;
    if (locations) {
      const arr = Array.isArray(locations) ? locations : String(locations).split(',').filter(Boolean);
      if (arr.length) query.location = { $in: arr };
    }
    if (fromDate || toDate) {
      query.doj = {};
      if (fromDate) query.doj.$gte = new Date(fromDate);
      if (toDate) query.doj.$lte = new Date(toDate);
      if (!Object.keys(query.doj).length) delete query.doj;
    }

    let base = [];
    try {
      base = await Employee.find(query).lean();
    } catch (e) {
      // fall back to sample data when db is not available
      base = sampleEmployees.filter((e) => {
        let ok = true;
        if (query.company) ok = ok && e.company === query.company;
        if (query.department) ok = ok && e.department === query.department;
        if (query.eType) ok = ok && e.eType === query.eType;
        if (query.workingFor) ok = ok && e.workingFor === query.workingFor;
        if (query.status) ok = ok && e.status === query.status;
        if (query.location && query.location.$in) ok = ok && query.location.$in.includes(e.location);
        if (query.doj) {
          const dj = new Date(e.doj || '1900-01-01');
          if (query.doj.$gte) ok = ok && dj >= query.doj.$gte;
          if (query.doj.$lte) ok = ok && dj <= query.doj.$lte;
        }
        return ok;
      });
    }

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

    const genderCounts = countBy('gender', ['Male', 'Female', 'Transgender']);
    const eTypeCounts = countBy('eType', ['STAFF', 'WORKER']);
    const statusCounts = countBy('status', ['OnRoll', 'OffRoll', 'Left']);

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

    const months = fyStartYear ? fyMonths(Number(fyStartYear)) : [];
    const monthlyStrength = months.map((endOfMonth, i) => {
      const label = monthNames[i];
      const newJoiners = base.filter((e) => e.doj && new Date(e.doj) >= new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), 1) && new Date(e.doj) <= endOfMonth).length;
      const leftEmployees = base.filter((e) => e.exitDate && new Date(e.exitDate) >= new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), 1) && new Date(e.exitDate) <= endOfMonth).length;
      const total = base.filter((e) => new Date(e.doj || '1900-01-01') <= endOfMonth && (!e.exitDate || new Date(e.exitDate) > endOfMonth)).length;
      return { month: label, total, new: newJoiners, left: leftEmployees };
    });

    res.json({
      totalEmployees,
      filtersApplied: { company, department, eType, workingFor, status, locations: locations || [], fromDate, toDate, fyStartYear },
      genderCounts,
      eTypeCounts,
      statusCounts,
      ageGroups,
      monthlyStrength,
    });
  } catch (err) {
    console.error('MIS error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// Seed sample employees for demo/testing
router.post('/seed', async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    if (count > 0) return res.json({ inserted: 0, existing: count });
    const insertResult = await Employee.insertMany(sampleEmployees);
    res.json({ inserted: insertResult.length });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed' });
  }
});