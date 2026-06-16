"use client";

import { useMemo, useState } from "react";
import { LinkCard, type LinkCardData } from "@/components/LinkCard";

export function LinksBrowser({
  cards,
  baseUrl,
}: {
  cards: LinkCardData[];
  baseUrl: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      [c.slug, c.title ?? "", c.url].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [cards, query]);

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">הלינקים שלי</h2>
        {cards.length > 0 && (
          <a
            href="/api/export/links"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            ⬇ ייצוא CSV
          </a>
        )}
      </div>

      {cards.length > 0 && (
        <div className="relative mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי כתובת קצרה, שם או יעד…"
            className="w-full rounded-xl border-0 bg-white px-4 py-2.5 text-gray-900 ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-12 text-center text-gray-400">
          עדיין אין לינקים. קצרו את הראשון למעלה ☝️
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-10 text-center text-gray-400">
          לא נמצאו לינקים שתואמים לחיפוש „{query}”.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((link) => (
            <LinkCard key={link.id} link={link} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </section>
  );
}
