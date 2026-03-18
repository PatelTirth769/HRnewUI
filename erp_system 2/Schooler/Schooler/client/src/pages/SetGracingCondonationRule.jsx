import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const SetGracingCondonationRule = () => {
  const [formData, setFormData] = useState({ university: '', semester: '', year: '', exam: '' });
  const [rules, setRules] = useState([
    { id: 1, rule: 'Rule 1', totalMarks: '', totalYearSemester: '', pass: 'N', variation: '', fail: 'N', grace: 'N' },
  ]);
  const [savedRules, setSavedRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length > 1) {
        const headers = data[0];
        const fileData = data.slice(1).map(row => {
          let rowData = {};
          row.forEach((value, index) => {
            rowData[headers[index]] = value;
          });
          return rowData;
        });

        const newFormData = {
          university: fileData[0]?.University || '',
          semester: fileData[0]?.Semester || '',
          year: fileData[0]?.Year || '',
          exam: fileData[0]?.Exam || '',
        };

        const newRules = fileData.map((row, index) => ({
          id: index + 1,
          rule: row.Rule || `Rule ${index + 1}`,
          totalMarks: row['Total Marks'] || '',
          totalYearSemester: row['Total (Year/Semester)'] || '',
          pass: row['Pass Y/N'] || 'N',
          variation: row.Variation || '',
          fail: row.Fail || 'N',
          grace: row.Grace || 'N',
        }));

        setFormData(newFormData);
        setRules(newRules);
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get('/api/gracing-condonation-rule');
        // Ensure we always set an array, even if response.data is not an array
        setSavedRules(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching rules:', error);
        setSavedRules([]); // Set empty array on error
      }
    };
    fetchRules();
  }, []);

  // Add null check and ensure savedRules is always treated as an array
  const filteredRules = (savedRules || []).filter(rule =>
    rule.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.semester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.exam?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRules.flatMap(savedRule => 
      savedRule.rules.map(rule => ({
        University: savedRule.university,
        Semester: savedRule.semester,
        Year: savedRule.year,
        Exam: savedRule.exam,
        Rule: rule.rule,
        'Total Marks': rule.totalMarks,
        'Total (Year/Semester)': rule.totalYearSemester,
        'Pass Y/N': rule.pass,
        Variation: rule.variation,
        Fail: rule.fail,
        Grace: rule.grace,
      }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rules');
    XLSX.writeFile(workbook, 'GracingCondonationRules.xlsx');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRuleChange = (id, e) => {
    const { name, value, type, checked } = e.target;
    const newRules = rules.map(rule => {
      if (rule.id === id) {
        const updatedRule = { ...rule, [name]: type === 'checkbox' ? (checked ? 'Y' : 'N') : value };
        
        // If this is a checkbox (pass, fail, or grace) and it's being checked
        if (type === 'checkbox' && checked && ['pass', 'fail', 'grace'].includes(name)) {
          // Uncheck the other two options
          if (name === 'pass') {
            updatedRule.fail = 'N';
            updatedRule.grace = 'N';
          } else if (name === 'fail') {
            updatedRule.pass = 'N';
            updatedRule.grace = 'N';
          } else if (name === 'grace') {
            updatedRule.pass = 'N';
            updatedRule.fail = 'N';
          }
        }
        
        return updatedRule;
      }
      return rule;
    });
    setRules(newRules);
  };

  const handleAddRule = () => {
    const newId = rules.length > 0 ? Math.max(...rules.map(rule => rule.id)) + 1 : 1;
    setRules([...rules, { id: newId, rule: `Rule ${newId}`, totalMarks: '', totalYearSemester: '', pass: 'N', variation: '', fail: 'N', grace: 'N' }]);
  };

  const handleRemoveRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/gracing-condonation-rule', { ...formData, rules });
      console.log(response.data);
      
      // Show success message
      setSaveMessage('Rules saved successfully!');
      
      // Refresh the saved rules after successful save
      const fetchRules = async () => {
        try {
          const response = await axios.get('/api/gracing-condonation-rule');
          setSavedRules(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Error fetching rules:', error);
          setSavedRules([]);
        }
      };
      fetchRules();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving rule:', error);
      setSaveMessage('Error saving rules. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Set Gracing/Condonation Rule</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-md">
        {saveMessage && (
          <div className={`mb-4 p-3 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {saveMessage}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input type="text" name="university" placeholder="University" value={formData.university} onChange={handleChange} className="border p-2 rounded-md" />
          <input type="text" name="semester" placeholder="Semester" value={formData.semester} onChange={handleChange} className="border p-2 rounded-md" />
          <input type="text" name="year" placeholder="Year" value={formData.year} onChange={handleChange} className="border p-2 rounded-md" />
          <input type="text" name="exam" placeholder="Exam" value={formData.exam} onChange={handleChange} className="border p-2 rounded-md" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Rule</th>
                <th className="py-2 px-4 border">All Subject</th>
                <th className="py-2 px-4 border">Total Marks</th>
                <th className="py-2 px-4 border">Total (Year/Semester)</th>
                <th className="py-2 px-4 border">Pass Y/N</th>
                <th className="py-2 px-4 border">Variation (X out of Total)</th>
                <th className="py-2 px-4 border">Fail</th>
                <th className="py-2 px-4 border">Grace</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td className="py-2 px-4 border">{rule.rule}</td>
                  <td className="py-2 px-4 border"></td>
                  <td className="py-2 px-4 border"><input type="text" name="totalMarks" value={rule.totalMarks} onChange={(e) => handleRuleChange(rule.id, e)} className="border p-1 w-full" /></td>
                  <td className="py-2 px-4 border"><input type="text" name="totalYearSemester" value={rule.totalYearSemester} onChange={(e) => handleRuleChange(rule.id, e)} className="border p-1 w-full" /></td>
                  <td className="py-2 px-4 border"><input type="checkbox" name="pass" checked={rule.pass === 'Y'} onChange={(e) => handleRuleChange(rule.id, e)} /></td>
                  <td className="py-2 px-4 border"><input type="text" name="variation" value={rule.variation} onChange={(e) => handleRuleChange(rule.id, e)} className="border p-1 w-full" /></td>
                  <td className="py-2 px-4 border"><input type="checkbox" name="fail" checked={rule.fail === 'Y'} onChange={(e) => handleRuleChange(rule.id, e)} /></td>
                  <td className="py-2 px-4 border"><input type="checkbox" name="grace" checked={rule.grace === 'Y'} onChange={(e) => handleRuleChange(rule.id, e)} /></td>
                  <td className="py-2 px-4 border">
                    <button type="button" onClick={() => handleRemoveRule(rule.id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button type="button" onClick={handleAddRule} className="bg-blue-500 text-white px-4 py-2 rounded">Add Rule</button>
          <div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">Save</button>
            <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>

        <div className="flex justify-end items-center mt-4">
          <div>
            <button type="button" onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Download Excel</button>
            <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" style={{ display: 'none' }} id="upload-excel" />
            <label htmlFor="upload-excel" className="bg-yellow-500 text-white px-4 py-2 rounded cursor-pointer">Upload Excel</label>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Saved Rules</h2>
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search..."
            className="border p-2 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">University</th>
                <th className="py-2 px-4 border">Semester</th>
                <th className="py-2 px-4 border">Year</th>
                <th className="py-2 px-4 border">Exam</th>
                <th className="py-2 px-4 border">Rule</th>
                <th className="py-2 px-4 border">Total Marks</th>
                <th className="py-2 px-4 border">Total (Year/Semester)</th>
                <th className="py-2 px-4 border">Pass Y/N</th>
                <th className="py-2 px-4 border">Variation</th>
                <th className="py-2 px-4 border">Fail</th>
                <th className="py-2 px-4 border">Grace</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map(savedRule => (
                <React.Fragment key={savedRule._id}>
                  {savedRule.rules.map((rule, index) => (
                    <tr key={`${savedRule._id}-${index}`}>
                      {index === 0 && (
                        <>
                          <td className="py-2 px-4 border" rowSpan={savedRule.rules.length}>{savedRule.university}</td>
                          <td className="py-2 px-4 border" rowSpan={savedRule.rules.length}>{savedRule.semester}</td>
                          <td className="py-2 px-4 border" rowSpan={savedRule.rules.length}>{savedRule.year}</td>
                          <td className="py-2 px-4 border" rowSpan={savedRule.rules.length}>{savedRule.exam}</td>
                        </>
                      )}
                      <td className="py-2 px-4 border">{rule.rule}</td>
                      <td className="py-2 px-4 border">{rule.totalMarks}</td>
                      <td className="py-2 px-4 border">{rule.totalYearSemester}</td>
                      <td className="py-2 px-4 border">{rule.pass}</td>
                      <td className="py-2 px-4 border">{rule.variation}</td>
                      <td className="py-2 px-4 border">{rule.fail}</td>
                      <td className="py-2 px-4 border">{rule.grace}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SetGracingCondonationRule;