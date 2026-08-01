-- Tabel product stock untuk form Input Stock
CREATE TABLE IF NOT EXISTS "Admin_Ely_Product_Stock" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  harga NUMERIC(15, 2) NOT NULL CHECK (harga > 0),
  currency TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (
    jenis IN ('Aksesoris', 'Alat Tulis Kantor', 'Pakaian', 'Lain-lain')
  ),
  detail_barang TEXT NOT NULL CHECK (char_length(detail_barang) <= 500),
  barcode_image_url TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bucket storage untuk gambar barcode (jalankan di Supabase Dashboard > Storage jika belum ada)
-- Nama bucket: product-barcode-images
-- Public: true (atau sesuaikan kebijakan akses proyek Anda)

-- Contoh policy insert untuk anon key (sesuaikan dengan kebutuhan keamanan):
-- CREATE POLICY "Allow insert product stock"
--   ON "Admin_Ely_Product_Stock"
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (true);

-- CREATE POLICY "Allow upload barcode images"
--   ON storage.objects
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (bucket_id = 'product-barcode-images');
