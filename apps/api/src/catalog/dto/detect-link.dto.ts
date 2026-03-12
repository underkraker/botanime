import { IsString, IsUrl } from "class-validator";

export class DetectLinkDto {
  @IsString()
  @IsUrl({ require_tld: false })
  url!: string;
}
