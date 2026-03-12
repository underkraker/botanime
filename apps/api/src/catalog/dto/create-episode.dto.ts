import { IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateEpisodeDto {
  @IsString()
  seasonId!: string;

  @IsNumber()
  @Min(1)
  episodeNumber!: number;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @IsString()
  thumbnailImage!: string;

  @IsString()
  videoUrl!: string;
}
