import React, { useState, useEffect } from 'react'; // <-- Pastikan useEffect diimpor
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_HEADERS } from './config/api';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, LogOut, 
  RefreshCw, Layers, Sliders, SlidersHorizontal, 
  FileCheck2, Eye, Plus, Trash2 
} from 'lucide-react';

export default function AdminDashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Konfigurasi Header
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [logo, setLogo] = useState("Hospital");

  // State Dinamis
  const [diseases, setDiseases] = useState([]);

  const navigate = useNavigate();

useEffect(() => {
    // Ambil data konfigurasi terakhir dari backend saat halaman admin dimuat
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: API_HEADERS })
      .then((res) => res.json())
      .then((json) => {
        if (json.metadata) {
          setTitle(json.metadata.judul || "Dashboard Surveilans Kasus Penyakit");
          setSubtitle(json.metadata.sumber || "Rekam Medik Elektronik Puskesmas");
          setLogo(json.metadata.logo || "Hospital");
        }
        if (json.diseases_config && json.diseases_config.length > 0) {
          setDiseases(json.diseases_config);
        }
      })
      .catch((err) => console.error("Gagal memuat konfigurasi:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuth');
    navigate('/portal-petugas');
  };

  // Fungsi Manajemen List Penyakit
  const addDisease = () => {
    const newId = `custom_${Date.now()}`;
    setDiseases([...diseases, { id: newId, name: 'Penyakit Baru', codes: '', color: '#64748b' }]);
  };

  const updateDisease = (id, field, value) => {
    setDiseases(diseases.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDisease = (id) => {
    setDiseases(diseases.filter(d => d.id !== id));
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('judul', title);
    formData.append('sumber', subtitle);
    formData.append('logo', logo);
    
    // Kirim seluruh konfigurasi penyakit sebagai format JSON string
    formData.append('diseases_config', JSON.stringify(diseases));

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: API_HEADERS,
        body: formData,
      });

      if (!response.ok) throw new Error('Gagal memproses berkas');

      await response.json();
      setIsUploading(false);
      setUploadSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses data.');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-sm">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Admin Dashboard</h1>
              <p className="text-[11px] text-slate-500">Konfigurasi Modul & Sinkronisasi Data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              <Eye size={14} /> Lihat Publik
            </a>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition shadow-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Studio Body */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* KOLOM KIRI: Filter Builder (7 Kolom) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                <Sliders size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Kustomisasi Teks Utama</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Dashboard</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sub-judul / Sumber Data</label>
                  <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ikon / Logo Dashboard</label>
                  <select 
                    value={logo} 
                    onChange={(e) => setLogo(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Hospital">Bangunan Rumah Sakit (Default)</option>
                    <option value="Activity">Garis Detak (Activity)</option>
                    <option value="ShieldPlus">Tameng Medis (Shield)</option>
                    <option value="HeartPulse">Detak Jantung (Heart Pulse)</option>
                    <option value="Stethoscope">Stetoskop</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Builder Widget Penyakit</h2>
                </div>
                <button onClick={addDisease} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition">
                  <Plus size={14} /> Tambah Penyakit
                </button>
              </div>
              
              <p className="text-xs text-slate-500 mb-4">
                Atur penyakit yang ingin dilacak. Masukkan kode ICD-10 dipisah dengan koma (contoh: J00, J01, A09).
              </p>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {diseases.map((dis, index) => (
                  <div key={dis.id} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                    <div className="flex gap-4">
                      {/* Warna */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Warna</label>
                        <input 
                          type="color" 
                          value={dis.color} 
                          onChange={(e) => updateDisease(dis.id, 'color', e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5" 
                        />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        {/* Nama Penyakit */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Label (Tampil di Grafik)</label>
                          <input 
                            type="text" 
                            value={dis.name} 
                            onChange={(e) => updateDisease(dis.id, 'name', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        {/* Kode ICD-10 */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Kode ICD-10 (Pisahkan dg koma)</label>
                          <textarea 
                            rows="2"
                            value={dis.codes} 
                            onChange={(e) => updateDisease(dis.id, 'codes', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:border-blue-500"
                            placeholder="Contoh: A00, A01, A02..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tombol Hapus (jangan tampilkan jika sisa 1) */}
                    {diseases.length > 1 && (
                      <button 
                        onClick={() => removeDisease(dis.id)}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                        title="Hapus Penyakit"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Upload & Eksekusi (5 Kolom) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Unggah Laporan Excel</h2>
                  <p className="text-[11px] text-slate-500">Hanya mendukung file hasil dari Laporan Pelayanan Pasien E-Dinkes</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                  <AlertTriangle size={12} />
                  <span>Timpa Menyeluruh</span>
                </div>
              </div>

              {/* Upload Box */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 mb-3">
                  <UploadCloud size={24} />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Pilih / Drop file .xlsx'}
                </span>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setUploadSuccess(false);
                  }
                }} className="hidden" />
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  <FileCheck2 size={16} className="text-emerald-600" />
                  <span>File siap diproses dengan <b className="text-slate-800">{diseases.length} filter penyakit</b>.</span>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6">
                <button
                  onClick={handleProcessUpload}
                  disabled={!selectedFile || isUploading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
                    !selectedFile || isUploading
                      ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {isUploading ? (
                    <><RefreshCw size={16} className="animate-spin" /> Memproses Data...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Terapkan & Perbarui Publik</>
                  )}
                </button>
              </div>

              {uploadSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 text-center">
                  ✓ Berhasil! Data diolah sesuai custom filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}