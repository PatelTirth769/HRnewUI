import React from 'react';

const GroupedMonthlyBars = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="w-full">
      <div className="flex items-end gap-3 h-64">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-100 rounded h-48 flex items-end gap-1">
              <div className="flex-1 bg-blue-500 rounded" style={{ height: `${(d.total / max) * 100}%` }}></div>
              <div className="w-2 bg-green-500 rounded" style={{ height: `${Math.min(100, d.new * 12)}px` }}></div>
              <div className="w-2 bg-red-500 rounded" style={{ height: `${Math.min(100, d.left * 12)}px` }}></div>
            </div>
            <div className="text-xs mt-2">{d.month}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 inline-block rounded"></span> Total Employee</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 inline-block rounded"></span> New Employee</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 inline-block rounded"></span> Left Employee</div>
      </div>
    </div>
  );
};

export default GroupedMonthlyBars;