-- Ubah tanggal_masuk dari TIMESTAMP ke DATE (format YYYY-MM-DD)
ALTER TABLE "Admin_Ely_Histori_Masuk_Product"
  ALTER COLUMN tanggal_masuk TYPE DATE
  USING tanggal_masuk::DATE;
