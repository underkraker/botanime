import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { Anime } from "./anime.entity";
import { Episode } from "./episode.entity";

@Entity({ name: "seasons" })
export class Season {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "anime_id" })
  animeId!: string;

  @Column({ name: "season_number", type: "int" })
  seasonNumber!: number;

  @Column()
  title!: string;

  @ManyToOne(() => Anime, (anime) => anime.seasons, { onDelete: "CASCADE" })
  @JoinColumn({ name: "anime_id" })
  anime!: Anime;

  @OneToMany(() => Episode, (episode) => episode.season)
  episodes!: Episode[];
}
