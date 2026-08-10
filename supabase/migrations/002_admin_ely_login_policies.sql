-- Policy akses untuk tabel Admin_Ely_Login
-- Jalankan di Supabase Dashboard → SQL Editor → Run
--
-- Catatan: Aplikasi admin ini memakai anon key dari browser (bukan Supabase Auth JWT).
-- Policy di bawah memberi role `anon` akses SELECT, INSERT, DELETE.
-- Untuk production, pertimbangkan memindahkan operasi sensitif ke API route + service role key.

-- 1. Aktifkan Row Level Security
ALTER TABLE "Admin_Ely_Login" ENABLE ROW LEVEL SECURITY;

-- 2. Beri hak akses dasar ke role anon & authenticated
GRANT SELECT, INSERT, DELETE ON "Admin_Ely_Login" TO anon;
GRANT SELECT, INSERT, DELETE ON "Admin_Ely_Login" TO authenticated;

-- 3. Hapus policy lama jika ada (aman dijalankan ulang)
DROP POLICY IF EXISTS "Allow anon select Admin_Ely_Login" ON "Admin_Ely_Login";
DROP POLICY IF EXISTS "Allow anon insert Admin_Ely_Login" ON "Admin_Ely_Login";
DROP POLICY IF EXISTS "Allow anon delete karyawan Admin_Ely_Login" ON "Admin_Ely_Login";

-- 4. SELECT — untuk login & daftar user di Delete User
CREATE POLICY "Allow anon select Admin_Ely_Login"
  ON "Admin_Ely_Login"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. INSERT — untuk form Add User
CREATE POLICY "Allow anon insert Admin_Ely_Login"
  ON "Admin_Ely_Login"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. DELETE — hanya baris dengan role karyawan (sesuai logika Delete User di app)
CREATE POLICY "Allow anon delete karyawan Admin_Ely_Login"
  ON "Admin_Ely_Login"
  FOR DELETE
  TO anon, authenticated
  USING (role = 'karyawan');
