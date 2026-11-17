import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PublicDashboard from './PublicDashboard';
import AuthPage from './AuthPage';
import AdminDashboard from './AdminDashboard';

// Komponen pelindung rute publik (Masyarakat & Admin wajib login)
function ProtectedPublicRoute({ children }) {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" replace />;
}

// Komponen pelindung rute admin (Hanya Administrator yang sah)
function ProtectedAdminRoute({ children }) {
  const isAdmin = localStorage.getItem('isAdminAuth') === 'true';
  const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
  return isAdmin && token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Satu Pintu Masuk Bersama (Unified Login & Register) */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/portal-petugas" element={<Navigate to="/login" replace />} />

        {/* 2. Halaman Dashboard Publik (Memerlukan Akun Masuk) */}
        <Route
          path="/"
          element={
            <ProtectedPublicRoute>
              <PublicDashboard />
            </ProtectedPublicRoute>
          }
        />

        {/* 3. Panel Manajemen Data Petugas (Tersamarkan & Terproteksi Khusus Admin) */}
        <Route
          path="/portal-petugas/manajemen-data"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        {/* Redirect sembarang URL ke halaman utama */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
