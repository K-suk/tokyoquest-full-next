-- CreateTable
CREATE TABLE "story_chapters" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "riddleEn" TEXT,
    "themeHints" TEXT[],
    "estReadSec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unlockedLevels" INTEGER[],
    "last_read_at_by_level" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_answers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_chapters_level_key" ON "story_chapters"("level");

-- CreateIndex
CREATE UNIQUE INDEX "story_progress_user_id_key" ON "story_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_answers_user_id_level_key" ON "story_answers"("user_id", "level");
