"use client";

import { useState } from "react";

export function QrButton({
  url,
  slug,
  className = "",
}: {
  url: string;
  slug: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const qrSrc = `/api/qr?data=${encodeURIComponent(url)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50 ${className}`}
      >
        QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p dir="ltr" className="mb-3 truncate text-sm font-semibold text-gray-700">
              {url.replace(/^https?:\/\//, "")}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR ${slug}`}
              width={256}
              height={256}
              className="mx-auto h-56 w-56 rounded-xl ring-1 ring-gray-100"
            />
            <div className="mt-4 flex gap-2">
              <a
                href={qrSrc}
                download={`katz-${slug}.png`}
                className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                הורדה
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
