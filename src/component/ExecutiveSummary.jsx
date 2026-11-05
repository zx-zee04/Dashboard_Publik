import React, { useMemo } from 'react';
import { Activity, MapPin, AlertCircle, Users } from 'lucide-react';

export default function ExecutiveSummary({ data }) {
  // 1. Kalkulasi Total Global (Semua Penyakit)
  const globalStats = useMemo(() => {
    let total = 0, male = 0, female = 0;
    data.kpi.forEach(item => {
      total += (item.total || 0);
      male += (item.male || 0);
      female += (item.female || 0);
    });
    return { total, male, female };
  }, [data.kpi]);

  // 2. Data Komparasi Penyakit
  const topDiseases = useMemo(() => {
    return [...data.kpi].sort((a, b) => b.total - a.total);
  }, [data.kpi]);

  // 3. Leaderboard Top 7 Puskesmas Baban Kasus Tertinggi
  const topPuskesmas = useMemo(() => {
    const puskMap = {};
    Object.values(data.puskesmas).forEach(list => {
      list.forEach(p => {
        puskMap[p.name] = (puskMap[p.name] || 0) + p.count;
      });
    });
    return Object.entries(puskMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Ambil 7 teratas
  }, [data.puskesmas]);

  // Nilai maksimum untuk menghitung panjang persentase Bar
  const maxDisease = topDiseases[0]?.total || 1;
  const maxPusk = topPuskesmas[0]?.count || 1;

  return (
    <div className="space-y-6 animation-fade-in">
      
      {/* PANEL 1: Total Global (Grand Total) */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 shadow-md md:p-10">
        {/* Hiasan Latar Belakang */}
        <div className="absolute -right-10 -top-20 opacity-10">
          <Activity size={250} className="text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Keseluruhan Kasus</h2>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-6xl font-black text-white md:text-7xl">
                {globalStats.total.toLocaleString('id-ID')}
              </span>
              <span className="text-lg font-medium text-slate-400">Pasien Terlacak</span>
            </div>
          </div>

          <div className="flex gap-6 border-t border-slate-700 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Laki-Laki</p>
              <p className="text-3xl font-bold text-blue-400">{globalStats.male.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Perempuan</p>
              <p className="text-3xl font-bold text-pink-400">{globalStats.female.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* PANEL 2: Komparasi Penyakit Tertinggi */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <AlertCircle size={20} className="text-red-500" />
            <h3 className="font-bold text-slate-800">Distribusi Penyakit Dominan</h3>
          </div>
          
          <div className="space-y-5">
            {topDiseases.map((dis, idx) => (
              <div key={dis.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{idx + 1}. {dis.name}</span>
                  <span className="font-bold text-slate-900">{Number(dis.total).toLocaleString('id-ID')}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(dis.total / maxDisease) * 100}%`,
                      backgroundColor: dis.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 3: Leaderboard Puskesmas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <MapPin size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">Top 7 Puskesmas (Beban Kasus Tertinggi)</h3>
          </div>

          <div className="space-y-4">
            {topPuskesmas.map((pusk, idx) => (
              <div key={idx} className="flex items-center gap-4">
                {/* Ranking Badge */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' :
                  idx === 1 ? 'bg-slate-200 text-slate-600 ring-1 ring-slate-300' :
                  idx === 2 ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  #{idx + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 truncate max-w-[200px]">{pusk.name}</span>
                    <span className="font-semibold text-slate-500">{Number(pusk.count).toLocaleString('id-ID')} pasien</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${(pusk.count / maxPusk) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            
            {topPuskesmas.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">Data puskesmas belum tersedia.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}