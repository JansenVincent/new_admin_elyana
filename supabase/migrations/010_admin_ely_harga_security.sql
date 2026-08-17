-- Keamanan Admin_Ely_Harga: RLS + cabut akses langsung dari browser

ALTER TABLE "Admin_Ely_Harga" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "Admin_Ely_Harga" FROM anon;
REVOKE ALL ON "Admin_Ely_Harga" FROM authenticated;
REVOKE ALL ON SEQUENCE admin_ely_harga_id_seq FROM anon;
REVOKE ALL ON SEQUENCE admin_ely_harga_id_seq FROM authenticated;
