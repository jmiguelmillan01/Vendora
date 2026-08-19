-- ============================================================
-- Sistema de ventas, cuentas por cobrar y fiados
-- Script de creación de base de datos (Fase 2)
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_ventas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_ventas;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'empleado') NOT NULL DEFAULT 'admin',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: clientes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  direccion VARCHAR(255) NULL,
  documento VARCHAR(50) NULL,
  observaciones TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_clientes_nombre (nombre),
  KEY idx_clientes_activo (activo),
  KEY idx_clientes_usuario (usuario_id),
  KEY idx_clientes_usuario_activo (usuario_id, activo),
  CONSTRAINT fk_clientes_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: productos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
  precio DECIMAL(12,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_productos_nombre (nombre),
  KEY idx_productos_activo (activo),
  KEY idx_productos_usuario (usuario_id),
  KEY idx_productos_usuario_activo (usuario_id, activo),
  CONSTRAINT fk_productos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: ventas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tipo_pago ENUM('CONTADO', 'CREDITO', 'PARCIAL') NOT NULL,
  estado ENUM('PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_ventas_cliente (cliente_id),
  KEY idx_ventas_fecha (fecha),
  KEY idx_ventas_estado (estado),
  KEY idx_ventas_usuario (usuario_id),
  KEY idx_ventas_usuario_fecha (usuario_id, fecha),
  KEY idx_ventas_usuario_estado (usuario_id, estado),
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_ventas_totales CHECK (subtotal >= 0 AND descuento >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: detalle_venta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_venta (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_detalle_venta_venta (venta_id),
  KEY idx_detalle_venta_producto (producto_id),
  CONSTRAINT fk_detalle_venta_venta FOREIGN KEY (venta_id)
    REFERENCES ventas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (producto_id)
    REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_detalle_venta_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_venta_precio CHECK (precio_unitario >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: abonos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abonos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor DECIMAL(12,2) NOT NULL,
  metodo_pago ENUM('EFECTIVO', 'TRANSFERENCIA', 'OTRO') NOT NULL DEFAULT 'EFECTIVO',
  observacion TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_abonos_cliente (cliente_id),
  KEY idx_abonos_fecha (fecha),
  KEY idx_abonos_usuario (usuario_id),
  KEY idx_abonos_usuario_fecha (usuario_id, fecha),
  CONSTRAINT fk_abonos_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_abonos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_abonos_valor CHECK (valor > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: password_resets
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Datos iniciales
-- ------------------------------------------------------------

-- Usuario administrador por defecto
-- Email: admin@sistema.com
-- Password: admin123  (cámbiala después del primer inicio de sesión)
INSERT INTO usuarios (nombre, email, password, rol, activo)
VALUES (
  'Administrador',
  'admin@sistema.com',
  '$2a$10$QtX3ijpqZGujU9vyDwAxEerx.ueD6L.xfzab2DoGONUwdJrq6eYDi',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE email = email;
