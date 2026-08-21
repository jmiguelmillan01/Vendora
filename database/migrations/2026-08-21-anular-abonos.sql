-- ============================================================
-- Migración: permitir anular un abono (igual que las ventas)
-- ============================================================
-- Se corre una sola vez contra la base de datos ya existente. Segura para
-- una tabla con datos reales: DEFAULT 0 no requiere backfill, ninguna fila
-- existente cambia de significado (todas quedan "no anuladas").

USE railway; -- ajustar al nombre real de la base si aplica (local: sistema_ventas)

ALTER TABLE abonos ADD COLUMN anulado TINYINT(1) NOT NULL DEFAULT 0 AFTER observacion;
ALTER TABLE abonos ADD KEY idx_abonos_anulado (anulado);
