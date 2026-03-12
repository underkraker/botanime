import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "../catalog/catalog.module";
import { Anime } from "../catalog/entities/anime.entity";
import { Season } from "../catalog/entities/season.entity";
import { Episode } from "../catalog/entities/episode.entity";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [CatalogModule, TypeOrmModule.forFeature([Anime, Season, Episode])],
  controllers: [TelegramController],
  providers: [TelegramService]
})
export class TelegramModule {}
