# API · Documentación de endpoints

Base: `http://localhost:3000/api`

Los errores siempre devuelven `{ "message": "..." }`.

Las rutas protegidas necesitan la cabecera `Authorization: Bearer <token>`. Sin token devuelven 401, y con un rol sin permiso, 403.

Roles: `usuario`, `moderador`, `administrador`.

## Auth

### Registrar un usuario

Method: POST
Url: /api/auth/registro
Headers: -
Body:
```json
{
    "nombre_usuario": "anagl",
    "email": "ana@email.com",
    "password": "12345678",
    "ubicacion": "Madrid"
}
```
`ubicacion` es opcional. La contraseña debe tener al menos 8 caracteres.

Response (201): el usuario queda registrado y con la sesión iniciada.
```json
{
    "message": "Usuario registrado",
    "token": "eyJhbGciOi...",
    "usuario": {
        "id": 1,
        "nombre_usuario": "anagl",
        "email": "ana@email.com",
        "rol": "usuario",
        "foto_url": null,
        "ubicacion": "Madrid"
    }
}
```
Errores:
- 400: faltan campos obligatorios o la contraseña tiene menos de 8 caracteres
- 409: el email o el nombre de usuario ya existen

### Iniciar sesión

Method: POST
Url: /api/auth/login
Headers: -
Body:
```json
{
    "email": "ana@email.com",
    "password": "12345678"
}
```

Response (200): mismo formato que el registro.
```json
{
    "message": "Login correcto",
    "token": "eyJhbGciOi...",
    "usuario": {
        "id": 1,
        "nombre_usuario": "anagl",
        "email": "ana@email.com",
        "rol": "usuario",
        "foto_url": null,
        "ubicacion": "Madrid"
    }
}
```
Errores:
- 400: faltan campos obligatorios
- 401: email o contraseña incorrectos
- 403: la cuenta está bloqueada o eliminada

El token caduca a los 7 días y lleva dentro el `id` y el `rol` del usuario.


## Usuarios (añadido por Mariel)

### Ver el perfil público de un usuario

Method: GET
Url: /api/usuarios/:idUsuario/publico
Headers: -
Body: -

Response (200): solo los datos públicos, nunca el email.
```json
{
    "id": 3,
    "nombre_usuario": "usuario",
    "foto_url": "/uploads/foto-3.jpg",
    "ubicacion": "Sevilla"
}
```
Errores:
- 400: el id no es un número
- 404: el usuario no existe o está eliminado

### Ver mi perfil

Method: GET
Url: /api/usuarios/perfil
Headers: Authorization: Bearer <token>
Body: -

Response (200): los datos del usuario que ha iniciado sesión, en el mismo formato que el login.
```json
{
    "id": 3,
    "nombre_usuario": "usuario",
    "email": "usuario@test.com",
    "rol": "usuario",
    "foto_url": null,
    "ubicacion": "Sevilla"
}
```
Errores:
- 401: no hay token, ha caducado o el usuario está bloqueado

### Editar mi perfil

Method: PUT
Url: /api/usuarios/perfil
Headers: Authorization: Bearer <token>
Body:
```json
{
    "nombre_usuario": "usuario_nuevo",
    "ubicacion": "Granada"
}
```
Los dos campos son opcionales, pero tiene que llegar al menos uno. El que no se envíe se queda como estaba.

Response (200): el perfil actualizado.
```json
{
    "message": "Perfil actualizado",
    "usuario": {
        "id": 3,
        "nombre_usuario": "usuario_nuevo",
        "email": "usuario@test.com",
        "rol": "usuario",
        "foto_url": null,
        "ubicacion": "Granada"
    }
}
```
Errores:
- 400: no llega ningún campo o el nombre de usuario está vacío
- 401: no hay token, ha caducado o el usuario está bloqueado
- 409: el nombre de usuario ya lo tiene otra persona

### Cambiar mi foto de perfil

Method: PUT
Url: /api/usuarios/perfil/foto
Headers: Authorization: Bearer <token>
Body: `multipart/form-data` con un campo `foto` que contiene la imagen.

Solo se admiten imágenes JPG, PNG o WEBP de hasta 2 MB.

