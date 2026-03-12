import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Episode } from "../../catalog/entities/episode.entity";

@Entity({ name: "watch_progress" })
@Unique("uq_watch_progress_user_episode", ["userId", "episodeId"])
export class WatchProgress {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id" })
  userId!: string;

  @Index()
  @Column({ name: "episode_id" })
  episodeId!: string;

  @Column({ name: "last_position_seconds", type: "int", default: 0 })
  lastPositionSeconds!: number;

  @Column({ name: "duration_seconds", type: "int", default: 0 })
  durationSeconds!: number;

  @Column({ name: "completion_percent", type: "float", default: 0 })
  completionPercent!: number;

  @Column({ name: "is_completed", default: false })
  isCompleted!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Episode, { onDelete: "CASCADE" })
  @JoinColumn({ name: "episode_id" })
  episode!: Episode;
}
