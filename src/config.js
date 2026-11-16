// Konfigurasi aplikasi dari environment variable (.env)
// Jika variabel lingkungan tidak diset, otomatis fallback ke http://localhost:8000
const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Menghilangkan trailing slash (garis miring di akhir) jika ada
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');
