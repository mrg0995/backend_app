# backend_app

API de la plataforma de compraventa de joyeria de segunda mano. Proyecto final del Máster Full Stack Developer (UNIR).

## Cómo arrancarlo

Necesitas Node 22.9 o superior, pnpm y MySQL 8.

1. Instala las dependencias: `pnpm install`
2. Crea la base de datos: abre `db/schema.sql` en MySQL Workbench y ejecútalo.
3. Copia `.env.example` como `.env` y pon tu contraseña de MySQL.
4. Arranca la API: `pnpm dev`
5. Comprueba que funciona: abre http://localhost:3000/api/health. Debe salir `{"status":"ok","database":"ok"}`.

## Endpoints

Documentados en `docs/api.md`.