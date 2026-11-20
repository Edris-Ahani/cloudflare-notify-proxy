import { Module } from "@nestjs/common";
import { GoogleService } from "./google.service";
import { GoogleController } from "./google.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CryptoModule } from "../common/crypto/crypto.module";

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [GoogleController],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
