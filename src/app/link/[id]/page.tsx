import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { CopyButton } from "@/components/ShortLinkActions";

export const dynamic = "force-dynamic";

type Breakdown = { label: string; count: number };

function Bars({ title, rows }: { title: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">אין נתונים עדיין</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate text-gray-700">{r.label}</span>
                <span className="font-semibold text-gray-500">{r.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function LinkStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return <LoginScreen />;

  const { id } = await params;
  const link = await prisma.link.findUnique({
    where: { id },
    include: { _count: { select: { clicks: true } }, owner: true },
  });

  if (!link) notFound();

  const isOwner = link.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const baseUrl = await getBaseUrl();
  const shortUrl = `${baseUrl}/${link.slug}`;

  const [bySource, byCountry, byDevice, recent] = await Promise.all([
    prisma.click.groupBy({
      by: ["source"],
      where: { linkId: id },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["country"],
      where: { linkId: id },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["device"],
      where: { linkId: id },
      _count: { _all: true },
    }),
    prisma.click.findMany({
      where: { linkId: id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const sources: Breakdown[] = bySource.map((r) => ({
    label: r.source ?? "ישיר",
    count: r._count._all,
  }));
  const countries: Breakdown[] = byCountry.map((r) => ({
    label: r.country ?? "לא ידוע",
    count: r._count._all,
  }));
  const devices: Breakdown[] = byDevice.map((r) => ({
    label: r.device ?? "לא ידוע",
    count: r._count._all,
  }));

  return (
    <>
      <Header user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          → חזרה לכל הלינקים
        </Link>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          {link.title && (
            <p className="mb-1 font-semibold text-gray-900">{link.title}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="text-lg font-bold text-brand-700 hover:underline"
            >
              {shortUrl.replace(/^https?:\/\//, "")}
            </a>
            <CopyButton value={shortUrl} />
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="mt-1 block truncate text-xs text-gray-400 hover:text-gray-600"
          >
            {link.url}
          </a>
          {isAdmin && !isOwner && (
            <p className="mt-2 text-xs text-gray-400">
              נוצר על ידי {link.owner.name ?? link.owner.email}
            </p>
          )}
        </div>

        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="סה״כ כניסות" value={link._count.clicks} />
          <Stat label="מקורות" value={sources.length} />
          <Stat label="מדינות" value={countries.length} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Bars title="מאיפה הגיעו" rows={sources} />
          <Bars title="מדינות" rows={countries} />
          <Bars title="סוג מכשיר" rows={devices} />

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-bold text-gray-900">כניסות אחרונות</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-gray-400">אין נתונים עדיין</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recent.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 text-gray-600"
                  >
                    <span className="truncate">
                      {c.source ?? "ישיר"}
                      {c.country ? ` · ${c.country}` : ""}
                    </span>
                    <span className="shrink-0 text-gray-400">
                      {c.createdAt.toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
      <div className="text-3xl font-black text-brand-600">{value}</div>
      <div className="mt-0.5 text-sm text-gray-500">{label}</div>
    </div>
  );
}
