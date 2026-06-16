import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const baseUrl = await getBaseUrl();
  const links = await prisma.link.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  const header = [
    "slug",
    "short_url",
    "destination",
    "title",
    "clicks",
    "created_at",
    "expires_at",
  ];
  const rows = links.map((l) => [
    l.slug,
    `${baseUrl}/${l.slug}`,
    l.url,
    l.title ?? "",
    l._count.clicks,
    l.createdAt.toISOString(),
    l.expiresAt ? l.expiresAt.toISOString() : "",
  ]);

  return csvResponse(toCsv(header, rows), "katz-links.csv");
}
