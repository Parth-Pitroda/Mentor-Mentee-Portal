"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DepartmentChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
        No departmental data available yet.
      </div>
    );
  }

  return (
    <div className="h-80 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
         <XAxis 
          dataKey="name" 
          stroke="#64748b" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => value === 'Information & Communication Tech' ? 'ICT' : value}
        />
        
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {/* Grey bar for Total students */}
          <Bar dataKey="Total" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60} />
          {/* Blue bar for Verified students */}
          <Bar dataKey="Verified" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/*
DESIGN 2 FOR CHART
<XAxis 
  dataKey="name" 
  stroke="#64748b" 
  fontSize={11} 
  tickLine={false} 
  axisLine={false} 
  interval={0} // Forces every single label to show!
  angle={-45} // Tilts the text so it fits
  textAnchor="end" // Aligns the tilted text nicely
  height={80} // Gives extra space at the bottom so the tilted text isn't cut off
  tickFormatter={(value) => value === 'Information & Communication Tech' ? 'ICT' : value}
/>*/