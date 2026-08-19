-- ============================================================
-- Migración: convertir el sistema en multi-tenant
-- ============================================================
-- Este script se corre UNA SOLA VEZ contra la base de datos ya
-- existente (no es idempotente y no forma parte de `npm run db:init`,
-- que solo crea instalaciones nuevas usando database.sql).
--
-- Secuencia segura para una tabla en vivo con datos reales:
-- 1) agregar columna nullable
-- 2) backfill al usuario admin actual
-- 3) verificar manualmente que no quedan NULL
-- 4) bloquear NOT NULL
-- 5) agregar FK + índices
-- ============================================================

USE sistema_ventas;

-- 1) Columnas nullable
ALTER TABLE clientes  ADD COLUMN usuario_id INT UNSIGNED NULL AFTER id;
ALTER TABLE productos ADD COLUMN usuario_id INT UNSIGNED NULL AFTER id;
ALTER TABLE ventas    ADD COLUMN usuario_id INT UNSIGNED NULL AFTER cliente_id;
ALTER TABLE abonos    ADD COLUMN usuario_id INT UNSIGNED NULL AFTER cliente_id;

-- 2) Backfill: todo lo existente pertenece al admin actual
UPDATE clientes  SET usuario_id = (SELECT id FROM usuarios WHERE email = 'admin@sistema.com') WHERE usuario_id IS NULL;
UPDATE productos SET usuario_id = (SELECT id FROM usuarios WHERE email = 'admin@sistema.com') WHERE usuario_id IS NULL;
UPDATE ventas    SET usuario_id = (SELECT id FROM usuarios WHERE email = 'admin@sistema.com') WHERE usuario_id IS NULL;
UPDATE abonos    SET usuario_id = (SELECT id FROM usuarios WHERE email = 'admin@sistema.com') WHERE usuario_id IS NULL;

-- 3) Verificar manualmente antes de continuar:
--    SELECT COUNT(*) FROM clientes  WHERE usuario_id IS NULL; -- debe ser 0
--    SELECT COUNT(*) FROM productos WHERE usuario_id IS NULL; -- debe ser 0
--    SELECT COUNT(*) FROM ventas    WHERE usuario_id IS NULL; -- debe ser 0
--    SELECT COUNT(*) FROM abonos    WHERE usuario_id IS NULL; -- debe ser 0

-- 4) Bloquear NOT NULL
ALTER TABLE clientes  MODIFY usuario_id INT UNSIGNED NOT NULL;
ALTER TABLE productos MODIFY usuario_id INT UNSIGNED NOT NULL;
ALTER TABLE ventas    MODIFY usuario_id INT UNSIGNED NOT NULL;
ALTER TABLE abonos    MODIFY usuario_id INT UNSIGNED NOT NULL;

-- 5) Claves foráneas e índices
ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD KEY idx_clientes_usuario (usuario_id),
  ADD KEY idx_clientes_usuario_activo (usuario_id, activo);

ALTER TABLE productos
  ADD CONSTRAINT fk_productos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD KEY idx_productos_usuario (usuario_id),
  ADD KEY idx_productos_usuario_activo (usuario_id, activo);

ALTER TABLE ventas
  ADD CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD KEY idx_ventas_usuario (usuario_id),
  ADD KEY idx_ventas_usuario_fecha (usuario_id, fecha),
  ADD KEY idx_ventas_usuario_estado (usuario_id, estado);

ALTER TABLE abonos
  ADD CONSTRAINT fk_abonos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD KEY idx_abonos_usuario (usuario_id),
  ADD KEY idx_abonos_usuario_fecha (usuario_id, fecha);

-- 6) Tabla nueva para recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_password_resets_token_hash (token_hash),
  KEY idx_password_resets_usuario (usuario_id),
  CONSTRAINT fk_password_resets_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
