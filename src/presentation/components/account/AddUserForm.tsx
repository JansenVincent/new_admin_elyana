"use client";

import { useMemo, useState } from "react";
import { authService } from "@/application/services/AuthService";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import PasswordField from "@/presentation/components/ui/PasswordField";
import { MAX_ACCOUNT_FIELD_LENGTH } from "@/shared/constants/account";
import {
  getPasswordRuleStatus,
  isAddUserFormValid,
  validateAddUserForm,
} from "@/shared/utils/accountValidation";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200";

/**
 * Ikon checkmark untuk indikator aturan password yang terpenuhi.
 */
function CheckIcon({ met }: { met: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`h-4 w-4 shrink-0 ${met ? "text-green-500" : "text-slate-300"}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/**
 * Form pendaftaran user admin baru ke tabel Admin_Ely_Login.
 */
export default function AddUserForm() {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ulangiPassword, setUlangiPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Gagal membuat akun");
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordRules = useMemo(
    () => getPasswordRuleStatus(password),
    [password]
  );

  const isFormValid = isAddUserFormValid({
    nama,
    username,
    password,
    ulangiPassword,
  });

  /**
   * Membatasi input teks agar tidak melebihi panjang maksimum.
   */
  function handleLimitedTextChange(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value.slice(0, MAX_ACCOUNT_FIELD_LENGTH));
  }

  /**
   * Mereset form ke kondisi awal setelah akun berhasil dibuat.
   */
  function resetForm() {
    setNama("");
    setUsername("");
    setPassword("");
    setUlangiPassword("");
    setFieldErrors({});
    setShowSuccess(false);
  }

  /**
   * Menampilkan dialog konfirmasi sebelum menyimpan akun.
   */
  function handleOpenConfirm() {
    const errors = validateAddUserForm({
      nama,
      username,
      password,
      ulangiPassword,
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setShowConfirmDialog(true);
  }

  /**
   * Menyimpan akun user baru ke database Supabase.
   */
  async function handleConfirmCreate() {
    setShowConfirmDialog(false);
    setIsLoading(true);

    const result = await authService.createUser({
      nama,
      username,
      password,
    });

    setIsLoading(false);

    if (result.success) {
      setShowSuccess(true);
      return;
    }

    setErrorMessage(result.error ?? "Gagal membuat akun");
    setShowErrorPopup(true);
  }

  return (
    <>
      <section className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Add User</h2>
          <p className="mt-2 text-sm text-slate-600">
            Daftarkan user baru untuk akses panel.
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p>Username dan Password akan digunakan untuk login.</p>
            <p>Akses role default yang terdaftar adalah karyawan.</p>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleOpenConfirm();
            }}
          >
            <div>
              <label
                htmlFor="nama"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nama
              </label>
              <input
                id="nama"
                type="text"
                value={nama}
                onChange={(event) =>
                  handleLimitedTextChange(setNama, event.target.value)
                }
                maxLength={MAX_ACCOUNT_FIELD_LENGTH}
                placeholder="Contoh: Budi Santoso"
                className={inputClassName}
              />
              {fieldErrors.nama && (
                <p className="mt-1.5 text-sm text-red-600">{fieldErrors.nama}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  handleLimitedTextChange(setUsername, event.target.value)
                }
                maxLength={MAX_ACCOUNT_FIELD_LENGTH}
                placeholder="Contoh: budi123"
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Minimal 6 karakter, kombinasi huruf dan angka (maks. 30 karakter).
              </p>
              {fieldErrors.username && (
                <p className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Contoh: Elyana123"
                error={fieldErrors.password}
              />

              <ul className="mt-3 space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon met={passwordRules.minLength} />
                  Minimal 8 karakter
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon met={passwordRules.hasUppercase} />
                  Mengandung huruf kapital
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon met={passwordRules.hasLowercase} />
                  Mengandung huruf kecil
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon met={passwordRules.hasNumber} />
                  Mengandung angka
                </li>
              </ul>
            </div>

            <PasswordField
              id="ulangiPassword"
              label="Ulangi Password"
              value={ulangiPassword}
              onChange={setUlangiPassword}
              placeholder="Contoh: Elyana123"
              error={fieldErrors.ulangiPassword}
            />

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buat Akun
            </button>
          </form>
        </div>
      </section>

      <ConfirmDialog
        visible={showConfirmDialog}
        message="Apakah Anda yakin semua pengisian data akun sudah tepat?"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmCreate}
      />

      <LoadingOverlay visible={isLoading} />

      <ErrorPopup
        visible={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
      />

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="create-user-success-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-7 w-7 text-green-500"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p
                id="create-user-success-title"
                className="text-lg font-semibold text-slate-900"
              >
                Akun berhasil dibuat
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buat Akun Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
