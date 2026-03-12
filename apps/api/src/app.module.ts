import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { WatchProgressModule } from "./watch-progress/watch-progress.module";
import { TelegramModule } from "./telegram/telegram.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbType = config.get<string>("DB_TYPE", "sqlite").toLowerCase();
        const synchronize = config.get<string>("DB_SYNC", "true") === "true";

        if (dbType === "sqlite") {
          return {
            type: "sqlite",
            database: config.get<string>(
              "SQLITE_PATH",
              join(process.cwd(), "apps", "api", "data", "anime.db")
            ),
            synchronize,
            autoLoadEntities: true
          };
        }

        return {
          type: "postgres",
          url: config.get<string>("DATABASE_URL"),
          host: config.get<string>("DB_HOST", "localhost"),
          port: Number(config.get<string>("DB_PORT", "5432")),
          username: config.get<string>("DB_USER", "postgres"),
          password: config.get<string>("DB_PASSWORD", "postgres"),
          database: config.get<string>("DB_NAME", "anime_stream"),
          synchronize,
          autoLoadEntities: true
        };
      }
    }),
    AuthModule,
    CatalogModule,
    WatchProgressModule,
    TelegramModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
