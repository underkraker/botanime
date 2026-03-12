import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Post
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramService } from "./telegram.service";

@Controller("telegram")
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService
  ) {}

  @Post("webhook")
  async webhook(
    @Headers("x-telegram-bot-api-secret-token") secretHeader: string | undefined,
    @Body() body: unknown
  ) {
    const expectedSecret = this.configService.get<string>("TELEGRAM_WEBHOOK_SECRET", "");
    if (expectedSecret && secretHeader !== expectedSecret) {
      throw new ForbiddenException("Invalid telegram webhook secret");
    }

    return this.telegramService.handleUpdate(body);
  }
}
