ALTER TABLE "Resume" ADD COLUMN "contentHash" TEXT NOT NULL DEFAULT '';
CREATE INDEX "Resume_userId_contentHash_idx" ON "Resume"("userId", "contentHash");
