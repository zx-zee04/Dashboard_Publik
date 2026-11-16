# 🏥 Sistem Informasi Surveilans Epidemiologi & Rekam Medis Terpadu

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.10-22c55e)](https://recharts.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

Platform dasbor analitik dan surveilans epidemiologi kesehatan masyarakat modern. Sistem ini dirancang untuk memproses, menganalisis, dan memvisualisasikan data rekam medis elektronik multi-puskesmas secara real-time berbasis standar klasifikasi penyakit internasional (**ICD-10**).

---

## 🌟 Fitur Utama

### 1. Dashboard Publik Interaktif
* **⚡ Zero-Lag Instant Filtering:** Agregasi data global dan data per-puskesmas telah dikalkulasi di muka (*pre-calculated*). Pemilihan filter wilayah fasilitas kesehatan berganti seketika (**0 ms**) langsung di memori peramban tanpa jeda pemuatan atau beban berlebih pada server backend.
* **📊 Ringkasan Eksekutif Terukur:** Kartu indikator metrik utama (Total Kasus, Diagnosa Terbanyak, Fasilitas Kasus Tertinggi, Rasio Gender Pasien) dan papan peringkat (*leaderboard*) puskesmas beban tertinggi.
* **📈 Visualisasi Epidemiologi Komprehensif:**
  * **Tren Kasus Harian:** Kurva area dinamis dengan gradien lembut dan tooltip tanggal.
  * **Distribusi Kelompok Usia:** Stratifikasi usia pasien (Balita 0–1 Thn, 1–5 Thn, Anak/Remaja 5–18 Thn, Dewasa 18–59 Thn, Lansia >60 Thn).
  * **Sebaran per Fasilitas Kesehatan:** Grafik batang komparasi volume kasus antar puskesmas.
* **🎨 Harmonisasi Warna Dinamis:** Warna aksen penyakit yang ditentukan oleh Admin menyatu secara alami dengan tema visual tanpa saling bertabrakan.
* **✨ Tipografi Humanis & Nyaman:** Menggunakan font **Plus Jakarta Sans** dengan bobot angka tabular (*tabular-nums*) yang mudah dicerna dan kredibel.

---

### 2. Panel Petugas / Admin Workspace
* **🖥️ Tata Letak Sidebar Responsif:** Desain bergaya *Enterprise SaaS* dengan menu samping terstruktur dan menu *hamburger* pada perangkat seluler.
* **📥 Import Data Rekam Medis:**
  * Mengunggah file Excel (`.xlsx`) berformat multi-sheet (1 sheet = 1 puskesmas).
  * **Sanitasi Data Otomatis:** Sistem secara otomatis membuang kolom identitas pribadi sensitif (seperti NIK, Nama Lengkap Pasien, Alamat) sebelum disimpan demi kepatuhan terhadap prinsip perlindungan data pribadi medis (UU PDP).
  * Menampilkan status database server, jumlah faskes yang terdeteksi, dan waktu pembaruan terakhir.
* **📋 Master Diagnosa & Kode ICD-10:**
  * **Tabel Master Kasus:** Menampilkan nama penyakit, kode ICD-10, warna aksen, serta **jumlah kasus riil** yang berhasil terdeteksi dari database.
  * **Editor Tag Chip:** Memudahkan penambahan atau pengurangan kode ICD-10 (misal: `J00`, `J06.9`, `A09`) menggunakan tombol `Enter` atau tanda koma.
  * **Template Standar SKDR Kemenkes:** Menambahkan preset penyakit surveilans nasional (ISPA, Diare Akut, TBC, DBD, Hipertensi, DM) dalam 1 klik.
* **🎨 Kustomisasi Tampilan & Identitas:**
  * Pengaturan Judul Dasbor dan Nama Instansi / Sumber Data.
  * **Pilihan Simbol Medis atau Upload Logo Kustom:** Mendukung pengunggahan logo resmi instansi (PNG/JPG/SVG) berlatar transparan dengan kompresi visual otomatis.
  * **Live Mini Preview:** Mockup visual header yang langsung terbarui saat admin mengetik sebelum disimpan.

---

## 🛠️ Arsitektur & Teknologi

* **Frontend:**
  * [React 19](https://react.dev/) — Pustaka antarmuka pengguna berbasis komponen deklaratif.
  * [Vite](https://vitejs.dev/) — *Build tool* dan *dev server* berkecepatan tinggi.
  * [Tailwind CSS](https://tailwindcss.com/) — Kerangka kerja CSS berbasis *utility-first*.
  * [Recharts](https://recharts.org/) — Pustaka grafik berbasis SVG dan D3.js.
  * [Lucide React](https://lucide.dev/) — Set ikon modern yang rapi dan konsisten.
  * [React Router v7](https://reactrouter.com/) — Manajemen rute halaman publik dan rute terproteksi admin.
* **Backend:**
  * [FastAPI (Python)](https://fastapi.tiangolo.com/) — API RESTful asinkron berkecepatan tinggi.
  * [Pandas & OpenPyXL](https://pandas.pydata.org/) — Pembersihan data, penyaringan regex ICD-10, dan agregasi analitik.

---

## 📂 Struktur Direktori

```text
Dashboard_Publik_V1/
├── public/                 # Aset statis publik
├── src/
│   ├── assets/             # Gambar & ikon aset
│   ├── component/          # Komponen tampilan analitik
│   │   ├── AgeDistribution.jsx    # Grafik kelompok usia
│   │   ├── BarChartComp.jsx       # Grafik perbandingan puskesmas
│   │   ├── ExecutiveSummary.jsx   # Ringkasan eksekutif & leaderboard
│   │   ├── HeaderComp.jsx         # Header instansi & status data
│   │   ├── LineChartComp.jsx      # Grafik kurva tren harian
│   │   └── SummaryPanel.jsx       # Kartu detail penyakit terpilih & gender
│   ├── AdminDashboard.jsx  # Workspace pengelolaan admin
│   ├── AdminLogin.jsx      # Portal autentikasi petugas
│   ├── App.jsx             # Rute & proteksi autentikasi
│   ├── config.js           # Konfigurasi alamat API backend terpusat
│   ├── index.css           # Konfigurasi font Plus Jakarta Sans & scrollbar
│   ├── main.jsx            # Entry point aplikasi React
│   └── PublicDashboard.jsx # Halaman utama dashboard publik
├── .env.example            # Template variabel lingkungan
├── index.html              # Template HTML utama
├── package.json            # Daftar pustaka & dependensi
├── tailwind.config.js      # Konfigurasi Tailwind CSS
└── vite.config.js          # Konfigurasi build Vite
```

---

## 📋 Spesifikasi Kolom Data Excel (.xlsx)

Setiap *sheet* pada file Excel mewakili satu Puskesmas / Fasilitas Kesehatan dan wajib memuat kolom-kolom berikut:

| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `Tanggal` | Tanggal / DateTime | Waktu pemeriksaan pasien (format tanggal fleksibel) |
| `Jenis Kelamin` | Teks | `Laki-laki` atau `Perempuan` |
| `Umur Tahun` | Angka / Teks | Usia pasien dalam hitungan tahun (contoh: `25` atau `25 Thn`) |
| `Diagnosa 1` | Teks | Uraian diagnosa klinis penyakit |
| `ICD-X 1` | Teks | Kode klasifikasi internasional penyakit (contoh: `J06.9`, `A09`) |

*Catatan: Kolom lain seperti NIK, Nama Pasien, No. Rekam Medik, atau Alamat akan secara otomatis diabaikan dan dibersihkan demi menjaga privasi data medis.*

---

## 🚀 Panduan Memulai

### 1. Prasyarat
* [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
* Server Backend FastAPI yang berjalan (default port `8000`).

### 2. Instalasi Dependensi
```bash
# Masuk ke direktori proyek
cd Dashboard_Publik_V1

# Pasang pustaka dependensi
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan alamat backend API jika diperlukan:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di: **`http://localhost:5173`**

### 5. Kompilasi Produksi
```bash
npm run build
```
File hasil kompilasi siap saji akan berada di dalam folder `dist/`.

---

## 🔐 Kredensial Portal Petugas (Default)

| Parameter | Nilai Default |
| :--- | :--- |
| **URL Portal** | `/portal-petugas` |
| **Nama Pengguna** | `admin` |
| **Kata Sandi** | `admin123` |

---

## 📄 Lisensi & Kontributor
Dikembangkan untuk mendukung digitalisasi dan integrasi pelaporan rekam medis surveilans kesehatan masyarakat daerah.
