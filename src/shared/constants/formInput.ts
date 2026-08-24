/** ClassName standar untuk textfield dan trigger dropdown kustom. */
export const formInputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200";

/** ClassName untuk input nominal harga tanpa spinner browser. */
export const nominalInputClassName = `${formInputClassName} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

/** Panjang maksimum username pada halaman login. */
export const MAX_LOGIN_USERNAME_LENGTH = 50;

/** Atribut untuk menonaktifkan autofill/saran browser pada textfield. */
export const NO_BROWSER_AUTOFILL_PROPS = {
  autoComplete: "off",
  autoCorrect: "off" as const,
  autoCapitalize: "off" as const,
  spellCheck: false,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
};
