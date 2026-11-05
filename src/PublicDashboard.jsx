import { useState, useEffect } from 'react';
import Header from './component/HeaderComp';
import SummaryPanel from './component/SummaryPanel';
import BarChartComp from './component/BarChartComp';
import AgeDistribution from './component/AgeDistribution';
import LineChartComp from './component/LineChartComp';
import { API_BASE_URL, API_HEADERS } from './config/api';
import ExecutiveSummary from './component/ExecutiveSummary'; // <-- Import komponen baru

export default function PublicDashboard() {
  const [data, setData] = useState(null);
  
  // Default diubah menjadi 'summary' alih-alih penyakit pertama
  const [selectedDisease, setSelectedDisease] = useState('summary'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: API_HEADERS })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Memuat data dashboard...
      </div>
    );
  }

  if (!data || !data.kpi || data.kpi.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-500 font-medium">
        Koneksi ke backend belum siap atau data kosong.
      </div>
    );
  }

  // Mendapatkan data penyakit yang sedang aktif (jika bukan di tab summary)
  const activeKpi = data.kpi.find((item) => item.id === selectedDisease);
  
  const trenData = activeKpi && data.tren_harian ? (data.tren_harian[selectedDisease] || []) : [];
  const startDate = trenData.length > 0 ? trenData[0].date : '';
  const endDate = trenData.length > 0 ? trenData[trenData.length - 1].date : '';
  const currentYear = new Date().getFullYear();
  const dateRangeStr = startDate && endDate ? `${startDate} - ${endDate} ${currentYear}` : 'Tidak ada data rentang waktu';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <Header 
        title={data.metadata?.judul} 
        subtitle={data.metadata?.sumber} 
        lastUpdate={data.metadata?.tanggal_update} 
        logoName={data.metadata?.logo}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        
        {/* TAB SELECTOR */}
        <section className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 justify-center sm:justify-start">
          
          {/* Tombol Tab Ringkasan (Paling Kiri) */}
          <button
            onClick={() => setSelectedDisease('summary')}
            className={`rounded-md px-5 py-2 text-xs font-bold transition-all shadow-sm border ${
              selectedDisease === 'summary'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            RINGKASAN EKSEKUTIF
          </button>

          {/* Tombol Tab Penyakit Dinamis */}
          {data.kpi.map((kpi) => (
            <button
              key={kpi.id}
              onClick={() => setSelectedDisease(kpi.id)}
              className={`rounded-md px-5 py-2 text-xs font-bold transition-all shadow-sm border ${
                selectedDisease === kpi.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              LAPORAN {kpi.name.toUpperCase()}
            </button>
          ))}
        </section>

        {/* LOGIKA PERGANTIAN HALAMAN */}
        {selectedDisease === 'summary' ? (
          
          // Tampilkan Halaman Executive Summary Jika Tab Ringkasan Dipilih
          <ExecutiveSummary data={data} />
          
        ) : (
          
          // Tampilkan Layout Lama Jika Tab Penyakit Spesifik Dipilih
          activeKpi && (
            <div className="animation-fade-in">
              <SummaryPanel 
                activeKpi={activeKpi} 
                dateRangeStr={dateRangeStr} 
              />
              <BarChartComp
                title={`Kunjungan ${activeKpi.name} Berdasarkan Puskesmas`}
                subtitle="Sebaran total kasus di setiap fasilitas kesehatan"
                data={(data.puskesmas && data.puskesmas[selectedDisease]) || []}
                barColor={activeKpi.color}
              />
              <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <LineChartComp
                  title={`Tren Harian Kasus ${activeKpi.name}`}
                  subtitle="Pergerakan data waktu pemeriksaan"
                  data={(data.tren_harian && data.tren_harian[selectedDisease]) || []}
                  lineColor={activeKpi.color}
                />
                <AgeDistribution
                  title={`Distribusi Kelompok Usia (${activeKpi.name})`}
                  subtitle="Rentang usia pasien terdiagnosa"
                  data={(data.kelompok_usia && data.kelompok_usia[selectedDisease]) || []}
                />
              </section>
            </div>
          )
          
        )}

      </main>
    </div>
  );
}