from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import os
import shutil
import re
import traceback
from datetime import datetime

app = FastAPI(title="Dashboard Surveilans API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "dashboard_data.json"

# Struktur default kosong sebelum ada upload
DEFAULT_DATA = {
    "metadata": {
        "tanggal_update": "Belum ada data",
        "sumber": "Sistem Informasi Rekam Medis",
        "judul": "Dashboard Surveilans Penyakit",
        "logo": "Hospital"
    },
    # Tambahkan blok ini agar saat sistem kosong, ada preset default:
    "diseases_config": [
        {"id": "ispa", "name": "ISPA", "codes": "J00, J01, J02, J03, J04, J05, J06, J09, J10, J11, J12, J13, J14, J15, J16, J17, J18, J20, J21, J22", "color": "#f97316"},
        {"id": "diare", "name": "DIARE", "codes": "A00, A02, A03, A04, A06, A08, A09", "color": "#10b981"},
        {"id": "tbc", "name": "TUBERKULOSIS", "codes": "A15, A16, A17, A18, A19", "color": "#8b5cf6"},
        {"id": "konjungtivitis", "name": "KONJUNGTIVITIS", "codes": "H10, H11, H13", "color": "#ef4444"},
        {"id": "dm", "name": "DIABETES MELITUS", "codes": "E10, E11", "color": "#3b82f6"}
    ],
    "kpi": [],
    "puskesmas": {},
    "tren_harian": {},
    "kelompok_usia": {}
}

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_DATA, f, indent=2)

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
    """Mengubah string 'J00, J01, A09' menjadi regex pattern 'J00|J01|A09'"""
    # Bersihkan spasi dan pisahkan dengan koma
    codes_list = [c.strip().upper() for c in codes_string.split(',') if c.strip()]
    if not codes_list:
        return "^$" # Regex yang tidak akan cocok dengan apa pun (empty)
    # Gabungkan dengan operator OR (|) di Regex
    # re.escape mencegah karakter aneh merusak regex
    regex_pattern = '|'.join([re.escape(c) for c in codes_list])
    return regex_pattern

