-- Tabel product barang
CREATE SEQUENCE IF NOT EXISTS admin_ely_product_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Product" (
  product_id TEXT PRIMARY KEY,
  slug_id TEXT NOT NULL UNIQUE CHECK (char_length(slug_id) <= 120),
  nama_barang TEXT NOT NULL CHECK (char_length(nama_barang) <= 100),
  tipe_barang TEXT NOT NULL CHECK (char_length(tipe_barang) <= 100),
  kuantitas INTEGER NOT NULL CHECK (kuantitas >= 0),
  satuan_kuantitas TEXT NOT NULL CHECK (char_length(satuan_kuantitas) <= 100),
  keterangan TEXT CHECK (keterangan IS NULL OR char_length(keterangan) <= 250),
  barcode TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION generate_admin_ely_product_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NULL OR NEW.product_id = '' THEN
    NEW.product_id := 'product_' || nextval('admin_ely_product_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_product_id ON "Admin_Ely_Product";

CREATE TRIGGER set_admin_ely_product_id
BEFORE INSERT ON "Admin_Ely_Product"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_product_id();
