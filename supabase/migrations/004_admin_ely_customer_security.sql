-- Keamanan Admin_Ely_Customer: RLS + cabut akses langsung dari browser

ALTER TABLE "Admin_Ely_Customer" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "Admin_Ely_Customer" FROM anon;
REVOKE ALL ON "Admin_Ely_Customer" FROM authenticated;
REVOKE ALL ON SEQUENCE admin_ely_customer_id_seq FROM anon;
REVOKE ALL ON SEQUENCE admin_ely_customer_id_seq FROM authenticated;
