-- AlterTable
ALTER TABLE "User" ADD COLUMN     "udiseNumber" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingUdise" TEXT,
ADD COLUMN     "shippingTaluk" TEXT,
ADD COLUMN     "shippingBlock" TEXT,
ADD COLUMN     "shippingPinCode" TEXT;

-- AlterTable
ALTER TABLE "GigRequest" ADD COLUMN     "udiseNumber" TEXT,
ADD COLUMN     "taluk" TEXT,
ADD COLUMN     "block" TEXT,
ADD COLUMN     "pinCode" TEXT;
