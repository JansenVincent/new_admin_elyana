-- Tabel harga product per customer
CREATE SEQUENCE IF NOT EXISTS admin_ely_harga_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Harga" (
  harga_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES "Admin_Ely_Product"(product_id) ON DELETE RESTRICT,
  cust_id TEXT NOT NULL REFERENCES "Admin_Ely_Customer"(cust_id) ON DELETE RESTRICT,
  harga DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (harga >= 0),
  mata_uang TEXT NOT NULL DEFAULT 'IDR' CHECK (char_length(mata_uang) <= 50)
);

CREATE OR REPLACE FUNCTION generate_admin_ely_harga_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.harga_id IS NULL OR NEW.harga_id = '' THEN
    NEW.harga_id := 'price_' || nextval('admin_ely_harga_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_harga_id ON "Admin_Ely_Harga";

CREATE TRIGGER set_admin_ely_harga_id
BEFORE INSERT ON "Admin_Ely_Harga"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_harga_id();
