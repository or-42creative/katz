"use client";

import Link from "next/link";
import { deleteLink } from "@/lib/actions";
import { CopyButton, ShareButton } from "@/components/ShortLinkActions";

export type LinkCardData = {
  id: string;
  slug: string;
  title: string | null;
  url: string;
  createdAt: string;
  clicks: number;
  ownerName?: string | null;
};

export function LinkCard({
  link,
  baseUrl,
}: {
  link: LinkCardData;
  baseUrl: string;
}) {
  const shortUrl = `${baseUrl}/${link.slug}`;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {link.title && (
            <p className="mb-0.5 truncate font-semibold text-gray-900">
              {link.title}
            </p>
          )}
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="block truncate text-base font-semibold text-brand-700 hover:underline"
          >
            {shortUrl.replace(/^https?:\/\//, "")}
          </a>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="mt-0.5 block truncate text-xs text-gray-400 hover:text-gray-600"
          >
            {link.url}
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CopyButton value={shortUrl} />
          <ShareButton url={shortUrl} title={link.title ?? undefined} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
            <span className="text-brand-600">{link.clicks}</span> כניסות
          </span>
          <span className="text-gray-400">
            {new Date(link.createdAt).toLocaleDateString("he-IL")}
          </span>
          {link.ownerName && (
            <span className="text-gray-400">· {link.ownerName}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/link/${link.id}`}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            סטטיסטיקות
          </Link>
          <form
            action={deleteLink}
            onSubmit={(e) => {
              if (!confirm("למחוק את הלינק? פעולה זו אינה הפיכה.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={link.id} />
            <button
              type="submit"
              className="font-medium text-gray-400 transition hover:text-red-600"
            >
              מחק
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
