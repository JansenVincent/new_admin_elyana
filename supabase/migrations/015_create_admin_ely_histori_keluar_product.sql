-- Tabel histori keluar product
CREATE SEQUENCE IF NOT EXISTS admin_ely_keluar_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Histori_Keluar_Product" (
  keluar_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES "Admin_Ely_Product"(product_id) ON DELETE RESTRICT,
  tanggal_keluar DATE NOT NULL,
  kuantitas_keluar INTEGER NOT NULL CHECK (kuantitas_keluar > 0),
  catatan TEXT NOT NULL CHECK (char_length(catatan) <= 250)
);

CREATE OR REPLACE FUNCTION generate_admin_ely_keluar_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.keluar_id IS NULL OR NEW.keluar_id = '' THEN
    NEW.keluar_id := 'keluar_' || nextval('admin_ely_keluar_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_keluar_id ON "Admin_Ely_Histori_Keluar_Product";

CREATE TRIGGER set_admin_ely_keluar_id
BEFORE INSERT ON "Admin_Ely_Histori_Keluar_Product"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_keluar_id();
