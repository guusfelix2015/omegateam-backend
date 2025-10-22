-- AlterTable
ALTER TABLE "raid_instances" ADD COLUMN     "audited_at" TIMESTAMP(3),
ADD COLUMN     "audited_by" TEXT,
ADD COLUMN     "is_audited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "raid_participants" ADD COLUMN     "has_confirmed_attendance" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "raid_attendance_confirmations" (
    "id" TEXT NOT NULL,
    "raid_instance_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raid_attendance_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raid_attendance_confirmations_participant_id_key" ON "raid_attendance_confirmations"("participant_id");

-- AddForeignKey
ALTER TABLE "raid_attendance_confirmations" ADD CONSTRAINT "raid_attendance_confirmations_raid_instance_id_fkey" FOREIGN KEY ("raid_instance_id") REFERENCES "raid_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_attendance_confirmations" ADD CONSTRAINT "raid_attendance_confirmations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "raid_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_attendance_confirmations" ADD CONSTRAINT "raid_attendance_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
