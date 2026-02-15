import React from 'react';

export default function NeedsPage({ title }) {
  return (
    <div className="p-6">
      <div className="bg-white border rounded-md p-4">
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-600 mt-2">Minimal placeholder page for {title}.</p>
      </div>
    </div>
  );
}