"use client";

import { useRef, useState, useTransition } from "react";
import type { ScanActionState } from "@/app/omr/evaluate/actions";

const CORNER_LABELS = ["1 (top-left)", "2 (top-right)", "3 (bottom-right)", "4 (bottom-left)"];

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<PdfjsDocument> };
};
type PdfjsDocument = { getPage: (n: number) => Promise<PdfjsPage> };
type PdfjsPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
};

let pdfjsPromise: Promise<PdfjsModule> | null = null;
function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    // Path kept out of a string literal on purpose: this is a vendored
    // static asset under /public, not a real module in the project graph —
    // a literal specifier here makes bundlers/TS try (and fail) to resolve
    // it at build time.
    const pdfjsPath = "/omr/pdfjs/pdf.min.mjs";
    pdfjsPromise = import(/* webpackIgnore: true */ pdfjsPath).then((mod) => {
      const lib = mod as unknown as PdfjsModule;
      lib.GlobalWorkerOptions.workerSrc = "/omr/pdfjs/pdf.worker.min.mjs";
      return lib;
    });
  }
  return pdfjsPromise;
}

async function renderPdfFirstPageToImage(file: File): Promise<HTMLImageElement> {
  const pdfjsLib = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const targetWidthPx = 2000;
  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: targetWidthPx / baseViewport.width });

  const off = document.createElement("canvas");
  off.width = Math.round(viewport.width);
  off.height = Math.round(viewport.height);
  const offCtx = off.getContext("2d")!;
  offCtx.fillStyle = "#ffffff";
  offCtx.fillRect(0, 0, off.width, off.height);
  await page.render({ canvasContext: offCtx, viewport }).promise;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not convert the rendered PDF page to an image."));
    image.src = off.toDataURL("image/png");
  });
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve(image);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("Could not read that image file."));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

function imageToPngBlob(image: HTMLImageElement): Promise<Blob> {
  const off = document.createElement("canvas");
  off.width = image.naturalWidth;
  off.height = image.naturalHeight;
  off.getContext("2d")!.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export the image."))), "image/png");
  });
}

export default function ScanUploadForm({
  action,
  examId,
  keyConfigured,
  multiSet,
  activeSetsLabel,
}: {
  action: (prevState: ScanActionState, formData: FormData) => Promise<ScanActionState>;
  examId: string;
  keyConfigured: boolean;
  multiSet: boolean;
  activeSetsLabel: string;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Select an image and click all 4 corners to enable scanning."
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function redraw(currentPoints: [number, number][]) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    currentPoints.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], Math.max(6, canvas.width * 0.006), 0, Math.PI * 2);
      ctx.fillStyle = "#145c9e";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = Math.max(14, canvas.width * 0.014) + "px sans-serif";
      ctx.fillText(String(i + 1), p[0] + 8, p[1] - 8);
    });
    if (currentPoints.length > 1) {
      ctx.strokeStyle = "#145c9e";
      ctx.lineWidth = Math.max(2, canvas.width * 0.002);
      ctx.beginPath();
      ctx.moveTo(currentPoints[0][0], currentPoints[0][1]);
      for (let i = 1; i < currentPoints.length; i++) ctx.lineTo(currentPoints[i][0], currentPoints[i][1]);
      if (currentPoints.length === 4) ctx.closePath();
      ctx.stroke();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    imgRef.current = null;
    setPoints([]);
    setImgLoaded(false);
    setLoadError(null);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    setStatusMessage(isPdf ? "Rendering PDF page 1…" : "Loading image…");

    try {
      const image = isPdf ? await renderPdfFirstPageToImage(file) : await loadImageFile(file);
      imgRef.current = image;
      const canvas = canvasRef.current!;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      redraw([]);
      setImgLoaded(true);
      setStatusMessage("Select an image and click all 4 corners to enable scanning.");
    } catch (err) {
      setLoadError(
        (err instanceof Error ? err.message : "Could not load that file.") +
          " Try a clear JPG/PNG photo" +
          (isPdf ? " instead." : " or a different file.")
      );
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!imgRef.current || points.length >= 4) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const next: [number, number][] = [...points, [x, y]];
    setPoints(next);
    redraw(next);
  }

  function resetCorners() {
    setPoints([]);
    redraw([]);
  }

  const ready = points.length === 4 && imgLoaded;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || !imgRef.current) return;
    setError(null);
    const formEl = e.currentTarget;
    const img = imgRef.current;
    startTransition(async () => {
      try {
        const blob = await imageToPngBlob(img);
        const formData = new FormData(formEl);
        formData.set("sheetImage", new File([blob], "sheet.png", { type: "image/png" }));
        formData.set("corners", JSON.stringify(points));
        const result = await action(undefined, formData);
        if (result?.error) setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not prepare the image for upload.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="examId" value={examId} />

      {multiSet && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Multi-set mode is on ({activeSetsLabel}) — each sheet&apos;s Test Booklet Code bubble is read
          automatically, no need to select a set here.
        </p>
      )}
      {!keyConfigured && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          The answer key isn&apos;t fully configured for all active sets yet — go to Settings and fill it in before
          scanning.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Scan mode</h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "single"} onChange={() => setMode("single")} />
            Single sheet
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "bulk"} onChange={() => setMode("bulk")} />
            Bulk mode (multiple sheets)
          </label>
        </div>
        <p className="text-xs text-foreground/50 mt-2">
          {mode === "bulk"
            ? "Bulk mode: after scoring, you get a one-click “Scan Next Sheet” button — handy for a whole class in a row."
            : "Single sheet: scan one sheet at a time, then choose where to go next."}
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">1. Photo</h2>
        <label className="block text-sm font-medium mb-1" htmlFor="fileInput">
          Sheet image or scanned PDF (JPG/PNG/WEBP/PDF)
        </label>
        <input
          id="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <p className="text-xs text-foreground/50 mt-1">
          A PDF from a flatbed scanner or scanner app works too — its first page is rendered below for
          corner-picking, same as a photo.
        </p>

        {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}

        {imgLoaded && (
          <div className="mt-3">
            <p className="text-sm font-medium">
              Click the 4 corners of the sheet, in order: <b>top-left → top-right → bottom-right → bottom-left</b>.
              {" "}
              {points.length} / 4 corners picked
              {points.length < 4 ? ` — next: ${CORNER_LABELS[points.length]}` : ""}
            </p>
            <button
              type="button"
              onClick={resetCorners}
              className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Reset corners
            </button>
          </div>
        )}
        <div className="mt-3 max-w-full overflow-x-auto">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="max-w-full border border-border rounded-md cursor-crosshair"
            style={{ display: imgLoaded ? "block" : "none" }}
          />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">2. Student</h2>
        <label className="block text-sm font-medium mb-1" htmlFor="studentName">
          Student name
        </label>
        <input
          id="studentName"
          name="studentName"
          placeholder="Optional — helps you tell results apart"
          className="w-full rounded-md border border-border px-3 py-2 text-sm mb-3"
        />
        <label className="block text-sm font-medium mb-1" htmlFor="rollNumber">
          Roll number (leave blank to use the number auto-detected from the sheet)
        </label>
        <input
          id="rollNumber"
          name="rollNumber"
          placeholder="Optional override"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!ready || !keyConfigured || isPending}
        className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {isPending ? "Scanning..." : "Scan & Score"}
      </button>
      <p className="text-xs text-foreground/50">{ready ? "" : statusMessage}</p>
    </form>
  );
}
