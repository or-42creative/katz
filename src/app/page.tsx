import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { type LinkCardData } from "@/components/LinkCard";
import { LinksBrowser } from "@/components/LinksBrowser";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string; expired?: string; disabled?: string }>;
}) {
  const session = await auth();
  const { notfound, expired, disabled } = await searchParams;

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
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
    disabled: l.disabled,
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

        {expired && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            הלינק <span dir="ltr" className="font-mono">/{expired}</span> פג תוקף.
          </div>
        )}

        {disabled && (
          <div className="mb-4 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200">
            הלינק <span dir="ltr" className="font-mono">/{disabled}</span> מושבת כרגע.
          </div>
        )}

        <CreateLinkForm baseUrl={baseUrl} />

        <LinksBrowser cards={cards} baseUrl={baseUrl} />
      </main>
    </>
  );
}
