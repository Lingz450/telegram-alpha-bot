/*
  Warnings:

  - A unique constraint covering the columns `[chatId,symbol]` on the table `WalletPosition` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'price',
    "triggerPrice" DECIMAL,
    "direction" TEXT,
    "timeframe" TEXT,
    "period" INTEGER,
    "threshold" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Alert" ("active", "chatId", "createdAt", "direction", "id", "symbol", "triggerPrice", "userId") SELECT "active", "chatId", "createdAt", "direction", "id", "symbol", "triggerPrice", "userId" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_chatId_active_createdAt_idx" ON "Alert"("chatId", "active", "createdAt");
CREATE INDEX "Alert_symbol_active_idx" ON "Alert"("symbol", "active");
CREATE INDEX "Alert_kind_timeframe_idx" ON "Alert"("kind", "timeframe");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExecutedTrade_chatId_createdAt_idx" ON "ExecutedTrade"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutedTrade_userId_createdAt_idx" ON "ExecutedTrade"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExecutedTrade_symbol_createdAt_idx" ON "ExecutedTrade"("symbol", "createdAt");

-- CreateIndex
CREATE INDEX "Giveaway_chatId_endsAt_idx" ON "Giveaway"("chatId", "endsAt");

-- CreateIndex
CREATE INDEX "TradeCall_chatId_createdAt_idx" ON "TradeCall"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeCall_symbol_createdAt_idx" ON "TradeCall"("symbol", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPosition_chatId_symbol_key" ON "WalletPosition"("chatId", "symbol");
