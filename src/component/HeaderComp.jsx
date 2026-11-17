import React, { useState, useEffect } from 'react';
import { Hospital, Activity, ShieldCheck, HeartPulse, Stethoscope, LogOut, Sliders, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function HeaderComp({ title, subtitle, lastUpdate, logoName, customLogo }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('authUser');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        setCurrentUser(u);
        if (u.role === 'admin' || localStorage.getItem('isAdminAuth') === 'true') {
          setIsAdmin(true);
        }
      }
    } catch {
      // Abaikan jika parse gagal
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('isAdminAuth');
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const renderLogo = () => {
    if (customLogo) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 p-1 shadow-xs overflow-hidden">
          <img src={customLogo} alt="Logo Instansi" className="h-full w-full object-contain" />
        </div>
      );
    }

    const props = { size: 20, strokeWidth: 2.2 };
    let icon = <Hospital {...props} />;
    if (logoName === 'Activity') icon = <Activity {...props} />;
    else if (logoName === 'ShieldPlus') icon = <ShieldCheck {...props} />;
    else if (logoName === 'HeartPulse') icon = <HeartPulse {...props} />;
    else if (logoName === 'Stethoscope') icon = <Stethoscope {...props} />;

    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
        {icon}
      </div>
    );
  };

  const initial = currentUser?.nama_lengkap 
    ? currentUser.nama_lengkap.charAt(0).toUpperCase() 
    : 'U';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Identitas Instansi & Sistem */}
        <div className="flex items-center gap-3">
          {renderLogo()}
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {title || 'Dashboard Surveilans Kasus Penyakit'}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              {subtitle || 'Sistem Informasi Rekam Medis Terpadu'}
            </p>
          </div>
        </div>

        {/* Informasi Pengguna & Kontrol Sesi */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right lg:block">
            <span className="block text-[11px] font-medium text-slate-400">Pembaruan Data</span>
            <span className="text-xs font-semibold text-slate-700">{lastUpdate || 'Belum ada data'}</span>
          </div>

          {/* Profil Pengguna Aktif */}
          {currentUser && (
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-bold text-white shadow-2xs">
                {initial}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.nama_lengkap || 'Pengguna'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Masyarakat'}
                </span>
              </div>
            </div>
          )}

          {/* Tombol Khusus Administrator (Hanya terlihat jika akun Admin) */}
          {isAdmin && (
            <Link
              to="/portal-petugas/manajemen-data"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              title="Buka Workspace Manajemen Petugas"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Workspace Petugas</span>
            </Link>
          )}

          {/* Tombol Keluar Sesi */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            title="Keluar dari akun"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
}
