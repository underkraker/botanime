import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { CreateSeasonDto } from "./dto/create-season.dto";
import { CreateEpisodeDto } from "./dto/create-episode.dto";
import { DetectLinkDto } from "./dto/detect-link.dto";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("featured")
  featured() {
    return this.catalogService.getFeatured();
  }

  @Get("animes")
  listAnimes() {
    return this.catalogService.listAnimes();
  }

  @Get("animes/:slug")
  getAnimeDetail(@Param("slug") slug: string) {
    return this.catalogService.getAnimeBySlug(slug);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/animes")
  createAnime(@Body() dto: CreateAnimeDto) {
    return this.catalogService.createAnime(dto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/seasons")
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.catalogService.createSeason(dto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/episodes")
  createEpisode(@Body() dto: CreateEpisodeDto) {
    return this.catalogService.createEpisode(dto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles("admin")
  @Post("admin/detect-from-link")
  detectFromLink(@Body() dto: DetectLinkDto) {
    return this.catalogService.detectFromLink(dto);
  }
}
