import React from 'react';
import { Calendar, Users } from 'lucide-react';

export default function SummaryPanel({ activeKpi, dateRangeStr }) {
  if (!activeKpi) return null;

  const total = Number(activeKpi.total || 0);
  const male = Number(activeKpi.male || 0);
  const female = Number(activeKpi.female || 0);

  const malePerc = total > 0 ? Math.round((male / total) * 100) : 0;
  const femalePerc = total > 0 ? 100 - malePerc : 0;
  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all">
      {/* Aksen Warna Halus di Bagian Kiri/Atas */}
      <div 
        className="absolute left-0 top-0 h-1.5 w-full sm:h-full sm:w-1.5 transition-colors"
        style={{ backgroundColor: activeKpi.color || '#3b82f6' }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between sm:pl-3">
        
        {/* Kolom Kiri: Nama & Total Kasus */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span 
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold"
              style={{
                backgroundColor: `${activeKpi.color || '#3b82f6'}18`,
                color: activeKpi.color || '#3b82f6'
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeKpi.color || '#3b82f6' }} />
              Kategori Terpantau
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar size={13} className="text-slate-400" />
              <span>Periode: {dateRangeStr}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {activeKpi.name}
          </h2>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-5xl">
              {fmt(total)}
            </span>
            <span className="text-sm font-semibold text-slate-500">Total Pasien Terdiagnosa</span>
          </div>
        </div>

        {/* Kolom Kanan: Distribusi Gender */}
        <div className="w-full lg:w-96 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" />
              Proporsi Jenis Kelamin
            </span>
            <span className="text-slate-500 font-medium">
              {male > female ? 'Mayoritas Laki-laki' : female > male ? 'Mayoritas Perempuan' : 'Sebanding'}
            </span>
          </div>

          {/* Dual Progress Bar */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="bg-blue-600 transition-all duration-500" style={{ width: `${malePerc}%` }} />
            <div className="bg-rose-500 transition-all duration-500" style={{ width: `${femalePerc}%` }} />
          </div>

          {/* Angka & Persentase */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white p-2 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-blue-600 font-semibold">Laki-laki</span>
                <span className="font-bold text-slate-800">{malePerc}%</span>
              </div>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{fmt(male)} <span className="text-[11px] font-normal text-slate-400">jiwa</span></p>
            </div>

            <div className="rounded-lg bg-white p-2 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-rose-500 font-semibold">Perempuan</span>
                <span className="font-bold text-slate-800">{femalePerc}%</span>
              </div>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{fmt(female)} <span className="text-[11px] font-normal text-slate-400">jiwa</span></p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
