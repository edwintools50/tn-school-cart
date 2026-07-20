-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationPhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "GigRequest" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "completionPhotoUrl" TEXT;
