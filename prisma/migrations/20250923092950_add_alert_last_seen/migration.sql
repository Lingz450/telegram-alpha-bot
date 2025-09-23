/*
  Warnings:

  - Made the column `triggerPrice` on table `Alert` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ExecutedTrade_symbol_createdAt_idx";

-- DropIndex
DROP INDEX "ExecutedTrade_userId_createdAt_idx";

-- DropIndex
DROP INDEX "ExecutedTrade_chatId_createdAt_idx";

-- DropIndex
DROP INDEX "WalletPosition_chatId_symbol_key";

-- CreateTable
CREATE TABLE "WatchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "triggerPrice" DECIMAL NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'either',
    "kind" TEXT,
    "timeframe" TEXT,
    "period" INTEGER,
    "threshold" REAL,
    "lastSeen" DECIMAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Alert" ("active", "chatId", "createdAt", "direction", "id", "kind", "period", "symbol", "threshold", "timeframe", "triggerPrice", "userId") SELECT "active", "chatId", "createdAt", coalesce("direction", 'either') AS "direction", "id", "kind", "period", "symbol", "threshold", "timeframe", "triggerPrice", "userId" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_chatId_active_idx" ON "Alert"("chatId", "active");
CREATE INDEX "Alert_symbol_idx" ON "Alert"("symbol");
CREATE TABLE "new_Giveaway" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "winners" INTEGER NOT NULL DEFAULT 1,
    "endsAt" DATETIME NOT NULL,
    "entrants" TEXT NOT NULL DEFAULT '',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Giveaway" ("chatId", "createdAt", "endsAt", "entrants", "id", "prize", "resolved", "winners") SELECT "chatId", "createdAt", "endsAt", "entrants", "id", "prize", "resolved", "winners" FROM "Giveaway";
DROP TABLE "Giveaway";
ALTER TABLE "new_Giveaway" RENAME TO "Giveaway";
CREATE INDEX "Giveaway_chatId_resolved_idx" ON "Giveaway"("chatId", "resolved");
CREATE TABLE "new_TradeCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "entry" DECIMAL NOT NULL,
    "sl" DECIMAL NOT NULL,
    "leverage" INTEGER NOT NULL,
    "tps" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'long',
    "status" TEXT NOT NULL DEFAULT 'open',
    "filledPrice" DECIMAL,
    "closedPrice" DECIMAL,
    "srcMessageId" TEXT,
    "logMessageId" TEXT,
    "logChatId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" DATETIME,
    "closedAt" DATETIME
);
INSERT INTO "new_TradeCall" ("chatId", "createdAt", "entry", "id", "leverage", "sl", "symbol", "tps", "userId") SELECT "chatId", "createdAt", "entry", "id", "leverage", "sl", "symbol", "tps", "userId" FROM "TradeCall";
DROP TABLE "TradeCall";
ALTER TABLE "new_TradeCall" RENAME TO "TradeCall";
CREATE INDEX "TradeCall_chatId_idx" ON "TradeCall"("chatId");
CREATE INDEX "TradeCall_symbol_status_idx" ON "TradeCall"("symbol", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WatchItem_chatId_userId_idx" ON "WatchItem"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_chatId_userId_symbol_key" ON "WatchItem"("chatId", "userId", "symbol");

-- CreateIndex
CREATE INDEX "ExecutedTrade_chatId_idx" ON "ExecutedTrade"("chatId");

-- CreateIndex
CREATE INDEX "ExecutedTrade_userId_idx" ON "ExecutedTrade"("userId");

-- CreateIndex
CREATE INDEX "ExecutedTrade_symbol_idx" ON "ExecutedTrade"("symbol");

-- CreateIndex
CREATE INDEX "WalletPosition_chatId_idx" ON "WalletPosition"("chatId");

-- CreateIndex
CREATE INDEX "WalletPosition_symbol_idx" ON "WalletPosition"("symbol");
