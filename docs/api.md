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