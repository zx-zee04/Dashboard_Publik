import React from "react";
import { Hospital, Calendar, Activity, ShieldPlus, HeartPulse, Stethoscope } from 'lucide-react';

export default function Header({ title, subtitle, lastUpdate, logoName }) {
  
  // Fungsi untuk merender ikon secara dinamis berdasarkan pilihan Admin
  const renderIcon = () => {
    const props = { size: 26, strokeWidth: 2.5 }; // Ukuran diperbesar
    switch(logoName) {
      case 'Activity': return <Activity {...props} />;
      case 'ShieldPlus': return <ShieldPlus {...props} />;
      case 'HeartPulse': return <HeartPulse {...props} />;
      case 'Stethoscope': return <Stethoscope {...props} />;
      default: return <Hospital {...props} />; // Default
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        
        {/* Bagian Kiri: Logo & Teks Sejajar */}
        <div className="flex items-center gap-4">
          
          {/* Kotak Logo Diperbesar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md">
            {renderIcon()}
          </div>
          
          {/* Teks Judul dan Sub-judul (Kolom Sejajar Rata Kiri) */}
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl leading-tight">
              {title || 'Dashboard Surveilans Kasus Penyakit'}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              {subtitle || 'Rekam Medik Elektronik Puskesmas'}
            </p>
          </div>
        </div>

        {/* Bagian Kanan: Waktu Pembaruan */}
        <div className="flex items-center gap-2 self-start rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 sm:self-center ring-1 ring-slate-200">
          <Calendar size={14} className="text-slate-400" />
          <span>Pembaruan: {lastUpdate || '-'}</span>
        </div>
      </div>
    </header>
  );
}