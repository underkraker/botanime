import { IsNumber, IsString, Min, MinLength } from "class-validator";

export class CreateSeasonDto {
  @IsString()
  animeId!: string;

  @IsNumber()
  @Min(1)
  seasonNumber!: number;

  @IsString()
  @MinLength(2)
  title!: string;
}
