# New Admin Ely

Panel admin dengan React, Next.js, Tailwind CSS, dan Supabase.

## Struktur Clean Architecture

```
src/
├── app/                          # Next.js App Router (routing & pages)
│   ├── login/page.tsx            # Route /login
│   ├── home/page.tsx             # Route /home (dashboard)
│   ├── layout.tsx
│   └── page.tsx                  # Redirect ke /login
│
├── domain/                       # Layer Domain (business rules)
│   ├── entities/                 # Model data bisnis
│   │   └── AdminUser.ts
│   └── repositories/             # Interface/kontrak (ports)
│       └── AuthRepository.ts
│
├── application/                  # Layer Application (use cases)
│   └── services/
│       └── AuthService.ts        # Orkestrasi logika login
│
├── infrastructure/               # Layer Infrastructure (adapters)
│   ├── supabase/
│   │   └── client.ts             # Supabase client + timeout 60s
│   └── repositories/
│       └── SupabaseAuthRepository.ts
│
├── presentation/                 # Layer Presentation (UI)
│   └── components/
│       ├── login/
│       │   └── Login.tsx
│       └── ui/
│           └── ErrorPopup.tsx
│
└── shared/                       # Konstanta & utilitas bersama
    └── constants/
        └── auth.ts
```

## Alur Login

1. User mengisi form di `Login.tsx`
2. `AuthService.login()` dipanggil (application layer)
3. `SupabaseAuthRepository.login()` query tabel `Admin_Ely_Login` (infrastructure)
4. Berhasil → redirect ke `/home` | Gagal → popup "Gagal Login"

## Setup

```bash
npm install
npm run dev
```

Pastikan `.env` berisi:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Lihat `.env.example` untuk penjelasan lengkap.

## Migration Supabase

Jalankan **berurutan** di Supabase SQL Editor:

| File | Isi |
|------|-----|
| `001_create_admin_ely_login.sql` | Tabel login (`user_id`, name, username, password, role, ...) |
| `002_admin_ely_login_security.sql` | RLS + revoke anon |
| `003_create_admin_ely_customer.sql` | Tabel customer (`cust_id`, `status_customer`, ...) |
| `004_admin_ely_customer_security.sql` | RLS customer |
| `005_create_admin_ely_product.sql` | Tabel product |
| `006_admin_ely_product_security.sql` | RLS product |
| `007_create_admin_ely_histori_masuk_product.sql` | Histori masuk barang |
| `008_admin_ely_histori_masuk_product_security.sql` | RLS histori masuk |
| `009_create_admin_ely_harga.sql` | Tabel harga per customer |
| `010_admin_ely_harga_security.sql` | RLS harga |
| `011_create_admin_ely_histori_harga.sql` | Histori harga |
| `012_admin_ely_histori_harga_security.sql` | RLS histori harga |
| `013_create_product_barcode_bucket.sql` | Bucket storage `product-barcode-images` |
| `014_alter_histori_masuk_tanggal_masuk_to_date.sql` | `tanggal_masuk` TIMESTAMP → DATE (YYYY-MM-DD) |
| `015_create_admin_ely_histori_keluar_product.sql` | Histori keluar barang |
| `016_admin_ely_histori_keluar_product_security.sql` | RLS histori keluar |

Atau buat bucket storage **`product-barcode-images`** manual di Supabase Dashboard → **Storage** → **New bucket** (Public bucket, max file size 5MB).

### Kolom utama

**Admin_Ely_Login:** `user_id` (PK, user_1...), name, username, password (bcrypt), role, created_date, last_login

**Admin_Ely_Customer:** `cust_id` (PK, cust_1...), cust_name, address, front_code, back_code, status_customer (default Active), created_date, last_edited

**Admin_Ely_Product:** `product_id` (PK, product_1...), `slug_id` (UNIQUE, slug nama barang + short id untuk URL detail, contoh: `sepatu-lari-nike-black-a8f2k`), nama_barang, tipe_barang, kuantitas, satuan_kuantitas, keterangan, barcode

**Admin_Ely_Harga:** `harga_id` (PK, price_1...), product_id (FK), cust_id (FK), harga, mata_uang

**Admin_Ely_Histori_Keluar_Product:** `keluar_id` (PK, keluar_1...), product_id (FK), tanggal_keluar (DATE), kuantitas_keluar, catatan

### Keamanan Production

Operasi sensitif lewat **API route** + **SUPABASE_SERVICE_ROLE_KEY**. Hapus customer = soft delete (`status_customer` → Inactive). URL detail My Product memakai `slug_id`, bukan primary key `product_id`.
