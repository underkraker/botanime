# Anime Stream Platform

Base inicial para una plataforma tipo Crunchyroll con arquitectura monorepo.

## Stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- DB: SQLite (default) o PostgreSQL + TypeORM

## Estructura

- `apps/web`: cliente web responsive (mobile-first)
- `apps/api`: API REST (health + auth JWT)

## Arranque local

1. Instala dependencias del monorepo:

```bash
npm install
```

2. Copia variables de entorno:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Por defecto la API usa SQLite en `apps/api/data/anime.db`, no necesitas instalar PostgreSQL.

3. Ejecuta frontend:

```bash
npm run dev:web
```

4. Ejecuta backend en otra terminal:

```bash
npm run dev:api
```

5. Verifica salud API:

- `http://localhost:4000/api/health`

## Endpoints auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me` (Bearer token)

## Endpoints catalog

- `GET /api/catalog/featured`
- `GET /api/catalog/animes`
- `GET /api/catalog/animes/:slug`
- `POST /api/catalog/admin/animes` (admin)
- `POST /api/catalog/admin/seasons` (admin)
- `POST /api/catalog/admin/episodes` (admin)
- `POST /api/catalog/admin/detect-from-link` (admin)
- `POST /api/telegram/webhook` (webhook Telegram)

Al iniciar por primera vez con DB vacia, la API inserta un seed inicial de animes,
temporadas y episodios de ejemplo.

## Endpoints continue watching

- `PUT /api/watch-progress/episode/:episodeId` (Bearer token)
- `GET /api/watch-progress/continue-watching` (Bearer token)

Body ejemplo para guardar progreso:

```json
{
  "positionSeconds": 120,
  "durationSeconds": 1440,
  "isCompleted": false
}
```

Body ejemplo para registro:

```json
{
  "email": "demo@anime.com",
  "password": "supersecreto",
  "displayName": "Demo User"
}
```

Si el email de registro coincide con `ADMIN_EMAIL` del `.env`, el usuario se crea con rol `admin`.

Si quieres usar PostgreSQL en vez de SQLite, cambia `DB_TYPE=postgres` y completa las variables `DB_*`.

## Frontend auth

- Pagina responsive en `http://localhost:3000/auth`
- Guarda `accessToken` y `refreshToken` en `localStorage`

## Frontend catalog

- Home conectada a `GET /api/catalog/animes` en `http://localhost:3000/`
- Detalle responsive de anime en `http://localhost:3000/anime/:slug`
- Reproductor HLS por episodio en `http://localhost:3000/anime/:slug/watch/:episodeId`
- Seccion `Continuar viendo` en home cuando el usuario tiene token activo
- Panel admin en `http://localhost:3000/admin` para alta de anime/temporada/episodio
- Panel admin con autocompletado por link (detecta metadata y rellena formulario)

## Integracion Telegram canal -> web

1. Crea un bot en `@BotFather` y agregalo como admin del canal.
2. Configura webhook a tu API (`/api/telegram/webhook`) con secret token.
3. Publica en canal con un formato como este:

```text
Anime: Nombre del anime
Temporada: 1
Capitulo: 3
Titulo capitulo: El regreso
Sinopsis: Texto del episodio
Link: https://tu-cdn.com/video.m3u8
```

La API detecta metadata y crea/actualiza anime, temporada y episodio automaticamente.

Comando ejemplo para webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
  -d "url=https://tu-dominio.com/api/telegram/webhook" \
  -d "secret_token=change-me-telegram-secret"
```

## Siguiente fase sugerida

1. Subtitulos VTT multi-idioma + selector en player
2. Favoritos, historial y busqueda avanzada
3. Moderacion/admin media upload (S3 o equivalente)
4. Suscripciones y pasarela de pagos
