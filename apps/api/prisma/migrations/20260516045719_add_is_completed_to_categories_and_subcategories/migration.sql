-- Partial indexes for the dominant query pattern (fetch active items only)
-- Prisma does not support partial indexes natively; added manually here.
CREATE INDEX "categories_userId_active_idx" ON "categories"("userId") WHERE "isCompleted" = false;

CREATE INDEX "subcategories_categoryId_active_idx" ON "subcategories"("categoryId") WHERE "isCompleted" = false;
