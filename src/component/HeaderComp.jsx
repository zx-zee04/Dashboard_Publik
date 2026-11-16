import React from 'react';
import { Hospital, Activity, ShieldCheck, HeartPulse, Stethoscope, Lock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeaderComp({ title, subtitle, lastUpdate, logoName, customLogo }) {
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

        {/* Informasi Status & Tombol Petugas */}
        <div className="flex items-center gap-4">
          <div className="hidden text-right md:block">
            <span className="block text-[11px] font-medium text-slate-400">Pembaruan Terakhir</span>
            <span className="text-xs font-semibold text-slate-700">{lastUpdate || 'Belum ada data'}</span>
          </div>

          <Link
            to="/portal-petugas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            title="Masuk ke Portal Petugas"
          >
            <Lock size={12} className="text-slate-400" />
            <span className="hidden sm:inline">Portal Petugas</span>
            <ArrowUpRight size={12} className="text-slate-400" />
          </Link>
        </div>

      </div>
    </header>
  );
}
