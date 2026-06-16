import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { LinkCard, type LinkCardData } from "@/components/LinkCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const session = await auth();
  const { notfound } = await searchParams;

  if (!session?.user?.id) {
    return <LoginScreen />;
  }

  const baseUrl = await getBaseUrl();

  const links = await prisma.link.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  const cards: LinkCardData[] = links.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    url: l.url,
    createdAt: l.createdAt.toISOString(),
    clicks: l._count.clicks,
  }));

  return (
    <>
      <Header user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">קצרו לינק חדש</h1>
          <p className="mt-1 text-gray-500">
            הדביקו לינק ארוך, ותקבלו לינק קצר לשיתוף — עם מעקב כניסות.
          </p>
        </div>

        {notfound && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            הלינק <span dir="ltr" className="font-mono">/{notfound}</span> לא קיים או נמחק.
          </div>
        )}

        <CreateLinkForm baseUrl={baseUrl} />

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">הלינקים שלי</h2>
            <span className="text-sm text-gray-400">{cards.length} לינקים</span>
          </div>

          {cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-12 text-center text-gray-400">
              עדיין אין לינקים. קצרו את הראשון למעלה ☝️
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((link) => (
                <LinkCard key={link.id} link={link} baseUrl={baseUrl} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
