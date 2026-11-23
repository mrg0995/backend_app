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

Después ejecuta `db/seed.sql` para tener datos de prueba: un usuario de cada rol y algunas categorías.

| Email | Rol |
|---|---|
| admin@test.com | administrador |
| moderador@test.com | moderador |
| usuario@test.com | usuario |
| bloqueado@test.com | usuario (bloqueado) |

La contraseña de todos es `12345678`.

## Datos de prueba de búsqueda (Sprint 2)

El `db/seed.sql` añade 15 joyas de ejemplo, repartidas entre las cinco categorías.
Incluye 13 publicadas, una vendida y una en borrador, con distintos estados de conservación y ubicaciones.
También crea tres vendedores de prueba (`ana_joyas`, `luis_joyas`, `sara_joyas`).

Como `uploads/` está ignorada por Git, las imágenes de ejemplo van en `db/fotos-seed/`.
Después de ejecutar `db/schema.sql` y `db/seed.sql`, copia las fotos desde la raíz del backend:

```bash
mkdir -p uploads
cp db/fotos-seed/*.jpg uploads/
```

En Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force uploads
Copy-Item db/fotos-seed/*.jpg uploads/
```

Las imágenes son **ilustraciones de prueba**, no fotografías reales de productos a la venta.
Después puedes probar los filtros con la extensión REST Client de VS Code en `requests/busqueda.http`.

Ejemplos rápidos:

- `GET http://localhost:3000/api/articulos` → 13 artículos publicados (12 en la primera página).
- `GET http://localhost:3000/api/articulos?q=anillos` → artículos con `anillo` en los campos de búsqueda.
- `GET http://localhost:3000/api/articulos?orden=precio_asc&por_pagina=5` → 5 artículos ordenados por precio.
- `GET http://localhost:3000/api/articulos?por_pagina=49` → error 400.

Para probar el recorrido completo en local (necesita MySQL, la API arrancada y el seed cargado):

```bash
PRUEBA_SPRINT2=SI node scripts/prueba-sprint2.mjs
```

El script crea un artículo de prueba y realiza: login, creación, foto, publicación, búsqueda,
detalle, venta y borrado. Solo funciona contra `localhost` o `127.0.0.1`.

**Importante:** `schema.sql` elimina y recrea la base de datos; úsalo solo para preparar el entorno de desarrollo, no sobre datos que se quieran conservar.
