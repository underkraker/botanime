import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CatalogService } from "../catalog/catalog.service";
import { Anime } from "../catalog/entities/anime.entity";
import { Season } from "../catalog/entities/season.entity";
import { Episode } from "../catalog/entities/episode.entity";

type TelegramUpdate = {
  update_id?: number;
  channel_post?: {
    message_id?: number;
    text?: string;
    caption?: string;
    chat?: {
      id?: number;
      username?: string;
      title?: string;
    };
  };
};

@Injectable()
export class TelegramService {
  constructor(
    private readonly configService: ConfigService,
    private readonly catalogService: CatalogService,
    @InjectRepository(Anime)
    private readonly animeRepository: Repository<Anime>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>
  ) {}

  async handleUpdate(payload: unknown) {
    const update = payload as TelegramUpdate;
    if (!update?.channel_post) {
      return { ok: true, ignored: true, reason: "No channel_post" };
    }

    const allowedChannel = this.configService.get<string>("TELEGRAM_CHANNEL_USERNAME", "").trim();
    const channelUsername = update.channel_post.chat?.username || "";
    if (allowedChannel && channelUsername && allowedChannel !== channelUsername) {
      return { ok: true, ignored: true, reason: "Channel not allowed" };
    }

    const content = [update.channel_post.text, update.channel_post.caption]
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!content) {
      return { ok: true, ignored: true, reason: "Empty content" };
    }

    const explicitVideoUrl =
      this.extractByKeys(content, ["link", "video", "url", "stream", "m3u8"]) ||
      this.extractFirstUrl(content);
    const detectResult = explicitVideoUrl
      ? await this.catalogService.detectFromLink({ url: explicitVideoUrl })
      : null;

    const animeTitle =
      this.extractByKeys(content, ["anime", "titulo anime", "serie", "title"]) ||
      detectResult?.anime.title ||
      "Anime";
    const animeSlug =
      this.extractByKeys(content, ["slug", "anime slug"]) ||
      detectResult?.anime.slug ||
      this.slugify(animeTitle);
    const animeSynopsis =
      this.extractByKeys(content, ["sinopsis", "descripcion", "description"]) ||
      detectResult?.anime.synopsis ||
      "";
    const animeGenre = this.extractByKeys(content, ["genero", "genre"]) || "Anime";
    const animeCover =
      this.extractByKeys(content, ["cover", "portada", "imagen", "poster"]) ||
      detectResult?.anime.coverImage ||
      "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&w=1200&q=80";
    const animeBanner =
      this.extractByKeys(content, ["banner", "header"]) || detectResult?.anime.bannerImage || animeCover;

    const parsedSeason = this.extractIntByKeys(content, ["temporada", "season", "t"]);
    const parsedEpisode = this.extractIntByKeys(content, ["capitulo", "episodio", "episode", "ep", "e"]);
    const seasonNumber = parsedSeason ?? detectResult?.season.seasonNumber ?? 1;
    const episodeNumber = parsedEpisode ?? detectResult?.episode.episodeNumber ?? 1;
    const episodeTitle =
      this.extractByKeys(content, ["titulo capitulo", "nombre capitulo", "episode title", "capitulo", "episodio"]) ||
      detectResult?.episode.title ||
      `Episodio ${episodeNumber}`;
    const episodeSynopsis =
      this.extractByKeys(content, ["sinopsis capitulo", "descripcion capitulo", "sinopsis"]) ||
      detectResult?.episode.synopsis ||
      animeSynopsis;
    const episodeThumbnail =
      this.extractByKeys(content, ["thumbnail", "miniatura", "imagen capitulo"]) ||
      detectResult?.episode.thumbnailImage ||
      animeCover;
    const episodeVideoUrl =
      explicitVideoUrl || detectResult?.episode.videoUrl || this.extractFirstUrl(content);

    if (!episodeVideoUrl) {
      return {
        ok: false,
        ignored: true,
        reason: "No video URL found",
        help: "Incluye una linea tipo 'Link: https://...m3u8'"
      };
    }

