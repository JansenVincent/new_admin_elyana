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

## Tabel Supabase

Pastikan tabel `Admin_Ely_Login` memiliki kolom minimal:
- `id` (uuid/int, primary key)
- `name` (text)
- `username` (text)
- `password` (text) — disimpan ter-hash bcrypt via API server-side
- `role` (text)
- `created_date` (timestamp) — default WIB: `date_trunc('second', now() AT TIME ZONE 'Asia/Jakarta')`
- `last_login` (timestamp, nullable) — di-update ke waktu WIB saat login berhasil

### Keamanan Production

Operasi **Login**, **Add User**, dan **Delete User** dijalankan melalui **API route Next.js** (`/api/auth/login`, `/api/users`) memakai **service role key** (server-only). Password di-hash dengan bcrypt sebelum disimpan.

Jalankan migration berurutan di Supabase SQL Editor:
1. `supabase/migrations/003_admin_ely_login_security.sql` — keamanan & revoke akses anon
2. `supabase/migrations/004_admin_ely_login_wib_timestamp.sql` — default created_date WIB

Untuk fitur Input Stock, jalankan migration di `supabase/migrations/001_create_product_stock.sql` dan buat bucket storage `product-barcode-images` di Supabase Dashboard.
