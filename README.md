# System Inventory (Stockify)

Sistem Manajemen Inventaris berbasis web untuk mengelola stok gudang secara lengkap dan terstruktur — mulai dari produk, pembelian (purchase order), penerimaan barang, stok masuk/keluar, transfer antar gudang, opname, hingga laporan dan audit trail.

Dibangun dengan **React + Node.js + MySQL**.

---

## Tentang Sistem

**System Inventory** adalah aplikasi inventaris enterprise yang membantu tim gudang, purchasing, finance, dan manajemen bekerja dalam satu platform terpusat. Setiap perubahan stok tercatat otomatis dalam *ledger* (riwayat stok) sehingga data selalu akurat dan dapat ditelusuri.

Keuntungan utama bagi pengguna:

- **Data stok real-time & akurat** — semua transaksi langsung mengubah saldo stok.
- **Alur kerja jelas** — setiap transaksi punya status dan persetujuan sesuai peran.
- **Rekam jejak lengkap** — audit log mencatat siapa melakukan apa dan kapan.
- **Laporan otomatis** — ekspor laporan stok & pergerakan stok ke Excel.
- **Notifikasi stok menipis** — mencegah kehabisan barang.

---

## Fitur Utama

### Dashboard
Ringkasan kondisi inventaris: total produk, nilai inventaris, stok menipis, stok habis, barang masuk/keluar hari ini & bulan ini, daftar PO tertunda, pergerakan stok terbaru, dan produk terlaris.

### Master Data
| Menu | Fungsi |
|---|---|
| Produk | Kelola produk (SKU, barcode, QR code, harga, stok minimum/maksimum, lokasi rak) |
| Kategori | Kategori bertingkat (parent–child) |
| Brand | Daftar merek produk |
| Supplier | Data pemasok barang |
| Pelanggan | Data pelanggan |
| Gudang | Daftar gudang penyimpanan |
| Lokasi | Hierarki lokasi rak: area → rack → shelf → bin |

### Transaksi
| Menu | Fungsi |
|---|---|
| Purchase Order | Membuat & menyetujui pesanan pembelian ke supplier |
| Penerimaan Barang | Mencatat barang diterima (jumlah normal, rusak, kurang, kedaluwarsa) lengkap dengan foto bukti |
| Stock In | Barang masuk manual (stok awal, retur supplier, dll.) |
| Stock Out | Barang keluar (penjualan, pemakaian, dll.) dengan persetujuan |
| Transfer Stok | Pindah stok antar gudang (kirim → terima) |
| Penyesuaian Stok | Koreksi selisih stok |
| Opname Stok | Hitung fisik stok dan catat selisihnya |

### Riwayat & Laporan
- **Pergerakan Stok** — ledger semua perubahan stok (masuk, keluar, transfer, penyesuaian, opname, PO, penerimaan).
- **Laporan** — laporan stok & pergerakan stok dengan filter, dapat di-ekspor ke **Excel (.xlsx)**.

### Sistem
- **Pengguna** — kelola user & peran.
- **Log Aktivitas** — audit trail semua aksi pengguna.
- **Pengaturan** — konfigurasi aplikasi (nama aplikasi, low-stock alert, dll.).

---

## Cara Kerja Sistem Bagi User

### 1. Login & Keamanan
1. Buka aplikasi di browser → halaman **Login**.
2. Masukkan **email** dan **password**.
3. Sistem memverifikasi kredensial dan memuat menu sesuai **peran** Anda.
4. Sesi aman dengan token JWT (refresh otomatis). Lupa password? gunakan menu **Lupa Password** → tautan reset dikirim ke email.

### 2. Alur Pembelian (Purchase → Terima Barang)
```
1. Purchasing membuat Purchase Order (PO) → status: pending
2. Finance/Manager menyetujui PO      → status: approved
3. Supplier mengirim barang
4. Staff Gudang membuat Penerimaan Barang
   → mencatat jumlah diterima / rusak / kurang / kedaluwarsa
   → melampirkan foto bukti
   → stok otomatis bertambah & tercatat di pergerakan stok
5. PO selesai saat semua item terpenuhi
```

### 3. Alur Stok Keluar
1. Staff membuat **Stock Out** dengan alasan (penjualan, pemakaian, dll.).
2. Manager menyetujui dokumen → stok otomatis berkurang.
3. Riwayat tercatat di pergerakan stok.

### 4. Alur Transfer Antar Gudang
1. Buat **Transfer Stok** dari gudang A ke gudang B → status *pending*.
2. Gudang A mengirim → status *shipped* (stok gudang A berkurang).
3. Gudang B menerima → status *received* (stok gudang B bertambah).

