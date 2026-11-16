import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function LineChartComp({ title, subtitle, data, lineColor }) {
  const chartColor = lineColor || '#3b82f6';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs">
          <p className="text-xs font-semibold text-slate-500">Tanggal: {label}</p>
          <p className="text-sm font-bold text-slate-900">
            {Number(payload[0].value).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">kasus baru</span>
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
        <p className="text-xs text-slate-500">{subtitle || 'Fluktuasi jumlah pasien per hari'}</p>
      </div>

      <div className="h-64 w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${chartColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={chartColor} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill={`url(#gradient-${chartColor.replace('#', '')})`} 
                dot={{ r: 3, fill: chartColor, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 5 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Belum ada data tren harian.
          </div>
        )}
      </div>
    </div>
  );
}
