import { IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateAnimeDto {
  @IsString()
  @MinLength(3)
  slug!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(10)
  synopsis!: string;

  @IsString()
  @MinLength(3)
  genre!: string;

  @IsString()
  coverImage!: string;

  @IsString()
  bannerImage!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  @Min(1960)
  releaseYear!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rating?: number;
}
