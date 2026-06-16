"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createLink, type CreateLinkState } from "@/lib/actions";
import { CopyButton, ShareButton } from "@/components/ShortLinkActions";

const initialState: CreateLinkState = { ok: false };

export function CreateLinkForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction, pending] = useActionState(createLink, initialState);
  const [advanced, setAdvanced] = useState(false);
  const [customRows, setCustomRows] = useState<number[]>([]);
  const rowId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const shortUrl = state.slug ? `${baseUrl}/${state.slug}` : "";

  // Reset the form after a successful creation.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setAdvanced(false);
      setCustomRows([]);
    }
  }, [state.ok]);

  const addCustomRow = () =>
    setCustomRows((rows) => [...rows, (rowId.current += 1)]);
  const removeCustomRow = (id: number) =>
    setCustomRows((rows) => rows.filter((r) => r !== id));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            הלינק לקיצור
          </label>
          <input
            name="url"
            type="text"
            inputMode="url"
            dir="ltr"
            required
            placeholder="https://example.com/very/long/link?with=params"
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {advanced ? "− הסתר אפשרויות" : "+ אפשרויות מתקדמות (לא חובה)"}
        </button>

        {advanced && (
          <div className="space-y-5 rounded-xl bg-gray-50/70 p-4 ring-1 ring-gray-100">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                שם פנימי ללינק
              </label>
              <input
                name="title"
                type="text"
                placeholder="לדוגמה: קמפיין קיץ — אינסטגרם"
                className="w-full rounded-xl border-0 bg-white px-4 py-2.5 text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                כתובת מותאמת אישית
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
                  placeholder="my-link"
                  className="min-w-0 flex-1 border-0 bg-white px-3 py-2.5 text-left text-gray-900 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                אם משאירים ריק — ניצור כתובת קצרה אוטומטית.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                פרמטרים לקמפיין (UTM)
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <UtmField name="utm_source" label="מקור (source)" placeholder="facebook" />
                <UtmField name="utm_medium" label="מדיום (medium)" placeholder="cpc" />
                <UtmField
                  name="utm_campaign"
                  label="קמפיין (campaign)"
                  placeholder="summer_sale"
                />
                <UtmField name="utm_term" label="מילת מפתח (term)" placeholder="shoes" />
                <UtmField
                  name="utm_content"
                  label="תוכן (content)"
                  placeholder="banner_a"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                שדות מותאמים אישית
              </p>
              {customRows.length > 0 && (
                <div className="mb-2 space-y-2">
                  {customRows.map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <input
                        name="customKey"
                        type="text"
                        dir="ltr"
                        placeholder="שם פרמטר (key)"
                        className="min-w-0 flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        name="customValue"
                        type="text"
                        dir="ltr"
                        placeholder="ערך (value)"
                        className="min-w-0 flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomRow(id)}
                        aria-label="הסר שדה"
                        className="shrink-0 rounded-lg px-2 py-1 text-gray-400 transition hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addCustomRow}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                + הוסף שדה
              </button>
            </div>
          </div>
        )}

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {pending ? "מקצר…" : "קצר לי ✂️"}
        </button>
      </form>

      {state.ok && shortUrl && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-sm font-medium text-green-800">הלינק מוכן! 🎉</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="flex-1 truncate text-base font-semibold text-brand-700 hover:underline"
            >
              {shortUrl}
            </a>
            <div className="flex gap-2">
              <CopyButton value={shortUrl} />
              <ShareButton url={shortUrl} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UtmField({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input
        name={name}
        type="text"
        dir="ltr"
        placeholder={placeholder}
        className="w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
