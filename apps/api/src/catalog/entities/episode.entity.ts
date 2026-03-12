import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Season } from "./season.entity";

@Entity({ name: "episodes" })
export class Episode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "season_id" })
  seasonId!: string;

  @Column({ name: "episode_number", type: "int" })
  episodeNumber!: number;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  synopsis!: string | null;

  @Column({ name: "duration_minutes", type: "int" })
  durationMinutes!: number;

  @Column({ name: "thumbnail_image" })
  thumbnailImage!: string;

  @Column({ name: "video_url" })
  videoUrl!: string;

  @ManyToOne(() => Season, (season) => season.episodes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "season_id" })
  season!: Season;
}
