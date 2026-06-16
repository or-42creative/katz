"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateLink, type UpdateLinkState } from "@/lib/actions";

const initialState: UpdateLinkState = { ok: false };

export function EditLinkForm({
  link,
  baseUrl,
}: {
  link: { id: string; slug: string; title: string | null; url: string };
  baseUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateLink, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={link.id} />

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            שם פנימי ללינק
          </label>
          <input
            name="title"
            type="text"
            defaultValue={link.title ?? ""}
            placeholder="לדוגמה: קמפיין קיץ — אינסטגרם"
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-gray-900 ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            כתובת היעד (הלינק המלא)
          </label>
          <input
            name="url"
            type="text"
            dir="ltr"
            required
            defaultValue={link.url}
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-left text-gray-900 ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            אפשר לערוך כאן ידנית כל פרמטר (UTM / מותאם אישית).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            הכתובת הקצרה
          </label>
          <div
            dir="ltr"
            className="flex items-stretch overflow-hidden rounded-xl ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand-500"
          >
            <span className="flex items-center whitespace-nowrap bg-gray-100 px-3 text-sm text-gray-500">
              {baseUrl.replace(/^https?:\/\//, "")}/
            </span>
            <input
              name="slug"
              type="text"
              dir="ltr"
              required
              defaultValue={link.slug}
              className="min-w-0 flex-1 border-0 bg-white px-3 py-2.5 text-left text-gray-900 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-amber-600">
            ⚠️ שינוי הכתובת הקצרה ישבור לינקים שכבר שיתפת.
          </p>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {pending ? "שומר…" : "שמור שינויים"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl bg-white px-4 py-3 text-base font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
