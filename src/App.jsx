import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PublicDashboard from './PublicDashboard';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

function AdminAccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-950 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
          !
        </div>
        <h1 className="mt-5 text-xl font-bold text-white">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-slate-400">
          Anda harus login sebagai admin sebelum membuka halaman manajemen data.
        </p>
        <Link
          to="/portal-petugas"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Ke Halaman Login
        </Link>
      </div>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const isAuth = localStorage.getItem('isAdminAuth') === 'true';
  return isAuth ? children : <AdminAccessDenied />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Halaman Publik (Default) - Tidak ada link login */}
        <Route path="/" element={<PublicDashboard />} />

        {/* 2. Halaman Login Petugas Tersembunyi */}
        <Route path="/portal-petugas" element={<AdminLogin />} />

        {/* 3. Panel Manajemen Data (Hanya bisa dibuka setelah login) */}
        <Route
          path="/portal-petugas/manajemen-data"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        {/* Redirect sembarang URL ke halaman publik */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}