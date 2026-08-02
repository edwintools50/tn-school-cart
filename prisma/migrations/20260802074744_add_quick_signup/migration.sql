-- CreateEnum
CREATE TYPE "QuickSignupStatus" AS ENUM ('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "QuickSignup" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "qualification" TEXT,
    "subjectSpecialization" "TeachingSubject",
    "experienceYears" INTEGER,
    "businessName" TEXT,
    "gigCategory" "GigCategory",
    "productCategory" "ProductCategory",
    "offeringTitle" TEXT,
    "offeringDescription" TEXT,
    "offeringPrice" DOUBLE PRECISION,
    "offeringUnit" TEXT,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "status" "QuickSignupStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuickSignup_status_idx" ON "QuickSignup"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuickSignup_email_role_key" ON "QuickSignup"("email", "role");
