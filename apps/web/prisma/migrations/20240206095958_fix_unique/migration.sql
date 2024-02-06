/*
  Warnings:

  - A unique constraint covering the columns `[threadId]` on the table `ActionItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId]` on the table `Summary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId]` on the table `UrgencyLevel` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ActionItem_threadId_userId_key";

-- DropIndex
DROP INDEX "Category_userId_threadId_key";

-- DropIndex
DROP INDEX "Summary_threadId_userId_key";

-- DropIndex
DROP INDEX "UrgencyLevel_userId_threadId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ActionItem_threadId_key" ON "ActionItem"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_threadId_key" ON "Category"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_threadId_key" ON "Summary"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "UrgencyLevel_threadId_key" ON "UrgencyLevel"("threadId");
