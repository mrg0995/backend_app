-- =========================================================
-- seed.sql · Datos de prueba
-- Ejecutar DESPUÉS de schema.sql
-- Contraseña de todos los usuarios de prueba: 12345678
-- =========================================================

SET NAMES utf8mb4;
USE segunda_mano;

-- Hash bcrypt de "12345678" (10 rondas)
SET @pwd = '$2a$10$H9R6RZiupDZfrsLBJKkDVucwcanWHOZNsEamg2lfJrFT6oQSRidg2';

-- ---------------------------------------------------------
-- Usuarios: uno de cada rol y uno bloqueado para pruebas
-- ---------------------------------------------------------
INSERT INTO usuario (nombre_usuario, email, password_hash, ubicacion, rol, bloqueado) VALUES
  ('admin',     'admin@test.com',     @pwd, 'Madrid',    'administrador', FALSE),
  ('moderador', 'moderador@test.com', @pwd, 'Valencia',  'moderador',     FALSE),
  ('usuario',   'usuario@test.com',   @pwd, 'Sevilla',   'usuario',       FALSE),
  ('bloqueado', 'bloqueado@test.com', @pwd, 'Bilbao',    'usuario',       TRUE);

-- ---------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------
INSERT INTO categoria (nombre) VALUES
  ('Anillos'),
  ('Collares'),
  ('Pendientes'),
  ('Pulseras'),
  ('Otros');

-- ---------------------------------------------------------
-- Sprint 2 (Adel): usuarios vendedores y 15 joyas de ejemplo
-- Las fotos se copian de db/fotos-seed/ a uploads/ (ver README).
-- ---------------------------------------------------------
INSERT INTO usuario (nombre_usuario, email, password_hash, ubicacion, rol) VALUES
  ('ana_joyas',  'ana.joyas@test.com',  @pwd, 'Madrid',    'usuario'),
  ('luis_joyas', 'luis.joyas@test.com', @pwd, 'Sevilla',   'usuario'),
  ('sara_joyas', 'sara.joyas@test.com', @pwd, 'Valencia', 'usuario');

SET @ana = (SELECT id FROM usuario WHERE nombre_usuario = 'ana_joyas');
SET @luis = (SELECT id FROM usuario WHERE nombre_usuario = 'luis_joyas');
SET @sara = (SELECT id FROM usuario WHERE nombre_usuario = 'sara_joyas');

INSERT INTO articulo
  (id_usuario, id_categoria, titulo, descripcion, precio, estado_conservacion, estado, ubicacion)
