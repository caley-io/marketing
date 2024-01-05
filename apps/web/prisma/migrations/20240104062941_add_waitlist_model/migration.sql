-- CreateTable
CREATE TABLE "WaitlistUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "invited" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT,

    CONSTRAINT "WaitlistUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistUser_email_key" ON "WaitlistUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistUser_inviteCode_key" ON "WaitlistUser"("inviteCode");
