-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "professionalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "schedules_serviceId_idx" ON "schedules"("serviceId");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
