-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "color" VARCHAR(7) NOT NULL DEFAULT '#69B598',
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subcategories" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
