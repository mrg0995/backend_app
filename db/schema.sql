-- =========================================================
-- Proyecto Final · Plataforma de compraventa de segunda mano
-- schema.sql · Crea la base de datos y todas las tablas
-- =========================================================

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS segunda_mano;
CREATE DATABASE segunda_mano CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE segunda_mano;

-- ---------------------------------------------------------
-- Parte A · Usuarios y categorías
-- ---------------------------------------------------------

CREATE TABLE usuario (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  nombre_usuario  VARCHAR(50)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  foto_url        VARCHAR(255) NULL,
  ubicacion       VARCHAR(100) NULL,
  rol             ENUM('usuario','moderador','administrador') NOT NULL DEFAULT 'usuario',
  bloqueado       BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado       BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categoria (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(80) NOT NULL UNIQUE,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Parte B · Artículos y fotos
-- ---------------------------------------------------------

CREATE TABLE articulo (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario           INT NOT NULL,
  id_categoria         INT NOT NULL,
  titulo               VARCHAR(120) NOT NULL,
  descripcion          TEXT NOT NULL,
  precio               DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  estado_conservacion  ENUM('nuevo','como_nuevo','buen_estado','aceptable') NOT NULL,
  estado               ENUM('borrador','publicado','en_revision','retirado','vendido') NOT NULL DEFAULT 'borrador',
  ubicacion            VARCHAR(100) NULL,
  fecha_creacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articulo_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuario(id),
  CONSTRAINT fk_articulo_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id),
  INDEX idx_articulo_estado    (estado),
  INDEX idx_articulo_categoria (id_categoria),
  INDEX idx_articulo_precio    (precio)
);

CREATE TABLE foto_articulo (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  id_articulo  INT NOT NULL,
  url          VARCHAR(255) NOT NULL,
  posicion     TINYINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_foto_articulo FOREIGN KEY (id_articulo) REFERENCES articulo(id) ON DELETE CASCADE,
  CONSTRAINT uq_foto_posicion UNIQUE (id_articulo, posicion)
);

-- ---------------------------------------------------------
-- Parte C · Mensajería
-- ---------------------------------------------------------

CREATE TABLE conversacion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_articulo     INT NOT NULL,
  id_comprador    INT NOT NULL,
  id_vendedor     INT NOT NULL,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversacion_articulo  FOREIGN KEY (id_articulo)  REFERENCES articulo(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversacion_comprador FOREIGN KEY (id_comprador) REFERENCES usuario(id),
  CONSTRAINT fk_conversacion_vendedor  FOREIGN KEY (id_vendedor)  REFERENCES usuario(id),
  CONSTRAINT uq_conversacion UNIQUE (id_articulo, id_comprador),
  CONSTRAINT chk_conversacion_distintos CHECK (id_comprador <> id_vendedor)
);

CREATE TABLE mensaje (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  id_conversacion  INT NOT NULL,
  id_emisor        INT NOT NULL,
  texto            TEXT NOT NULL,
  leido            BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mensaje_conversacion FOREIGN KEY (id_conversacion) REFERENCES conversacion(id) ON DELETE CASCADE,
  CONSTRAINT fk_mensaje_emisor       FOREIGN KEY (id_emisor)       REFERENCES usuario(id),
  INDEX idx_mensaje_conversacion (id_conversacion, fecha_creacion)
);

-- ---------------------------------------------------------
-- Parte D · Moderación y notificaciones
-- ---------------------------------------------------------

CREATE TABLE reporte (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  id_denunciante        INT NOT NULL,
  tipo                  ENUM('articulo','usuario','conversacion') NOT NULL,
  id_articulo           INT NULL,
  id_usuario_reportado  INT NULL,
  id_conversacion       INT NULL,
  motivo                VARCHAR(255) NOT NULL,
  estado                ENUM('pendiente','resuelto') NOT NULL DEFAULT 'pendiente',
  fecha_creacion        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reporte_denunciante  FOREIGN KEY (id_denunciante)       REFERENCES usuario(id),
  CONSTRAINT fk_reporte_articulo     FOREIGN KEY (id_articulo)          REFERENCES articulo(id),
  CONSTRAINT fk_reporte_usuario      FOREIGN KEY (id_usuario_reportado) REFERENCES usuario(id),
  CONSTRAINT fk_reporte_conversacion FOREIGN KEY (id_conversacion)      REFERENCES conversacion(id),
  CONSTRAINT chk_reporte_destino CHECK (
       (tipo = 'articulo'     AND id_articulo IS NOT NULL AND id_usuario_reportado IS NULL     AND id_conversacion IS NULL)
    OR (tipo = 'usuario'      AND id_articulo IS NULL     AND id_usuario_reportado IS NOT NULL AND id_conversacion IS NULL)
    OR (tipo = 'conversacion' AND id_articulo IS NULL     AND id_usuario_reportado IS NULL     AND id_conversacion IS NOT NULL)
  ),
  INDEX idx_reporte_estado (estado)
);

CREATE TABLE accion_moderacion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte      INT NOT NULL,
  id_moderador    INT NOT NULL,
  accion          ENUM('mantener','retirar','avisar_usuario','bloquear_usuario') NOT NULL,
  comentario      TEXT NOT NULL,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_accion_reporte   FOREIGN KEY (id_reporte)   REFERENCES reporte(id),
  CONSTRAINT fk_accion_moderador FOREIGN KEY (id_moderador) REFERENCES usuario(id)
);

CREATE TABLE notificacion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL,
  tipo            ENUM('moderacion','cambio_estado','mensaje') NOT NULL,
  texto           VARCHAR(255) NOT NULL,
  enlace          VARCHAR(255) NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
  INDEX idx_notificacion_usuario (id_usuario, leida)
);

-- ---------------------------------------------------------
-- Deseables (opcionales: se activan si nos da tiempo)
-- ---------------------------------------------------------
-- CREATE TABLE favorito (
--   id_usuario      INT NOT NULL,
--   id_articulo     INT NOT NULL,
--   fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (id_usuario, id_articulo),
--   FOREIGN KEY (id_usuario)  REFERENCES usuario(id),
--   FOREIGN KEY (id_articulo) REFERENCES articulo(id) ON DELETE CASCADE
-- );
--
-- CREATE TABLE valoracion (
--   id              INT AUTO_INCREMENT PRIMARY KEY,
--   id_autor        INT NOT NULL,
--   id_valorado     INT NOT NULL,
--   id_articulo     INT NOT NULL,
--   puntuacion      TINYINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
--   comentario      VARCHAR(255) NULL,
--   fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE (id_autor, id_articulo),
--   FOREIGN KEY (id_autor)    REFERENCES usuario(id),
--   FOREIGN KEY (id_valorado) REFERENCES usuario(id),
--   FOREIGN KEY (id_articulo) REFERENCES articulo(id)
-- );