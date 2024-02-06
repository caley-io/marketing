/*
  Warnings:

  - A unique constraint covering the columns `[threadId,userId]` on the table `ActionItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,threadId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId,userId]` on the table `Summary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,threadId]` on the table `UrgencyLevel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_name_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ActionItem_threadId_userId_key" ON "ActionItem"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_threadId_key" ON "Category"("userId", "threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_threadId_userId_key" ON "Summary"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UrgencyLevel_userId_threadId_key" ON "UrgencyLevel"("userId", "threadId");
