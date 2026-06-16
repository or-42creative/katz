import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { CopyButton } from "@/components/ShortLinkActions";
import { QrButton } from "@/components/QrButton";

export const dynamic = "force-dynamic";

type Breakdown = { label: string; count: number };

const RANGES = [
  { key: "7d", label: "7 ימים", days: 7 },
  { key: "30d", label: "30 יום", days: 30 },
  { key: "90d", label: "90 יום", days: 90 },
  { key: "all", label: "הכל", days: null },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}
function dayKey(d: Date): string {
  return utcStartOfDay(d).toISOString().slice(0, 10);
}

type DayPoint = { key: string; label: string; count: number };

function buildDaySeries(dates: Date[], days: number | null): DayPoint[] {
  const end = utcStartOfDay(new Date());
  let start: Date;
  if (days != null) {
    start = addDays(end, -(days - 1));
  } else if (dates.length === 0) {
    start = end;
  } else {
    const earliest = utcStartOfDay(
      new Date(Math.min(...dates.map((d) => d.getTime()))),
    );
    const cap = addDays(end, -89); // show at most ~90 days on the axis
    start = earliest.getTime() < cap.getTime() ? cap : earliest;
  }

  const counts = new Map<string, number>();
  for (const d of dates) {
    const k = dayKey(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const series: DayPoint[] = [];
  for (let dt = new Date(start); dt <= end; dt = addDays(dt, 1)) {
    const k = dt.toISOString().slice(0, 10);
    series.push({
      key: k,
      label: `${dt.getUTCDate()}/${dt.getUTCMonth() + 1}`,
      count: counts.get(k) ?? 0,
    });
  }
  return series;
}

function Bars({ title, rows }: { title: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">אין נתונים בטווח</p>
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

function DayChart({ series }: { series: DayPoint[] }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const showLabels = series.length <= 16;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:col-span-2">
      <h3 className="mb-3 font-bold text-gray-900">כניסות לפי יום</h3>
      {series.every((s) => s.count === 0) ? (
        <p className="text-sm text-gray-400">אין כניסות בטווח שנבחר</p>
      ) : (
        <>
          <div
            dir="ltr"
            className="flex h-32 items-end gap-1 border-b border-gray-100"
          >
            {series.map((s) => (
              <div
                key={s.key}
                title={`${s.label}: ${s.count}`}
                className="flex min-w-[6px] flex-1 items-end"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full rounded-t bg-brand-500 transition-all"
                  style={{ height: `${Math.max(s.count === 0 ? 0 : 4, (s.count / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          {showLabels && (
            <div dir="ltr" className="mt-1 flex gap-1 text-[10px] text-gray-400">
              {series.map((s) => (
                <div key={s.key} className="min-w-[6px] flex-1 text-center">
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default async function LinkStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return <LoginScreen />;

  const { id } = await params;
  const { range: rangeParam } = await searchParams;

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

  const selectedRange: RangeKey =
    RANGES.find((r) => r.key === rangeParam)?.key ?? "all";
  const days = RANGES.find((r) => r.key === selectedRange)!.days;
  const since =
    days != null ? addDays(utcStartOfDay(new Date()), -(days - 1)) : null;

  const clickWhere = {
    linkId: id,
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [bySource, byCountry, byDevice, recent, clickDates] = await Promise.all([
    prisma.click.groupBy({
      by: ["source"],
      where: clickWhere,
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["country"],
      where: clickWhere,
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["device"],
      where: clickWhere,
      _count: { _all: true },
    }),
    prisma.click.findMany({
      where: clickWhere,
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.click.findMany({
      where: clickWhere,
      select: { createdAt: true },
    }),
  ]);

  const totalInRange = clickDates.length;
  const series = buildDaySeries(
    clickDates.map((c) => c.createdAt),
    days,
  );

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
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            → חזרה לכל הלינקים
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/api/export/clicks?id=${id}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              ⬇ ייצוא כניסות
            </a>
            <Link
              href={`/link/${id}/edit`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              עריכת הלינק
            </Link>
          </div>
        </div>

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
            <QrButton url={shortUrl} slug={link.slug} />
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
          {link.disabled && (
            <p className="mt-2 text-xs font-semibold text-gray-500">
              ⏸ הלינק מושבת כרגע ואינו מפנה.
            </p>
          )}
          {link.expiresAt && (
            <p className="mt-2 text-xs font-medium">
              {link.expiresAt.getTime() < Date.now() ? (
                <span className="text-red-600">
                  ⏱ פג תוקף ב-{link.expiresAt.toLocaleString("he-IL")}
                </span>
              ) : (
                <span className="text-amber-700">
                  ⏱ תקף עד {link.expiresAt.toLocaleString("he-IL")}
                </span>
              )}
            </p>
          )}
          {isAdmin && !isOwner && (
            <p className="mt-2 text-xs text-gray-400">
              נוצר על ידי {link.owner.name ?? link.owner.email}
            </p>
          )}
        </div>

        {/* Date range filter */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">טווח תאריכים:</span>
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/link/${id}?range=${r.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selectedRange === r.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>

        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="כניסות בטווח" value={totalInRange} />
          <Stat label="סה״כ אי-פעם" value={link._count.clicks} />
          <Stat label="מקורות" value={sources.length} />
          <Stat label="מדינות" value={countries.length} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DayChart series={series} />
          <Bars title="מאיפה הגיעו" rows={sources} />
          <Bars title="מדינות" rows={countries} />
          <Bars title="סוג מכשיר" rows={devices} />

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-bold text-gray-900">כניסות אחרונות</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-gray-400">אין נתונים בטווח</p>
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
