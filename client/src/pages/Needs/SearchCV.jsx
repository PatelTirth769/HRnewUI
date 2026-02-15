import React, { useMemo, useState } from 'react';

// Sample candidate data to demonstrate dynamic filtering
const candidates = [
  { id: 1, name: 'John Doe', skills: ['React', 'Node'], qualification: 'B.Tech', keywords: ['frontend', 'spa'], salaryCTC: 600000, experienceYrs: 5, city: 'Mumbai', gender: 'Male', positionCode: 'P001' },
  { id: 2, name: 'Jane Smith', skills: ['Java', 'Spring'], qualification: 'MCA', keywords: ['backend', 'api'], salaryCTC: 800000, experienceYrs: 6, city: 'Delhi', gender: 'Female', positionCode: 'P002' },
  { id: 3, name: 'Sam Wilson', skills: ['Python', 'Django'], qualification: 'B.Sc', keywords: ['ml', 'data'], salaryCTC: 500000, experienceYrs: 3, city: 'Pune', gender: 'Male', positionCode: 'P003' },
  { id: 4, name: 'Alice Brown', skills: ['React', 'TypeScript'], qualification: 'B.E', keywords: ['frontend', 'ui'], salaryCTC: 900000, experienceYrs: 7, city: 'Bangalore', gender: 'Female', positionCode: 'P004' },
  { id: 5, name: 'Bob Lee', skills: ['Angular', 'Node'], qualification: 'B.Tech', keywords: ['fullstack'], salaryCTC: 700000, experienceYrs: 4, city: 'Noida', gender: 'Male', positionCode: 'P005' },
];

const andOr = ['AND', 'OR'];

