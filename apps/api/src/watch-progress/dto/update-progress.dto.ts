import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  positionSeconds!: number;

  @IsNumber()
  @Min(0)
  durationSeconds!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercent?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
