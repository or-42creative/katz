import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Header } from "@/components/Header";
import { LoginScreen } from "@/components/LoginScreen";
import { EditLinkForm } from "@/components/EditLinkForm";

export const dynamic = "force-dynamic";

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return <LoginScreen />;

  const { id } = await params;
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) notFound();

  const isOwner = link.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const baseUrl = await getBaseUrl();

  return (
    <>
      <Header user={session.user} />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          → חזרה
        </Link>
        <h1 className="mb-5 text-2xl font-black text-gray-900">עריכת לינק</h1>
        <EditLinkForm
          link={{
            id: link.id,
            slug: link.slug,
            title: link.title,
            url: link.url,
          }}
          baseUrl={baseUrl}
        />
      </main>
    </>
  );
}