Response (200): el perfil con la foto nueva.
```json
{
    "message": "Foto actualizada",
    "usuario": {
        "id": 3,
        "nombre_usuario": "usuario",
        "email": "usuario@test.com",
        "rol": "usuario",
        "foto_url": "/uploads/foto-3.jpg",
        "ubicacion": "Sevilla"
    }
}
```
Errores:
- 400: no llega ninguna imagen, el formato no está permitido o pesa más de 2 MB
- 401: no hay token, ha caducado o el usuario está bloqueado

`foto_url` es una ruta: para mostrar la imagen hay que añadir delante `http://localhost:3000`.

## Comprobación del servicio

### Estado de la API y de MySQL

Method: GET
Url: /api/health
Headers: -
Body: -

Response (200), cuando MySQL responde:
```json
{ "status": "ok", "database": "ok" }
```

Response (503), cuando falla la conexión con MySQL:
```json
{ "status": "error", "database": "error" }
```

## Contrato con el frontend (Sprint 1)

Estos son los nombres que debe utilizar Angular según los controladores del backend actual.
No son propuestas de nuevas rutas: las he comprobado en `src/routes/` y `src/controllers/`.

| Pantalla / acción | Método y ruta | Datos que envía el front | Respuesta que utiliza |
| --- | --- | --- | --- |
| Registro | `POST /api/auth/registro` | `nombre_usuario`, `email`, `password` y `ubicacion` opcional | `token`, `usuario` |
| Login | `POST /api/auth/login` | `email`, `password` | `token`, `usuario` |
| Mi perfil | `GET /api/usuarios/perfil` | Cabecera `Authorization: Bearer <token>` | Usuario con `rol`, `foto_url`, `ubicacion` |
| Editar perfil | `PUT /api/usuarios/perfil` | `nombre_usuario` y/o `ubicacion` | `message`, `usuario` |
| Foto de perfil | `PUT /api/usuarios/perfil/foto` | FormData con archivo `foto` | `message`, `usuario` |
| Perfil público | `GET /api/usuarios/:idUsuario/publico` | Id en la URL | Usuario público, sin email |

**Importante para el equipo:**

- La propiedad de la contraseña en los cuerpos de registro y login se llama `password`, **no** `password_hash`. El hash se genera dentro del backend.
- El registro es `/api/auth/registro`, no `/api/auth/register`.
- La respuesta de registro y login trae `usuario`, no `user`.
- El rol del usuario se llama `rol`. Valores posibles: `usuario`, `moderador`, `administrador`.
- `GET /api/usuarios/perfil` devuelve directamente el usuario, mientras que el `PUT` devuelve `{ message, usuario }`.
- Las rutas protegidas necesitan el token; los permisos de cada operación deben verificarse también en el backend, no solo ocultando enlaces del menú.
- La ruta `/uploads/...` se sirve desde el backend. En desarrollo puede utilizarse el proxy de Angular, que también está configurado para `/api`.

## Artículos, categorías, fotos y búsqueda (Sprint 2)

Resumen de las rutas del sprint 2. El detalle de cada una está en las secciones siguientes.

| Método y URL | Qué hace | Quién |
|---|---|---|
| `GET /api/categorias` | Listar categorías | Todos |
| `GET /api/articulos?filtros…` | Buscar o listar artículos publicados | Todos |
| `GET /api/articulos/:idArticulo` | Detalle público | Todos |
| `POST /api/articulos` | Crear (como borrador) | Con sesión |
| `PUT /api/articulos/:idArticulo` | Editar | Dueño |
| `DELETE /api/articulos/:idArticulo` | Borrar | Dueño |
| `PATCH /api/articulos/:idArticulo/publicar` | Publicar | Dueño |
| `PATCH /api/articulos/:idArticulo/vendido` | Marcar como vendido | Dueño |
| `GET /api/usuarios/perfil/articulos` | Mis artículos, en todos los estados | Con sesión |
| `GET /api/usuarios/perfil/articulos/:idArticulo` | Un artículo mío, en cualquier estado | Dueño |
| `POST /api/fotos/articulo/:idArticulo` | Subir fotos | Dueño |
| `DELETE /api/fotos/:idFoto` | Borrar una foto | Dueño |

Los artículos de un vendedor en su perfil público usan el listado con un filtro: `GET /api/articulos?id_vendedor=4`.

