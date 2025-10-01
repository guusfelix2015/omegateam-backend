-- CreateTable
CREATE TABLE "auction_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "reason" TEXT,
    "previous_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_audit_logs_pkey" PRIMARY KEY ("id")
);

