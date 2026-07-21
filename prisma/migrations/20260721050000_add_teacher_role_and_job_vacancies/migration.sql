-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- CreateEnum
CREATE TYPE "TeachingSubject" AS ENUM ('TAMIL', 'ENGLISH', 'MATHS', 'SCIENCE', 'SOCIAL_SCIENCE', 'COMPUTER_SCIENCE', 'PHYSICAL_EDUCATION', 'ARTS_CRAFT', 'MUSIC', 'PRIMARY_TEACHER', 'SPECIAL_EDUCATOR', 'LIBRARIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "JobVacancyStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('PENDING', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "subjectSpecialization" "TeachingSubject",
ADD COLUMN     "experienceYears" INTEGER;

-- CreateTable
CREATE TABLE "JobVacancy" (
    "id" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "subject" "TeachingSubject" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "udiseNumber" TEXT,
    "district" TEXT NOT NULL,
    "taluk" TEXT,
    "block" TEXT,
    "pinCode" TEXT,
    "address" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "qualificationRequired" TEXT NOT NULL,
    "experienceRequired" TEXT NOT NULL,
    "salaryRange" TEXT,
    "status" "JobVacancyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobVacancyId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "coverNote" TEXT NOT NULL,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobVacancyId_teacherId_key" ON "JobApplication"("jobVacancyId", "teacherId");

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobVacancyId_fkey" FOREIGN KEY ("jobVacancyId") REFERENCES "JobVacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