Notas:
- No hay `/api/busqueda`: buscar es listar la colección de artículos con filtros, `GET /api/articulos?…`.
- «Mis artículos» cuelga del perfil, igual que `/api/usuarios/perfil`.
- Cada artículo tiene como máximo **5 fotos**, de 2 MB cada una (jpg, png o webp).

## Objetos de artículo que devuelve la API

**Artículo en un listado** (tarjeta):
```json
{
    "id": 7,
    "titulo": "Anillo de plata con circonita",
    "precio": 45,
    "estado_conservacion": "como_nuevo",
    "estado": "publicado",
    "ubicacion": "Madrid",
    "foto_portada": "/uploads/1731400000-anillo.jpg",
    "vendedor": { "id": 4, "nombre_usuario": "anagl" }
}
```
`foto_portada` es `null` si el artículo no tiene fotos.

**Artículo completo** (detalle):
```json
{
    "id": 7,
    "titulo": "Anillo de plata con circonita",
    "descripcion": "Talla 14, plata de ley 925. Usado dos veces.",
    "precio": 45,
    "estado_conservacion": "como_nuevo",
    "estado": "publicado",
    "ubicacion": "Madrid",
    "categoria": { "id": 1, "nombre": "Anillos" },
    "vendedor": { "id": 4, "nombre_usuario": "anagl", "foto_url": null, "ubicacion": "Madrid" },
    "fotos": [
        { "id": 12, "url": "/uploads/1731400000-anillo.jpg", "posicion": 0 },
        { "id": 13, "url": "/uploads/1731400001-anillo2.jpg", "posicion": 1 }
    ],
    "fecha_creacion": "2026-11-16T10:00:00.000Z",
    "fecha_actualizacion": "2026-11-16T10:05:00.000Z"
}
```
La foto con `posicion` 0 es la portada.

Valores posibles:
- `estado_conservacion`: `nuevo`, `como_nuevo`, `buen_estado`, `aceptable`
- `estado`: `borrador`, `publicado`, `en_revision`, `retirado`, `vendido`

## Categorías

### Listar categorías

Method: GET
Url: /api/categorias
Headers: -
Body: -

Response (200):
```json
[
    { "id": 1, "nombre": "Anillos" },
    { "id": 2, "nombre": "Collares" }
]
```

## Artículos

### Buscar artículos

Method: GET
Url: /api/articulos
Headers: -

Parámetros de la URL, todos opcionales:
- `q`: texto a buscar en título, descripción y categoría
- `id_categoria`
- `precio_min` y `precio_max`
- `estado_conservacion`
- `ubicacion`: busca la ciudad dentro del texto de ubicación
- `id_vendedor`: solo los artículos de ese usuario (para su perfil público)
- `orden`: `recientes` (por defecto), `precio_asc` o `precio_desc`
- `pagina`: empieza en 1 (por defecto 1)
- `por_pagina`: por defecto 12, como máximo 48

Ejemplo: `/api/articulos?q=anillo&id_categoria=1&precio_max=100&orden=precio_asc&pagina=2`

Solo devuelve artículos publicados. Sin parámetros, devuelve los más recientes (la página de inicio).

Response (200):
```json
{
    "articulos": [ "...artículos en formato tarjeta..." ],
    "total": 37,
    "pagina": 2,
    "por_pagina": 12
}
```

Errores:
- 400: algún parámetro no es válido (precio no numérico, orden desconocido…)

### Detalle de un artículo

Method: GET
Url: /api/articulos/:idArticulo
Headers: -

Response (200): el artículo completo.

Errores:
- 404: no existe, o no está publicado ni vendido (los borradores y los retirados solo los ve su dueño, con la ruta de su perfil)

### Crear un artículo

Method: POST
Url: /api/articulos
Headers: Authorization: Bearer <token>
Body:
```json
{
    "titulo": "Anillo de plata con circonita",
    "descripcion": "Talla 14, plata de ley 925. Usado dos veces.",
    "precio": 45,
    "id_categoria": 1,
    "estado_conservacion": "como_nuevo",
    "ubicacion": "Madrid"
}
```
`ubicacion` es opcional: si no llega, se usa la del perfil del usuario. El artículo se crea como `borrador`. Las fotos se suben después, con su propio endpoint.

Response (201): el artículo completo.

Errores:
- 400: faltan campos, el título tiene más de 120 caracteres, el precio es negativo, la categoría no existe o el estado de conservación no es válido
- 401: sin token

