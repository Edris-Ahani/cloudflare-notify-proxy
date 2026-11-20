-- CreateTable
CREATE TABLE "google_auth_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretEncrypted" TEXT NOT NULL,
    "clientSecretIv" TEXT NOT NULL,
    "clientSecretTag" TEXT NOT NULL,
    "authorizedRedirectUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_auth_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_auth_configs_userId_key" ON "google_auth_configs"("userId");

-- AddForeignKey
ALTER TABLE "google_auth_configs" ADD CONSTRAINT "google_auth_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