VALUES
  (@ana,  1, 'Anillo de plata con circonita',       'Plata de ley 925, talla 14, usado un par de veces.',             45.00,  'como_nuevo',  'publicado', 'Madrid'),
  (@luis, 2, 'Collar de perlas cultivadas',         'Collar de 45 cm, con cierre de plata.',                           120.50, 'buen_estado', 'publicado', 'Sevilla'),
  (@sara, 3, 'Pendientes de aro dorados',           'Pendientes nuevos, ligeros y sin estrenar.',                      18.00,  'nuevo',       'publicado', 'Valencia'),
  (@ana,  4, 'Pulsera de cuero y plata',            'Pulsera trenzada con cierre metálico.',                           25.00,  'buen_estado', 'publicado', 'Madrid'),
  (@luis, 1, 'Sortija de oro 18k',                  'Sortija clásica de oro, con marcas normales de uso.',            280.00, 'como_nuevo',  'publicado', 'Bilbao'),
  (@sara, 5, 'Broche vintage de flor',              'Broche antiguo con forma de flor, pequeñas señales de uso.',      35.00,  'aceptable',   'publicado', 'Granada'),
  (@ana,  2, 'Gargantilla de plata',                'Gargantilla sencilla para uso diario.',                           40.00,  'nuevo',       'publicado', 'Madrid'),
  (@luis, 3, 'Pendientes de perla',                 'Pendientes con perla blanca y cierre de presión.',               55.00,  'como_nuevo',  'publicado', 'Barcelona'),
  (@sara, 1, 'Alianza de plata',                    'Anillo liso de plata, talla 16.',                                 30.00,  'buen_estado', 'publicado', 'Sevilla'),
  (@ana,  4, 'Pulsera de charms',                   'Pulsera con tres colgantes en buen estado.',                      60.00,  'buen_estado', 'publicado', 'Valencia'),
  (@sara, 2, 'Colgante de corazón',                 'Collar con colgante pequeño de corazón.',                         22.00,  'nuevo',       'publicado', 'Madrid'),
  (@ana,  1, 'Anillo ajustable con piedra azul',    'Anillo ajustable con piedra decorativa azul.',                    15.00,  'como_nuevo',  'publicado', 'Málaga'),
  (@luis, 3, 'Pendientes largos de cristal',        'Pendientes de cristal para ocasiones especiales.',               28.00,  'buen_estado', 'publicado', 'Bilbao'),
  (@sara, 4, 'Esclava de oro',                      'Esclava de oro con cierre de seguridad (ya vendida).',          320.00, 'buen_estado', 'vendido',   'Barcelona'),
  (@luis, 5, 'Reloj de bolsillo antiguo',          'Reloj decorativo para restaurar (todavía en borrador).',         150.00, 'aceptable',   'borrador', 'Zaragoza');

-- Una foto de portada por artículo. Son imágenes ilustrativas de prueba.
-- El enlace será válido después de copiar los archivos a uploads/.
INSERT INTO foto_articulo (id_articulo, url, posicion)
SELECT a.id,
  CASE a.titulo
    WHEN 'Anillo de plata con circonita' THEN '/uploads/seed-01.jpg'
    WHEN 'Collar de perlas cultivadas' THEN '/uploads/seed-02.jpg'
    WHEN 'Pendientes de aro dorados' THEN '/uploads/seed-03.jpg'
    WHEN 'Pulsera de cuero y plata' THEN '/uploads/seed-04.jpg'
    WHEN 'Sortija de oro 18k' THEN '/uploads/seed-05.jpg'
    WHEN 'Broche vintage de flor' THEN '/uploads/seed-06.jpg'
    WHEN 'Gargantilla de plata' THEN '/uploads/seed-07.jpg'
    WHEN 'Pendientes de perla' THEN '/uploads/seed-08.jpg'
    WHEN 'Alianza de plata' THEN '/uploads/seed-09.jpg'
    WHEN 'Pulsera de charms' THEN '/uploads/seed-10.jpg'
    WHEN 'Colgante de corazón' THEN '/uploads/seed-11.jpg'
    WHEN 'Anillo ajustable con piedra azul' THEN '/uploads/seed-12.jpg'
    WHEN 'Pendientes largos de cristal' THEN '/uploads/seed-13.jpg'
    WHEN 'Esclava de oro' THEN '/uploads/seed-14.jpg'
    WHEN 'Reloj de bolsillo antiguo' THEN '/uploads/seed-15.jpg'
  END,
  0
FROM articulo a
WHERE a.id_usuario IN (@ana, @luis, @sara);


-- ---------------------------------------------------------
-- Sprint 3 (Mariel): conversaciones, mensajes y notificaciones
-- Tres conversaciones con mensajes leídos y sin leer, y avisos de prueba.
-- No hay ninguna de usuario@test.com sobre el artículo 1: la usan
-- requests/conversaciones.http y scripts/prueba-mensajes.mjs para crearla.
--
-- Al cargar el seed, quedan sin leer:
--   ana_joyas:  1 mensaje y 1 notificación
--   usuario:    2 mensajes
--   luis_joyas: 1 notificación
-- ---------------------------------------------------------
SET @usuario = (SELECT id FROM usuario WHERE nombre_usuario = 'usuario');
SET @pulsera = (SELECT id FROM articulo WHERE titulo = 'Pulsera de cuero y plata');
SET @collar  = (SELECT id FROM articulo WHERE titulo = 'Collar de perlas cultivadas');
SET @esclava = (SELECT id FROM articulo WHERE titulo = 'Esclava de oro');

