import Link from "next/link";
import { GraduationCap, MapPin, Briefcase, MessageCircle, UserSearch } from "lucide-react";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";
import { TEACHING_SUBJECT_LABELS, TN_DISTRICTS } from "@/lib/constants";
import type { TeachingSubject } from "@/generated/prisma/enums";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; district?: string }>;
}) {
  const { subject, district } = await searchParams;

  const teachers = await db.user.findMany({
    where: {
      role: "TEACHER",
      status: "APPROVED",
      ...(subject ? { subjectSpecialization: subject as TeachingSubject } : {}),
      ...(district ? { serviceArea: district } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 w-full">
      <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold mb-1">
        <GraduationCap size={22} className="text-brand" />
        Teacher Directory
      </h1>
      <p className="text-sm text-foreground/60 mb-5">
        Verified teachers available across Tamil Nadu — reach out directly for full-time,
        part-time, or coaching roles.
      </p>

      <form method="get" className="flex flex-wrap gap-3 mb-6">
        <select name="subject" defaultValue={subject ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">All subjects</option>
          {Object.entries(TEACHING_SUBJECT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select name="district" defaultValue={district ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-brand text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-brand-dark">
          Filter
        </button>
        {(subject || district) && (
          <Link href="/teachers" className="text-sm text-foreground/50 hover:text-brand self-center">
            Clear
          </Link>
        )}
      </form>

      {teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 text-foreground/50">
          <UserSearch size={40} className="mb-3 opacity-60" />
          <p className="text-sm">No teachers found for this filter.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="card p-4 rounded-2xl flex flex-col gap-2">
              <p className="font-semibold">{t.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-accent font-semibold uppercase tracking-wide">
                <GraduationCap size={13} />
                {t.subjectSpecialization ? TEACHING_SUBJECT_LABELS[t.subjectSpecialization] : "Teacher"}
              </p>
              <p className="text-sm text-foreground/70">{t.qualification}</p>
              <div className="flex items-center gap-3 text-xs text-foreground/50 mt-1">
                <span className="flex items-center gap-1">
                  <Briefcase size={12} />
                  {t.experienceYears ?? 0} yrs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {t.serviceArea}
                </span>
              </div>

              <a
                href={whatsappLink(
                  `Hi TN School Cart, I'd like to get in touch with ${t.name} (${t.subjectSpecialization ? TEACHING_SUBJECT_LABELS[t.subjectSpecialization] : "Teacher"}, ${t.serviceArea}) from the teacher directory.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg py-2 hover:brightness-95 transition"
              >
                <MessageCircle size={14} />
                Contact via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
