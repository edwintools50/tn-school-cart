-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isDigital" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "fileUrl" TEXT;
