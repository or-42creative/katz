"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Options, DotType } from "qr-code-styling";

type QrInstance = {
  append: (el: HTMLElement) => void;
  update: (opts: Partial<Options>) => void;
  download: (opts: { name?: string; extension?: "png" | "svg" }) => void;
};

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: "square", label: "ריבועים" },
  { value: "rounded", label: "מעוגל" },
  { value: "dots", label: "נקודות" },
  { value: "classy", label: "קלאסי" },
  { value: "classy-rounded", label: "קלאסי מעוגל" },
  { value: "extra-rounded", label: "מעוגל מאוד" },
];

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
  const [fg, setFg] = useState("#1e1b2e");
  const [bg, setBg] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [dotType, setDotType] = useState<DotType>("square");
  const [logo, setLogo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QrInstance | null>(null);

  const getOptions = useCallback((): Partial<Options> => {
    const rounded = dotType !== "square";
    return {
      width: 260,
      height: 260,
      type: "canvas",
      data: url,
      margin: 10,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: fg, type: dotType },
      cornersSquareOptions: {
        color: fg,
        type: rounded ? "extra-rounded" : "square",
      },
      cornersDotOptions: { color: fg, type: rounded ? "dot" : "square" },
      backgroundOptions: { color: transparent ? "rgba(0,0,0,0)" : bg },
      image: logo ?? undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 6,
        imageSize: 0.4,
        hideBackgroundDots: true,
      },
    };
  }, [url, fg, bg, transparent, dotType, logo]);

  // Create the QR instance when the modal opens (client-only import).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const mod = await import("qr-code-styling");
      if (cancelled || !containerRef.current) return;
      const QRCodeStyling = mod.default;
      const inst = new QRCodeStyling(getOptions()) as unknown as QrInstance;
      qrRef.current = inst;
      containerRef.current.innerHTML = "";
      inst.append(containerRef.current);
    })();
    return () => {
      cancelled = true;
      qrRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Live-update on any design change.
  useEffect(() => {
    if (open && qrRef.current) qrRef.current.update(getOptions());
  }, [open, getOptions]);

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  function download() {
    qrRef.current?.download({ name: `katz-${slug}`, extension: "png" });
  }

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
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">עיצוב QR</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="סגירה"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div
              className="mx-auto mb-4 grid place-items-center rounded-xl p-3"
              style={{
                backgroundImage: transparent
                  ? "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)"
                  : undefined,
                backgroundSize: "16px 16px",
              }}
            >
              <div ref={containerRef} />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">צבע הקוד</span>
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg ring-1 ring-gray-200"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">רקע</span>
                  <input
                    type="color"
                    value={bg}
                    disabled={transparent}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-lg ring-1 ring-gray-200 disabled:opacity-40"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                רקע שקוף (PNG שקוף)
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">סגנון (טקסטורה)</span>
                <select
                  value={dotType}
                  onChange={(e) => setDotType(e.target.value as DotType)}
                  className="w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500"
                >
                  {DOT_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">לוגו במרכז</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onLogoChange}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      הסר
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={download}
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-700"
              >
                ⬇ הורדה כ-PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