    const releaseYear =
      this.extractIntByKeys(content, ["anio", "año", "year"]) ||
      detectResult?.anime.releaseYear ||
      new Date().getFullYear();

    const anime = await this.findOrCreateAnime({
      title: animeTitle,
      slug: animeSlug,
      synopsis: animeSynopsis,
      genre: animeGenre,
      coverImage: animeCover,
      bannerImage: animeBanner,
      releaseYear
    });

    const season = await this.findOrCreateSeason(anime.id, seasonNumber);
    const episode = await this.createOrUpdateEpisode({
      seasonId: season.id,
      episodeNumber,
      title: episodeTitle,
      synopsis: episodeSynopsis,
      thumbnailImage: episodeThumbnail,
      videoUrl: episodeVideoUrl
    });

    return {
      ok: true,
      action: "synced",
      channel: channelUsername || update.channel_post.chat?.title || "unknown",
      messageId: update.channel_post.message_id,
      anime: { id: anime.id, title: anime.title, slug: anime.slug },
      season: { id: season.id, seasonNumber: season.seasonNumber },
      episode: { id: episode.id, episodeNumber: episode.episodeNumber, title: episode.title }
    };
  }

  private async findOrCreateAnime(input: {
    title: string;
    slug: string;
    synopsis: string;
    genre: string;
    coverImage: string;
    bannerImage: string;
    releaseYear: number;
  }) {
    const bySlug = await this.animeRepository.findOne({ where: { slug: input.slug } });
    if (bySlug) {
      return bySlug;
    }

    const byTitle = await this.animeRepository
      .createQueryBuilder("anime")
      .where("LOWER(anime.title) = LOWER(:title)", { title: input.title })
      .getOne();
    if (byTitle) {
      return byTitle;
    }

    return this.animeRepository.save(
      this.animeRepository.create({
        title: input.title,
        slug: this.slugify(input.slug),
        synopsis: input.synopsis || "Sinopsis pendiente",
        genre: input.genre || "Anime",
        coverImage: input.coverImage,
        bannerImage: input.bannerImage,
        releaseYear: input.releaseYear,
        rating: 4.5,
        status: "ongoing"
      })
    );
  }

  private async findOrCreateSeason(animeId: string, seasonNumber: number) {
    const existing = await this.seasonRepository.findOne({ where: { animeId, seasonNumber } });
    if (existing) {
      return existing;
    }

    return this.seasonRepository.save(
      this.seasonRepository.create({
        animeId,
        seasonNumber,
        title: `Temporada ${seasonNumber}`
      })
    );
  }

  private async createOrUpdateEpisode(input: {
    seasonId: string;
    episodeNumber: number;
    title: string;
    synopsis: string;
    thumbnailImage: string;
    videoUrl: string;
  }) {
    const existing = await this.episodeRepository.findOne({
      where: { seasonId: input.seasonId, episodeNumber: input.episodeNumber }
    });

    if (existing) {
      existing.title = input.title || existing.title;
      existing.synopsis = input.synopsis || existing.synopsis;
      existing.thumbnailImage = input.thumbnailImage || existing.thumbnailImage;
      existing.videoUrl = input.videoUrl || existing.videoUrl;
      return this.episodeRepository.save(existing);
    }

    return this.episodeRepository.save(
      this.episodeRepository.create({
        seasonId: input.seasonId,
        episodeNumber: input.episodeNumber,
        title: input.title,
        synopsis: input.synopsis || null,
        durationMinutes: 24,
        thumbnailImage: input.thumbnailImage,
        videoUrl: input.videoUrl
      })
    );
  }

  private extractByKeys(content: string, keys: string[]): string {
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*:\\s*(.+)$`, "im");
      const match = content.match(regex);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    return "";
  }

  private extractIntByKeys(content: string, keys: string[]): number | null {
    const value = this.extractByKeys(content, keys);
    if (!value) {
      return null;
    }

    const match = value.match(/\d{1,4}/);
    if (!match) {
      return null;
    }

    return Number(match[0]);
  }

  private extractFirstUrl(content: string): string {
    const match = content.match(/https?:\/\/[^\s)]+/i);
    return match?.[0] || "";
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "anime";
  }
}
