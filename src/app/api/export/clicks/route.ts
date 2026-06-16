import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return new Response("Not found", { status: 404 });

  const isOwner = link.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return new Response("Forbidden", { status: 403 });

  const clicks = await prisma.click.findMany({
    where: { linkId: id },
    orderBy: { createdAt: "desc" },
  });

  const header = ["timestamp", "source", "country", "city", "device", "referer"];
  const rows = clicks.map((c) => [
    c.createdAt.toISOString(),
    c.source ?? "",
    c.country ?? "",
    c.city ?? "",
    c.device ?? "",
    c.referer ?? "",
  ]);

  return csvResponse(toCsv(header, rows), `katz-clicks-${link.slug}.csv`);
}
