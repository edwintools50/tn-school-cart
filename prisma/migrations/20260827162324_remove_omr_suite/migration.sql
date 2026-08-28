-- DropForeignKey
ALTER TABLE "OmrBranding" DROP CONSTRAINT "OmrBranding_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "OmrExamConfig" DROP CONSTRAINT "OmrExamConfig_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "OmrGeneratedSheet" DROP CONSTRAINT "OmrGeneratedSheet_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "OmrResult" DROP CONSTRAINT "OmrResult_examConfigId_fkey";

-- DropForeignKey
ALTER TABLE "OmrResult" DROP CONSTRAINT "OmrResult_ownerId_fkey";

-- DropTable
DROP TABLE "OmrBranding";

-- DropTable
DROP TABLE "OmrExamConfig";

-- DropTable
DROP TABLE "OmrGeneratedSheet";

-- DropTable
DROP TABLE "OmrResult";

