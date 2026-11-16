import React, { useMemo } from 'react';
import { Activity, Building2, Users2, TrendingUp, AlertCircle } from 'lucide-react';

export default function ExecutiveSummary({ data, onSelectDisease }) {
  // 1. Kalkulasi Statistik Global
  const stats = useMemo(() => {
    let total = 0, male = 0, female = 0;
    (data.kpi || []).forEach((item) => {
      total += Number(item.total || 0);
      male += Number(item.male || 0);
      female += Number(item.female || 0);
    });
    const malePct = total > 0 ? Math.round((male / total) * 100) : 0;
    const femalePct = total > 0 ? 100 - malePct : 0;
    return { total, male, female, malePct, femalePct };
  }, [data.kpi]);

  // 2. Ranking Penyakit Terbanyak
  const sortedDiseases = useMemo(() => {
    return [...(data.kpi || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [data.kpi]);

  // 3. Leaderboard Puskesmas
  const topPuskesmas = useMemo(() => {
    const map = {};
    Object.values(data.puskesmas || {}).forEach((list) => {
      (list || []).forEach((p) => {
        map[p.name] = (map[p.name] || 0) + Number(p.count || 0);
      });
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [data.puskesmas]);

  const topDisease = sortedDiseases[0];
  const topFacility = topPuskesmas[0];
  const maxPusk = topFacility?.count || 1;
  const maxDisCount = topDisease?.total || 1;

  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6">

      {/* 4 Kartu Metrik Ringkasan Teratas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Metrik 1: Total Pasien Terpantau */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Kasus Terpantau</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {fmt(stats.total)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{data.kpi?.length || 0}</span> kategori penyakit aktif
          </div>
        </div>

        {/* Metrik 2: Penyakit Tertinggi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kasus Tertinggi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 truncate" title={topDisease?.name}>
            {topDisease?.name || '—'}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{fmt(topDisease?.total)} kasus</span>
            <span className="font-semibold text-slate-700">
              {stats.total > 0 ? Math.round(((topDisease?.total || 0) / stats.total) * 100) : 0}% porsi
            </span>
          </div>
        </div>

        {/* Metrik 3: Fasilitas Terpadat */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fasilitas Terbanyak</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 truncate" title={topFacility?.name}>
            {topFacility?.name ? `Pusk. ${topFacility.name}` : '—'}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{fmt(topFacility?.count)} kunjungan</span>
            <span className="font-semibold text-emerald-600">Peringkat 1</span>
          </div>
        </div>

        {/* Metrik 4: Komposisi Gender Pasien */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demografi Gender</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Users2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-sm font-bold text-slate-900">
            <span className="text-blue-600 font-semibold text-xs">L: {fmt(stats.male)} ({stats.malePct}%)</span>
            <span className="text-rose-500 font-semibold text-xs">P: {fmt(stats.female)} ({stats.femalePct}%)</span>
          </div>
          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="bg-blue-500 transition-all duration-500" style={{ width: `${stats.malePct}%` }} />
            <div className="bg-rose-400 transition-all duration-500" style={{ width: `${stats.femalePct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>Laki-laki</span>
            <span>Perempuan</span>
          </div>
        </div>

      </div>

      {/* Grid Komparasi Dua Kolom */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Kolom 1: Distribusi Beban Tiap Penyakit */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distribusi Kasus Berdasarkan Penyakit</h2>
              <p className="text-xs text-slate-500">Perbandingan jumlah pasien antar kategori penyakit</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {sortedDiseases.length} Penyakit
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {sortedDiseases.map((dis) => {
              const pct = stats.total > 0 ? Math.round(((dis.total || 0) / stats.total) * 100) : 0;
              const barWidth = maxDisCount > 0 ? ((dis.total || 0) / maxDisCount) * 100 : 0;
              return (
                <div 
                  key={dis.id} 
                  onClick={() => onSelectDisease && onSelectDisease(dis.id)}
                  className="group -mx-2 cursor-pointer rounded-xl p-2.5 transition hover:bg-slate-50"
                  title="Klik untuk melihat detail penyakit ini"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: dis.color }} />
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                        {dis.name}
                      </span>
                      <span className="text-xs font-mono text-slate-400">({pct}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 tabular-nums">{fmt(dis.total)}</span>
                      <span className="text-xs text-slate-400 ml-1">pasien</span>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: dis.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Kolom 2: Leaderboard Beban Kasus Fasilitas Kesehatan */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fasilitas Kesehatan Teratas</h2>
              <p className="text-xs text-slate-500">Puskesmas dengan volume kunjungan diagnosa tertinggi</p>
            </div>
            <span className="text-xs font-medium text-slate-400">Top 7 Wilayah</span>
          </div>

          <div className="mt-5 space-y-3.5">
            {topPuskesmas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada data puskesmas tersedia.</div>
            ) : (
              topPuskesmas.map((pusk, idx) => {
                const barWidth = maxPusk > 0 ? (pusk.count / maxPusk) * 100 : 0;
                return (
                  <div key={pusk.name} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 font-extrabold ring-1 ring-amber-300/60' :
                      idx === 1 ? 'bg-slate-200 text-slate-700 font-bold' :
                      idx === 2 ? 'bg-orange-100 text-orange-800 font-bold' :
                      'bg-slate-100 text-slate-500 font-medium'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 truncate">Puskesmas {pusk.name}</span>
                        <span className="font-bold text-slate-900 tabular-nums ml-2 shrink-0">
                          {fmt(pusk.count)} <span className="font-normal text-slate-400">pasien</span>
                        </span>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
