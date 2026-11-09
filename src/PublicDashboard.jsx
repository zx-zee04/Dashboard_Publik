import { useState, useEffect } from 'react';
import Header from './component/HeaderComp';
import SummaryPanel from './component/SummaryPanel';
import BarChartComp from './component/BarChartComp';
import AgeDistribution from './component/AgeDistribution';
import LineChartComp from './component/LineChartComp';
import { API_BASE_URL, API_HEADERS } from './config/api';
import ExecutiveSummary from './component/ExecutiveSummary'; // <-- Import komponen baru
import { MapPin } from 'lucide-react'; // <-- Import Ikon MapPin

export default function PublicDashboard() {
  const [data, setData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('summary'); 
  const [loading, setLoading] = useState(true);
  
  // State Baru untuk Global Filter Puskesmas
  const [selectedPuskesmas, setSelectedPuskesmas] = useState('Semua Puskesmas');

  // Fungsi fetch dipisah agar bisa dipanggil saat dropdown berubah
  useEffect(() => {
    setLoading(true);
    // Jika 'Semua Puskesmas', fetch normal. Jika spesifik, tambahkan parameter query.
    const url = selectedPuskesmas === 'Semua Puskesmas' 
      ? `${API_BASE_URL}/api/dashboard`
      : `${API_BASE_URL}/api/dashboard?puskesmas=${encodeURIComponent(selectedPuskesmas)}`;

    fetch(url, { headers: API_HEADERS })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedPuskesmas]); // <-- Akan hit ulang setiap dropdown berubah

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Memuat data analitik...
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

  const activeKpi = data.kpi.find((item) => item.id === selectedDisease);
  const trenData = activeKpi && data.tren_harian ? (data.tren_harian[selectedDisease] || []) : [];
  const startDate = trenData.length > 0 ? trenData[0].date : '';
  const endDate = trenData.length > 0 ? trenData[trenData.length - 1].date : '';
  const currentYear = new Date().getFullYear();
  const dateRangeStr = startDate && endDate ? `${startDate} - ${endDate} ${currentYear}` : 'Tidak ada data waktu';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <Header 
        title={data.metadata?.judul} 
        subtitle={data.metadata?.sumber} 
        lastUpdate={data.metadata?.tanggal_update} 
        logoName={data.metadata?.logo}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        
        {/* --- GLOBAL FILTER BAR (BARU) --- */}
        <section className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wilayah Analisis</h3>
              <p className="text-sm font-bold text-slate-800">Filter Fasilitas Kesehatan</p>
            </div>
          </div>
          
          <select
            value={selectedPuskesmas}
            onChange={(e) => setSelectedPuskesmas(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
          >
            <option value="Semua Puskesmas">Semua Puskesmas (Global Kabupaten)</option>
            
            {/* Render daftar puskesmas otomatis dari backend */}
            {data.available_puskesmas && data.available_puskesmas.map((puskName) => (
              <option key={puskName} value={puskName}>
                Puskesmas {puskName}
              </option>
            ))}
          </select>
        </section>

        {/* TAB SELECTOR */}
        <section className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 justify-center sm:justify-start">
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

        {/* KONTEN HALAMAN */}
        <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'opacity-100 transition-opacity'}>
          {selectedDisease === 'summary' ? (
            <ExecutiveSummary data={data} />
          ) : (
            activeKpi && (
              <div className="animation-fade-in">
                <SummaryPanel activeKpi={activeKpi} dateRangeStr={dateRangeStr} />
                
                {/* Sembunyikan BarChart puskesmas jika sudah filter 1 puskesmas */}
                {selectedPuskesmas === 'Semua Puskesmas' && (
                  <BarChartComp
                    title={`Kunjungan ${activeKpi.name} Berdasarkan Puskesmas`}
                    subtitle="Sebaran total kasus di setiap fasilitas kesehatan"
                    data={(data.puskesmas && data.puskesmas[selectedDisease]) || []}
                    barColor={activeKpi.color}
                  />
                )}
                
                <section className={`mt-6 grid grid-cols-1 gap-6 ${selectedPuskesmas === 'Semua Puskesmas' ? 'lg:grid-cols-2' : ''}`}>
                  <LineChartComp
                    title={`Tren Harian Kasus ${activeKpi.name}`}
                    subtitle={`Pergerakan data waktu pemeriksaan (${selectedPuskesmas})`}
                    data={(data.tren_harian && data.tren_harian[selectedDisease]) || []}
                    lineColor={activeKpi.color}
                  />
                  <AgeDistribution
                    title={`Distribusi Kelompok Usia (${activeKpi.name})`}
                    subtitle={`Rentang usia pasien terdiagnosa (${selectedPuskesmas})`}
                    data={(data.kelompok_usia && data.kelompok_usia[selectedDisease]) || []}
                  />
                </section>
              </div>
            )
          )}
        </div>

      </main>
    </div>
  );
}