-- 1. luis_joyas pregunta a ana_joyas por la pulsera. El último mensaje, ana no lo ha leído.
INSERT INTO conversacion (id_articulo, id_comprador, id_vendedor, fecha_creacion)
VALUES (@pulsera, @luis, @ana, NOW() - INTERVAL 3 DAY);
SET @conv1 = LAST_INSERT_ID();

INSERT INTO mensaje (id_conversacion, id_emisor, texto, leido, fecha_creacion) VALUES
  (@conv1, @luis, 'Buenas, ¿la pulsera es ajustable?',          TRUE,  NOW() - INTERVAL 3 DAY),
  (@conv1, @ana,  'Sí, el cierre tiene dos posiciones.',         TRUE,  NOW() - INTERVAL 3 DAY + INTERVAL 2 HOUR),
  (@conv1, @luis, '¡Genial! ¿Podrías enviarla a Sevilla?',       FALSE, NOW() - INTERVAL 2 HOUR);

-- 2. usuario pregunta a luis_joyas por el collar. Las dos respuestas de luis están sin leer.
INSERT INTO conversacion (id_articulo, id_comprador, id_vendedor, fecha_creacion)
VALUES (@collar, @usuario, @luis, NOW() - INTERVAL 1 DAY);
SET @conv2 = LAST_INSERT_ID();

INSERT INTO mensaje (id_conversacion, id_emisor, texto, leido, fecha_creacion) VALUES
  (@conv2, @usuario, 'Hola, ¿las perlas son naturales?',            TRUE,  NOW() - INTERVAL 1 DAY),
  (@conv2, @luis,    'Son cultivadas y vienen con su certificado.', FALSE, NOW() - INTERVAL 30 MINUTE),
  (@conv2, @luis,    'Si te interesa, te hago buen precio.',        FALSE, NOW() - INTERVAL 25 MINUTE);

-- 3. ana_joyas preguntó a sara_joyas por la esclava, que después se vendió. Todo leído.
INSERT INTO conversacion (id_articulo, id_comprador, id_vendedor, fecha_creacion)
VALUES (@esclava, @ana, @sara, NOW() - INTERVAL 6 DAY);
SET @conv3 = LAST_INSERT_ID();

INSERT INTO mensaje (id_conversacion, id_emisor, texto, leido, fecha_creacion) VALUES
  (@conv3, @ana,  'Hola, ¿la esclava lleva algún grabado?',              TRUE, NOW() - INTERVAL 6 DAY),
  (@conv3, @sara, 'No, es lisa. Ya la tengo reservada, lo siento.',      TRUE, NOW() - INTERVAL 5 DAY);

-- Notificaciones: las que habría creado crearNotificacion en cada caso.
INSERT INTO notificacion (id_usuario, tipo, texto, enlace, leida, fecha_creacion) VALUES
  (@sara, 'mensaje',       'ana_joyas te ha escrito sobre «Esclava de oro»',            CONCAT('/mensajes/', @conv3),   TRUE,  NOW() - INTERVAL 6 DAY),
  (@ana,  'cambio_estado', '«Esclava de oro» se ha vendido',                            CONCAT('/articulos/', @esclava), FALSE, NOW() - INTERVAL 4 DAY),
  (@ana,  'mensaje',       'luis_joyas te ha escrito sobre «Pulsera de cuero y plata»',  CONCAT('/mensajes/', @conv1),   TRUE,  NOW() - INTERVAL 3 DAY),
  (@luis, 'mensaje',       'usuario te ha escrito sobre «Collar de perlas cultivadas»', CONCAT('/mensajes/', @conv2),   FALSE, NOW() - INTERVAL 1 DAY);