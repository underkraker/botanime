import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Episode } from "../catalog/entities/episode.entity";
import { WatchProgress } from "./entities/watch-progress.entity";
import { UpdateProgressDto } from "./dto/update-progress.dto";

@Injectable()
export class WatchProgressService {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepository: Repository<WatchProgress>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>
  ) {}

  async updateEpisodeProgress(userId: string, episodeId: string, dto: UpdateProgressDto) {
    const episodeExists = await this.episodeRepository.exist({ where: { id: episodeId } });
    if (!episodeExists) {
      throw new NotFoundException("Episode not found");
    }

    const duration = Math.max(0, Math.round(dto.durationSeconds));
    const position = Math.max(0, Math.min(Math.round(dto.positionSeconds), duration || dto.positionSeconds));
    const derivedCompletion = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
    const completionPercent =
      dto.completionPercent !== undefined
        ? Math.max(0, Math.min(100, dto.completionPercent))
        : derivedCompletion;
    const isCompleted = dto.isCompleted ?? completionPercent >= 95;

    let progress = await this.watchProgressRepository.findOne({
      where: { userId, episodeId }
    });

    if (!progress) {
      progress = this.watchProgressRepository.create({
        userId,
        episodeId,
        durationSeconds: duration,
        lastPositionSeconds: position,
        completionPercent,
        isCompleted
      });
    } else {
      progress.durationSeconds = duration;
      progress.lastPositionSeconds = position;
      progress.completionPercent = completionPercent;
      progress.isCompleted = isCompleted;
    }

    const saved = await this.watchProgressRepository.save(progress);
    return {
      episodeId: saved.episodeId,
      lastPositionSeconds: saved.lastPositionSeconds,
      durationSeconds: saved.durationSeconds,
      completionPercent: saved.completionPercent,
      isCompleted: saved.isCompleted,
      updatedAt: saved.updatedAt
    };
  }

  async getContinueWatching(userId: string) {
    const items = await this.watchProgressRepository
      .createQueryBuilder("progress")
      .innerJoinAndSelect("progress.episode", "episode")
      .innerJoinAndSelect("episode.season", "season")
      .innerJoinAndSelect("season.anime", "anime")
      .where("progress.user_id = :userId", { userId })
      .andWhere("progress.is_completed = :isCompleted", { isCompleted: false })
      .andWhere("progress.last_position_seconds > 0")
      .orderBy("progress.updated_at", "DESC")
      .take(20)
      .getMany();

    return items.map((item) => ({
      animeSlug: item.episode.season.anime.slug,
      animeTitle: item.episode.season.anime.title,
      animeCoverImage: item.episode.season.anime.coverImage,
      seasonNumber: item.episode.season.seasonNumber,
      episodeId: item.episode.id,
      episodeNumber: item.episode.episodeNumber,
      episodeTitle: item.episode.title,
      lastPositionSeconds: item.lastPositionSeconds,
      durationSeconds: item.durationSeconds,
      completionPercent: item.completionPercent,
      updatedAt: item.updatedAt
    }));
  }
}
