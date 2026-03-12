import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Anime } from "./entities/anime.entity";
import { Season } from "./entities/season.entity";
import { Episode } from "./entities/episode.entity";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { CreateSeasonDto } from "./dto/create-season.dto";
import { CreateEpisodeDto } from "./dto/create-episode.dto";
import { DetectLinkDto } from "./dto/detect-link.dto";

type SeedAnime = {
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  coverImage: string;
  bannerImage: string;
  releaseYear: number;
  rating: number;
  seasons: Array<{
    seasonNumber: number;
    title: string;
    episodes: Array<{
      episodeNumber: number;
      title: string;
      durationMinutes: number;
      synopsis: string;
      thumbnailImage: string;
      videoUrl: string;
    }>;
  }>;
};

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(Anime)
    private readonly animeRepository: Repository<Anime>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>
  ) {}

  async onModuleInit() {
    const total = await this.animeRepository.count();
    if (total === 0) {
      await this.seedCatalog();
    }
  }

  async getFeatured() {
    const items = await this.animeRepository.find({
      order: { rating: "DESC", createdAt: "DESC" },
      take: 6
    });

    return items.map((anime) => ({
      slug: anime.slug,
      title: anime.title,
      genre: anime.genre,
      releaseYear: anime.releaseYear,
      rating: anime.rating,
      coverImage: anime.coverImage
    }));
  }

  async listAnimes() {
    const animes = await this.animeRepository.find({ order: { createdAt: "DESC" } });

    const mapped = await Promise.all(
      animes.map(async (anime) => {
        const seasonCount = await this.seasonRepository.count({ where: { animeId: anime.id } });

        const episodeCount = await this.episodeRepository
          .createQueryBuilder("episode")
          .innerJoin("episode.season", "season")
          .where("season.anime_id = :animeId", { animeId: anime.id })
          .getCount();

        return {
          slug: anime.slug,
          title: anime.title,
          synopsis: anime.synopsis,
          genre: anime.genre,
          status: anime.status,
          releaseYear: anime.releaseYear,
          rating: anime.rating,
          coverImage: anime.coverImage,
          seasonCount,
          episodeCount
        };
      })
    );

    return mapped;
  }

  async getAnimeBySlug(slug: string) {
    const anime = await this.animeRepository.findOne({ where: { slug } });
    if (!anime) {
      throw new NotFoundException("Anime not found");
    }

    const seasons = await this.seasonRepository.find({
      where: { animeId: anime.id },
      order: { seasonNumber: "ASC" }
    });

    const seasonPayload = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await this.episodeRepository.find({
          where: { seasonId: season.id },
          order: { episodeNumber: "ASC" }
        });

        return {
          id: season.id,
          seasonNumber: season.seasonNumber,
          title: season.title,
          episodes: episodes.map((episode) => ({
            id: episode.id,
            episodeNumber: episode.episodeNumber,
            title: episode.title,
            synopsis: episode.synopsis,
            durationMinutes: episode.durationMinutes,
            thumbnailImage: episode.thumbnailImage,
            videoUrl: episode.videoUrl
          }))
        };
      })
    );

    return {
      slug: anime.slug,
      title: anime.title,
      synopsis: anime.synopsis,
      genre: anime.genre,
      status: anime.status,
      releaseYear: anime.releaseYear,
      rating: anime.rating,
      coverImage: anime.coverImage,
      bannerImage: anime.bannerImage,
      seasons: seasonPayload
    };
  }

  async createAnime(dto: CreateAnimeDto) {
    const existing = await this.animeRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException("Anime slug already exists");
    }

    const anime = await this.animeRepository.save(
      this.animeRepository.create({
        slug: dto.slug,
        title: dto.title,
        synopsis: dto.synopsis,
        genre: dto.genre,
        coverImage: dto.coverImage,
        bannerImage: dto.bannerImage,
        status: dto.status ?? "ongoing",
        releaseYear: dto.releaseYear,
        rating: dto.rating ?? 4.5
      })
    );

    return {
      id: anime.id,
      slug: anime.slug,
      title: anime.title
    };
  }

  async createSeason(dto: CreateSeasonDto) {
    const anime = await this.animeRepository.findOne({ where: { id: dto.animeId } });
    if (!anime) {
      throw new NotFoundException("Anime not found");
    }

    const seasonExists = await this.seasonRepository.findOne({
      where: { animeId: dto.animeId, seasonNumber: dto.seasonNumber }
    });
    if (seasonExists) {
      throw new ConflictException("Season number already exists for this anime");
    }

    const season = await this.seasonRepository.save(
      this.seasonRepository.create({
        animeId: dto.animeId,
        seasonNumber: dto.seasonNumber,
        title: dto.title
      })
    );

    return {
      id: season.id,
      animeId: season.animeId,
      seasonNumber: season.seasonNumber,
      title: season.title
    };
  }

  async createEpisode(dto: CreateEpisodeDto) {
    const season = await this.seasonRepository.findOne({ where: { id: dto.seasonId } });
    if (!season) {
      throw new NotFoundException("Season not found");
    }

    const exists = await this.episodeRepository.findOne({
      where: { seasonId: dto.seasonId, episodeNumber: dto.episodeNumber }
    });
    if (exists) {
      throw new ConflictException("Episode number already exists for this season");
    }

    const episode = await this.episodeRepository.save(
      this.episodeRepository.create({
        seasonId: dto.seasonId,
        episodeNumber: dto.episodeNumber,
        title: dto.title,
        synopsis: dto.synopsis ?? null,
        durationMinutes: dto.durationMinutes,
        thumbnailImage: dto.thumbnailImage,
        videoUrl: dto.videoUrl
      })
    );

    return {
      id: episode.id,
      seasonId: episode.seasonId,
      episodeNumber: episode.episodeNumber,
      title: episode.title
    };
  }

  async detectFromLink(dto: DetectLinkDto) {
    const normalizedUrl = dto.url.trim();
    const directVideoUrl = /\.(m3u8|mp4)(\?.*)?$/i.test(normalizedUrl) ? normalizedUrl : "";

    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AnimeStreamBot/1.0)"
        }
      });

      const html = await response.text();
      const title =
        this.extractMeta(html, "property", "og:title") ||
        this.extractMeta(html, "name", "twitter:title") ||
        this.extractTitleTag(html);
      const description =
        this.extractMeta(html, "property", "og:description") ||
        this.extractMeta(html, "name", "description") ||
        this.extractMeta(html, "name", "twitter:description");
      const image =
        this.extractMeta(html, "property", "og:image") ||
        this.extractMeta(html, "name", "twitter:image") ||
        "";

      const seasonEpisode = this.detectSeasonEpisode([title, description].filter(Boolean).join(" "));
      const releaseYear = this.detectYear([title, description].filter(Boolean).join(" "));

      const cleanedTitle = this.cleanTitle(title || this.titleFromUrl(normalizedUrl));
      const animeTitle = this.extractAnimeTitle(cleanedTitle, seasonEpisode.episodeTitle);
      const episodeTitle = seasonEpisode.episodeTitle || cleanedTitle;

      return {
        sourceUrl: normalizedUrl,
        confidence: this.computeConfidence(title, description, seasonEpisode),
        anime: {
          title: animeTitle,
          slug: this.slugify(animeTitle),
          synopsis: description || "",
          releaseYear,
          coverImage: image,
          bannerImage: image
        },
        season: {
          seasonNumber: seasonEpisode.seasonNumber,
          title: `Temporada ${seasonEpisode.seasonNumber}`
        },
        episode: {
          title: episodeTitle,
          episodeNumber: seasonEpisode.episodeNumber,
          synopsis: description || "",
          thumbnailImage: image,
          videoUrl: directVideoUrl || normalizedUrl
        }
      };
    } catch {
      const fallbackTitle = this.cleanTitle(this.titleFromUrl(normalizedUrl));
      const seasonEpisode = this.detectSeasonEpisode(fallbackTitle);
      const animeTitle = this.extractAnimeTitle(fallbackTitle, seasonEpisode.episodeTitle);

      return {
        sourceUrl: normalizedUrl,
        confidence: 0.25,
        anime: {
          title: animeTitle,
          slug: this.slugify(animeTitle),
          synopsis: "",
          releaseYear: new Date().getFullYear(),
          coverImage: "",
          bannerImage: ""
        },
        season: {
          seasonNumber: seasonEpisode.seasonNumber,
          title: `Temporada ${seasonEpisode.seasonNumber}`
        },
        episode: {
          title: seasonEpisode.episodeTitle || fallbackTitle || "Episodio",
          episodeNumber: seasonEpisode.episodeNumber,
          synopsis: "",
          thumbnailImage: "",
          videoUrl: directVideoUrl || normalizedUrl
        }
      };
    }
  }

  private async seedCatalog() {
    const catalog: SeedAnime[] = [
      {
        slug: "blaze-of-orion",
        title: "Blaze of Orion",
        synopsis:
          "Un escuadron juvenil protege colonias orbitales mientras descubre una guerra olvidada.",
        genre: "Accion",
        coverImage:
          "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=1200&q=80",
        bannerImage:
          "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1600&q=80",
        releaseYear: 2025,
        rating: 4.8,
        seasons: [
          {
            seasonNumber: 1,
            title: "Temporada 1",
            episodes: [
              {
                episodeNumber: 1,
                title: "Despertar orbital",
                durationMinutes: 24,
                synopsis: "Orion recibe su primera mision real fuera de la academia.",
                thumbnailImage:
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
                videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              },
              {
                episodeNumber: 2,
                title: "Lluvia de meteoros",
                durationMinutes: 24,
                synopsis: "El equipo enfrenta una emboscada mientras escolta refugiados.",
                thumbnailImage:
                  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
                videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              }
            ]
          }
        ]
      },
      {
        slug: "lunar-harbor",
        title: "Lunar Harbor",
        synopsis:
          "En un puerto lunar, dos musicos rivales encuentran una conexion que cambia su destino.",
        genre: "Romance",
        coverImage:
          "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=1200&q=80",
        bannerImage:
          "https://images.unsplash.com/photo-1515165562835-c4c1f7d68900?auto=format&fit=crop&w=1600&q=80",
        releaseYear: 2024,
        rating: 4.6,
        seasons: [
          {
            seasonNumber: 1,
            title: "Temporada 1",
            episodes: [
              {
                episodeNumber: 1,
                title: "Primer acorde",
                durationMinutes: 22,
                synopsis: "Mira y Kaito se conocen durante una tormenta solar.",
                thumbnailImage:
                  "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80",
                videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              }
            ]
          }
        ]
      },
      {
        slug: "neon-ronin",
        title: "Neon Ronin",
        synopsis:
          "Un samurai cibernetico persigue una red criminal en una megalopolis saturada de neones.",
        genre: "Sci-Fi",
        coverImage:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
        bannerImage:
          "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80",
        releaseYear: 2026,
        rating: 4.7,
        seasons: [
          {
            seasonNumber: 1,
            title: "Temporada 1",
            episodes: [
              {
                episodeNumber: 1,
                title: "Codigo fantasma",
                durationMinutes: 25,
                synopsis: "Riku recibe un contrato imposible en el distrito cero.",
                thumbnailImage:
                  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
                videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              },
              {
                episodeNumber: 2,
                title: "Sombra en la lluvia",
                durationMinutes: 25,
                synopsis: "Una inteligencia artificial antigua reaparece en la red publica.",
                thumbnailImage:
                  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
                videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              }
            ]
          }
        ]
      }
    ];

    for (const item of catalog) {
      const anime = await this.animeRepository.save(
        this.animeRepository.create({
          slug: item.slug,
          title: item.title,
          synopsis: item.synopsis,
          genre: item.genre,
          coverImage: item.coverImage,
          bannerImage: item.bannerImage,
          releaseYear: item.releaseYear,
          rating: item.rating,
          status: "ongoing"
        })
      );

      for (const seasonItem of item.seasons) {
        const season = await this.seasonRepository.save(
          this.seasonRepository.create({
            animeId: anime.id,
            seasonNumber: seasonItem.seasonNumber,
            title: seasonItem.title
          })
        );

        for (const episodeItem of seasonItem.episodes) {
          await this.episodeRepository.save(
            this.episodeRepository.create({
              seasonId: season.id,
              episodeNumber: episodeItem.episodeNumber,
              title: episodeItem.title,
              synopsis: episodeItem.synopsis,
              durationMinutes: episodeItem.durationMinutes,
              thumbnailImage: episodeItem.thumbnailImage,
              videoUrl: episodeItem.videoUrl
            })
          );
        }
      }
    }
  }

  private extractMeta(html: string, attribute: "property" | "name", key: string): string {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `<meta[^>]*${attribute}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const reverseRegex = new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${escaped}["'][^>]*>`,
      "i"
    );

    const match = html.match(regex) || html.match(reverseRegex);
    return this.normalizeWhitespace(this.decodeHtml(match?.[1] || ""));
  }

  private extractTitleTag(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return this.normalizeWhitespace(this.decodeHtml(match?.[1] || ""));
  }

  private detectSeasonEpisode(text: string) {
    const normalized = text || "";

    const sxe = normalized.match(/s\s*(\d{1,2})\s*e\s*(\d{1,3})/i);
    if (sxe) {
      return {
        seasonNumber: Number(sxe[1]),
        episodeNumber: Number(sxe[2]),
        episodeTitle: this.cleanEpisodeTitle(normalized)
      };
    }

    const spanish = normalized.match(/(?:temporada|season|t)\s*(\d{1,2}).{0,20}(?:capitulo|episodio|episode|e|c)\s*(\d{1,3})/i);
    if (spanish) {
      return {
        seasonNumber: Number(spanish[1]),
        episodeNumber: Number(spanish[2]),
        episodeTitle: this.cleanEpisodeTitle(normalized)
      };
    }

    const episodeOnly = normalized.match(/(?:capitulo|episodio|episode|ep)\s*(\d{1,3})/i);
    if (episodeOnly) {
      return {
        seasonNumber: 1,
        episodeNumber: Number(episodeOnly[1]),
        episodeTitle: this.cleanEpisodeTitle(normalized)
      };
    }

    return {
      seasonNumber: 1,
      episodeNumber: 1,
      episodeTitle: this.cleanEpisodeTitle(normalized)
    };
  }

  private detectYear(text: string): number {
    const match = text.match(/(19\d{2}|20\d{2})/);
    return match ? Number(match[1]) : new Date().getFullYear();
  }

  private cleanEpisodeTitle(text: string): string {
    const cleaned = this.cleanTitle(text)
      .replace(/(?:^|\s)[-:|]+(?:\s|$)/g, " ")
      .replace(/\b(?:temporada|season|t)\s*\d{1,2}\b/gi, "")
      .replace(/\b(?:capitulo|episodio|episode|ep|e)\s*\d{1,3}\b/gi, "")
      .replace(/\bs\s*\d{1,2}\s*e\s*\d{1,3}\b/gi, "");

    return this.normalizeWhitespace(cleaned) || "Episodio";
  }

  private extractAnimeTitle(cleanedTitle: string, episodeTitle: string): string {
    const withoutEpisode = cleanedTitle
      .replace(episodeTitle, "")
      .replace(/[|\-:]+/g, " ")
      .trim();

    const candidate = this.normalizeWhitespace(withoutEpisode || cleanedTitle || "Anime");

    if (candidate.length < 2) {
      return "Anime";
    }

    return candidate;
  }

  private cleanTitle(title: string): string {
    const value = this.normalizeWhitespace(this.decodeHtml(title || ""));
    const noSiteSuffix = value
      .replace(/\s*[|]\s*[^|]+$/g, "")
      .replace(/\s+-\s+ver\s+online.*$/i, "")
      .replace(/\s+-\s+watch\s+online.*$/i, "")
      .trim();

    return noSiteSuffix || value;
  }

  private titleFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const segment = parsed.pathname.split("/").filter(Boolean).at(-1) || parsed.hostname;
      return segment.replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "");
    } catch {
      return url;
    }
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  private normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "anime";
  }

  private computeConfidence(
    title: string,
    description: string,
    seasonEpisode: { seasonNumber: number; episodeNumber: number; episodeTitle: string }
  ): number {
    let score = 0.2;
    if (title) {
      score += 0.35;
    }
    if (description) {
      score += 0.25;
    }
    if (seasonEpisode.episodeNumber > 1 || seasonEpisode.seasonNumber > 1) {
      score += 0.2;
    }

    return Math.min(1, Number(score.toFixed(2)));
  }
}
