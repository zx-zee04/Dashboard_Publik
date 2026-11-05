import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_HEADERS } from './config/api';
import { 
  UploadCloud, CheckCircle2, LogOut, RefreshCw, Sliders, 
  Eye, Plus, Trash2, Database, LayoutTemplate, X, Palette, Edit3, Tag 
} from 'lucide-react';

const DISEASE_TEMPLATES = [
  { id: 'ispa', name: 'ISPA', codes: 'J00, J01, J02, J03, J04, J05, J06, J09, J10, J11, J12, J13, J14, J15, J16, J17, J18, J20, J21, J22', color: '#f97316' },
  { id: 'diare', name: 'DIARE', codes: 'A00, A02, A03, A04, A06, A08, A09', color: '#10b981' },
  { id: 'tbc', name: 'TUBERKULOSIS', codes: 'A15, A16, A17, A18, A19', color: '#8b5cf6' },
  { id: 'konjungtivitis', name: 'KONJUNGTIVITIS', codes: 'H10, H11, H13', color: '#ef4444' },
  { id: 'dm', name: 'DIABETES MELITUS', codes: 'E10, E11', color: '#3b82f6' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); 
  
  // State Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // State Kustomisasi Utama
  const [title, setTitle] = useState("Dashboard Surveilans Kasus Penyakit");
  const [subtitle, setSubtitle] = useState("Rekam Medik Elektronik Puskesmas");
  const [logo, setLogo] = useState("Hospital");
  const [diseases, setDiseases] = useState([]);

  // State Modal & Form Editor
  const [modalView, setModalView] = useState('none'); // 'none', 'select_template', 'edit_form'
  const [activeFormData, setActiveFormData] = useState(null); // Menyimpan data sementara saat diedit
  const [tagInput, setTagInput] = useState(''); // Input sementara untuk ngetik ICD-10

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

  // --- LOGIKA EDITOR CHIP / TAGS ---
  const handleOpenForm = (diseaseToEdit) => {
    // Ubah string koma "A01, A02" menjadi array ['A01', 'A02']
    const initialTags = diseaseToEdit.codes 
      ? diseaseToEdit.codes.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    
    setActiveFormData({ ...diseaseToEdit, tags: initialTags });
    setTagInput('');
    setModalView('edit_form');
  };

  const handleKeyDownTag = (e) => {
    // Jika user tekan Enter atau Koma
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toUpperCase();
      
      if (newTag && !activeFormData.tags.includes(newTag)) {
        setActiveFormData({ ...activeFormData, tags: [...activeFormData.tags, newTag] });
      }
      setTagInput(''); // Kosongkan input
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setActiveFormData({
      ...activeFormData,
      tags: activeFormData.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleSaveForm = () => {
    // Gabungkan kembali array tags menjadi string "A01, A02" untuk disimpan ke backend
    const finalCodes = activeFormData.tags.join(', ');
    const finalDisease = { 
      id: activeFormData.id, 
      name: activeFormData.name, 
      codes: finalCodes, 
      color: activeFormData.color 
    };

    const isExist = diseases.find(d => d.id === finalDisease.id);
    if (isExist) {
      // Update jika sudah ada
      setDiseases(diseases.map(d => d.id === finalDisease.id ? finalDisease : d));
    } else {
      // Tambah baru
      setDiseases([...diseases, finalDisease]);
    }
    setModalView('none');
  };

  const removeDisease = (id) => {
    if (window.confirm('Yakin ingin menghapus pelacakan penyakit ini?')) {
      setDiseases(diseases.filter(d => d.id !== id));
    }
  };

  // --- API HANDLERS ---
  const handleUploadRawData = async () => { /* Logika sama seperti sebelumnya */ };
  const handleSaveConfig = async () => { /* Logika sama seperti sebelumnya */ };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar & Tab Menu (Kode disederhanakan untuk contoh, biarkan sama seperti sebelumnya) */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><Sliders size={18} /></span>
            <div><h1 className="text-sm font-bold text-slate-900 leading-tight">Admin Workspace</h1><p className="text-[11px] text-slate-500">Pusat Kendali Data</p></div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"><Eye size={14} /> Publik</a>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"><LogOut size={14} /> Keluar</button>
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 flex gap-8">
          <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-2 py-4 border-b-2 text-sm font-semibold transition-colors ${activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Database size={16} /> Data Center</button>
          <button onClick={() => setActiveTab('studio')} className={`flex items-center gap-2 py-4 border-b-2 text-sm font-semibold transition-colors ${activeTab === 'studio' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Palette size={16} /> Studio Visual</button>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        
        {/* --- TAB 1: UPLOAD (Tetap Sama) --- */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
              <h2 className="text-xl font-bold mb-2">Unggah Database Rekam Medis</h2>
              <p className="text-sm text-slate-500 mb-6">Sistem akan membuang kolom sensitif dan menyimpan format analitik.</p>
              {/* Box Upload Sederhana */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 hover:border-blue-400">
                <UploadCloud size={32} className="text-blue-500 mb-4" />
                <span className="font-semibold text-slate-800">{selectedFile ? selectedFile.name : 'Pilih file .xlsx'}</span>
                <input type="file" accept=".xlsx" onChange={(e) => { if(e.target.files[0]) setSelectedFile(e.target.files[0]) }} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* --- TAB 2: STUDIO VISUAL BARU (Layout Kompak) --- */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kolom Kiri: Pengaturan Header */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-4"><LayoutTemplate size={16} className="text-blue-600"/> Teks & Logo</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Utama</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Sumber Data</label>
                    <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ikon</label>
                    <select value={logo} onChange={(e) => setLogo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
                      <option value="Hospital">Rumah Sakit</option>
                      <option value="Activity">Detak Jantung</option>
                      <option value="ShieldPlus">Tameng Medis</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan dipindah ke kiri agar menonjol */}
              <button onClick={handleSaveConfig} className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                <CheckCircle2 size={18} /> Terapkan ke Publik
              </button>
            </div>

            {/* Kolom Kanan: Daftar Penyakit Kompak */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2"><Sliders size={16} className="text-blue-600"/> Filter Penyakit Aktif</h2>
                  <p className="text-[11px] text-slate-500">Kelola indikator kesehatan yang dipantau.</p>
                </div>
                <button onClick={() => setModalView('select_template')} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition">
                  <Plus size={14} /> Tambah Baru
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {diseases.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Belum ada penyakit yang diatur.</div>
                ) : (
                  <ul className="space-y-1">
                    {diseases.map((dis) => (
                      <li key={dis.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: dis.color}}></span>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-none">{dis.name}</p>
                            <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[250px] font-mono">{dis.codes}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenForm(dis)} className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"><Edit3 size={14}/></button>
                          {diseases.length > 1 && (
                            <button onClick={() => removeDisease(dis.id)} className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition"><Trash2 size={14}/></button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* --- MODAL MULTIGUNA (Template & Editor) --- */}
      {modalView !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-800">
                {modalView === 'select_template' ? 'Pilih Template Penyakit' : 'Editor Pengaturan Penyakit'}
              </h3>
              <button onClick={() => setModalView('none')} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
            </div>
            
            {/* VIEW: PILIH TEMPLATE */}
            {modalView === 'select_template' && (
              <div className="p-6 bg-slate-50 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {DISEASE_TEMPLATES.map(temp => (
                    <button key={temp.id} onClick={() => handleOpenForm(temp)} className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: temp.color}}></span>
                        <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600">{temp.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 truncate w-full">{temp.codes}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => handleOpenForm({ id: `custom_${Date.now()}`, name: 'Penyakit Baru', codes: '', color: '#3b82f6' })} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 font-bold hover:border-blue-500 hover:text-blue-600 bg-white">
                  <Plus size={16} /> Buat Kustom dari Nol
                </button>
              </div>
            )}

            {/* VIEW: FORM EDITOR (Mode Chips/Tags) */}
            {modalView === 'edit_form' && activeFormData && (
              <div className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-20">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Warna</label>
                    <input type="color" value={activeFormData.color} onChange={(e) => setActiveFormData({...activeFormData, color: e.target.value})} className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 p-0.5" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Label / Nama Penyakit</label>
                    <input type="text" value={activeFormData.name} onChange={(e) => setActiveFormData({...activeFormData, name: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Kode ICD-10 (Filter Data)</span>
                    <span className="font-normal text-slate-400">Ketik kode, lalu tekan Enter / Koma</span>
                  </label>
                  
                  {/* Area Input & Chips */}
                  <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 min-h-[80px]">
                    {activeFormData.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition"><X size={12} /></button>
                      </span>
                    ))}
                    
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                      onKeyDown={handleKeyDownTag}
                      placeholder={activeFormData.tags.length === 0 ? "Contoh: A01, A09..." : "Tambah kode..."}
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-mono uppercase px-1"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setModalView('none')} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Batal</button>
                  <button onClick={handleSaveForm} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">Simpan Perubahan</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}