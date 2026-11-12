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