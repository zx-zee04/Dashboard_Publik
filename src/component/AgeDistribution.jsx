import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

export default function AgeDistribution({ title, subtitle, data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs">
          <p className="text-xs font-semibold text-slate-500">Rentang Usia: {label}</p>
          <p className="text-sm font-bold text-slate-900">
            {Number(payload[0].value).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pasien</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle || 'Stratifikasi usia penderita yang terdata'}</p>
      </div>

      <div className="h-64 w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 35, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis 
                dataKey="group" 
                type="category" 
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                width={70} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#475569" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#334155', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Belum ada data kelompok usia.
          </div>
        )}
      </div>
    </div>
  );
}
