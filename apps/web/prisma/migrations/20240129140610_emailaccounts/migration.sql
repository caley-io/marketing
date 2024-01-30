-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gmailAccessToken" TEXT,
    "gmailRefreshToken" TEXT,
    "gmailExpiresAt" TIMESTAMP(3),
    "gmailSyncedAt" TIMESTAMP(3),
    "gmailSyncedHistoryId" TEXT,
    "gmailSyncedHistoryIdUpdatedAt" TIMESTAMP(3),
    "outlookAccessToken" TEXT,
    "outlookRefreshToken" TEXT,
    "outlookExpiresAt" TIMESTAMP(3),
    "outlookSyncedAt" TIMESTAMP(3),
    "outlookSyncedHistoryId" TEXT,
    "outlookSyncedHistoryIdUpdatedAt" TIMESTAMP(3),
    "yahooAccessToken" TEXT,
    "yahooRefreshToken" TEXT,
    "yahooExpiresAt" TIMESTAMP(3),
    "yahooSyncedAt" TIMESTAMP(3),
    "yahooSyncedHistoryId" TEXT,
    "yahooSyncedHistoryIdUpdatedAt" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUsername" TEXT,
    "imapPassword" TEXT,
    "imapSyncedAt" TIMESTAMP(3),
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
