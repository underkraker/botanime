import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { Anime } from "./entities/anime.entity";
import { Season } from "./entities/season.entity";
import { Episode } from "./entities/episode.entity";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Module({
  imports: [TypeOrmModule.forFeature([Anime, Season, Episode]), JwtModule.register({})],
  controllers: [CatalogController],
  providers: [CatalogService, AccessTokenGuard, RolesGuard],
  exports: [CatalogService]
})
export class CatalogModule {}
