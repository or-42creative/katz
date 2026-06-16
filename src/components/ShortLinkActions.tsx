"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "העתק",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — fall back to a prompt.
      window.prompt("העתיקו את הלינק:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
      } ${className}`}
    >
      {copied ? "✓ הועתק" : label}
    </button>
  );
}

export function ShareButton({ url, title }: { url: string; title?: string }) {
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "כץ", url });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("הלינק הועתק — אפשר לשתף אותו עכשיו 🙂");
      } catch {
        window.prompt("העתיקו לשיתוף:", url);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
    >
      שיתוף
    </button>
  );
}
