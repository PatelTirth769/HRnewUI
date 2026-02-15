import React from 'react';
import { useParams } from 'react-router-dom';

export default function PayrollDashboard() {
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;
  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-1">
            <button className="w-full px-3 py-2 text-sm rounded bg-white border text-left">Payroll Config</button>
            <button className="w-full px-3 py-2 text-sm rounded bg-white border text-left">Salary heads</button>
            <button className="w-full px-3 py-2 text-sm rounded bg-white border text-left">Statutory Settings</button>
            <button className="w-full px-3 py-2 text-sm rounded bg-white border text-left">Prepare Payroll</button>
            <button className="w-full px-3 py-2 text-sm rounded bg-white border text-left">Run Payroll</button>
            <button className="w-full px-3 py-2 text-sm rounded bg-blue-50 text-blue-700 border border-blue-200 text-left">Dashboard</button>
          </div>
        </div>
        <div className="col-span-9">
          <div className="flex justify-end mb-3">
            <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Personalize</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-2xl font-semibold text-green-600">2660</div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">Present Employees</div>
                <div className="text-2xl font-semibold text-red-600">920</div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">Average Working Hours</div>
                <div className="text-2xl font-semibold text-gray-800">8 hours</div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
              <div className="p-4 rounded border">
                <div className="text-sm text-gray-600">Checked Out Employees</div>
                <div className="text-2xl font-semibold text-green-600">340</div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-sm text-gray-600 mb-2">Monthly Attendance Distribution</div>
              <div className="h-48 grid grid-cols-5 gap-2 items-end">
                {[2200,2400,2500,2600,2700].map((h,i) => (
                  <div key={i} className="bg-green-500" style={{height: `${(h/3000)*100}%`}}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded border flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm">Full-time</div>
              <div className="text-sm text-gray-600">
                <div>Full-time (45%)</div>
                <div>Part-time (30%)</div>
                <div>Contract (25%)</div>
              </div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-sm text-gray-600 mb-2">Payroll Distribution</div>
              <div className="h-48 grid grid-cols-5 gap-2 items-end">
                {[2300,2000,2600,2400,2700].map((h,i) => (
                  <div key={i} className="bg-green-500" style={{height: `${(h/3000)*100}%`}}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded border">
              <div className="text-sm text-gray-600">Total Check-ins</div>
              <div className="text-green-600 text-lg">920 vs last month</div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-sm text-gray-600">Total Check-Outs</div>
              <div className="text-red-600 text-lg">340 vs last month</div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-sm text-gray-600">Present Employees</div>
              <div className="text-green-600 text-lg">920 vs last month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}