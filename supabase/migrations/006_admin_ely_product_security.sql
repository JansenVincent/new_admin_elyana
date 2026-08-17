-- Keamanan Admin_Ely_Product: RLS + cabut akses langsung dari browser

ALTER TABLE "Admin_Ely_Product" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "Admin_Ely_Product" FROM anon;
REVOKE ALL ON "Admin_Ely_Product" FROM authenticated;
REVOKE ALL ON SEQUENCE admin_ely_product_id_seq FROM anon;
REVOKE ALL ON SEQUENCE admin_ely_product_id_seq FROM authenticated;
