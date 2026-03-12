import { Body, Controller, Get, Param, Put, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { AccessTokenPayload } from "../auth/types/jwt-payload.types";
import { UpdateProgressDto } from "./dto/update-progress.dto";
import { WatchProgressService } from "./watch-progress.service";

type RequestWithUser = Request & { user: AccessTokenPayload };

@UseGuards(AccessTokenGuard)
@Controller("watch-progress")
export class WatchProgressController {
  constructor(private readonly watchProgressService: WatchProgressService) {}

  @Put("episode/:episodeId")
  updateProgress(
    @Req() req: RequestWithUser,
    @Param("episodeId") episodeId: string,
    @Body() dto: UpdateProgressDto
  ) {
    return this.watchProgressService.updateEpisodeProgress(req.user.sub, episodeId, dto);
  }

  @Get("continue-watching")
  continueWatching(@Req() req: RequestWithUser) {
    return this.watchProgressService.getContinueWatching(req.user.sub);
  }
}
