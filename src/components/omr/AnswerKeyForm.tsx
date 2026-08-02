"use client";

import { useActionState, useMemo, useState } from "react";
import type { ExamActionState } from "@/app/omr/evaluate/actions";
import type { SeriesLetter } from "@/lib/omr/examConfig";

const ALL_SERIES_LETTERS: SeriesLetter[] = ["P", "Q", "R", "S"];
const OPTION_LETTERS = ["A", "B", "C", "D"];
const MAX_SUBJECTS = 5;

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

type SubjectField = { name: string; count: number };
type Rules = { marksCorrect: number; marksWrong: number; marksUnattempted: number; marksMultiple: number };

export default function AnswerKeyForm({
  action,
  examId,
  initialExamTitle,
  initialSubjects,
  initialRules,
  initialActiveSets,
  initialAnswerKeys,
  initialSheetsExportEmail,
  saved,
}: {
  action: (prevState: ExamActionState, formData: FormData) => Promise<ExamActionState>;
  examId: string;
  initialExamTitle: string;
  initialSubjects: SubjectField[];
  initialRules: Rules;
  initialActiveSets: SeriesLetter[];
  initialAnswerKeys: Record<SeriesLetter, Record<number, string>>;
  initialSheetsExportEmail: string;
  saved: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [subjects, setSubjects] = useState<SubjectField[]>(initialSubjects);
  const [setCount, setSetCount] = useState(Math.max(1, initialActiveSets.length));
  const [answerKeys, setAnswerKeys] = useState(initialAnswerKeys);
  const [activeTab, setActiveTab] = useState<SeriesLetter>("P");

  const total = subjects.reduce((s, x) => s + Math.max(0, x.count), 0);

  const sections = useMemo(() => {
    const result: { subject: SubjectField; startQ: number; endQ: number }[] = [];
    let cursor = 1;
    for (const subject of subjects) {
      if (subject.count <= 0) continue;
      result.push({ subject, startQ: cursor, endQ: cursor + subject.count - 1 });
      cursor += subject.count;
    }
    return result;
  }, [subjects]);

  function setAnswer(set: SeriesLetter, qNum: number, letter: string) {
    setAnswerKeys((prev) => ({ ...prev, [set]: { ...prev[set], [qNum]: letter } }));
  }

  function addSubject() {
    setSubjects((prev) => (prev.length < MAX_SUBJECTS ? [...prev, { name: "", count: 0 }] : prev));
  }
  function removeSubject(i: number) {
    setSubjects((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  const visibleSets = ALL_SERIES_LETTERS.slice(0, setCount);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="examId" value={examId} />

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Settings saved.
        </p>
      )}
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Exam</h2>
        <label className="block text-sm font-medium mb-1" htmlFor="examTitle">
          Exam title
        </label>
        <input id="examTitle" name="examTitle" defaultValue={initialExamTitle} className={inputClass} />

        <label className="block text-sm font-medium mb-1 mt-4">
          Sections (must match the section names/counts used to generate the blank sheet) — up to {MAX_SUBJECTS}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {subjects.map((subj, i) => (
            <div key={i} className="space-y-1">
              <div className="flex gap-1">
                <input
                  name={`subject${i + 1}Name`}
                  value={subj.name}
                  onChange={(e) =>
                    setSubjects((prev) => prev.map((s, idx) => (idx === i ? { ...s, name: e.target.value } : s)))
                  }
                  placeholder={`Section ${i + 1} name`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  disabled={subjects.length <= 1}
                  className="shrink-0 rounded-md border border-border px-2 text-xs text-foreground/60 hover:bg-black/5 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
              <input
                name={`subject${i + 1}Count`}
                type="number"
                min={0}
                max={200}
                value={subj.count}
                onChange={(e) =>
                  setSubjects((prev) =>
                    prev.map((s, idx) =>
                      idx === i ? { ...s, count: Math.max(0, Math.min(200, Number(e.target.value) || 0)) } : s
                    )
                  )
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
        {subjects.length < MAX_SUBJECTS && (
          <button type="button" onClick={addSubject} className="mt-2 text-sm text-brand hover:underline">
            + Add section
          </button>
        )}
        <p className="text-sm mt-3">
          Total questions: <strong>{total}</strong>
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-1">Marking scheme</h2>
        <p className="text-xs text-foreground/50 mb-3">
          Example NEET-style scheme: +4 correct, -1 wrong, 0 unattempted, -1 multiple marks.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Correct</label>
            <input name="marksCorrect" type="number" step="0.25" defaultValue={initialRules.marksCorrect} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Wrong</label>
            <input name="marksWrong" type="number" step="0.25" defaultValue={initialRules.marksWrong} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Unattempted</label>
            <input name="marksUnattempted" type="number" step="0.25" defaultValue={initialRules.marksUnattempted} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Multiple marks</label>
            <input name="marksMultiple" type="number" step="0.25" defaultValue={initialRules.marksMultiple} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-1">Multiple sets (anti-copying)</h2>
        <p className="text-xs text-foreground/50 mb-3">
          Every printed sheet already has a Test Booklet Code bubble grid (series letters P/Q/R/S). Turn this on to
          shuffle 2–4 versions of the paper — when scanning, the booklet series is auto-detected per sheet and
          graded against that set&apos;s key. Leave it at 1 Set if you&apos;re only using a single paper.
        </p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <label
              key={n}
              className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer ${
                setCount === n ? "border-brand bg-brand/10 text-brand-dark" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="setCount"
                value={n}
                checked={setCount === n}
                onChange={() => setSetCount(n)}
                className="hidden"
              />
              {n} Set{n === 1 ? "" : "s"} ({ALL_SERIES_LETTERS.slice(0, n).join("/")})
            </label>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-1">Answer key</h2>
        <p className="text-xs text-foreground/50 mb-3">
          Pick the correct option for every question. {total} question{total === 1 ? "" : "s"} total, per set.
        </p>

        <div className="flex gap-2 mb-4 flex-wrap">
          {visibleSets.map((set) => {
            const filled = Object.keys(answerKeys[set] || {}).filter((k) => Number(k) <= total).length;
            return (
              <button
                key={set}
                type="button"
                onClick={() => setActiveTab(set)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  activeTab === set ? "bg-brand text-white" : "border border-border text-foreground/70"
                }`}
              >
                Set {set} ({filled}/{total})
              </button>
            );
          })}
        </div>

        {visibleSets.map((set) => (
          <div key={set} className={activeTab === set ? "space-y-4" : "hidden"}>
            {sections.map(({ subject, startQ, endQ }) => (
              <div key={subject.name + startQ}>
                <h3 className="text-sm font-semibold text-brand-dark mb-2">
                  {subject.name} (Q{startQ}–{endQ})
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {Array.from({ length: endQ - startQ + 1 }, (_, idx) => startQ + idx).map((q) => (
                    <div key={q} className="flex items-center gap-1 text-xs">
                      <span className="text-foreground/50 w-6 shrink-0">Q{q}</span>
                      <select
                        name={`q_${set}_${q}`}
                        value={answerKeys[set]?.[q] || ""}
                        onChange={(e) => setAnswer(set, q, e.target.value)}
                        className="flex-1 rounded border border-border px-1 py-1 text-xs"
                      >
                        <option value="">?</option>
                        {OPTION_LETTERS.map((letter) => (
                          <option key={letter} value={letter}>
                            {letter}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {sections.length === 0 && <p className="text-xs text-foreground/50">Add questions above first.</p>}
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-1">Export destination</h2>
        <label className="block text-sm font-medium mb-1" htmlFor="sheetsExportEmail">
          Google account email (optional note — results export via CSV today)
        </label>
        <input
          id="sheetsExportEmail"
          name="sheetsExportEmail"
          type="email"
          defaultValue={initialSheetsExportEmail}
          placeholder="teacher@example.com"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
