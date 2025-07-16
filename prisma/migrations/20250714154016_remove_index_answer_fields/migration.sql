/*
  Warnings:

  - You are about to drop the column `answer` on the `blog_contents` table. All the data in the column will be lost.
  - You are about to drop the column `index` on the `blog_contents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blog_contents" DROP COLUMN "answer",
DROP COLUMN "index";
