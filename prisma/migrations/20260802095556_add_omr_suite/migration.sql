-- CreateTable
CREATE TABLE "OmrExamConfig" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "examTitle" TEXT NOT NULL,
    "subjects" JSONB NOT NULL,
    "rules" JSONB NOT NULL,
    "activeSets" TEXT[] DEFAULT ARRAY['P']::TEXT[],
    "answerKeys" JSONB NOT NULL,
    "sheetsExportEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OmrExamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmrResult" (
    "id" TEXT NOT NULL,
    "examConfigId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "wrongCount" INTEGER NOT NULL,
    "unattemptedCount" INTEGER NOT NULL,
    "multipleCount" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "bookletSeries" TEXT,
    "setWarning" TEXT,
    "uploadImageUrl" TEXT NOT NULL,
    "overlayImageUrl" TEXT NOT NULL,
    "examTitle" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmrResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmrBranding" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "instituteName" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1E3A8A',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OmrBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OmrGeneratedSheet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isBatch" BOOLEAN NOT NULL DEFAULT false,
    "studentCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OmrGeneratedSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OmrExamConfig_ownerId_idx" ON "OmrExamConfig"("ownerId");

-- CreateIndex
CREATE INDEX "OmrResult_ownerId_idx" ON "OmrResult"("ownerId");

-- CreateIndex
CREATE INDEX "OmrResult_examConfigId_idx" ON "OmrResult"("examConfigId");

-- CreateIndex
CREATE INDEX "OmrResult_rollNumber_idx" ON "OmrResult"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OmrBranding_ownerId_key" ON "OmrBranding"("ownerId");

-- CreateIndex
CREATE INDEX "OmrGeneratedSheet_ownerId_idx" ON "OmrGeneratedSheet"("ownerId");

-- AddForeignKey
ALTER TABLE "OmrExamConfig" ADD CONSTRAINT "OmrExamConfig_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmrResult" ADD CONSTRAINT "OmrResult_examConfigId_fkey" FOREIGN KEY ("examConfigId") REFERENCES "OmrExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmrResult" ADD CONSTRAINT "OmrResult_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmrBranding" ADD CONSTRAINT "OmrBranding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OmrGeneratedSheet" ADD CONSTRAINT "OmrGeneratedSheet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
