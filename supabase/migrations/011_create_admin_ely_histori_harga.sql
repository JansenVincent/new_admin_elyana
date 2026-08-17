-- Tabel histori perubahan harga
CREATE SEQUENCE IF NOT EXISTS admin_ely_hist_harga_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Histori_Harga" (
  hist_harga_id TEXT PRIMARY KEY,
  harga_id TEXT NOT NULL REFERENCES "Admin_Ely_Harga"(harga_id) ON DELETE RESTRICT,
  catatan TEXT NOT NULL CHECK (char_length(catatan) <= 250)
);

CREATE OR REPLACE FUNCTION generate_admin_ely_hist_harga_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hist_harga_id IS NULL OR NEW.hist_harga_id = '' THEN
    NEW.hist_harga_id := 'hist_harga_' || nextval('admin_ely_hist_harga_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_hist_harga_id ON "Admin_Ely_Histori_Harga";

CREATE TRIGGER set_admin_ely_hist_harga_id
BEFORE INSERT ON "Admin_Ely_Histori_Harga"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_hist_harga_id();
