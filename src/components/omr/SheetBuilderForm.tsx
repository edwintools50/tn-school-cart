"use client";

import { useActionState, useState } from "react";
import type { SheetActionState } from "@/app/omr/sheet-builder/actions";
import GeneratedSheetActions from "./GeneratedSheetActions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

type Mode = "single" | "batch";
type SectionField = { name: string; count: number };

const MAX_SECTIONS = 5;
const DEFAULT_SECTIONS: SectionField[] = [
  { name: "Physics", count: 45 },
  { name: "Chemistry", count: 45 },
  { name: "Biology", count: 90 },
];

export default function SheetBuilderForm({
  generateAction,
  generateBatchAction,
}: {
  generateAction: (prevState: SheetActionState, formData: FormData) => Promise<SheetActionState>;
  generateBatchAction: (prevState: SheetActionState, formData: FormData) => Promise<SheetActionState>;
}) {
  const [mode, setMode] = useState<Mode>("single");
  const [singleState, singleFormAction, singlePending] = useActionState(generateAction, undefined);
  const [batchState, batchFormAction, batchPending] = useActionState(generateBatchAction, undefined);

  const [examTitle, setExamTitle] = useState("");
  const [sections, setSections] = useState<SectionField[]>(DEFAULT_SECTIONS);
  const [instructions, setInstructions] = useState(["", "", "", "", ""]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeSets, setActiveSets] = useState("P");
  const [rosterFileName, setRosterFileName] = useState("");

  const total = sections.reduce((sum, s) => sum + s.count, 0);
  const state = mode === "single" ? singleState : batchState;
  const pending = mode === "single" ? singlePending : batchPending;

  function updateSection(i: number, patch: Partial<SectionField>) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSection() {
    setSections((prev) => (prev.length < MAX_SECTIONS ? [...prev, { name: "", count: 0 }] : prev));
  }
  function removeSection(i: number) {
    setSections((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  const sharedFields = (
    <>
      <input type="hidden" name="examTitle" value={examTitle} />
      {sections.map((s, i) => (
        <span key={i}>
          <input type="hidden" name={`section${i + 1}Name`} value={s.name} />
          <input type="hidden" name={`section${i + 1}Count`} value={s.count} />
        </span>
      ))}
      <input type="hidden" name="instruction1" value={instructions[0]} />
      <input type="hidden" name="instruction2" value={instructions[1]} />
      <input type="hidden" name="instruction3" value={instructions[2]} />
      <input type="hidden" name="instruction4" value={instructions[3]} />
      <input type="hidden" name="instruction5" value={instructions[4]} />
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-md bg-black/5 p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
            mode === "single" ? "bg-white shadow text-brand" : "text-foreground/60"
          }`}
        >
          Single sheet
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
            mode === "batch" ? "bg-white shadow text-brand" : "text-foreground/60"
          }`}
        >
          Batch (roster)
        </button>
      </div>

      <div>
        <label className={labelClass} htmlFor="examTitle">
          Exam title (optional)
        </label>
        <input
          id="examTitle"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="NEET (UG) 2027 — Practice OMR Answer Sheet"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Sections &amp; question counts (up to {MAX_SECTIONS} — e.g. CUET/CLAT-style exams)</label>
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={s.name}
                onChange={(e) => updateSection(i, { name: e.target.value })}
                placeholder={`Section ${i + 1} name`}
                className={`${inputClass} flex-[1.4]`}
              />
              <input
                type="number"
                min={0}
                max={200}
                value={s.count}
                onChange={(e) => updateSection(i, { count: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeSection(i)}
                disabled={sections.length <= 1}
                className="shrink-0 rounded-md border border-border px-3 text-sm text-foreground/60 hover:bg-black/5 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {sections.length < MAX_SECTIONS && (
          <button
            type="button"
            onClick={addSection}
            className="mt-2 text-sm text-brand hover:underline"
          >
            + Add section
          </button>
        )}
        <div className="mt-2 flex items-center justify-between rounded-md bg-brand/5 px-3 py-2 text-sm">
          <span className="text-foreground/70">Total questions</span>
          <strong className="text-brand-dark text-base">{total}</strong>
        </div>
        {total === 0 && <p className="text-xs text-red-600 mt-1">Add at least one question.</p>}
        {total > 200 && <p className="text-xs text-red-600 mt-1">Maximum 200 questions per sheet.</p>}
      </div>

      <details open={showInstructions} onToggle={(e) => setShowInstructions(e.currentTarget.open)} className="rounded-md border border-border px-3">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-brand-dark">
          Custom instructions (optional — defaults are used for anything left blank)
        </summary>
        <div className="space-y-2 pb-3">
          {instructions.slice(0, 4).map((line, i) => (
            <input
              key={i}
              value={line}
              onChange={(e) =>
                setInstructions((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`Instruction ${i + 1}`}
              className={inputClass}
            />
          ))}
          <input
            value={instructions[4]}
            onChange={(e) => setInstructions((prev) => prev.map((v, idx) => (idx === 4 ? e.target.value : v)))}
            placeholder="Instruction 5 (leave blank for auto question-distribution summary)"
            className={inputClass}
          />
        </div>
      </details>

      {mode === "single" ? (
        <form action={singleFormAction} className="space-y-4">
          {sharedFields}
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
          )}
          {state?.sheetUrl && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <p>
                &ldquo;{state.sheetTitle}&rdquo; is ready —{" "}
                <a href={state.sheetUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                  download it here
                </a>
                .
              </p>
              <div className="mt-2">
                <GeneratedSheetActions fileUrl={state.sheetUrl} title={state.sheetTitle} />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={pending || total === 0 || total > 200}
            className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Generating..." : "Generate sheet"}
          </button>
        </form>
      ) : (
        <form action={batchFormAction} className="space-y-4">
          {sharedFields}
          <div>
            <label className={labelClass} htmlFor="rosterFile">
              Roster CSV (Name + Roll Number columns)
            </label>
            <input
              id="rosterFile"
              name="rosterFile"
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => setRosterFileName(e.target.files?.[0]?.name ?? "")}
              className={inputClass}
            />
            {rosterFileName && <p className="text-xs text-foreground/50 mt-1">Selected: {rosterFileName}</p>}
            <a
              href="/omr/sheet-builder/roster-template"
              className="text-xs text-brand hover:underline inline-block mt-1"
            >
              Download CSV template →
            </a>
          </div>
          <div>
            <label className={labelClass} htmlFor="activeSets">
              Active test-booklet sets (comma-separated, from P/Q/R/S)
            </label>
            <input
              id="activeSets"
              name="activeSets"
              value={activeSets}
              onChange={(e) => setActiveSets(e.target.value)}
              placeholder="P or P,Q,R,S"
              className={inputClass}
            />
            <p className="text-xs text-foreground/50 mt-1">
              With more than one set, each student&apos;s sheet is pre-marked with a set round-robin — use the same
              sets when scoring in Evaluate.
            </p>
          </div>
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
          )}
          {state?.sheetUrl && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <p>
                &ldquo;{state.sheetTitle}&rdquo; ({state.studentCount} students) is ready —{" "}
                <a href={state.sheetUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                  download it here
                </a>
                .
              </p>
              <div className="mt-2">
                <GeneratedSheetActions fileUrl={state.sheetUrl} title={state.sheetTitle} />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={pending || total === 0 || total > 200}
            className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Generating batch..." : "Generate batch"}
          </button>
        </form>
      )}
    </div>
  );
}
