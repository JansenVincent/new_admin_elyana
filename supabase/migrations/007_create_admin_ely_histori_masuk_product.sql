-- Tabel histori masuk product
CREATE SEQUENCE IF NOT EXISTS admin_ely_masuk_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Histori_Masuk_Product" (
  masuk_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES "Admin_Ely_Product"(product_id) ON DELETE RESTRICT,
  tanggal_masuk TIMESTAMP NOT NULL,
  kuantitas_masuk INTEGER NOT NULL CHECK (kuantitas_masuk > 0),
  catatan TEXT NOT NULL CHECK (char_length(catatan) <= 250)
);

CREATE OR REPLACE FUNCTION generate_admin_ely_masuk_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.masuk_id IS NULL OR NEW.masuk_id = '' THEN
    NEW.masuk_id := 'masuk_' || nextval('admin_ely_masuk_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_masuk_id ON "Admin_Ely_Histori_Masuk_Product";

CREATE TRIGGER set_admin_ely_masuk_id
BEFORE INSERT ON "Admin_Ely_Histori_Masuk_Product"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_masuk_id();
