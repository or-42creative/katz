import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");

  if (!data || data.length > 2000) {
    return new Response("missing or invalid data", { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#1e1b2eff", light: "#ffffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
