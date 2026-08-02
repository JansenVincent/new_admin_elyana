"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/application/services/AuthService";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import PasswordField from "@/presentation/components/ui/PasswordField";
import { isLoginFormValid } from "@/shared/utils/accountValidation";

const LOGIN_ERROR_MESSAGE =
  "Gagal Login.\nMasukkan Username dan Password yang sesuai.";

/**
 * Halaman form login admin dengan desain card modern di tengah layar.
 */
export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const isFormValid = useMemo(
    () => isLoginFormValid(username, password),
    [username, password]
  );

  /**
   * Menangani submit form login.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    setIsLoading(true);
    setShowError(false);

    const result = await authService.login({ username, password });

    setIsLoading(false);

    if (result.success) {
      router.push("/home");
      return;
    }

    setShowError(true);
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Admin Ely
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Masuk ke panel administrasi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Contoh: admin123"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Contoh: Elyana123"
                autoComplete="current-password"
                maxLength={undefined}
              />

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Memproses..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <ErrorPopup
        visible={showError}
        message={LOGIN_ERROR_MESSAGE}
        onClose={() => setShowError(false)}
      />
    </>
  );
}
