/*
  Warnings:

  - The values [LITERATURE_REVIEW,PROPOSAL,METHODOLOGY,DATA_COLLECTION,ANALYSIS] on the enum `ResearchPhase` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[projectId,studentId,semester,componentType,weekNumber,phaseKey]` on the table `Mark` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResearchPhase_new" AS ENUM ('PROBLEM_DEFINITION', 'EDA', 'DATA_ENGINEERING_PREPROCESSING', 'EXPERIMENTAL_SETUP_MODEL_DESIGN', 'TRAINING_OPTIMIZATION_TESTING', 'VALIDATION_RESULTS_SYNTHESIS', 'THESIS_WRITING');
ALTER TABLE "ProjectPhaseProgress" ALTER COLUMN "researchPhase" TYPE "ResearchPhase_new" USING ("researchPhase"::text::"ResearchPhase_new");
ALTER TYPE "ResearchPhase" RENAME TO "ResearchPhase_old";
ALTER TYPE "ResearchPhase_new" RENAME TO "ResearchPhase";
DROP TYPE "public"."ResearchPhase_old";
COMMIT;

-- DropIndex
DROP INDEX "Mark_projectId_studentId_semester_componentType_key";

-- AlterTable
ALTER TABLE "Mark" ADD COLUMN     "phaseKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "weekNumber" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WeightScheme" ADD COLUMN     "weeklyMeetingWeeks" INTEGER NOT NULL DEFAULT 14;

-- CreateIndex
CREATE UNIQUE INDEX "Mark_projectId_studentId_semester_componentType_weekNumber__key" ON "Mark"("projectId", "studentId", "semester", "componentType", "weekNumber", "phaseKey");