### Editar un artículo

Method: PUT
Url: /api/articulos/:idArticulo
Headers: Authorization: Bearer <token>
Body: los mismos campos que al crear.

Response (200): el artículo completo actualizado.

Errores:
- 400: datos no válidos (como al crear)
- 403: el artículo no es tuyo
- 404: el artículo no existe
- 409: el artículo está en revisión, retirado o vendido y ya no se puede editar

### Borrar un artículo

Method: DELETE
Url: /api/articulos/:idArticulo
Headers: Authorization: Bearer <token>

Response (200):
```json
{ "message": "Artículo borrado" }
```

Errores:
- 403: el artículo no es tuyo
- 404: el artículo no existe
- 409: el artículo tiene reportes o está en revisión y no se puede borrar

### Publicar un artículo

Method: PATCH
Url: /api/articulos/:idArticulo/publicar
Headers: Authorization: Bearer <token>

Pasa el artículo de `borrador` a `publicado`.

Response (200): el artículo completo.

Errores:
- 403: el artículo no es tuyo
- 404: el artículo no existe
- 409: el artículo no está en borrador, o no tiene ninguna foto

### Marcar como vendido

Method: PATCH
Url: /api/articulos/:idArticulo/vendido
Headers: Authorization: Bearer <token>

Pasa el artículo de `publicado` a `vendido`.

Response (200): el artículo completo.

Errores:
- 403: el artículo no es tuyo
- 404: el artículo no existe
- 409: el artículo no está publicado

## Mis artículos (en el perfil)

### Mis artículos

Method: GET
Url: /api/usuarios/perfil/articulos
Headers: Authorization: Bearer <token>

Response (200): array de artículos en formato tarjeta, en todos los estados, del más reciente al más antiguo.

### Un artículo mío (para editarlo)

Method: GET
Url: /api/usuarios/perfil/articulos/:idArticulo
Headers: Authorization: Bearer <token>

Response (200): el artículo completo, en cualquier estado.

Errores:
- 403: el artículo no es tuyo
- 404: el artículo no existe

## Fotos

### Subir fotos a un artículo

Method: POST
Url: /api/fotos/articulo/:idArticulo
Headers: Authorization: Bearer <token>
Body: `multipart/form-data` con uno o varios archivos en el campo `fotos`. Formatos jpg, png o webp, de 2 MB como máximo cada uno.

Las fotos se colocan detrás de las que ya hay. Si el artículo no tenía ninguna, la primera pasa a ser la portada.

Response (201): todas las fotos del artículo.
```json
[
    { "id": 12, "url": "/uploads/1731400000-anillo.jpg", "posicion": 0 }
]
```

Errores:
- 400: no llega ningún archivo, o algún archivo no es una imagen válida o pasa de 2 MB
- 403: el artículo no es tuyo
- 404: el artículo no existe
- 409: el artículo superaría las 5 fotos

### Borrar una foto

Method: DELETE
Url: /api/fotos/:idFoto
Headers: Authorization: Bearer <token>

Si se borra la portada, la siguiente foto pasa a ser la portada.

Response (200): las fotos que le quedan al artículo.

Errores:
- 403: la foto es de un artículo que no es tuyo
- 404: la foto no existe

## Módulos todavía pendientes

En el código recibido hay routers de Express creados para estos módulos, pero **no contienen endpoints** todavía:

| Módulo | Prefijo previsto en el backend | Estado en el ZIP recibido |
| --- | --- | --- |
| Artículos | `/api/articulos` | Sprint 2: contrato definido arriba |
| Categorías | `/api/categorias` | Sprint 2: contrato definido arriba |
| Fotos de artículos | `/api/fotos` | Sprint 2: contrato definido arriba |
| Búsqueda | — | Se elimina: la búsqueda es `GET /api/articulos` con filtros |
| Conversaciones | `/api/conversaciones` | Router vacío |
| Mensajes | `/api/mensajes` | Router vacío |
| Notificaciones | `/api/notificaciones` | Router vacío |
| Reportes | `/api/reportes` | Router vacío |
| Moderación | `/api/moderacion` | Router vacío |
| Administración | `/api/admin` | Router vacío |

