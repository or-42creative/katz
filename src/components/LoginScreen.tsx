import Image from "next/image";
import { signIn } from "@/auth";

export function LoginScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Image
        src="/katz-logo.png"
        alt="כץ"
        width={256}
        height={256}
        priority
        className="mb-5 h-28 w-28 rounded-full object-cover shadow-lg shadow-brand-600/20 ring-1 ring-black/5"
      />
      <h1 className="text-4xl font-black tracking-tight text-gray-900">כץ</h1>
      <p className="mt-3 text-lg text-gray-500">
        מקצר הלינקים הפנים-ארגוני.
        <br />
        קצר, מהיר ופשוט.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
        className="mt-8 w-full"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-base font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <GoogleIcon />
          התחברות עם Google
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-400">
        הכניסה מיועדת לעובדי הארגון בלבד.
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
