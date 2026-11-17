import { useState, useEffect, useMemo } from 'react';
import HeaderComp from './component/HeaderComp';
import SummaryPanel from './component/SummaryPanel';
import BarChartComp from './component/BarChartComp';
import AgeDistribution from './component/AgeDistribution';
import LineChartComp from './component/LineChartComp';
import ExecutiveSummary from './component/ExecutiveSummary';
import { MapPin, ChevronDown, RefreshCw, X, SlidersHorizontal } from 'lucide-react';
import { API_BASE_URL, API_HEADERS } from './config';

export default function PublicDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('summary'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPuskesmas, setSelectedPuskesmas] = useState('Semua Puskesmas');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refreshWhenFocused = () => setRefreshKey((key) => key + 1);
    window.addEventListener('focus', refreshWhenFocused);
    return () => window.removeEventListener('focus', refreshWhenFocused);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // Ambil seluruh agregat sekali; perubahan filter memakai data di memori.
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: API_HEADERS, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat data (HTTP ${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(json?.kpi)) throw new Error('Format data dashboard tidak valid.');
        setDashboardData(json);
        setSelectedPuskesmas((current) => (
          current === 'Semua Puskesmas' || json.by_puskesmas?.[current]
            ? current
            : 'Semua Puskesmas'
        ));
        setSelectedDisease((current) => (
          current === 'summary' || json.kpi.some((item) => item.id === current)
            ? current
            : 'summary'
        ));
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Gagal mengambil data surveilans:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const data = useMemo(() => {
    if (!dashboardData || selectedPuskesmas === 'Semua Puskesmas') return dashboardData;
    const metrics = dashboardData.by_puskesmas?.[selectedPuskesmas];
    if (!metrics) return null;
    return { ...dashboardData, ...metrics, selected_puskesmas: selectedPuskesmas };
  }, [dashboardData, selectedPuskesmas]);

  if (loading && !dashboardData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <RefreshCw size={24} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Data Surveilans...</p>
        <p className="text-xs text-slate-400 mt-1">Mengambil data analitik puskesmas</p>
      </div>
    );
  }

  if (!data || !data.kpi || data.kpi.length === 0) {
    const missingPuskesmas = dashboardData && selectedPuskesmas !== 'Semua Puskesmas';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-200 mb-4">
          <MapPin size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          {missingPuskesmas ? 'Data Puskesmas Belum Tersedia' : 'Database Belum Siap atau Kosong'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
          {missingPuskesmas
            ? `Data ${selectedPuskesmas} belum tersedia. Muat ulang data atau pilih semua wilayah.`
            : error ? `Pesan: ${error}` : 'Belum ada data rekam medis yang diunggah ke server.'}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            {loading ? 'Memuat Data...' : 'Coba Muat Ulang'}
          </button>
          {missingPuskesmas && (
            <button
              type="button"
              onClick={() => setSelectedPuskesmas('Semua Puskesmas')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Tampilkan Semua Wilayah
            </button>
          )}
          <a 
            href="/portal-petugas" 
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            Buka Portal Petugas untuk Upload
          </a>
        </div>
      </div>
    );
  }

  const activeKpi = data?.kpi?.find((item) => item.id === selectedDisease);
  const trenData = activeKpi && data?.tren_harian ? (data.tren_harian[selectedDisease] || []) : [];
  const startDate = trenData.length > 0 ? trenData[0].date : '';
  const endDate = trenData.length > 0 ? trenData[trenData.length - 1].date : '';
  const currentYear = new Date().getFullYear();
  const dateRangeStr = startDate && endDate ? `${startDate} - ${endDate} ${currentYear}` : 'Rentang waktu aktif';

  const totalFacilities = data.available_puskesmas?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16">
      
      {/* Header Utama */}
      <HeaderComp 
        title={data.metadata?.judul} 
        subtitle={data.metadata?.sumber} 
        lastUpdate={data.metadata?.tanggal_update} 
        logoName={data.metadata?.logo}
        customLogo={data.metadata?.custom_logo}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {error && (
          <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Pembaruan data belum berhasil. Menampilkan data terakhir yang berhasil dimuat. Anda tetap bisa mengganti filter atau mencoba muat ulang.
          </p>
        )}

        {/* --- CONTROL BAR: TABS & FILTER WILAYAH --- */}
        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          
          {/* TAB NAVIGASI PENYAKIT */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDisease('summary')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedDisease === 'summary'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Ringkasan Eksekutif</span>
            </button>

            {data.kpi.map((kpi) => {
              const isSelected = selectedDisease === kpi.id;
              return (
                <button
                  key={kpi.id}
                  onClick={() => setSelectedDisease(kpi.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={isSelected ? { borderLeft: `3px solid ${kpi.color || '#3b82f6'}` } : undefined}
                >
                  <span 
                    className="h-2 w-2 rounded-full shrink-0" 
                    style={{ backgroundColor: kpi.color || '#3b82f6' }}
                  />
                  <span>{kpi.name}</span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>
                    {Number(kpi.total || 0).toLocaleString('id-ID')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* FILTER FASILITAS KESEHATAN / PUSKESMAS */}
          <div className="flex items-center gap-2 shrink-0 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
            <div className="relative w-full sm:w-auto">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <MapPin size={15} />
              </div>
              
              <select
                value={selectedPuskesmas}
                onChange={(e) => setSelectedPuskesmas(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-9 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="Semua Puskesmas">Semua Wilayah ({totalFacilities} Puskesmas)</option>
                {data.available_puskesmas && data.available_puskesmas.map((name) => (
                  <option key={name} value={name}>
                    Puskesmas {name}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {selectedPuskesmas !== 'Semua Puskesmas' && (
              <button
                onClick={() => setSelectedPuskesmas('Semua Puskesmas')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Reset ke Semua Puskesmas"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              aria-label="Muat ulang data"
              title={loading ? 'Memperbarui data...' : 'Muat ulang data'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

        </section>

        {/* KONTEN UTAMA */}
        {selectedDisease === 'summary' ? (
          <ExecutiveSummary 
            data={data}
            onSelectDisease={(id) => setSelectedDisease(id)} 
          />
        ) : (
          activeKpi && (
            <div className="space-y-6">
              
              {/* Kartu Ringkasan Penyakit Terpilih */}
              <SummaryPanel activeKpi={activeKpi} dateRangeStr={dateRangeStr} />

              {/* Bar Chart Puskesmas (Hanya tampil jika sedang dalam mode Semua Puskesmas) */}
              {selectedPuskesmas === 'Semua Puskesmas' && (
                <BarChartComp
                  title={`Sebaran Kasus ${activeKpi.name} per Fasilitas Kesehatan`}
                  subtitle="Perbandingan jumlah penderita di masing-masing puskesmas"
                  data={(data.puskesmas && data.puskesmas[selectedDisease]) || []}
                  barColor={activeKpi.color}
                />
              )}

              {/* Grid Tren Harian & Distribusi Usia */}
              <div className={`grid grid-cols-1 gap-6 ${selectedPuskesmas === 'Semua Puskesmas' ? 'lg:grid-cols-2' : ''}`}>
                <LineChartComp
                  title={`Tren Waktu Kasus ${activeKpi.name}`}
                  subtitle={`Fluktuasi harian pemeriksaan (${selectedPuskesmas})`}
                  data={(data.tren_harian && data.tren_harian[selectedDisease]) || []}
                  lineColor={activeKpi.color}
                />

                <AgeDistribution
                  title={`Kelompok Usia Pasien (${activeKpi.name})`}
                  subtitle={`Stratifikasi demografi penderita (${selectedPuskesmas})`}
                  data={(data.kelompok_usia && data.kelompok_usia[selectedDisease]) || []}
                />
              </div>

            </div>
          )
        )}

      </main>

    </div>
  );
}
