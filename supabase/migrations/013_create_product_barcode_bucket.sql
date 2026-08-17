-- Bucket Supabase Storage untuk gambar barcode product (Input Barang)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-barcode-images',
  'product-barcode-images',
  true,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;