def process_excel_file(file_path, config_list):
    all_records = []
    xls = None
    
    try:
        # Buka file Excel seperti cara lamamu yang berhasil
        xls = pd.ExcelFile(file_path)
        puskesmas_sheets = [s for s in xls.sheet_names if s not in ['STATUS', 'DETAIL_HARI']]
        
        for sheet in puskesmas_sheets:
            try:
                df = pd.read_excel(xls, sheet_name=sheet)
                if df.empty: 
                    print(f"[-] Sheet '{sheet}' dilewati karena kosong.")
                    continue
                
                # Bersihkan spasi nyasar pada nama kolom jika ada
                df.columns = df.columns.str.strip()
                
                needed_cols = ['Tanggal', 'Jenis Kelamin', 'Umur Tahun', 'Diagnosa 1', 'ICD-X 1']
                available = [c for c in needed_cols if c in df.columns]
                
                if available:
                    df_sub = df[available].copy()
                    df_sub['Puskesmas'] = sheet
                    all_records.append(df_sub)
                    print(f"[+] Sheet '{sheet}' berhasil diproses.")
                else:
                    print(f"[!] Sheet '{sheet}' ditolak. Kolom di file: {list(df.columns)}")
            except Exception as e:
                print(f"[X] Gagal membaca sheet '{sheet}'. Error: {str(e)}")
                continue
                
    finally:
        # CARA PALING AMPUH DI WINDOWS: Tutup file manual agar tidak terkunci
        if xls is not None:
            xls.close()

    if not all_records:
        raise ValueError("Semua sheet data kosong atau format header kolom tidak sesuai.")
        
    merged_df = pd.concat(all_records, ignore_index=True)
    
    # Gabungkan diagnosa dan ICD-10 untuk dicari oleh Engine Filter
    diagnosa_series = (
        merged_df['Diagnosa 1'].fillna('').astype(str) + " " +
        (merged_df['ICD-X 1'].fillna('').astype(str) if 'ICD-X 1' in merged_df.columns else '')
    ).str.upper()

    # Inisialisasi struktur hasil
    kpi_list = []
    puskesmas_dict = {}
    tren_harian_dict = {}
    kelompok_usia_dict = {}

    merged_df['Clean_Date'] = pd.to_datetime(merged_df['Tanggal'], errors='coerce', dayfirst=True) if 'Tanggal' in merged_df.columns else pd.Series([])
    merged_df['Clean_Age'] = merged_df['Umur Tahun'].apply(extract_age_number) if 'Umur Tahun' in merged_df.columns else pd.Series([])
    merged_df['Age_Group'] = merged_df['Clean_Age'].apply(categorize_age)
    age_order = ["0-1 Thn", "1-5 Thn", "5-18 Thn", "18-59 Thn", ">60 Thn"]

    # LOOP DINAMIS BERDASARKAN FILTER ADMIN
    for dis in config_list:
        d_id = dis['id']
        d_name = dis['name']
        d_color = dis['color']
        
        # Buat mask Regex dari input koma
        pattern = build_regex_from_codes(dis['codes'])
        mask = diagnosa_series.str.contains(pattern, regex=True)
        
        sub = merged_df[mask]

        # 1. KPI Pokok
        total = int(len(sub))
        gender_col = sub['Jenis Kelamin'].astype(str).str.strip().str.lower() if 'Jenis Kelamin' in sub.columns else pd.Series([])
        male = int((gender_col == 'laki-laki').sum())
        female = int((gender_col == 'perempuan').sum())
        
        kpi_list.append({
            "id": d_id, "name": d_name, "total": total,
            "male": male, "female": female, "color": d_color
        })

        # 2. Distribusi Puskesmas
        if not sub.empty:
            counts = sub['Puskesmas'].value_counts().reset_index()
            counts.columns = ['name', 'count']
            puskesmas_dict[d_id] = counts.head(15).to_dict(orient='records')
        else:
            puskesmas_dict[d_id] = []

        # 3. Tren Harian
        if not sub.empty and 'Clean_Date' in sub.columns:
            valid_dates = sub.dropna(subset=['Clean_Date']).sort_values('Clean_Date')
            if not valid_dates.empty:
                daily_counts = valid_dates.groupby(valid_dates['Clean_Date'].dt.strftime('%d %b'), sort=False)['Puskesmas'].count().reset_index()
                daily_counts.columns = ['date', 'count']
                tren_harian_dict[d_id] = daily_counts.tail(20).to_dict(orient='records')
            else:
                tren_harian_dict[d_id] = []
        else:
            tren_harian_dict[d_id] = []

        # 4. Kelompok Usia
        if not sub.empty and 'Age_Group' in sub.columns:
            age_counts = sub['Age_Group'].value_counts()
            kelompok_usia_dict[d_id] = [{"group": grp, "count": int(age_counts.get(grp, 0))} for grp in age_order]
        else:
            kelompok_usia_dict[d_id] = [{"group": grp, "count": 0} for grp in age_order]

    return {
        "kpi": kpi_list,
        "puskesmas": puskesmas_dict,
        "tren_harian": tren_harian_dict,
        "kelompok_usia": kelompok_usia_dict
    }

@app.get("/api/dashboard")
def get_dashboard_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return DEFAULT_DATA

@app.post("/api/upload")
async def upload_excel(
    file: UploadFile = File(...),
    judul: str = Form("Dashboard Surveilans Kasus Penyakit"),
    sumber: str = Form("Rekam Medik Elektronik Puskesmas"),
    logo: str = Form("Hospital"),
    diseases_config: str = Form(...) # Menerima JSON dari frontend
):
    temp_filename = f"temp_{int(datetime.now().timestamp())}_{file.filename}"
    try:
        # Ubah string JSON config menjadi list dictionary Python
        config_list = json.loads(diseases_config)

        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Eksekusi pemrosesan data (Kirim list filter ke engine)
        parsed_data = process_excel_file(temp_filename, config_list)
        
        # Tambahkan metadata
        parsed_data["metadata"] = {
            "tanggal_update": datetime.now().strftime("%d %b %Y %H:%M"),
            "sumber": sumber,
            "judul": judul,
            "logo": logo
        }
        # Tambahkan konfigurasi filter admin ke dalam JSON agar bisa dibaca lagi nanti
        parsed_data["diseases_config"] = config_list 
        
        # Timpa file JSON
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2)

        return JSONResponse(content={"status": "success"}, headers={"Access-Control-Allow-Origin": "*"})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)}, headers={"Access-Control-Allow-Origin": "*"})
    finally:
        if os.path.exists(temp_filename):
            try: os.remove(temp_filename)
            except: pass