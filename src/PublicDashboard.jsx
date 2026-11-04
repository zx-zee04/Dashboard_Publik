import React, { useState, useEffect } from 'react';
import Header from './component/HeaderComp';
import SummaryPanel from './component/SummaryPanel'; // Import komponen panel baru
import BarChartComp from './component/BarChartComp';
import AgeDistribution from './component/AgeDistribution';
import LineChartComp from './component/LineChartComp';
import { API_BASE_URL, API_HEADERS } from './config/api';

export default function PublicDashboard() {
  const [data, setData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: API_HEADERS })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        if (json.kpi && json.kpi.length > 0) {
          setSelectedDisease(json.kpi[0].id);
        }
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

  const activeKpi = data.kpi.find((item) => item.id === selectedDisease) || data.kpi[0];
  
  // Mengambil rentang tanggal secara dinamis dari data tren harian
  const trenData = (data.tren_harian && data.tren_harian[selectedDisease]) || [];
  const startDate = trenData.length > 0 ? trenData[0].date : '';
  const endDate = trenData.length > 0 ? trenData[trenData.length - 1].date : '';
  const currentYear = new Date().getFullYear();
  const dateRangeStr = startDate && endDate ? `${startDate} - ${endDate} ${currentYear}` : 'Tidak ada data rentang waktu';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* 1. Header Modular */}
      <Header 
        title={data.metadata?.judul} 
        subtitle={data.metadata?.sumber} 
        lastUpdate={data.metadata?.tanggal_update}
        logoName={data.metadata?.logo} // <-- Tambahkan baris ini
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        
        {/* 2. Selector Tabs Berbasis Teks (Dipindah ke atas Panel) */}
        <section className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 justify-center sm:justify-start">
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
              Laporan {kpi.name.toUpperCase()}
            </button>
          ))}
        </section>

        {/* 3. Panel Ringkasan Utama Dinamis (Pengganti KpiCard) */}
        <SummaryPanel 
          activeKpi={activeKpi} 
          dateRangeStr={dateRangeStr} 
        />

        {/* 4. Bar Chart Puskesmas Modular */}
        <BarChartComp
          title={`Kunjungan ${activeKpi?.name} Berdasarkan Puskesmas di Kutai Kartanegara`}
          subtitle="Sebaran total kasus di setiap fasilitas kesehatan"
          data={(data.puskesmas && data.puskesmas[selectedDisease]) || []}
          barColor={activeKpi?.color}
        />

        {/* 5. Line Chart & Age Distribution Modular */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LineChartComp
            title={`Tren Harian Kasus ${activeKpi?.name}`}
            subtitle="Pergerakan data waktu pemeriksaan"
            data={(data.tren_harian && data.tren_harian[selectedDisease]) || []}
            lineColor={activeKpi?.color}
          />
          <AgeDistribution
            title={`Distribusi Kelompok Usia (${activeKpi?.name})`}
            subtitle="Rentang usia pasien terdiagnosa"
            data={(data.kelompok_usia && data.kelompok_usia[selectedDisease]) || []}
          />
        </section>
      </main>
    </div>
  );
}