export default function SearchCV() {
  const [criteriaName, setCriteriaName] = useState('');
  const [topSearch, setTopSearch] = useState('');

  const [skill, setSkill] = useState('');
  const [skill2, setSkill2] = useState('');
  const [skillJoin, setSkillJoin] = useState('AND');

  const [qualification, setQualification] = useState('');
  const [qualification2, setQualification2] = useState('');
  const [qualificationJoin, setQualificationJoin] = useState('AND');

  const [keyword, setKeyword] = useState('');
  const [keyword2, setKeyword2] = useState('');
  const [keywordJoin, setKeywordJoin] = useState('AND');

  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');

  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');

  const [city, setCity] = useState('');
  const [cityJoin, setCityJoin] = useState('AND');
  const [gender, setGender] = useState('Male');

  const [positionCode, setPositionCode] = useState('');

  const clear = () => {
    setCriteriaName(''); setTopSearch('');
    setSkill(''); setSkill2(''); setSkillJoin('AND');
    setQualification(''); setQualification2(''); setQualificationJoin('AND');
    setKeyword(''); setKeyword2(''); setKeywordJoin('AND');
    setSalaryFrom(''); setSalaryTo(''); setExpFrom(''); setExpTo('');
    setCity(''); setCityJoin('AND'); setGender('Male'); setPositionCode('');
  };

  const saveCriteria = () => {
    const payload = {
      criteriaName, topSearch,
      skill, skill2, skillJoin,
      qualification, qualification2, qualificationJoin,
      keyword, keyword2, keywordJoin,
      salaryFrom, salaryTo,
      expFrom, expTo,
      city, cityJoin,
      gender,
      positionCode,
    };
    localStorage.setItem('search_cv_last', JSON.stringify(payload));
    alert('Search Criteria सहेज लिया गया');
  };

  const loadLast = () => {
    const raw = localStorage.getItem('search_cv_last');
    if (!raw) return alert('कोई past search नहीं मिला');
    try {
      const p = JSON.parse(raw);
      setCriteriaName(p.criteriaName || ''); setTopSearch(p.topSearch || '');
      setSkill(p.skill || ''); setSkill2(p.skill2 || ''); setSkillJoin(p.skillJoin || 'AND');
      setQualification(p.qualification || ''); setQualification2(p.qualification2 || ''); setQualificationJoin(p.qualificationJoin || 'AND');
      setKeyword(p.keyword || ''); setKeyword2(p.keyword2 || ''); setKeywordJoin(p.keywordJoin || 'AND');
      setSalaryFrom(p.salaryFrom || ''); setSalaryTo(p.salaryTo || '');
      setExpFrom(p.expFrom || ''); setExpTo(p.expTo || '');
      setCity(p.city || ''); setCityJoin(p.cityJoin || 'AND'); setGender(p.gender || 'Male');
      setPositionCode(p.positionCode || '');
    } catch { alert('Saved search पढ़ने में त्रुटि'); }
  };

  const matches = useMemo(() => {
    // helper to match two values with AND/OR
    const matchJoin = (value, a, b, join) => {
      if (!a && !b) return true;
      const hasA = a ? value.includes(a.toLowerCase()) : false;
      const hasB = b ? value.includes(b.toLowerCase()) : false;
      return join === 'AND' ? (hasA && hasB) : (hasA || hasB);
    };

    return candidates.filter(c => {
      // top search (by name)
      if (topSearch && !c.name.toLowerCase().includes(topSearch.toLowerCase())) return false;
      // skill
      const skillStr = c.skills.map(s => s.toLowerCase());
      if (!matchJoin(skillStr.join(' '), skill, skill2, skillJoin)) return false;
      // qualification
      const qStr = (c.qualification || '').toLowerCase();
      if (!matchJoin(qStr, qualification.toLowerCase(), qualification2.toLowerCase(), qualificationJoin)) return false;
      // keywords
      const kStr = (c.keywords || []).map(k => k.toLowerCase()).join(' ');
      if (!matchJoin(kStr, keyword.toLowerCase(), keyword2.toLowerCase(), keywordJoin)) return false;
      // salary range
      const fromS = Number(salaryFrom || 0); const toS = Number(salaryTo || Number.MAX_SAFE_INTEGER);
      if (c.salaryCTC < fromS || c.salaryCTC > toS) return false;
      // experience range
      const fromE = Number(expFrom || 0); const toE = Number(expTo || Number.MAX_SAFE_INTEGER);
      if (c.experienceYrs < fromE || c.experienceYrs > toE) return false;
      // city
      const cityOk = city ? c.city.toLowerCase().includes(city.toLowerCase()) : true;
      if (!cityOk) return false;
      // gender
      if (gender && c.gender !== gender) return false;
      // position code
      if (positionCode && c.positionCode !== positionCode) return false;
      return true;
    });
  }, [topSearch, skill, skill2, skillJoin, qualification, qualification2, qualificationJoin, keyword, keyword2, keywordJoin, salaryFrom, salaryTo, expFrom, expTo, city, gender, positionCode]);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Search CV</h1>
        </div>

        {/* Filters - first row */}
        <div className="px-4 pt-4 grid grid-cols-12 gap-3 text-sm">
          <input className="border rounded px-2 py-2 col-span-4" placeholder="Search" value={topSearch} onChange={(e) => setTopSearch(e.target.value)} />
          <input className="border rounded px-2 py-2 col-span-3" placeholder="Criteria Name" value={criteriaName} onChange={(e) => setCriteriaName(e.target.value)} />
        </div>

        {/* Filter rows to mirror screenshot */}
        <div className="px-4 py-3 grid grid-cols-12 gap-3 text-sm">
          {/* Skill */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <select className="border rounded px-2 py-2 col-span-1" value={skillJoin} onChange={(e) => setSkillJoin(e.target.value)}>
            {andOr.map(j => (<option key={j} value={j}>{j}</option>))}
          </select>
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Skill 2" value={skill2} onChange={(e) => setSkill2(e.target.value)} />

          {/* Qualification */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} />
          <select className="border rounded px-2 py-2 col-span-1" value={qualificationJoin} onChange={(e) => setQualificationJoin(e.target.value)}>
            {andOr.map(j => (<option key={j} value={j}>{j}</option>))}
          </select>
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Qualification 2" value={qualification2} onChange={(e) => setQualification2(e.target.value)} />

          {/* Keyword */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select className="border rounded px-2 py-2 col-span-1" value={keywordJoin} onChange={(e) => setKeywordJoin(e.target.value)}>
            {andOr.map(j => (<option key={j} value={j}>{j}</option>))}
          </select>
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Keyword 2" value={keyword2} onChange={(e) => setKeyword2(e.target.value)} />

          {/* Salary range */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Salary Range (CTC PA)" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} />
          <span className="col-span-1 flex items-center justify-center text-gray-500">TO</span>
          <input className="border rounded px-2 py-2 col-span-2" placeholder="TO" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} />

          {/* Experience range */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="Experience(s) Range [Yrs]" value={expFrom} onChange={(e) => setExpFrom(e.target.value)} />
          <span className="col-span-1 flex items-center justify-center text-gray-500">TO</span>
          <input className="border rounded px-2 py-2 col-span-2" placeholder="TO" value={expTo} onChange={(e) => setExpTo(e.target.value)} />

          {/* City */}
          <input className="border rounded px-2 py-2 col-span-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <select className="border rounded px-2 py-2 col-span-1" value={cityJoin} onChange={(e) => setCityJoin(e.target.value)}>
            {andOr.map(j => (<option key={j} value={j}>{j}</option>))}
          </select>

          {/* Gender */}
          <div className="col-span-3 flex items-center gap-4">
            <label className="flex items-center gap-2"><input type="radio" checked={gender === 'Male'} onChange={() => setGender('Male')} /> Male</label>
            <label className="flex items-center gap-2"><input type="radio" checked={gender === 'Female'} onChange={() => setGender('Female')} /> Female</label>
          </div>

          {/* Position Code dropdown to mirror last control */}
          <select className="border rounded px-2 py-2 col-span-2" value={positionCode} onChange={(e) => setPositionCode(e.target.value)}>
            <option value="">Position Code</option>
            {[...new Set(candidates.map(c => c.positionCode))].map(pc => (<option key={pc} value={pc}>{pc}</option>))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={saveCriteria}>Save Search Criteria</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={loadLast}>View Past Search</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={clear}>Clear</button>
        </div>

        {/* Results */}
        <div className="px-4 pb-4">
          <div className="border rounded">
            <div className="p-2 border-b text-sm bg-gray-50 text-gray-600 grid grid-cols-7">
              <div className="p-2">Name</div>
              <div className="p-2">Skills</div>
              <div className="p-2">Qualification</div>
              <div className="p-2">Experience</div>
              <div className="p-2">Salary (CTC)</div>
              <div className="p-2">City</div>
              <div className="p-2">Position Code</div>
            </div>
            {matches.map(c => (
              <div key={c.id} className="grid grid-cols-7 border-t text-sm">
                <div className="p-2">{c.name}</div>
                <div className="p-2">{c.skills.join(', ')}</div>
                <div className="p-2">{c.qualification}</div>
                <div className="p-2">{c.experienceYrs} yrs</div>
                <div className="p-2">{(c.salaryCTC/100000).toFixed(1)} LPA</div>
                <div className="p-2">{c.city}</div>
                <div className="p-2">{c.positionCode}</div>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="p-4 text-center text-gray-500">No matching candidates</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}