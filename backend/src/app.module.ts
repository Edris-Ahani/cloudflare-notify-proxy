import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CryptoModule } from "./common/crypto/crypto.module";
import { AuthModule } from "./auth/auth.module";
import { CloudflareModule } from "./cloudflare/cloudflare.module";
import { TelegramModule } from "./telegram/telegram.module";
import { TemplateModule } from "./template/template.module";
import { GoogleModule } from "./google/google.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    CloudflareModule,
    TelegramModule,
    TemplateModule,
    GoogleModule,
  ],
})
export class AppModule {}
