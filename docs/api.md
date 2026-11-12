# API · Documentación de endpoints

Base: `http://localhost:3000/api`

Los errores siempre devuelven `{ "message": "..." }`.

Las rutas protegidas necesitan la cabecera `Authorization: Bearer <token>`. Sin token devuelven 401, y con un rol sin permiso, 403.

## Auth

### Registrar un usuario

Method: POST
Url: /api/auth/registro
Headers: -
Body:
```json
{
    "email": "ana@email.com",
    "nombre_usuario": "anagl",
    "password": "123456",
    "ubicacion": "Madrid"
}
```
`ubicacion` es opcional.

Response (201):
```json
{
    "id": 1,
    "email": "ana@email.com",
    "nombre_usuario": "anagl",
    "foto_url": null,
    "ubicacion": "Madrid",
    "rol": "usuario",
    "fecha_creacion": "2026-11-11T18:00:00.000Z"
}
```
Errores:
- 400: faltan campos obligatorios
- 409: el email o el nombre de usuario ya existen

### Iniciar sesión

Method: POST
Url: /api/auth/login
Headers: -
Body:
```json
{
    "email": "ana@email.com",
    "password": "123456"
}
```

Response (200):
```json
{
    "message": "Login correcto",
    "token": "eyJhbGciOi...",
    "usuario": {
        "id": 1,
        "nombre_usuario": "anagl",
        "rol": "usuario",
        "foto_url": null
    }
}
```
Errores:
- 401: email o contraseña incorrectos
- 403: la cuenta está bloqueada o eliminada

El token caduca a los 7 días y lleva dentro el `id` y el `rol` del usuario.