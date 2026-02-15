import React from 'react';

const SimpleDonut = ({ data, colors, size = 160, thickness = 24, totalLabel }) => {
  const entries = Object.entries(data || {});
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const radius = (size - thickness) / 2;
  const center = size / 2;
  let start = 0;
  const arcs = entries.map(([k, v], i) => {
    const angle = total ? (v / total) * Math.PI * 2 : 0;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const end = start + angle;
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    start = end;
    return { key: k, value: v, path, color: colors[i % colors.length] };
  });
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {arcs.map((a, idx) => (
          <path key={idx} d={a.path} fill="none" stroke={a.color} strokeWidth={thickness} />
        ))}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fontSize="18" fill="#111827">{totalLabel ?? total}</text>
      </svg>
      <div className="space-y-2">
        {entries.map(([k, v], i) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded" style={{ background: colors[i % colors.length] }}></span>
            <span className="text-gray-700">{k}</span>
            <span className="ml-auto text-gray-900 font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleDonut;