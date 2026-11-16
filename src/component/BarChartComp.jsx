import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

export default function BarChartComp({ title, subtitle, data, barColor }) {
  const chartColor = barColor || '#3b82f6';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs">
          <p className="text-xs font-semibold text-slate-500">Puskesmas {label}</p>
          <p className="text-sm font-bold text-slate-900">
            {Number(payload[0].value).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pasien</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle || 'Peringkat puskesmas berdasarkan volume kunjungan kasus'}</p>
        </div>
        <span className="text-xs font-medium text-slate-400 self-start sm:self-center">
          Maks. 15 Fasilitas
        </span>
      </div>

      <div className="h-72 w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                angle={-35} 
                textAnchor="end" 
                interval={0} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={chartColor} radius={[5, 5, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Belum ada rincian data puskesmas untuk ditampilkan.
          </div>
        )}
      </div>
    </section>
  );
}
