-- Tabel login admin
CREATE SEQUENCE IF NOT EXISTS admin_ely_login_user_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS "Admin_Ely_Login" (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  username TEXT NOT NULL CHECK (char_length(username) <= 100),
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (char_length(role) <= 100),
  created_date TIMESTAMP NOT NULL DEFAULT date_trunc('second', (now() AT TIME ZONE 'Asia/Jakarta')),
  last_login TIMESTAMP
);

CREATE OR REPLACE FUNCTION generate_admin_ely_login_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id = '' THEN
    NEW.user_id := 'user_' || nextval('admin_ely_login_user_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_ely_login_user_id ON "Admin_Ely_Login";

CREATE TRIGGER set_admin_ely_login_user_id
BEFORE INSERT ON "Admin_Ely_Login"
FOR EACH ROW
EXECUTE FUNCTION generate_admin_ely_login_user_id();
