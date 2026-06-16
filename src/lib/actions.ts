"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildDestinationUrl, type CustomParam } from "@/lib/url";
import { randomSlug, validateCustomSlug, RESERVED_SLUGS } from "@/lib/slug";

export type CreateLinkState = {
  ok: boolean;
  error?: string;
  slug?: string;
};

/** Reads repeated customKey[]/customValue[] inputs into a list of params. */
function readCustomParams(formData: FormData): CustomParam[] {
  const keys = formData.getAll("customKey").map((v) => String(v));
  const values = formData.getAll("customValue").map((v) => String(v));
  const out: CustomParam[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]?.trim();
    const value = values[i]?.trim();
    if (key && value) out.push({ key, value });
  }
  return out;
}

export async function createLink(
  _prev: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "צריך להתחבר כדי לקצר לינק" };
  }

  const rawUrl = String(formData.get("url") ?? "");
  const title = String(formData.get("title") ?? "").trim() || null;
  const customSlugRaw = String(formData.get("slug") ?? "").trim();

  let destination: string;
  try {
    destination = buildDestinationUrl(
      rawUrl,
      {
        source: String(formData.get("utm_source") ?? ""),
        medium: String(formData.get("utm_medium") ?? ""),
        campaign: String(formData.get("utm_campaign") ?? ""),
        term: String(formData.get("utm_term") ?? ""),
        content: String(formData.get("utm_content") ?? ""),
      },
      readCustomParams(formData),
    );
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let slug: string;
  if (customSlugRaw) {
    const err = validateCustomSlug(customSlugRaw);
    if (err) return { ok: false, error: err };
    const existing = await prisma.link.findUnique({
      where: { slug: customSlugRaw },
    });
    if (existing) return { ok: false, error: "הכתובת המותאמת כבר תפוסה" };
    slug = customSlugRaw;
  } else {
    // Generate a unique random slug.
    slug = randomSlug();
    for (let i = 0; i < 5; i++) {
      const taken =
        RESERVED_SLUGS.has(slug) ||
        (await prisma.link.findUnique({ where: { slug } }));
      if (!taken) break;
      slug = randomSlug();
    }
  }

  try {
    await prisma.link.create({
      data: { slug, url: destination, title, ownerId: session.user.id },
    });
  } catch {
    return { ok: false, error: "שמירת הלינק נכשלה, נסו שוב" };
  }

  revalidatePath("/");
  return { ok: true, slug };
}

export async function deleteLink(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return;

  const isOwner = link.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return;

  await prisma.link.delete({ where: { id } });
  revalidatePath("/");
}

export type UpdateLinkState = { ok: boolean; error?: string };

export async function updateLink(
  _prev: UpdateLinkState,
  formData: FormData,
): Promise<UpdateLinkState> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "צריך להתחבר" };

  const id = String(formData.get("id") ?? "");
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return { ok: false, error: "הלינק לא נמצא" };

  const isOwner = link.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return { ok: false, error: "אין הרשאה" };

  const title = String(formData.get("title") ?? "").trim() || null;
  const rawUrl = String(formData.get("url") ?? "");
  const newSlug = String(formData.get("slug") ?? "").trim();

  // Validate + normalize the destination URL.
  let destination: string;
  try {
    destination = buildDestinationUrl(rawUrl, {});
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  // Validate the slug if it changed.
  if (newSlug !== link.slug) {
    const err = validateCustomSlug(newSlug);
    if (err) return { ok: false, error: err };
    const taken = await prisma.link.findUnique({ where: { slug: newSlug } });
    if (taken) return { ok: false, error: "הכתובת המותאמת כבר תפוסה" };
  }

  await prisma.link.update({
    where: { id },
    data: { title, url: destination, slug: newSlug },
  });

  revalidatePath("/");
  revalidatePath(`/link/${id}`);
  return { ok: true };
}

// ===== Admin: user management =====

export async function setUserRole(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return;

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || (role !== "USER" && role !== "ADMIN")) return;

  // Don't allow demoting the hard-coded super admin.
  const target = await prisma.user.findUnique({ where: { id: userId } });
  const superAdmin = (
    process.env.SUPER_ADMIN_EMAIL ?? "or@42creative.co.il"
  ).toLowerCase();
  if (target?.email?.toLowerCase() === superAdmin && role !== "ADMIN") return;

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}

export async function deleteUser(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return;

  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === session.user.id) return;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  const superAdmin = (
    process.env.SUPER_ADMIN_EMAIL ?? "or@42creative.co.il"
  ).toLowerCase();
  if (target?.email?.toLowerCase() === superAdmin) return;

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}
