-- Tabel customer
CREATE SEQUENCE IF NOT EXISTS admin_ely_customer_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Customer" (
  cust_id TEXT PRIMARY KEY,
  cust_name TEXT NOT NULL CHECK (char_length(cust_name) <= 100),
  address TEXT CHECK (address IS NULL OR char_length(address) <= 150),
  front_code TEXT NOT NULL CHECK (char_length(front_code) <= 10),
  back_code TEXT NOT NULL CHECK (char_length(back_code) <= 10),
  status_customer TEXT NOT NULL DEFAULT 'Active' CHECK (char_length(status_customer) <= 50),
  created_date TIMESTAMP NOT NULL DEFAULT date_trunc('second', (now() AT TIME ZONE 'Asia/Jakarta')),
  last_edited TIMESTAMP
);

CREATE OR REPLACE FUNCTION generate_admin_ely_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cust_id IS NULL OR NEW.cust_id = '' THEN
    NEW.cust_id := 'cust_' || nextval('admin_ely_customer_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_customer_id ON "Admin_Ely_Customer";

CREATE TRIGGER set_admin_ely_customer_id
BEFORE INSERT ON "Admin_Ely_Customer"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_customer_id();

CREATE OR REPLACE FUNCTION set_admin_ely_customer_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited := date_trunc('second', (now() AT TIME ZONE 'Asia/Jakarta'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_ely_customer_last_edited ON "Admin_Ely_Customer";

CREATE TRIGGER update_admin_ely_customer_last_edited
BEFORE UPDATE ON "Admin_Ely_Customer"
FOR EACH ROW
EXECUTE FUNCTION set_admin_ely_customer_last_edited();
