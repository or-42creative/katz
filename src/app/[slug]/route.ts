import { prisma } from "@/lib/prisma";
import { refererSource } from "@/lib/url";

export const dynamic = "force-dynamic";

function deviceFromUa(ua: string | null): string {
  if (!ua) return "לא ידוע";
  return /mobile|android|iphone|ipad|ipod/i.test(ua) ? "מובייל" : "מחשב";
}

function safeDecode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const link = await prisma.link.findUnique({ where: { slug } });

  if (!link) {
    const origin = new URL(request.url).origin;
    return Response.redirect(`${origin}/?notfound=${encodeURIComponent(slug)}`, 302);
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    const origin = new URL(request.url).origin;
    return Response.redirect(`${origin}/?expired=${encodeURIComponent(slug)}`, 302);
  }

  const headers = request.headers;
  const referer = headers.get("referer");

  // Record the click (best-effort — never block the redirect on a failure).
  try {
    await prisma.click.create({
      data: {
        linkId: link.id,
        referer: referer ?? null,
        source: refererSource(referer),
        country: headers.get("x-vercel-ip-country") ?? null,
        city: safeDecode(headers.get("x-vercel-ip-city")),
        device: deviceFromUa(headers.get("user-agent")),
      },
    });
  } catch {
    /* swallow — redirecting matters more than analytics */
  }

  return Response.redirect(link.url, 302);
}
