import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Season } from "./season.entity";

@Entity({ name: "animes" })
export class Anime {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  synopsis!: string;

  @Column()
  genre!: string;

  @Column({ name: "cover_image" })
  coverImage!: string;

  @Column({ name: "banner_image" })
  bannerImage!: string;

  @Column({ default: "ongoing" })
  status!: string;

  @Column({ name: "release_year", type: "int" })
  releaseYear!: number;

  @Column({ type: "float", default: 4.5 })
  rating!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Season, (season) => season.anime)
  seasons!: Season[];
}