Cuando cada responsable implemente un endpoint, añadirá en este documento **Method, Url, Headers, Body, Response y Errores**, igual que los ejemplos de Auth y Usuarios. No hay que inventar rutas ni respuestas mientras sigan pendientes.

## Prueba manual rápida

Con el backend en marcha (`localhost:3000`) y después de ejecutar `db/schema.sql` y `db/seed.sql`:

```bash
# Iniciar sesión con una cuenta de prueba (rol usuario)
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@test.com","password":"12345678"}'
```

El resultado debe incluir `token` y `usuario`. Después hay que copiar el token de la respuesta:

```bash
curl http://localhost:3000/api/usuarios/perfil \
  -H 'Authorization: Bearer PEGA_AQUI_EL_TOKEN'
```

También hay cuentas sembradas para `moderador@test.com` y `admin@test.com` (misma contraseña de pruebas). El registro público crea usuarios con rol `usuario`; los otros dos roles se prueban con las cuentas de `db/seed.sql`.

El script `scripts/smoke-api.mjs` automatiza estas llamadas cuando se dispone de MySQL y el servidor en marcha.

## Notas de implementación: búsqueda (Sprint 2, Adel)

**Method:** GET
**Url:** `/api/articulos`
**Headers:** no requiere sesión
**Body:** ninguno

La ruta permite listar únicamente los artículos con `estado = 'publicado'`.
Está montada en `articulos.routes.js`, no existe una ruta separada `/api/busqueda`.

| Parámetro | Tipo y valores admitidos | Por defecto |
| --- | --- | --- |
| `q` | Texto de hasta 120 caracteres; máximo 10 palabras | Sin filtro |
| `id_categoria` | Entero positivo | Sin filtro |
| `precio_min` / `precio_max` | Números entre 0 y 99999999.99, con hasta 2 decimales | Sin filtro |
| `estado_conservacion` | `nuevo`, `como_nuevo`, `buen_estado`, `aceptable` | Sin filtro |
| `ubicacion` | Texto de hasta 100 caracteres | Sin filtro |
| `id_vendedor` | Entero positivo | Sin filtro |
| `orden` | `recientes`, `precio_asc`, `precio_desc` | `recientes` |
| `pagina` | Entero de 1 a 1000000 | 1 |
| `por_pagina` | Entero de 1 a 48 | 12 |

Las palabras de `q` se buscan en **título, descripción y nombre de categoría**.
Para hacer coincidir algunos plurales se quita `es` o `s` al final de cada palabra:
`collares` busca `collar` y `anillos` busca `anillo`.
Si se buscan varias palabras, el artículo debe coincidir con todas ellas (pueden estar en distintos campos).

La búsqueda usa parámetros SQL (`?`) para todos los datos del usuario.
El orden se elige únicamente entre tres columnas predefinidas, nunca con texto libre.
Los resultados con el mismo precio se ordenan también por id, para que la paginación sea estable.

**Response (200):**
```json
{
  "articulos": [
    {
      "id": 1,
      "titulo": "Anillo de plata con circonita",
      "precio": 45,
      "estado_conservacion": "como_nuevo",
      "estado": "publicado",
      "ubicacion": "Madrid",
      "foto_portada": "/uploads/seed-01.jpg",
      "vendedor": { "id": 5, "nombre_usuario": "ana_joyas" }
    }
  ],
  "total": 1,
  "pagina": 1,
  "por_pagina": 12
}
```
`precio` se envía como número, no como cadena. Si no hay resultados, `articulos` es un array vacío y `total` es 0.

**Errores:**
- 400: cualquier filtro inválido, por ejemplo `orden=otro`, `pagina=0`, `por_pagina=49`, `precio_min=abc`, valores duplicados o `precio_min > precio_max`.
- 500: error interno o de base de datos (manejado por Express).

**Fotos de artículos:** se permiten **5 imágenes como máximo por artículo**, de **2 MB cada una**.
Formatos: JPG, PNG y WEBP; campo del formulario: `fotos`.
Las imágenes de muestra del seed se guardan en `db/fotos-seed/`; para mostrarlas se copian a `uploads/` siguiendo el README.

Para probar los filtros y sus errores, usar `requests/busqueda.http`.
Para el recorrido completo (crear borrador → subir foto → publicar → buscar → detalle → vender → borrar), usar las rutas documentadas en Artículos y Fotos y una base de datos de prueba.
