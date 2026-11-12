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
