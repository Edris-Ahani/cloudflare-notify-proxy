-- AlterTable
ALTER TABLE "users" ADD COLUMN "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "telegram_otp_sessions" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "otpCode" TEXT,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_otp_sessions_sessionToken_key" ON "telegram_otp_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "telegram_otp_sessions_phoneNumber_idx" ON "telegram_otp_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "telegram_otp_sessions_sessionToken_idx" ON "telegram_otp_sessions"("sessionToken");
