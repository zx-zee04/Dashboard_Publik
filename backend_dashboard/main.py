from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
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
RAW_FILE = "database_bersih.xlsx"

DEFAULT_DATA = {
    "metadata": {
        "tanggal_update": "Belum ada data",
        "sumber": "Sistem Informasi Rekam Medis",
        "judul": "Dashboard Surveilans Penyakit",
        "logo": "Hospital"
    },
    "diseases_config": [
        {"id": "ispa", "name": "ISPA", "codes": "J00, J01, J02, J03, J04, J05, J06, J09, J10, J11, J12, J13, J14, J15, J16, J17, J18, J20, J21, J22", "color": "#f97316"},
        {"id": "diare", "name": "DIARE", "codes": "A00, A02, A03, A04, A06, A08, A09", "color": "#10b981"},
        {"id": "tbc", "name": "TUBERKULOSIS", "codes": "A15, A16, A17, A18, A19", "color": "#8b5cf6"},
        {"id": "konjungtivitis", "name": "KONJUNGTIVITIS", "codes": "H10, H11, H13", "color": "#ef4444"},
        {"id": "dm", "name": "DIABETES MELITUS", "codes": "E10, E11", "color": "#3b82f6"}
    ],
    "kpi": [], "puskesmas": {}, "tren_harian": {}, "kelompok_usia": {}
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
                safe_keywords = ['tanggal', 'jenis kelamin', 'umur', 'diagnosa', 'icd', 'kode']
                cols_to_keep = [col for col in df.columns if any(k in str(col).lower().strip() for k in safe_keywords)]
                df[cols_to_keep].to_excel(writer, sheet_name=sheet, index=False)
            except Exception: pass
    xls.close()

def process_excel_file(file_path, config_list, target_puskesmas=None):
    all_records = []
    xls = None
    try:
        xls = pd.ExcelFile(file_path)
        for sheet in xls.sheet_names:
            try:
                df = pd.read_excel(xls, sheet_name=sheet)
                if df.empty: continue
                df.columns = df.columns.str.strip()
                needed_cols = ['Tanggal', 'Jenis Kelamin', 'Umur Tahun', 'Diagnosa 1', 'ICD-X 1']
                if any(c in df.columns for c in needed_cols): # Jika ada minimal 1 kolom valid
                    available = [c for c in needed_cols if c in df.columns]
                    df_sub = df[available].copy()
                    df_sub['Puskesmas'] = sheet
                    all_records.append(df_sub)
            except Exception: continue
    finally:
        if xls is not None: xls.close()

    if not all_records:
        raise ValueError("Data bersih kosong atau format kolom tidak sesuai.")
        
    merged_df = pd.concat(all_records, ignore_index=True)
    all_puskesmas_names = sorted(merged_df['Puskesmas'].dropna().unique().tolist())

    if target_puskesmas and target_puskesmas != "Semua Puskesmas":
        merged_df = merged_df[merged_df['Puskesmas'].str.lower() == target_puskesmas.lower()]

    diagnosa_series = (
        merged_df['Diagnosa 1'].fillna('').astype(str) + " " +
        (merged_df['ICD-X 1'].fillna('').astype(str) if 'ICD-X 1' in merged_df.columns else '')
    ).str.upper()

    kpi_list, puskesmas_dict, tren_harian_dict, kelompok_usia_dict = [], {}, {}, {}
    merged_df['Clean_Date'] = pd.to_datetime(merged_df['Tanggal'], errors='coerce', dayfirst=True) if 'Tanggal' in merged_df.columns else pd.Series([])
    merged_df['Clean_Age'] = merged_df['Umur Tahun'].apply(extract_age_number) if 'Umur Tahun' in merged_df.columns else pd.Series([])
    merged_df['Age_Group'] = merged_df['Clean_Age'].apply(categorize_age)
    age_order = ["0-1 Thn", "1-5 Thn", "5-18 Thn", "18-59 Thn", ">60 Thn"]

    for dis in config_list:
        d_id, d_name, d_color = dis['id'], dis['name'], dis['color']
        pattern = build_regex_from_codes(dis['codes'])
        sub = merged_df[diagnosa_series.str.contains(pattern, regex=True)]

        gender_col = sub['Jenis Kelamin'].astype(str).str.strip().str.lower() if 'Jenis Kelamin' in sub.columns else pd.Series([])
        kpi_list.append({
            "id": d_id, "name": d_name, "total": int(len(sub)),
            "male": int((gender_col == 'laki-laki').sum()), 
            "female": int((gender_col == 'perempuan').sum()), "color": d_color
        })

        puskesmas_dict[d_id] = sub['Puskesmas'].value_counts().reset_index().rename(columns={'Puskesmas': 'name', 'count': 'count'}).head(15).to_dict(orient='records') if not sub.empty else []

        if not sub.empty and 'Clean_Date' in sub.columns:
            valid_dates = sub.dropna(subset=['Clean_Date']).sort_values('Clean_Date')
            tren_harian_dict[d_id] = valid_dates.groupby(valid_dates['Clean_Date'].dt.strftime('%d %b'), sort=False)['Puskesmas'].count().reset_index().rename(columns={'Clean_Date': 'date', 'Puskesmas': 'count'}).tail(20).to_dict(orient='records') if not valid_dates.empty else []
        else: tren_harian_dict[d_id] = []

        age_counts = sub['Age_Group'].value_counts() if not sub.empty and 'Age_Group' in sub.columns else {}
        kelompok_usia_dict[d_id] = [{"group": grp, "count": int(age_counts.get(grp, 0))} for grp in age_order]

    return {"kpi": kpi_list, "puskesmas": puskesmas_dict, "tren_harian": tren_harian_dict, "kelompok_usia": kelompok_usia_dict, "available_puskesmas": all_puskesmas_names}

@app.get("/api/dashboard")
def get_dashboard_data(puskesmas: Optional[str] = None):
    config_data = DEFAULT_DATA
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            config_data = json.load(f)
            
    if not os.path.exists(RAW_FILE):
        return config_data
        
    try:
        diseases_config = config_data.get("diseases_config", [])
        calculated_data = process_excel_file(RAW_FILE, diseases_config, target_puskesmas=puskesmas)
        calculated_data["metadata"] = config_data.get("metadata", {})
        calculated_data["diseases_config"] = diseases_config
        return calculated_data
    except Exception as e:
        print(f"Error filtering dashboard: {e}")
        return config_data

# --- API UPLOAD TERPUSAT KEMBALI ---
@app.post("/api/upload")
async def upload_excel(
    file: Optional[UploadFile] = File(None),
    judul: str = Form("Dashboard Surveilans Kasus Penyakit"),
    sumber: str = Form("Rekam Medik Elektronik Puskesmas"),
    logo: str = Form("Hospital"),
    diseases_config: str = Form(...) 
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

        # 3. Proses data dan gabungkan dengan pengaturan
        parsed_data = process_excel_file(RAW_FILE, config_list)
        parsed_data["metadata"] = {
            "tanggal_update": datetime.now().strftime("%d %b %Y %H:%M"),
            "sumber": sumber,
            "judul": judul,
            "logo": logo
        }
        parsed_data["diseases_config"] = config_list 
        
        # 4. Simpan ke JSON
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2)

        return JSONResponse(content={"status": "success"})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})