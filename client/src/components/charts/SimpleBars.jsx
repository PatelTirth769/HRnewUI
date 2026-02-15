import React from 'react';

const SimpleBars = ({ data, height = 220, barColor = '#22c55e' }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="w-full">
      <div className="flex items-end gap-3 h-[220px]">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="w-full bg-gray-100 rounded">
              <div style={{ height: `${(d.count / max) * height}px`, background: barColor }} className="w-full rounded"></div>
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center">{d.label}</div>
            <div className="text-xs text-gray-900">{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleBars;