import React from "react";

export function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}
