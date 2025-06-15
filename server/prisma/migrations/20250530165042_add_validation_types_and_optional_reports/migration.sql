-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "batchNumber" TEXT,
    "nutritionalInfo" TEXT,
    "claims" TEXT,
    "imageUrl" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("batchNumber", "brand", "category", "claims", "createdAt", "description", "id", "imageUrl", "name", "nutritionalInfo", "qrCode", "sku", "status", "updatedAt", "userId") SELECT "batchNumber", "brand", "category", "claims", "createdAt", "description", "id", "imageUrl", "name", "nutritionalInfo", "qrCode", "sku", "status", "updatedAt", "userId" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX "products_qrCode_key" ON "products"("qrCode");
CREATE TABLE "new_validations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "claimsValidated" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "validatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productId" TEXT NOT NULL,
    "reportId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "validations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "validations_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "validations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_validations" ("claimsValidated", "createdAt", "id", "notes", "productId", "reportId", "status", "summary", "updatedAt", "userId", "validatedAt") SELECT "claimsValidated", "createdAt", "id", "notes", "productId", "reportId", "status", "summary", "updatedAt", "userId", "validatedAt" FROM "validations";
DROP TABLE "validations";
ALTER TABLE "new_validations" RENAME TO "validations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
