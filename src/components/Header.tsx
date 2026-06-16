import Link from "next/link";
import { signOut } from "@/auth";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "USER" | "ADMIN";
};

export function Header({ user }: { user: HeaderUser }) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">
            כ
          </span>
          <span className="text-xl font-black tracking-tight text-gray-900">כץ</span>
        </Link>

        <div className="flex items-center gap-3">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              ניהול משתמשים
            </Link>
          )}

          <div className="flex items-center gap-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-8 w-8 rounded-full ring-1 ring-gray-200"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {user.name ?? user.email}
            </span>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-700"
            >
              יציאה
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
