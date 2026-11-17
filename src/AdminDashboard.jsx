import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_HEADERS } from './config';
import { 
  FileSpreadsheet, Sliders, Palette, Eye, LogOut, Menu, X, 
  Plus, Trash2, Edit3, CheckCircle2, AlertCircle, RefreshCw, 
  UploadCloud, ExternalLink, ShieldCheck, Database, Search, 
  ChevronRight, Sparkles, HelpCircle, Activity, Hospital, HeartPulse, Stethoscope, Users
} from 'lucide-react';

// Template Standar Surveilans Epidemiologi Kemenkes / SKDR
const PRESET_TEMPLATES = [
  { id: 'ispa', name: 'ISPA', codes: 'J00, J01, J02, J03, J04, J05, J06, J09, J10, J11, J12, J13, J14, J15, J16, J17, J18, J20, J21, J22', color: '#ea580c' },
  { id: 'diare', name: 'DIARE AKUT', codes: 'A00, A02, A03, A04, A06, A08, A09', color: '#16a34a' },
  { id: 'tbc', name: 'TUBERKULOSIS', codes: 'A15, A16, A17, A18, A19', color: '#9333ea' },
  { id: 'dbd', name: 'DEMAM BERDARAH (DBD)', codes: 'A90, A91', color: '#dc2626' },
  { id: 'konjungtivitis', name: 'KONJUNGTIVITIS', codes: 'H10, H11, H13', color: '#e11d48' },
  { id: 'hipertensi', name: 'HIPERTENSI', codes: 'I10, I11, I12, I13, I15', color: '#4f46e5' },
  { id: 'dm', name: 'DIABETES MELITUS', codes: 'E10, E11, E12, E13, E14', color: '#2563eb' }
];

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#ea580c', // Orange
  '#16a34a', // Green
  '#dc2626', // Red
  '#9333ea', // Purple
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#e11d48', // Rose
  '#ca8a04', // Amber
  '#475569', // Slate
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('diagnosa'); // 'import', 'diagnosa', 'tampilan'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [diseases, setDiseases] = useState([]);
  const [title, setTitle] = useState("Dashboard Surveilans Kasus Penyakit");
  const [subtitle, setSubtitle] = useState("Rekam Medik Elektronik Puskesmas");
  const [logo, setLogo] = useState("Hospital");
  const [customLogo, setCustomLogo] = useState("");
  const [logoType, setLogoType] = useState("icon"); // 'icon' | 'custom'
  const [lastUpdate, setLastUpdate] = useState("Belum ada data");

  // State Import File
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // State Modal / Drawer Diagnosa
  const [modalMode, setModalMode] = useState('none'); // 'none' | 'edit' | 'template'
  const [editingItem, setEditingItem] = useState(null);
  const [chipInput, setChipInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State Pemantauan Pengguna
  const [userList, setUserList] = useState([]);
  const [userStats, setUserStats] = useState({ total_users: 0, total_masyarakat: 0, total_admin: 0 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Gagal memuat daftar pengguna.');
      const data = await res.json();
      setUserList(data.users || []);
      setUserStats({
        total_users: data.total_users || 0,
        total_masyarakat: data.total_masyarakat || 0,
        total_admin: data.total_admin || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pengguna') {
      fetchUsers();
    }
  }, [activeTab]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return userList;
    const q = userSearchQuery.toLowerCase();
    return userList.filter(u => 
      (u.nama_lengkap && u.nama_lengkap.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [userList, userSearchQuery]);

  // Fetch data awal saat dibuka
  const loadDashboardConfig = () => {
    fetch(`${API_BASE_URL}/api/dashboard`, { headers: API_HEADERS })
      .then((res) => res.json())
      .then((json) => {
        setDashboardData(json);
        if (json.metadata) {
          setTitle(json.metadata.judul || "Dashboard Surveilans Kasus Penyakit");
          setSubtitle(json.metadata.sumber || "Rekam Medik Elektronik Puskesmas");
          setLogo(json.metadata.logo || "Hospital");
          setLastUpdate(json.metadata.tanggal_update || "Belum ada data");
          if (json.metadata.custom_logo) {
            setCustomLogo(json.metadata.custom_logo);
            setLogoType('custom');
          } else {
            setCustomLogo('');
            setLogoType('icon');
          }
        }
        if (json.diseases_config && json.diseases_config.length > 0) {
          setDiseases(json.diseases_config);
        }
      })
      .catch((err) => console.error("Gagal memuat konfigurasi:", err));
  };

  useEffect(() => {
    loadDashboardConfig();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('isAdminAuth');
    navigate('/portal-petugas');
  };

  // --- LOGIKA UPLOAD GAMBAR LOGO KUSTOM ---
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png', 0.9);
        setCustomLogo(dataUrl);
        setLogoType('custom');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- HANDLER SIMPAN / UPDATE API ---
  const handleSaveToServer = async (withUploadFile = false) => {
    setIsProcessing(true);
    setActionFeedback(null);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      setActionFeedback({ type: 'error', message: 'Sesi login tidak ditemukan. Silakan login kembali.' });
      handleLogout();
      return;
    }

    const formData = new FormData();
    if (withUploadFile) {
      if (!selectedFile) {
        setActionFeedback({ type: 'error', message: 'Silakan pilih file Excel (.xlsx) terlebih dahulu!' });
        setIsProcessing(false);
        return;
      }
      formData.append('file', selectedFile);
    }

    formData.append('judul', title);
    formData.append('sumber', subtitle);
    formData.append('logo', logo);
    formData.append('custom_logo', logoType === 'custom' ? (customLogo || '') : '');
    formData.append('diseases_config', JSON.stringify(diseases));

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...API_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        alert("Sesi login Anda telah berakhir atau token tidak valid. Silakan login kembali.");
        handleLogout();
        return;
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal memproses data server');

      setIsProcessing(false);
      setActionFeedback({
        type: 'success',
        message: withUploadFile
          ? 'Berhasil! File Excel telah dibersihkan, diolah, dan database analitik diperbarui.'
          : 'Berhasil! Perubahan pengaturan telah diterapkan ke Dashboard Publik.'
      });

      if (withUploadFile) {
        setSelectedFile(null);
      }
      loadDashboardConfig();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setActionFeedback({ type: 'error', message: `Gagal: ${err.message}` });
    }
  };

  // --- LOGIKA FORM MODAL DIAGNOSA ---
  const handleOpenAddForm = () => {
    setEditingItem({
      id: `custom_${Date.now()}`,
      name: '',
      codes: '',
      tags: [],
      color: '#2563eb'
    });
    setChipInput('');
    setModalMode('edit');
  };

  const handleOpenEditForm = (item) => {
    const tags = item.codes 
      ? item.codes.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [];
    setEditingItem({ ...item, tags });
    setChipInput('');
    setModalMode('edit');
  };

  const handleAddTag = (val) => {
    const clean = val.trim().toUpperCase();
    if (!clean) return;
    if (editingItem && !editingItem.tags.includes(clean)) {
      setEditingItem({ ...editingItem, tags: [...editingItem.tags, clean] });
    }
    setChipInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      tags: editingItem.tags.filter((t) => t !== tagToRemove)
    });
  };

  const handleKeyDownChip = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(chipInput);
    }
  };

  const handleSaveModal = () => {
    if (!editingItem.name.trim()) {
      alert("Nama diagnosa / kasus wajib diisi!");
      return;
    }
    const finalCodes = (editingItem.tags || []).join(', ');
    const updated = {
      id: editingItem.id,
      name: editingItem.name.trim().toUpperCase(),
      codes: finalCodes,
      color: editingItem.color || '#2563eb'
    };

    const exists = diseases.find((d) => d.id === updated.id);
    let newDiseases;
    if (exists) {
      newDiseases = diseases.map((d) => d.id === updated.id ? updated : d);
    } else {
      newDiseases = [...diseases, updated];
    }
    setDiseases(newDiseases);
    setModalMode('none');
    setActionFeedback({ type: 'success', message: 'Item berhasil diubah di form. Jangan lupa klik tombol "Terapkan ke Dashboard Publik" di bawah.' });
  };

  const handleDeleteDisease = (id, name) => {
    if (window.confirm(`Yakin ingin menghapus pemantauan kasus "${name}"?`)) {
      setDiseases(diseases.filter((d) => d.id !== id));
      setActionFeedback({ type: 'success', message: `Kasus "${name}" dihapus. Silakan klik "Terapkan ke Dashboard Publik" untuk menyimpan.` });
    }
  };

  const handleApplyPresetTemplate = (preset) => {
    const exists = diseases.some((d) => d.id === preset.id || d.name.toUpperCase() === preset.name.toUpperCase());
    if (exists) {
      alert(`Diagnosa "${preset.name}" sudah ada dalam daftar.`);
      return;
    }
    setDiseases([...diseases, preset]);
    setModalMode('none');
    setActionFeedback({ type: 'success', message: `Template "${preset.name}" ditambahkan. Klik tombol "Terapkan ke Dashboard Publik" untuk memperbarui visual.` });
  };

  // Filter daftar diagnosa dengan pencarian
  const filteredDiseases = useMemo(() => {
    if (!searchQuery.trim()) return diseases;
    const q = searchQuery.toLowerCase();
    return diseases.filter((d) => 
      d.name.toLowerCase().includes(q) || d.codes.toLowerCase().includes(q)
    );
  }, [diseases, searchQuery]);

  // Map jumlah kasus terdeteksi per diagnosa saat ini (jika ada data)
  const caseCountMap = useMemo(() => {
    const map = {};
    if (dashboardData && dashboardData.kpi) {
      dashboardData.kpi.forEach((k) => {
        map[k.id] = k.total || 0;
      });
    }
    return map;
  }, [dashboardData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">

      {/* --- SIDEBAR WORKSPACE --- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col justify-between`}>
        <div>
          {/* Header Sidebar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Admin Portal</h2>
                <p className="text-[11px] font-medium text-slate-400">Surveilans Kesehatan</p>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigasi 3 Menu Eksklusif */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => { setActiveTab('import'); setIsMobileMenuOpen(false); setActionFeedback(null); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'import'
                  ? 'bg-blue-50 text-blue-700 font-extrabold ring-1 ring-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UploadCloud size={16} className={activeTab === 'import' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Import Data Rekam Medis</span>
            </button>

            <button
              onClick={() => { setActiveTab('diagnosa'); setIsMobileMenuOpen(false); setActionFeedback(null); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'diagnosa'
                  ? 'bg-blue-50 text-blue-700 font-extrabold ring-1 ring-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sliders size={16} className={activeTab === 'diagnosa' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Jenis Diagnosa / Kasus</span>
            </button>

            <button
              onClick={() => { setActiveTab('tampilan'); setIsMobileMenuOpen(false); setActionFeedback(null); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'tampilan'
                  ? 'bg-blue-50 text-blue-700 font-extrabold ring-1 ring-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Palette size={16} className={activeTab === 'tampilan' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Custom Tampilan Umum</span>
            </button>

            <button
              onClick={() => { setActiveTab('pengguna'); setIsMobileMenuOpen(false); setActionFeedback(null); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === 'pengguna'
                  ? 'bg-blue-50 text-blue-700 font-extrabold ring-1 ring-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users size={16} className={activeTab === 'pengguna' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Daftar Pengguna</span>
            </button>
          </nav>
        </div>

        {/* Footer Sidebar: Quick link & Logout */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="flex items-center gap-2">
              <Eye size={14} className="text-slate-500" />
              <span>Lihat Publik</span>
            </span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={14} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* --- KONTEN UTAMA WORKSPACE --- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar Workspace */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Panel Pengelola</p>
              <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                {activeTab === 'import' && 'Import & Pembaruan Data Rekam Medis'}
                {activeTab === 'diagnosa' && 'Master Kategori Kasus & Kode ICD-10'}
                {activeTab === 'tampilan' && 'Kustomisasi Tampilan & Identitas'}
                {activeTab === 'pengguna' && 'Pemantauan Akun & Daftar Pengguna'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Database size={12} className="text-slate-400" />
              <span>Pembaruan: {lastUpdate}</span>
            </span>
          </div>
        </header>

        {/* Area Notifikasi Feedback */}
        {actionFeedback && (
          <div className="mx-4 sm:mx-8 mt-4">
            <div className={`flex items-start justify-between rounded-xl p-3.5 text-xs font-semibold ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{actionFeedback.message}</span>
              </div>
              <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Konten Halaman per Tab */}
        <main className="p-4 sm:p-8 flex-1">

          {/* ============================================================== */}
          {/* MENU 1: IMPORT DATA REKAM MEDIS */}
          {/* ============================================================== */}
          {activeTab === 'import' && (
            <div className="max-w-4xl space-y-6">
              
              {/* Card Ringkasan Status Database Saat Ini */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Server</span>
                  <p className="mt-1 text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Database Siap
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-mono">database_bersih.xlsx</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cakupan Wilayah</span>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {dashboardData?.available_puskesmas?.length || 0} Puskesmas
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Tiap sheet mewakili 1 faskes</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kasus Masuk</span>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {dashboardData?.kpi ? dashboardData.kpi.reduce((acc, k) => acc + (k.total || 0), 0).toLocaleString('id-ID') : '0'} Pasien
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Terpetakan ke diagnosa aktif</p>
                </div>
              </div>

              {/* Area Form Upload File */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">Upload File Rekam Medis (.xlsx)</h3>
                  <p className="text-xs text-slate-500">
                    File Excel hasil ekspor dari SIMPUS / Rekam Medik Elektronik seluruh puskesmas.
                  </p>
                </div>

                {/* Dropzone */}
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-3 shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  
                  <span className="text-sm font-bold text-slate-800 text-center">
                    {selectedFile ? selectedFile.name : 'Pilih atau Tarik File Excel (.xlsx) ke sini'}
                  </span>
                  
                  <span className="mt-1 text-xs text-slate-400">
                    {selectedFile 
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB — Siap diproses` 
                      : 'Mendukung format multi-sheet (1 sheet per puskesmas)'}
                  </span>

                  <input 
                    type="file" 
                    accept=".xlsx" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setActionFeedback(null);
                      }
                    }}
                    className="hidden" 
                  />
                </label>

                {/* Tombol Eksekusi Upload */}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Sanitasi otomatis: Kolom identitas sensitif (NIK/nama) dibuang demi privasi.
                  </span>

                  <button
                    onClick={() => handleSaveToServer(true)}
                    disabled={!selectedFile || isProcessing}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition ${
                      !selectedFile || isProcessing
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 shadow-xs active:scale-[0.99]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Memproses Data Excel...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>Mulai Import Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Panduan Format Kolom */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <HelpCircle size={15} className="text-blue-500" />
                  Format Kolom yang Diperlukan pada Excel:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Tanggal</span>
                    <span className="text-slate-400 text-[11px]">Waktu periksa pasien</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Jenis Kelamin</span>
                    <span className="text-slate-400 text-[11px]">Laki-laki / Perempuan</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Umur Tahun</span>
                    <span className="text-slate-400 text-[11px]">Angka usia pasien</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Diagnosa 1</span>
                    <span className="text-slate-400 text-[11px]">Uraian nama penyakit</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="font-bold text-slate-800 block">ICD-X 1</span>
                    <span className="text-slate-400 text-[11px]">Kode ICD-10 (mis. J06)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 2: JENIS DIAGNOSA / KASUS (ENTERPRISE MASTER TABLE) */}
          {/* ============================================================== */}
          {activeTab === 'diagnosa' && (
            <div className="space-y-5">
              
              {/* Toolbar Atas: Search & Tombol Tambah */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute inset-y-0 left-0 my-auto ml-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama penyakit atau kode ICD-10..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalMode('template')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Pilih dari Template SKDR</span>
                  </button>

                  <button
                    onClick={handleOpenAddForm}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Tambah Diagnosa Baru</span>
                  </button>
                </div>
              </div>

              {/* Tabel Enterprise Diagnosa */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4 w-12">Warna</th>
                        <th className="py-3.5 px-4">Nama Diagnosa / Kategori</th>
                        <th className="py-3.5 px-4">Kode ICD-10 yang Dipantau</th>
                        <th className="py-3.5 px-4 text-right">Kasus Terdeteksi</th>
                        <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredDiseases.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400">
                            {searchQuery ? 'Tidak ada diagnosa yang cocok dengan pencarian.' : 'Belum ada diagnosa yang diatur.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDiseases.map((dis) => {
                          const codeList = dis.codes ? dis.codes.split(',').map((c) => c.trim()).filter(Boolean) : [];
                          const count = caseCountMap[dis.id] || 0;
                          return (
                            <tr key={dis.id} className="hover:bg-slate-50/60 transition">
                              
                              {/* Kolom Warna */}
                              <td className="py-3.5 px-4">
                                <span 
                                  className="h-4 w-4 rounded-full block shadow-2xs ring-1 ring-black/10" 
                                  style={{ backgroundColor: dis.color }} 
                                />
                              </td>

                              {/* Kolom Nama */}
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-900 block text-sm">{dis.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {dis.id}</span>
                              </td>

                              {/* Kolom Kode ICD-10 Chips */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap items-center gap-1 max-w-md">
                                  {codeList.slice(0, 8).map((code) => (
                                    <span key={code} className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
                                      {code}
                                    </span>
                                  ))}
                                  {codeList.length > 8 && (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      +{codeList.length - 8} lainnya
                                    </span>
                                  )}
                                  {codeList.length === 0 && (
                                    <span className="text-slate-400 text-xs italic">Semua kode (bebas)</span>
                                  )}
                                </div>
                              </td>

                              {/* Kolom Kasus Terdeteksi */}
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {count.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[11px] text-slate-400 ml-1">pasien</span>
                              </td>

                              {/* Kolom Tombol Aksi */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditForm(dis)}
                                    className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition"
                                    title="Edit Diagnosa"
                                  >
                                    <Edit3 size={15} />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteDisease(dis.id, dis.name)}
                                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                                    title="Hapus Diagnosa"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Tabel dengan Tombol Terapkan Perubahan */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50/50 p-4">
                  <span className="text-xs text-slate-500">
                    Menampilkan <span className="font-bold text-slate-800">{filteredDiseases.length}</span> diagnosa yang dipantau
                  </span>

                  <button
                    onClick={() => handleSaveToServer(false)}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Menyimpan ke Server...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Terapkan ke Dashboard Publik</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 3: CUSTOM TAMPILAN UMUM */}
          {/* ============================================================== */}
          {activeTab === 'tampilan' && (
            <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Kolom Form Pengaturan */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">Pengaturan Identitas & Teks</h3>
                  <p className="text-xs text-slate-500">Ubah judul, instansi penanggung jawab, dan simbol brand dashboard.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Dashboard</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Dashboard Surveilans Kasus Penyakit"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Instansi / Sumber Data</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Contoh: Dinas Kesehatan Kabupaten Kutai Kartanegara"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">Logo atau Simbol Brand</label>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setLogoType('icon')}
                        className={`rounded-md px-2.5 py-1 transition ${
                          logoType === 'icon' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Ikon Standar
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoType('custom')}
                        className={`rounded-md px-2.5 py-1 transition ${
                          logoType === 'custom' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upload Gambar/Logo
                      </button>
                    </div>
                  </div>

                  {logoType === 'icon' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'Hospital', label: 'Rumah Sakit', icon: Hospital },
                        { id: 'Activity', label: 'Detak Jantung', icon: Activity },
                        { id: 'ShieldPlus', label: 'Tameng', icon: ShieldCheck },
                        { id: 'HeartPulse', label: 'Nadi', icon: HeartPulse },
                        { id: 'Stethoscope', label: 'Stetoskop', icon: Stethoscope },
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isSelected = logo === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLogo(item.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold ring-2 ring-blue-100'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <IconComp size={20} className="mb-1" />
                            <span className="text-[10px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customLogo ? (
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 p-1 shadow-2xs overflow-hidden">
                            <img src={customLogo} alt="Logo Terpilih" className="h-full w-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">Logo Instansi Aktif</p>
                            <p className="text-[11px] text-slate-400">Gambar berhasil dimuat dan siap disimpan.</p>
                            <div className="mt-1 flex items-center gap-3">
                              <label className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer underline">
                                Ganti Gambar
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => { setCustomLogo(''); setLogoType('icon'); }}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-600 underline"
                              >
                                Hapus Logo
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer">
                          <UploadCloud size={22} className="text-slate-400 mb-1.5" />
                          <span className="text-xs font-bold text-slate-700">Pilih File Logo (PNG, JPG, SVG)</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">Disarankan gambar berlatar transparan (rasio 1:1)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => handleSaveToServer(false)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Menyimpan Pengaturan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Simpan & Terapkan Pengaturan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Kolom Live Preview Mini */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Preview Header</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Real-time
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    Begini tampilan bagian header yang akan dilihat oleh publik dan pengunjung web:
                  </p>

                  {/* Mockup Header */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      {logoType === 'custom' && customLogo ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 p-1 shadow-xs overflow-hidden">
                          <img src={customLogo} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                          {logo === 'Activity' && <Activity size={20} />}
                          {logo === 'ShieldPlus' && <ShieldCheck size={20} />}
                          {logo === 'HeartPulse' && <HeartPulse size={20} />}
                          {logo === 'Stethoscope' && <Stethoscope size={20} />}
                          {logo === 'Hospital' && <Hospital size={20} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{title || 'Judul Dashboard'}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{subtitle || 'Subjudul Instansi'}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between text-[10px] text-slate-400">
                      <span>Pembaruan: {lastUpdate}</span>
                      <span className="font-semibold text-slate-600">Terverifikasi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-500">
                  💡 Tip: Anda bisa mengunggah logo resmi Dinas Kesehatan / Pemerintah Daerah agar dashboard terlihat lebih formal dan terpercaya.
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: PEMANTAUAN AKUN & DAFTAR PENGGUNA */}
          {/* ============================================================== */}
          {activeTab === 'pengguna' && (
            <div className="space-y-6">
              
              {/* Top Banner & Refresh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Users size={16} />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Pemantauan Akun Pengguna</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Daftar masyarakat dan staf pengelola yang memiliki akses ke platform surveilans.
                  </p>
                </div>

                <button
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <RefreshCw size={14} className={loadingUsers ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                  <span>Segarkan Data</span>
                </button>
              </div>

              {/* 3 Kartu Ringkasan Statistik */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengguna Terdaftar</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900">{userStats.total_users}</span>
                    <span className="text-xs font-semibold text-slate-400">Akun Aktif</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Akun Masyarakat</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-emerald-700">{userStats.total_masyarakat}</span>
                    <span className="text-xs font-semibold text-slate-400">Pengunjung</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Akun Administrator</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-blue-700">{userStats.total_admin}</span>
                    <span className="text-xs font-semibold text-slate-400">Pengelola</span>
                  </div>
                </div>
              </div>

              {/* Tabel Pengguna */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h4 className="text-sm font-bold text-slate-900">Daftar Akun Terdaftar</h4>
                  
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Cari nama atau email..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Table Component */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold w-12 text-center">No</th>
                        <th className="py-3 px-4 font-bold">Nama Lengkap</th>
                        <th className="py-3 px-4 font-bold">Alamat Email</th>
                        <th className="py-3 px-4 font-bold">Peran Akses</th>
                        <th className="py-3 px-4 font-bold">Tanggal Terdaftar</th>
                        <th className="py-3 px-4 font-bold">Terakhir Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                            {loadingUsers ? 'Memuat data pengguna...' : 'Tidak ada data pengguna yang cocok.'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => (
                          <tr key={u.id || idx} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                                  u.role === 'admin' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {u.nama_lengkap ? u.nama_lengkap.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span>{u.nama_lengkap}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-600 font-mono text-[11px]">
                              {u.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {u.role === 'admin' ? 'Administrator' : 'Masyarakat'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                              {u.created_at || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                              {u.last_login ? (
                                <span className="font-semibold text-slate-700">{u.last_login}</span>
                              ) : (
                                <span className="text-slate-400 italic">Belum pernah</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL / DRAWER TAMBAH & EDIT DIAGNOSA */}
      {/* ============================================================== */}
      {modalMode === 'edit' && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingItem.id.startsWith('custom_') ? 'Tambah Diagnosa Baru' : 'Edit Kategori Diagnosa'}
                </h3>
                <p className="text-xs text-slate-400">Tentukan nama, kode ICD-10, dan aksen warna visual.</p>
              </div>
              <button 
                onClick={() => setModalMode('none')}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Nama Diagnosa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Diagnosa / Penyakit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ISPA, DIARE AKUT, TUBERKULOSIS..."
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold uppercase text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Warna Aksen Visual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Warna Aksen Visual
                </label>
                
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, color: c })}
                        className={`h-7 w-7 rounded-lg transition-transform ${
                          editingItem.color === c ? 'scale-115 ring-2 ring-offset-1 ring-slate-800' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <input
                    type="color"
                    value={editingItem.color || '#2563eb'}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                    className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                    title="Pilih warna kustom"
                  />
                </div>
              </div>

              {/* Tag Input Kode ICD-10 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Daftar Kode ICD-10 yang Dipantau
                  </label>
                  <span className="text-[11px] text-slate-400">Tekan Enter atau Koma</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 min-h-[90px]">
                  {(editingItem.tags || []).map((tag) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-2xs"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-rose-500 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={chipInput}
                    onChange={(e) => setChipInput(e.target.value)}
                    onKeyDown={handleKeyDownChip}
                    placeholder={(editingItem.tags || []).length === 0 ? "Ketik kode (misal: J06, J00)..." : "Tambah kode..."}
                    className="flex-1 min-w-[130px] bg-transparent py-1 px-1.5 text-xs font-mono font-semibold uppercase outline-none"
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Data rekam medis dengan kolom diagnosa/ICD yang memuat salah satu kode di atas akan otomatis dikelompokkan ke dalam kategori ini.
                </p>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setModalMode('none')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
              >
                Simpan Item Diagnosa
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL TEMPLATE STANDAR SKDR KEMENKES */}
      {/* ============================================================== */}
      {modalMode === 'template' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Template Surveilans Standar (SKDR)</h3>
                <p className="text-xs text-slate-400">Pilih penyakit surveilans nasional untuk ditambahkan langsung.</p>
              </div>
              <button 
                onClick={() => setModalMode('none')}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {PRESET_TEMPLATES.map((preset) => {
                const isAlreadyAdded = diseases.some((d) => d.id === preset.id || d.name.toUpperCase() === preset.name.toUpperCase());
                return (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:border-blue-400 hover:bg-blue-50/20 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: preset.color }} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{preset.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{preset.codes}</p>
                      </div>
                    </div>

                    <button
                      disabled={isAlreadyAdded}
                      onClick={() => handleApplyPresetTemplate(preset)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        isAlreadyAdded
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                      }`}
                    >
                      {isAlreadyAdded ? 'Sudah Ada' : 'Gunakan'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <button
                onClick={() => setModalMode('none')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