### 5. Opname & Penyesuaian
- **Opname Stok:** hitung fisik barang → sistem membandingkan dengan stok sistem → selisih dihitung.
- **Penyesuaian Stok:** koreksi manual stok jika ada selisih, dengan persetujuan manager.

### 6. Pelacakan Otomatis
- Setiap transaksi menulis **1 baris ke ledger `stock_movements`** — jadi Anda selalu tahu: kapan, berapa, dari mana, ke mana, dan siapa yang melakukan perubahan.
- **Log Aktivitas** merekam semua aksi pengguna untuk keperluan audit.

---

## Peran & Hak Akses

| Peran | Ringkasan Hak Akses |
|---|---|
| **Super Admin** | Semua akses (termasuk kelola user, log, pengaturan, backup) |
| **Manager Gudang** | Kelola master data, semua transaksi & persetujuan, laporan, audit |
| **Staff Gudang** | Buat produk & transaksi stok (tanpa persetujuan), tidak bisa kelola master data pengguna |
| **Purchasing** | Kelola PO & penerimaan barang, supplier, import/ekspor produk, laporan |
| **Finance** | Menyetujui PO, melihat seluruh data & laporan (hanya baca) |
| **Viewer** | Melihat seluruh data & laporan (read-only) |

Setiap menu akan otomatis tampil/sembunyi sesuai izin peran. Akses yang tidak diizinkan akan menampilkan halaman **403 Forbidden**.

---

## Teknologi

**Frontend:** React 18, Vite, TailwindCSS, React Router, React Query, Zustand, React Hook Form + Zod, Recharts, html5-qrcode, xlsx

**Backend:** Node.js, Express, Sequelize (ORM), MySQL, Socket.IO (realtime), JWT + refresh token, bcryptjs, Joi (validasi), Multer (upload), ExcelJS (ekspor Excel), PDFKit, QR/Barcode (qrcode, bwip-js), Nodemailer (email)

---

## Cara Menjalankan

### Prasyarat
- Node.js (LTS)
- Server MySQL lokal — panduan lengkap: [`database/PANDUAN_DATABASE.md`](database/PANDUAN_DATABASE.md)

### 1. Siapkan Database
Ikuti panduan di [`database/PANDUAN_DATABASE.md`](database/PANDUAN_DATABASE.md) untuk membuat database `inventory_db` (27 tabel) dan mengisi data awal (seed). Skema & seed tersedia di:
- `database/schema.mysql.sql`
- `database/seed.sql`

> Diagram relasi tabel: [`database/ERD.md`](database/ERD.md)

### 2. Konfigurasi Backend
```bash
cd backend
cp .env.example .env
```
Sesuaikan isi `.env` (host/port/user/password MySQL). Konfigurasi default mengikuti koneksi di `PANDUAN_DATABASE.md` (host `127.0.0.1`, user `root`, tanpa password).

### 3. Install & Jalankan
```bash
# dari folder project root:
npm run install:all      # install dependensi backend & frontend
npm run dev              # jalankan backend + frontend bersamaan
```
Atau jalankan terpisah:
```bash
npm run dev:backend      # backend → http://localhost:5000
npm run dev:frontend     # frontend → http://localhost:5173
```

Buka aplikasi di browser: **http://localhost:5173**

---

## Akun Demo (dari seed)

Semua akun berpassword **`Admin@123`**:

| Peran | Email |
|---|---|
| Super Admin | `admin@company.com` |
| Manager Gudang | `manager@company.com` |
| Staff Gudang | `staff@company.com` |
| Purchasing | `purchasing@company.com` |
| Finance | `finance@company.com` |
| Viewer | `viewer@company.com` |

---

## Struktur Folder

```
system_inventroy/
├── backend/               # REST API (Express + Sequelize)
│   └── src/
│       ├── controllers/   # logika bisnis per modul
│       ├── models/        # model Sequelize (28 tabel)
│       ├── routes/        # endpoint API
│       ├── middlewares/   # auth, otorisasi, validasi, error handler
│       ├── services/      # permission & business service
│       ├── sockets/       # realtime (Socket.IO)
│       └── validators/    # skema validasi Joi
├── frontend/              # SPA (React + Vite + Tailwind)
│   └── src/
│       ├── pages/         # halaman (master, transactions, system, auth)
│       ├── layouts/       # layout aplikasi
│       ├── router/        # routing & guard permission
│       ├── store/         # state (Zustand)
│       └── api/           # client API (axios)
├── database/
│   ├── schema.mysql.sql   # skema database (27 tabel)
│   ├── seed.sql           # data awal
│   ├── ERD.md             # diagram relasi tabel
│   └── PANDUAN_DATABASE.md # panduan setup database (DBngin + TablePlus)
└── package.json           # script helper (install, dev, build)
```

---

## Lisensi

Proyek internal/private (`private: true`).
