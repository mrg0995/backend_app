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

## Módulos todavía pendientes

En el código recibido hay routers de Express creados para estos módulos, pero **no contienen endpoints** todavía:

| Módulo | Prefijo previsto en el backend | Estado en el ZIP recibido |
| --- | --- | --- |
| Artículos | `/api/articulos` | Router vacío |
| Categorías | `/api/categorias` | Router vacío |
| Fotos de artículos | `/api/fotos` | Router vacío |
| Búsqueda | `/api/busqueda` | Router vacío |
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
