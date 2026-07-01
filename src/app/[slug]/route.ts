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

/** Escapes a string for safe use inside an HTML attribute. */
function htmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Minimal branded interstitial that forwards to the destination. */
function redirectInterstitial(url: string): Response {
  const safe = htmlAttr(url);
  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=${safe}">
<title>מעביר אתכם…</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center;
    background: #f6f7fb; color: #1e1b2e;
    font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; }
  .box { text-align: center; padding: 24px; }
  .spinner { width: 36px; height: 36px; margin: 0 auto 16px; border-radius: 50%;
    border: 3px solid #e0e7ff; border-top-color: #4f46e5;
    animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { font-size: 18px; font-weight: 600; margin: 0 0 6px; }
  a { color: #4f46e5; font-size: 14px; text-decoration: none; }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
</style>
</head>
<body>
  <div class="box">
    <div class="spinner" aria-hidden="true"></div>
    <p>מיד תועברו לעמוד…</p>
    <a id="dest" href="${safe}" rel="noreferrer nofollow">לא הועברתם? לחצו כאן</a>
  </div>
  <script>
    var a = document.getElementById("dest");
    if (a) location.replace(a.getAttribute("href"));
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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

  if (link.disabled) {
    const origin = new URL(request.url).origin;
    return Response.redirect(`${origin}/?disabled=${encodeURIComponent(slug)}`, 302);
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

  return redirectInterstitial(link.url);
}
