import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExamDatesheet = () => {
  const [datesheet, setDatesheet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded data based on the provided image
  const staticData = {
    "B. Pharmacy": [
      { date: "12-05-2025", day: "Monday", subjectCode: "BP-201T", subjectName: "Human Anatomy and Physiology II", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "14-05-2025", day: "Wednesday", subjectCode: "BP-202T", subjectName: "Pharmaceutical Organic Chemistry I", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "16-05-2025", day: "Friday", subjectCode: "BP-203T", subjectName: "Biochemistry", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "19-05-2025", day: "Monday", subjectCode: "BP-204T", subjectName: "Pathophysiology", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "21-05-2025", day: "Wednesday", subjectCode: "BP-205T", subjectName: "Computer Applications in Pharmacy", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "23-05-2025", day: "Friday", subjectCode: "BP-206T", subjectName: "Environmental Sciences", course: "B.Pharm", sem: "II", shift: "M" },
      { date: "13-05-2025", day: "Tuesday", subjectCode: "BP-401T", subjectName: "Pharmaceutical Organic Chemistry III", course: "B.Pharm", sem: "IV", shift: "M" },
      { date: "15-05-2025", day: "Thursday", subjectCode: "BP-402T", subjectName: "Medicinal Chemistry I", course: "B.Pharm", sem: "IV", shift: "M" },
      { date: "20-05-2025", day: "Tuesday", subjectCode: "BP-403T", subjectName: "Physical Pharmaceutics II", course: "B.Pharm", sem: "IV", shift: "M" },
      { date: "22-05-2025", day: "Thursday", subjectCode: "BP-404T", subjectName: "Pharmacology I", course: "B.Pharm", sem: "IV", shift: "M" },
      { date: "26-05-2025", day: "Monday", subjectCode: "BP-405T", subjectName: "Pharmacognosy and Phytochemistry I", course: "B.Pharm", sem: "IV", shift: "M" },
      { date: "13-05-2025", day: "Tuesday", subjectCode: "BP-601T", subjectName: "Medicinal Chemistry III", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "15-05-2025", day: "Thursday", subjectCode: "BP-602T", subjectName: "Pharmacology III", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "20-05-2025", day: "Tuesday", subjectCode: "BP-603T", subjectName: "Herbal Drug Technology", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "22-05-2025", day: "Thursday", subjectCode: "BP-604T", subjectName: "Biopharmaceutics and Pharmacokinetics", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "26-05-2025", day: "Monday", subjectCode: "BP-605T", subjectName: "Pharmaceutical Biotechnology", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "28-05-2025", day: "Wednesday", subjectCode: "BP-606T", subjectName: "Quality Assurance", course: "B.Pharm", sem: "VI", shift: "M" },
      { date: "12-05-2025", day: "Monday", subjectCode: "BP-801T", subjectName: "Biostatistics and Research Methodology", course: "B.Pharm", sem: "VIII", shift: "M" },
      { date: "14-05-2025", day: "Wednesday", subjectCode: "BP-802T", subjectName: "Social and Preventive Pharmacy", course: "B.Pharm", sem: "VIII", shift: "M" },
      { date: "16-05-2025", day: "Friday", subjectCode: "BP-803ET", subjectName: "Pharma Marketing Management", course: "B.Pharm", sem: "VIII", shift: "M" },
      { date: "19-05-2025", day: "Monday", subjectCode: "BP-804ET", subjectName: "Pharmaceutical Regulatory Science", course: "B.Pharm", sem: "VIII", shift: "M" },
      { date: "21-05-2025", day: "Wednesday", subjectCode: "BP-806ET", subjectName: "Quality Control and Standardization of Herbals", course: "B.Pharm", sem: "VIII", shift: "M" },
      { date: "23-05-2025", day: "Friday", subjectCode: "BP-812ET", subjectName: "Dietary Supplements and Nutraceuticals", course: "B.Pharm", sem: "VIII", shift: "M" },
    ],
    "M. Pharmacy": [
      { date: "12-05-2025", day: "Monday", subjectCode: "MPH-201T", subjectName: "Molecular Pharmaceutics (Nano Tech and Targeted DDS)", course: "M.Pharm", sem: "II", shift: "M" },
      { date: "14-05-2025", day: "Wednesday", subjectCode: "MPH-202T", subjectName: "Advanced Biopharmacuetics & Pharmacokinetics", course: "M.Pharm", sem: "II", shift: "M" },
      { date: "16-05-2025", day: "Friday", subjectCode: "MPH-203T", subjectName: "Computer Aided Drug Delivery System", course: "M.Pharm", sem: "II", shift: "M" },
      { date: "19-05-2025", day: "Monday", subjectCode: "MPH-204T", subjectName: "Cosmetic and Cosmeceuticals", course: "M.Pharm", sem: "II", shift: "M" },
    ],
    "D. Pharmacy": [
        { date: "12-05-2025", day: "Monday", subjectCode: "ER20-11T", subjectName: "Pharmaceutics", course: "D.Pharm", sem: "1st Yr.", shift: "M" },
        { date: "14-05-2025", day: "Wednesday", subjectCode: "ER20-12T", subjectName: "Pharmaceutical Chemistry", course: "D.Pharm", sem: "1st Yr.", shift: "M" },
        { date: "16-05-2025", day: "Friday", subjectCode: "ER20-13T", subjectName: "Pharmacognosy", course: "D.Pharm", sem: "1st Yr.", shift: "M" },
        { date: "19-05-2025", day: "Monday", subjectCode: "ER20-14T", subjectName: "Human Anatomy & Physiology", course: "D.Pharm", sem: "1st Yr.", shift: "M" },
        { date: "21-05-2025", day: "Wednesday", subjectCode: "ER20-15T", subjectName: "Social Pharmacy", course: "D.Pharm", sem: "1st Yr.", shift: "M" },
        { date: "13-05-2025", day: "Tuesday", subjectCode: "ER20-21T", subjectName: "Pharmacology", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
        { date: "15-05-2025", day: "Thursday", subjectCode: "ER20-22T", subjectName: "Community Pharmacy & Management", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
        { date: "20-05-2025", day: "Tuesday", subjectCode: "ER20-23T", subjectName: "Biochemistry & Clinical Pathology", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
        { date: "22-05-2025", day: "Thursday", subjectCode: "ER20-24T", subjectName: "Pharmacotherapeutics", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
        { date: "26-05-2025", day: "Monday", subjectCode: "ER20-25T", subjectName: "Hospital & Clinical Pharmacy", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
        { date: "28-05-2025", day: "Wednesday", subjectCode: "ER20-26T", subjectName: "Pharmacy Law & Ethics", course: "D.Pharm", sem: "2nd Yr.", shift: "M" },
    ],
    "BA (Hons.) English": [
        { date: "13-05-2025", day: "Tuesday", subjectCode: "BEN-104", subjectName: "Popular Literature", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "15-05-2025", day: "Thursday", subjectCode: "BEN-106", subjectName: "British Poetry & Drama: 17th to 18th Century", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "20-05-2025", day: "Tuesday", subjectCode: "BEN-108", subjectName: "European Classical Literature", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "22-05-2025", day: "Thursday", subjectCode: "BEN-102A", subjectName: "Modern Indian Writings in English Translations", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "26-05-2025", day: "Monday", subjectCode: "BEN-110", subjectName: "American Literature", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "02-06-2025", day: "Monday", subjectCode: "CE-108", subjectName: "Environmental Science & Ecology", course: "BA(H)ENG.", sem: "II", shift: "M" },
        { date: "13-05-2025", day: "Tuesday", subjectCode: "BEN-202", subjectName: "Functional English", course: "BA(H)ENG.", sem: "IV", shift: "M" },
        { date: "15-05-2025", day: "Thursday", subjectCode: "BEN-206", subjectName: "British Romantic Literature", course: "BA(H)ENG.", sem: "IV", shift: "M" },
        { date: "20-05-2025", day: "Tuesday", subjectCode: "BEN-204", subjectName: "Literary Theory & Criticism", course: "BA(H)ENG.", sem: "IV", shift: "M" },
        { date: "22-05-2025", day: "Thursday", subjectCode: "ABMI-ENG-003", subjectName: "Standard English Pronounciation", course: "BA(H)ENG.", sem: "IV", shift: "M" },
        { date: "26-05-2025", day: "Monday", subjectCode: "ABMA-ENG-001", subjectName: "Content Writing", course: "BA(H)ENG.", sem: "IV", shift: "M" },
        { date: "30-05-2025", day: "Friday", subjectCode: "ABMAED-258", subjectName: "Social Work & Social Entrepreneurship-I", course: "BA(H)ENG.", sem: "IV", shift: "M" },
    ]
  };

  useEffect(() => {
    // Using static data for now
    setDatesheet(staticData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="text-xl">Loading...</div></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Lingaya's Vidyapeeth, Faridabad</h1>
          <p className="text-md sm:text-lg text-gray-600">(Deemed to be University, Approved u/s 3 of UGC Act, 1956)</p>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mt-4">Datesheet of End Semester Examination (May, 2025)</h2>
          <p className="text-md text-gray-500 mt-1">M - Morning Shift: 10:00 AM to 1:00 PM</p>
        </div>

        {datesheet && Object.keys(datesheet).map(courseName => (
          <div key={courseName} className="mb-10">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 bg-gray-200 p-3 rounded-lg text-gray-700">{courseName}</h3>
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject Code</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject Name</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sem</th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {datesheet[courseName].map((exam, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.date}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.day}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.subjectCode}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.subjectName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.course}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.sem}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{exam.shift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamDatesheet;