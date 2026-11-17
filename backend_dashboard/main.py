import sqlite3
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Security, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import json
import os
import shutil
import re
import traceback
import hashlib
from datetime import datetime, timedelta, timezone
import jwt

app = FastAPI(title="Dashboard Surveilans API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "dashboard_data.json"
RAW_FILE = "database_bersih.xlsx"
DB_FILE = "surveilans.db"

# Konfigurasi Keamanan JWT & Kredensial Admin
JWT_SECRET = os.getenv("JWT_SECRET", "surveilans-puskesmas-jwt-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv(
    "ADMIN_PASSWORD_HASH",
    hashlib.sha256("admin123".encode()).hexdigest()
)
API_SYNC_KEY = os.getenv("API_SYNC_KEY", "sync-secret-surveilans-2026")

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    """Inisialisasi tabel basis data SQLite untuk pengguna masyarakat & petugas"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_lengkap TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'masyarakat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    """)
    conn.commit()

    # Pastikan akun administrator bawaan selalu tersedia
    c.execute("SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(email) = ?", ("admin", "admin@surveilans.go.id"))
    if not c.fetchone():
        now_str = datetime.now().strftime("%d %b %Y %H:%M")
        c.execute("""
            INSERT INTO users (nama_lengkap, email, password_hash, role, created_at, last_login)
            VALUES (?, ?, ?, 'admin', ?, ?)
        """, ("Administrator Sistem", "admin@surveilans.go.id", ADMIN_PASSWORD_HASH, now_str, now_str))
        conn.commit()
    conn.close()

# Inisialisasi basis data
init_db()

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class RegisterRequest(BaseModel):
    nama_lengkap: str
    email: str
    password: str

