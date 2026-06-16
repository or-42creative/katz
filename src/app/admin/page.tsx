import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { setUserRole, deleteUser } from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

const SUPER_ADMIN = (
  process.env.SUPER_ADMIN_EMAIL ?? "or@42creative.co.il"
).toLowerCase();

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) return <LoginScreen />;
  if (session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { links: true } } },
  });

  return (
    <>
      <Header user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          → חזרה
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">ניהול משתמשים</h1>
          <p className="mt-1 text-gray-500">
            {users.length} משתמשים רשומים במערכת.
          </p>
        </div>

        <div className="space-y-3">
          {users.map((u) => {
            const isSuper = u.email?.toLowerCase() === SUPER_ADMIN;
            const isSelf = u.id === session.user.id;
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.image}
                      alt=""
                      className="h-10 w-10 rounded-full ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gray-200 font-bold text-gray-600">
                      {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {u.name ?? "—"}
                      {isSuper && (
                        <span className="ms-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                          סופר-אדמין
                        </span>
                      )}
                    </p>
                    <p dir="ltr" className="truncate text-sm text-gray-400">
                      {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700">
                      {u._count.links}
                    </div>
                    <div className="text-xs text-gray-400">לינקים</div>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      u.role === "ADMIN"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role === "ADMIN" ? "מנהל" : "משתמש"}
                  </span>

                  {!isSuper && (
                    <form action={setUserRole}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={u.role === "ADMIN" ? "USER" : "ADMIN"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
                      >
                        {u.role === "ADMIN" ? "הורד למשתמש" : "הפוך למנהל"}
                      </button>
                    </form>
                  )}

                  {!isSuper && !isSelf && (
                    <form action={deleteUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <ConfirmButton
                        message={`למחוק את ${u.email}? כל הלינקים שלו יימחקו גם כן.`}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-gray-400 hover:text-red-600"
                      >
                        מחק
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
