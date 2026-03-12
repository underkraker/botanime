import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { WatchProgress } from "./entities/watch-progress.entity";
import { WatchProgressController } from "./watch-progress.controller";
import { WatchProgressService } from "./watch-progress.service";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { Episode } from "../catalog/entities/episode.entity";

@Module({
  imports: [TypeOrmModule.forFeature([WatchProgress, Episode]), JwtModule.register({})],
  controllers: [WatchProgressController],
  providers: [WatchProgressService, AccessTokenGuard]
})
export class WatchProgressModule {}
