-- Keamanan Admin_Ely_Login: RLS + cabut akses langsung dari browser
-- Semua operasi lewat API route + SUPABASE_SERVICE_ROLE_KEY

ALTER TABLE "Admin_Ely_Login" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "Admin_Ely_Login" FROM anon;
REVOKE ALL ON "Admin_Ely_Login" FROM authenticated;
REVOKE ALL ON SEQUENCE admin_ely_login_user_id_seq FROM anon;
REVOKE ALL ON SEQUENCE admin_ely_login_user_id_seq FROM authenticated;
