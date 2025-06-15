-- CreateTable
CREATE TABLE "product_seals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sealId" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "issuedDate" DATETIME,
    "expiryDate" DATETIME,
    "validatingLaboratory" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_seals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
