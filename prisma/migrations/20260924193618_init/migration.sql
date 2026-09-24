-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COORDINATOR', 'FACULTY');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SOFTWARE', 'RESEARCH');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('FYP_1', 'FYP_2');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('PROPOSAL_SUBMISSION', 'WEEKLY_MEETINGS', 'SDLC_PHASE', 'PLAGIARISM', 'THESIS_QUALITY');

-- CreateEnum
CREATE TYPE "SoftwarePhase" AS ENUM ('REQUIREMENTS', 'DESIGN', 'IMPLEMENTATION', 'TESTING', 'DEPLOYMENT_MAINTENANCE');

-- CreateEnum
CREATE TYPE "ResearchPhase" AS ENUM ('LITERATURE_REVIEW', 'PROPOSAL', 'METHODOLOGY', 'DATA_COLLECTION', 'ANALYSIS', 'THESIS_WRITING');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightScheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentWeight" (
    "id" TEXT NOT NULL,
    "weightSchemeId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "componentType" "ComponentType" NOT NULL,
    "maxMarks" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ComponentWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjectType" NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "weightSchemeId" TEXT NOT NULL,
    "proposalSubmittedAt" TIMESTAMP(3),
    "proposalDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPhaseProgress" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "softwarePhase" "SoftwarePhase",
    "researchPhase" "ResearchPhase",
    "status" "PhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPhaseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMeeting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "held" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlagiarismCheck" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "similarityPct" DECIMAL(5,2) NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PlagiarismCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesisReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "comments" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThesisReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "componentType" "ComponentType" NOT NULL,
    "marksAwarded" DECIMAL(5,2) NOT NULL,
    "maxMarks" DECIMAL(5,2) NOT NULL,
    "remarks" TEXT,
    "givenById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkEmailNotification" (
    "id" TEXT NOT NULL,
    "markId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorText" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkEmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_title_key" ON "AcademicSession"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE INDEX "WeightScheme_isDefault_idx" ON "WeightScheme"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentWeight_weightSchemeId_semester_componentType_key" ON "ComponentWeight"("weightSchemeId", "semester", "componentType");

-- CreateIndex
CREATE INDEX "Project_academicSessionId_idx" ON "Project"("academicSessionId");

-- CreateIndex
CREATE INDEX "Project_supervisorId_idx" ON "Project"("supervisorId");

-- CreateIndex
CREATE INDEX "Project_type_idx" ON "Project"("type");

-- CreateIndex
CREATE INDEX "ProjectMember_studentId_idx" ON "ProjectMember"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_studentId_key" ON "ProjectMember"("projectId", "studentId");

-- CreateIndex
CREATE INDEX "ProjectPhaseProgress_projectId_idx" ON "ProjectPhaseProgress"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhaseProgress_projectId_softwarePhase_key" ON "ProjectPhaseProgress"("projectId", "softwarePhase");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhaseProgress_projectId_researchPhase_key" ON "ProjectPhaseProgress"("projectId", "researchPhase");

-- CreateIndex
CREATE INDEX "WeeklyMeeting_projectId_idx" ON "WeeklyMeeting"("projectId");

-- CreateIndex
CREATE INDEX "PlagiarismCheck_projectId_idx" ON "PlagiarismCheck"("projectId");

-- CreateIndex
CREATE INDEX "ThesisReview_projectId_idx" ON "ThesisReview"("projectId");

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "Mark"("studentId");

-- CreateIndex
CREATE INDEX "Mark_projectId_idx" ON "Mark"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_projectId_studentId_semester_componentType_key" ON "Mark"("projectId", "studentId", "semester", "componentType");

-- CreateIndex
CREATE INDEX "MarkEmailNotification_markId_idx" ON "MarkEmailNotification"("markId");

-- CreateIndex
CREATE INDEX "MarkEmailNotification_studentId_idx" ON "MarkEmailNotification"("studentId");

-- AddForeignKey
ALTER TABLE "WeightScheme" ADD CONSTRAINT "WeightScheme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentWeight" ADD CONSTRAINT "ComponentWeight_weightSchemeId_fkey" FOREIGN KEY ("weightSchemeId") REFERENCES "WeightScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_weightSchemeId_fkey" FOREIGN KEY ("weightSchemeId") REFERENCES "WeightScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhaseProgress" ADD CONSTRAINT "ProjectPhaseProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMeeting" ADD CONSTRAINT "WeeklyMeeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlagiarismCheck" ADD CONSTRAINT "PlagiarismCheck_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisReview" ADD CONSTRAINT "ThesisReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkEmailNotification" ADD CONSTRAINT "MarkEmailNotification_markId_fkey" FOREIGN KEY ("markId") REFERENCES "Mark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
