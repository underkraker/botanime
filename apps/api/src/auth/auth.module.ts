import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "./entities/user.entity";
import { RefreshSession } from "./entities/refresh-session.entity";
import { AccessTokenGuard } from "./guards/access-token.guard";

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshSession]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
  exports: [AuthService]
})
export class AuthModule {}