def create_access_token(identifier: str, role: str = "masyarakat", nama_lengkap: str = "") -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": identifier,
        "role": role,
        "nama_lengkap": nama_lengkap,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    """Middleware proteksi endpoint: Memeriksa validitas token untuk semua pengguna (masyarakat & admin)"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Akses ditolak: Token autentikasi tidak ditemukan.")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi login telah berakhir. Silakan login kembali.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token autentikasi tidak valid.")

def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Middleware proteksi khusus administrator"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak: Hak akses administrator diperlukan.")
    return current_user

DEFAULT_DATA = {
    "metadata": {
        "tanggal_update": "Belum ada data",
        "sumber": "Sistem Informasi Rekam Medis",
        "judul": "Dashboard Surveilans Penyakit",
        "logo": "Hospital",
        "custom_logo": ""
    },
    "diseases_config": [
        {"id": "ispa", "name": "ISPA", "codes": "J00, J01, J02, J03, J04, J05, J06, J09, J10, J11, J12, J13, J14, J15, J16, J17, J18, J20, J21, J22", "color": "#f97316"},
        {"id": "diare", "name": "DIARE", "codes": "A00, A02, A03, A04, A06, A08, A09", "color": "#10b981"},
        {"id": "tbc", "name": "TUBERKULOSIS", "codes": "A15, A16, A17, A18, A19", "color": "#8b5cf6"},
        {"id": "konjungtivitis", "name": "KONJUNGTIVITIS", "codes": "H10, H11, H13", "color": "#ef4444"},
        {"id": "dm", "name": "DIABETES MELITUS", "codes": "E10, E11", "color": "#3b82f6"}
    ],
    "kpi": [], "puskesmas": {}, "tren_harian": {}, "kelompok_usia": {},
    "by_puskesmas": {}, "available_puskesmas": []
}

def extract_age_number(val):
    if pd.isna(val): return 0
    match = re.search(r'\d+', str(val))
    return int(match.group()) if match else 0

def categorize_age(age):
    if age <= 1: return "0-1 Thn"
    elif age <= 5: return "1-5 Thn"
    elif age <= 18: return "5-18 Thn"
    elif age <= 59: return "18-59 Thn"
    else: return ">60 Thn"

def build_regex_from_codes(codes_string):
    codes_list = [c.strip().upper() for c in codes_string.split(',') if c.strip()]
    if not codes_list: return "^$"
    return '|'.join([re.escape(c) for c in codes_list])

def sanitize_and_save_excel(input_path, output_path):
    """Membuang kolom sensitif dan menyimpan sebagai database_bersih.xlsx"""
    xls = pd.ExcelFile(input_path)
    sheets = [s for s in xls.sheet_names if s not in ['STATUS', 'DETAIL_HARI']]
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        for sheet in sheets:
            try:
                df = pd.read_excel(xls, sheet_name=sheet)
                if df.empty: continue
                safe_keywords = ['tanggal', 'jenis kelamin', 'umur', 'diagnosa', 'icd', 'kode', 'puskesmas']
                cols_to_keep = [col for col in df.columns if any(k in str(col).lower().strip() for k in safe_keywords)]
                df[cols_to_keep].to_excel(writer, sheet_name=sheet, index=False)
            except Exception: pass
    xls.close()

def compute_analytics(df, config_list):
    """Menghitung KPI, distribusi puskesmas, tren harian, dan kelompok usia secara in-memory"""
    kpi_list, puskesmas_dict, tren_harian_dict, kelompok_usia_dict = [], {}, {}, {}
    age_order = ["0-1 Thn", "1-5 Thn", "5-18 Thn", "18-59 Thn", ">60 Thn"]

    for dis in config_list:
        d_id, d_name, d_color = dis['id'], dis['name'], dis['color']
        pattern = build_regex_from_codes(dis['codes'])
        sub = df[df['Diagnosa_Full'].str.contains(pattern, regex=True)]

        gender_col = sub['Jenis Kelamin'].astype(str).str.strip().str.lower() if 'Jenis Kelamin' in sub.columns else pd.Series([], dtype=str)
        kpi_list.append({
            "id": d_id, "name": d_name, "total": int(len(sub)),
            "male": int((gender_col == 'laki-laki').sum()), 
            "female": int((gender_col == 'perempuan').sum()), "color": d_color
        })

        puskesmas_dict[d_id] = sub['Puskesmas'].value_counts().reset_index().rename(columns={'Puskesmas': 'name', 'count': 'count'}).head(15).to_dict(orient='records') if not sub.empty else []

        if not sub.empty and 'Clean_Date' in sub.columns:
            valid_dates = sub.dropna(subset=['Clean_Date']).sort_values('Clean_Date')
            tren_harian_dict[d_id] = valid_dates.groupby(valid_dates['Clean_Date'].dt.strftime('%d %b'), sort=False)['Puskesmas'].count().reset_index().rename(columns={'Clean_Date': 'date', 'Puskesmas': 'count'}).tail(20).to_dict(orient='records') if not valid_dates.empty else []
        else:
            tren_harian_dict[d_id] = []

        age_counts = sub['Age_Group'].value_counts() if not sub.empty and 'Age_Group' in sub.columns else {}
        kelompok_usia_dict[d_id] = [{"group": grp, "count": int(age_counts.get(grp, 0))} for grp in age_order]

    return {
        "kpi": kpi_list,
        "puskesmas": puskesmas_dict,
        "tren_harian": tren_harian_dict,
        "kelompok_usia": kelompok_usia_dict
    }

def process_excel_file(file_path, config_list):
    """Membaca file database_bersih.xlsx satu kali dan menghitung data agregat global serta per-puskesmas"""
    all_records = []
    xls = None
    try:
        xls = pd.ExcelFile(file_path)
        for sheet in xls.sheet_names:
            if sheet in ['STATUS', 'DETAIL_HARI']:
                continue
            try:
                df = pd.read_excel(xls, sheet_name=sheet)
                if df.empty: continue
                df.columns = df.columns.str.strip()
                needed_cols = ['Tanggal', 'Jenis Kelamin', 'Umur Tahun', 'Diagnosa 1', 'ICD-X 1']
                if any(c in df.columns for c in needed_cols):
                    available = [c for c in needed_cols if c in df.columns]
                    df_sub = df[available].copy()
                    
                    # Deteksi nama puskesmas dari kolom jika ada (mode 1 sheet gabungan), atau dari nama sheet
                    pusk_col = next((c for c in df.columns if 'puskesmas' in c.lower()), None)
                    if pusk_col:
                        df_sub['Puskesmas'] = df[pusk_col].astype(str).str.strip()
                    else:
                        df_sub['Puskesmas'] = sheet.strip()

                    all_records.append(df_sub)
            except Exception:
                continue
    finally:
        if xls is not None:
            xls.close()

    if not all_records:
        raise ValueError("Data bersih kosong atau format kolom tidak sesuai.")
        
    merged_df = pd.concat(all_records, ignore_index=True)
    all_puskesmas_names = sorted(merged_df['Puskesmas'].dropna().unique().tolist())

    # Preprocessing satu kali di memori
    merged_df['Clean_Date'] = pd.to_datetime(merged_df['Tanggal'], errors='coerce', dayfirst=True) if 'Tanggal' in merged_df.columns else pd.Series([])
    merged_df['Clean_Age'] = merged_df['Umur Tahun'].apply(extract_age_number) if 'Umur Tahun' in merged_df.columns else pd.Series([])
    merged_df['Age_Group'] = merged_df['Clean_Age'].apply(categorize_age)
    merged_df['Diagnosa_Full'] = (
        merged_df['Diagnosa 1'].fillna('').astype(str) + " " +
        (merged_df['ICD-X 1'].fillna('').astype(str) if 'ICD-X 1' in merged_df.columns else '')
    ).str.upper()

    # Hitung data agregat global ("Semua Puskesmas")
    global_metrics = compute_analytics(merged_df, config_list)

    # Hitung data spesifik per puskesmas di memori secara instan
    by_puskesmas = {}
    for p_name in all_puskesmas_names:
        sub_df = merged_df[merged_df['Puskesmas'] == p_name]
        by_puskesmas[p_name] = compute_analytics(sub_df, config_list)

    return {
        **global_metrics,
        "by_puskesmas": by_puskesmas,
        "available_puskesmas": all_puskesmas_names
    }

def ensure_dashboard_cache():
    """Memastikan dashboard_data.json selalu siap dan sudah terisi by_puskesmas tanpa perlu membaca Excel per request"""
    if not os.path.exists(DATA_FILE) and not os.path.exists(RAW_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DATA, f, indent=2)
        return

    if os.path.exists(RAW_FILE):
        needs_build = False
        config_list = DEFAULT_DATA["diseases_config"]
        meta = DEFAULT_DATA["metadata"]

        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    curr = json.load(f)
                config_list = curr.get("diseases_config", config_list)
                meta = curr.get("metadata", meta)
                if "by_puskesmas" not in curr or not curr["by_puskesmas"]:
                    needs_build = True
            except Exception:
                needs_build = True
        else:
            needs_build = True

        if needs_build:
            print("[INFO] Membangun cache dashboard_data.json dengan data per-puskesmas...")
            try:
                parsed = process_excel_file(RAW_FILE, config_list)
                parsed["metadata"] = meta
                parsed["diseases_config"] = config_list
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2)
                print("[INFO] Cache dashboard_data.json siap!")
            except Exception as e:
                print(f"[WARN] Gagal membangun cache: {e}")

# Jalankan inisialisasi cache saat startup
ensure_dashboard_cache()

# ==============================================================
# ENDPOINT AUTENTIKASI SATU PINTU (UNIFIED LOGIN & REGISTER)
# ==============================================================
@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    """Pendaftaran mandiri akun masyarakat untuk pemantauan akses dashboard"""
    nama = req.nama_lengkap.strip()
    email = req.email.strip().lower()
    pwd = req.password

    if not nama or not email or not pwd:
        raise HTTPException(status_code=400, detail="Nama lengkap, email, dan kata sandi wajib diisi.")
    
    if len(pwd) < 6:
        raise HTTPException(status_code=400, detail="Kata sandi minimal 6 karakter demi keamanan.")
    
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Format alamat email tidak valid.")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Alamat email sudah terdaftar. Silakan langsung masuk.")

    hashed_pwd = hash_password(pwd)
    now_str = datetime.now().strftime("%d %b %Y %H:%M")

    c.execute("""
        INSERT INTO users (nama_lengkap, email, password_hash, role, created_at, last_login)
        VALUES (?, ?, ?, 'masyarakat', ?, ?)
    """, (nama, email, hashed_pwd, now_str, now_str))
    new_id = c.lastrowid
    conn.commit()
    conn.close()

    token = create_access_token(email, role="masyarakat", nama_lengkap=nama)
    return {
        "status": "success",
        "message": "Pendaftaran berhasil",
        "token": token,
        "role": "masyarakat",
        "user": {
            "id": new_id,
            "nama_lengkap": nama,
            "email": email,
            "role": "masyarakat"
        }
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    """
    Satu Pintu Masuk (Unified Login):
    Dapat digunakan masyarakat (email) maupun administrator (email / 'admin').
    """
    ident = (req.email or req.username or "").strip().lower()
    if not ident or not req.password:
        raise HTTPException(status_code=400, detail="Identitas dan kata sandi wajib diisi.")

    hashed_input = hash_password(req.password)
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Cek khusus untuk kredensial administrator (bisa username 'admin' atau email)
    if ident == "admin" or ident == "admin@surveilans.go.id":
        if hashed_input == ADMIN_PASSWORD_HASH:
            c.execute("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(email) = ?", ("admin@surveilans.go.id", "admin"))
            user = c.fetchone()
            now_str = datetime.now().strftime("%d %b %Y %H:%M")
            if user:
                c.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_str, user["id"]))
                conn.commit()
                nama = user["nama_lengkap"]
                email_val = user["email"]
            else:
                nama = "Administrator Sistem"
                email_val = "admin@surveilans.go.id"
            conn.close()

            token = create_access_token(email_val, role="admin", nama_lengkap=nama)
            return {
                "status": "success",
                "token": token,
                "role": "admin",
                "user": {
                    "nama_lengkap": nama,
                    "email": email_val,
                    "role": "admin"
                }
            }
        else:
            conn.close()
            raise HTTPException(status_code=401, detail="Kata sandi administrator salah.")

    # Cek pengguna reguler di database SQLite
    c.execute("SELECT * FROM users WHERE LOWER(email) = ?", (ident,))
    user = c.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Akun dengan email tersebut belum terdaftar.")

    if user["password_hash"] != hashed_input:
        conn.close()
        raise HTTPException(status_code=401, detail="Kata sandi salah. Silakan periksa kembali.")

    now_str = datetime.now().strftime("%d %b %Y %H:%M")
    c.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_str, user["id"]))
    conn.commit()
    conn.close()

    token = create_access_token(user["email"], role=user["role"], nama_lengkap=user["nama_lengkap"])
    return {
        "status": "success",
        "token": token,
        "role": user["role"],
        "user": {
            "id": user["id"],
            "nama_lengkap": user["nama_lengkap"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@app.get("/api/auth/verify")
def verify_session(current_user: dict = Depends(get_current_user)):
    """Memverifikasi keabsahan sesi login saat ini (masyarakat atau admin)"""
    return {
        "status": "success",
        "valid": True,
        "user": {
            "email": current_user.get("sub"),
            "role": current_user.get("role"),
            "nama_lengkap": current_user.get("nama_lengkap", "")
        }
    }

# ==============================================================
# ENDPOINT ADMINISTRASI PENGGUNA (TERPROTEKSI ADMIN)
# ==============================================================
@app.get("/api/admin/users")
def get_all_users(admin: dict = Depends(get_current_admin)):
    """Mengambil daftar seluruh akun yang telah terdaftar pada sistem (Hanya Admin)"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT id, nama_lengkap, email, role, created_at, last_login 
        FROM users 
        ORDER BY id DESC
    """)
    rows = c.fetchall()
    conn.close()

    users_list = [dict(r) for r in rows]
    total_masyarakat = sum(1 for u in users_list if u.get("role") == "masyarakat")
    total_admin = sum(1 for u in users_list if u.get("role") == "admin")

    return {
        "status": "success",
        "total_users": len(users_list),
        "total_masyarakat": total_masyarakat,
        "total_admin": total_admin,
        "users": users_list
    }

# ==============================================================
# ENDPOINT PUBLIK
# ==============================================================
@app.get("/api/dashboard")
def get_dashboard_data(puskesmas: Optional[str] = None):
    """
    Endpoint dashboard publik: Membaca file JSON cache (sangat cepat, <5ms).
    Tidak memerlukan autentikasi login (terbuka untuk publik).
    """
    config_data = DEFAULT_DATA
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                config_data = json.load(f)
        except Exception as e:
            print(f"Error membaca {DATA_FILE}: {e}")
            return config_data

    # Jika client eksternal meminta puskesmas tertentu via query string
    if puskesmas and puskesmas != "Semua Puskesmas":
        by_pusk = config_data.get("by_puskesmas", {})
        matched_key = next((k for k in by_pusk if k.lower() == puskesmas.lower()), None)
        if matched_key:
            pusk_data = by_pusk[matched_key]
            return {
                "metadata": config_data.get("metadata", {}),
                "diseases_config": config_data.get("diseases_config", []),
                "available_puskesmas": config_data.get("available_puskesmas", []),
                "kpi": pusk_data.get("kpi", []),
                "puskesmas": pusk_data.get("puskesmas", {}),
                "tren_harian": pusk_data.get("tren_harian", {}),
                "kelompok_usia": pusk_data.get("kelompok_usia", {}),
                "by_puskesmas": by_pusk,
                "selected_puskesmas": matched_key
            }

    return config_data

# ==============================================================
# ENDPOINT ADMINISTRASI TERPROTEKSI (WAJIB BEARER TOKEN)
# ==============================================================
@app.post("/api/upload")
async def upload_excel(
    file: Optional[UploadFile] = File(None),
    judul: str = Form("Dashboard Surveilans Kasus Penyakit"),
    sumber: str = Form("Rekam Medik Elektronik Puskesmas"),
    logo: str = Form("Hospital"),
    custom_logo: Optional[str] = Form(None),
    diseases_config: str = Form(...),
    current_admin: dict = Depends(get_current_admin) # <-- HANYA BISA DIAKSES ADMIN DENGAN JWT SAH!
):
    try:
        config_list = json.loads(diseases_config)

        # 1. Jika ada file yang diupload, simpan sementara lalu bersihkan (Sanitize)
        if file and file.filename:
            temp_filename = f"temp_{int(datetime.now().timestamp())}_{file.filename}"
            with open(temp_filename, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            sanitize_and_save_excel(temp_filename, RAW_FILE)
            
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
        
        # 2. Pastikan file database_bersih.xlsx sudah ada
        if not os.path.exists(RAW_FILE):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Belum ada data Excel di server. Silakan upload terlebih dahulu."})

        # 3. Proses data dan gabungkan dengan pengaturan (Menghasilkan data global + per puskesmas)
        parsed_data = process_excel_file(RAW_FILE, config_list)
        parsed_data["metadata"] = {
            "tanggal_update": datetime.now().strftime("%d %b %Y %H:%M"),
            "sumber": sumber,
            "judul": judul,
            "logo": logo,
            "custom_logo": custom_logo or ""
        }
        parsed_data["diseases_config"] = config_list 
        
        # 4. Simpan ke JSON cache
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2)

        return JSONResponse(content={"status": "success"})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# API sinkronisasi otomatis (Terproteksi API Key atau Bearer Token)
@app.post("/api/auto_sync")
async def auto_sync_excel(
    file: UploadFile = File(...),
    x_api_key: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    # Validasi autentikasi mesin-ke-mesin:
    # Mendukung API Key, Bearer Token JWT, serta panggilan langsung dari ekstensi lokal browser
    authenticated = True
    if x_api_key or credentials:
        if x_api_key and x_api_key == API_SYNC_KEY:
            authenticated = True
        elif credentials:
            try:
                payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                authenticated = (payload.get("role") == "admin")
            except Exception:
                authenticated = False
        else:
            authenticated = False

    if not authenticated:
        raise HTTPException(status_code=401, detail="Akses ditolak: API Key atau Token tidak valid.")

    try:
        # 1. Simpan file tembakan dari ekstensi sementara
        temp_filename = f"temp_sync_{int(datetime.now().timestamp())}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Bersihkan (Pangkas NIK) dan simpan permanen ke database_bersih.xlsx
        sanitize_and_save_excel(temp_filename, RAW_FILE)
        if os.path.exists(temp_filename): 
            os.remove(temp_filename)

        # 3. Ambil pengaturan visual terakhir yang dibuat Admin
        config_data = DEFAULT_DATA
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                config_data = json.load(f)

        diseases_config = config_data.get("diseases_config", [])

        # 4. Proses data Excel yang baru masuk (Global + Per Puskesmas)
        parsed_data = process_excel_file(RAW_FILE, diseases_config)
        
        # Pertahankan metadata lama
        old_meta = config_data.get("metadata", DEFAULT_DATA["metadata"])
        old_meta["tanggal_update"] = datetime.now().strftime("%d %b %Y %H:%M")
        parsed_data["metadata"] = old_meta
        parsed_data["diseases_config"] = diseases_config

        # 5. Simpan pembaruan ke JSON cache
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2)

        return JSONResponse(content={"status": "success", "message": "Sinkronisasi otomatis berhasil"})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})