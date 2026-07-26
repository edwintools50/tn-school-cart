"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireApprovedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeachingSubject, EmploymentType, JobVacancyStatus, CoachingMode } from "@/generated/prisma/enums";
import { notifyJobApplicationReceived, notifyTeacherHired } from "@/lib/whatsapp-notify";

export type ActionState = { error?: string } | undefined;

const jobVacancySchema = z.object({
  subject: z.enum(TeachingSubject),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(10, "Please describe the role"),
  schoolName: z.string().trim().min(2, "School / coaching centre name is required"),
  // Only a school (Principal) has a UDISE code — validated as required
  // further down, conditional on the poster's actual role.
  udiseNumber: z.string().trim().optional(),
  district: z.string().trim().min(2, "District is required"),
  taluk: z.string().trim().min(2, "Taluk is required"),
  block: z.string().trim().min(2, "Block is required"),
  pinCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pin code"),
  address: z.string().trim().min(5, "Address is required"),
  employmentType: z.enum(EmploymentType),
  qualificationRequired: z.string().trim().min(2, "Required qualification is required"),
  experienceRequired: z.string().trim().min(1, "Required experience is required"),
  salaryRange: z.string().trim().optional(),
  coachingMode: z.enum(CoachingMode).optional(),
});

export async function createJobVacancyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireApprovedUser(["PRINCIPAL", "COACHING_CENTRE"]);
  const parsed = jobVacancySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (user.role === "PRINCIPAL" && !/^\d{11}$/.test(data.udiseNumber ?? "")) {
    return { error: "UDISE number must be the 11-digit school code" };
  }
  if (user.role === "COACHING_CENTRE" && !data.coachingMode) {
    return { error: "Select a mode for this batch" };
  }

  const jobVacancy = await db.jobVacancy.create({
    data: {
      principalId: user.id,
      subject: data.subject,
      title: data.title,
      description: data.description,
      schoolName: data.schoolName,
      udiseNumber: user.role === "PRINCIPAL" ? data.udiseNumber : null,
      district: data.district,
      taluk: data.taluk,
      block: data.block,
      pinCode: data.pinCode,
      address: data.address,
      employmentType: data.employmentType,
      qualificationRequired: data.qualificationRequired,
      experienceRequired: data.experienceRequired,
      salaryRange: data.salaryRange || null,
      coachingMode: user.role === "COACHING_CENTRE" ? data.coachingMode : null,
    },
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${jobVacancy.id}`);
}

const applicationSchema = z.object({
  jobVacancyId: z.string().min(1),
  coverNote: z.string().trim().min(5, "Add a short cover note"),
});

export async function submitApplicationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser(["TEACHER"]);
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { jobVacancyId, coverNote } = parsed.data;

  const jobVacancy = await db.jobVacancy.findUnique({
    where: { id: jobVacancyId },
    include: { principal: true },
  });
  if (!jobVacancy || jobVacancy.status !== "OPEN") {
    return { error: "This job vacancy is no longer open for applications." };
  }

  await db.jobApplication.upsert({
    where: { jobVacancyId_teacherId: { jobVacancyId, teacherId: user.id } },
    create: { jobVacancyId, teacherId: user.id, coverNote },
    update: { coverNote, status: "PENDING" },
  });

  await notifyJobApplicationReceived({
    phone: jobVacancy.principal.phone,
    principalName: jobVacancy.principal.name,
    teacherName: user.name,
    jobTitle: jobVacancy.title,
  });

  revalidatePath(`/jobs/${jobVacancyId}`);
  return undefined;
}

export async function hireApplicationAction(formData: FormData) {
  const user = await requireApprovedUser(["PRINCIPAL", "COACHING_CENTRE"]);
  const applicationId = String(formData.get("applicationId"));

  const application = await db.jobApplication.findUnique({
    include: { jobVacancy: true, teacher: true },
    where: { id: applicationId },
  });
  if (!application || application.jobVacancy.principalId !== user.id) throw new Error("Not found");
  if (application.jobVacancy.status !== "OPEN") throw new Error("Vacancy already filled");

  await db.$transaction([
    db.jobApplication.update({ where: { id: applicationId }, data: { status: "HIRED" } }),
    db.jobApplication.updateMany({
      where: { jobVacancyId: application.jobVacancyId, id: { not: applicationId } },
      data: { status: "REJECTED" },
    }),
    db.jobVacancy.update({ where: { id: application.jobVacancyId }, data: { status: "FILLED" } }),
  ]);

  await notifyTeacherHired({
    phone: application.teacher.phone,
    teacherName: application.teacher.name,
    jobTitle: application.jobVacancy.title,
    schoolName: application.jobVacancy.schoolName,
  });

  revalidatePath(`/jobs/${application.jobVacancyId}`);
}

const vacancyStatusTransitions: Record<string, string[]> = {
  OPEN: ["CLOSED"],
};

export async function updateJobVacancyStatusAction(formData: FormData) {
  const user = await requireApprovedUser(["PRINCIPAL", "COACHING_CENTRE"]);
  const jobVacancyId = String(formData.get("jobVacancyId"));
  const status = String(formData.get("status"));

  const jobVacancy = await db.jobVacancy.findUnique({ where: { id: jobVacancyId } });
  if (!jobVacancy || jobVacancy.principalId !== user.id) throw new Error("Not found");

  const allowed = vacancyStatusTransitions[jobVacancy.status] ?? [];
  if (!allowed.includes(status)) throw new Error("Invalid status transition");

  await db.jobVacancy.update({
    where: { id: jobVacancyId },
    data: { status: status as JobVacancyStatus },
  });

  revalidatePath(`/jobs/${jobVacancyId}`);
  revalidatePath("/jobs/mine");
}
