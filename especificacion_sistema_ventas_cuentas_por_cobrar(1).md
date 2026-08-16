# Especificación general — Sistema de ventas, cuentas por cobrar y fiados

## 1. Descripción del proyecto

Desarrollar una aplicación web general para pequeños negocios que permita gestionar clientes, productos o servicios, ventas, ventas a crédito/fiadas, abonos, saldos pendientes y reportes.

El sistema **no debe estar ligado a un tipo de negocio específico**. Debe poder utilizarse, por ejemplo, en restaurantes, tiendas, negocios de comida, minimercados, emprendimientos, servicios u otros comercios.

La aplicación debe permitir registrar una venta para un cliente, indicar si fue pagada completamente o quedó pendiente, registrar pagos posteriores y consultar en todo momento cuánto debe cada cliente.

La arquitectura debe diseñarse para que posteriormente puedan agregarse inventario, gastos, proveedores, usuarios, roles, facturación, reportes avanzados y otras funciones sin tener que rehacer el sistema.

---

# 2. Objetivo principal

Crear un sistema web sencillo, moderno y escalable para controlar:

- Clientes.
- Productos y/o servicios.
- Ventas.
- Ventas de contado.
- Ventas a crédito o fiadas.
- Abonos o pagos parciales.
- Saldos pendientes.
- Historial de movimientos por cliente.
- Reportes diarios, semanales, mensuales y por rangos de fechas.
- Dashboard administrativo.
- Usuarios y autenticación.

La regla principal del sistema es:

> **Saldo pendiente = Total de ventas a crédito - Total de abonos realizados**

El saldo no debe depender de una modificación manual realizada por el usuario.

---

# 3. Tecnologías propuestas

Utilizar el siguiente stack:

## Backend

- Node.js
- Express.js

## Frontend

- HTML5
- CSS3
- JavaScript
- EJS

## Diseño

- Tailwind CSS
- Heroicons o Lucide Icons (opcional para iconografía)

### Requisitos obligatorios de diseño y responsive

Tailwind CSS debe ser el framework principal y obligatorio para todos los estilos de la aplicación.

**No utilizar Bootstrap ni mezclar Bootstrap con Tailwind CSS.**

La interfaz debe desarrollarse siguiendo un enfoque **mobile-first**, de manera que la aplicación funcione correctamente en:

- Celulares.
- Tablets.
- Laptops.
- Computadores de escritorio.
- Monitores de diferentes resoluciones.

El diseño debe adaptarse automáticamente al tamaño de pantalla mediante los breakpoints de Tailwind CSS.

#### Reglas responsive

1. Todas las vistas deben diseñarse primero para pantallas pequeñas y posteriormente ampliarse para tablets y escritorio.
2. No debe existir scroll horizontal innecesario en las páginas.
3. Las tablas deben adaptarse a pantallas pequeñas mediante:
   - Scroll horizontal controlado cuando sea realmente necesario.
   - Ocultamiento de columnas secundarias en tamaños pequeños.
   - Alternativas de presentación mediante cards cuando resulte más usable.
4. Los formularios deben ser cómodos para utilizar desde celulares.
5. Los botones deben tener un área táctil adecuada para dispositivos móviles.
6. Los elementos del dashboard deben reorganizarse automáticamente según el ancho de pantalla.
7. Las tarjetas de estadísticas deben pasar de varias columnas en escritorio a una o dos columnas en dispositivos pequeños.
8. El menú lateral debe comportarse de forma responsive:
   - Sidebar visible en escritorio.
   - Sidebar colapsable o menú tipo drawer en tablets y celulares.
9. Los modales deben adaptarse al tamaño de pantalla.
10. Los gráficos deben ser responsive.
11. Las fuentes, espacios, botones y controles deben mantener una buena legibilidad en celulares.
12. Las páginas no deben depender de anchos fijos que provoquen desbordamientos.
13. Las imágenes deben utilizar tamaños máximos y comportamiento responsive.
14. Los componentes deben aprovechar las clases responsive de Tailwind como `sm:`, `md:`, `lg:`, `xl:` y `2xl:` cuando corresponda.
15. Las vistas deben probarse visualmente en diferentes tamaños antes de considerarse terminadas.

#### Experiencia de usuario móvil

La aplicación debe ser especialmente cómoda para tareas frecuentes desde un celular, por ejemplo:

- Buscar un cliente.
- Consultar cuánto debe.
- Registrar una venta.
- Registrar un abono.
- Consultar el historial.
- Revisar el dashboard.
- Buscar un producto.

Los elementos más utilizados deben estar fácilmente accesibles y no requerir demasiados pasos.

#### Componentes visuales

Crear componentes reutilizables utilizando Tailwind CSS para:

- Botones.
- Inputs.
- Selects.
- Formularios.
- Cards.
- Tablas.
- Badges.
- Alertas.
- Modales.
- Dropdowns.
- Sidebar.
- Navbar.
- Breadcrumbs.
- Paginación.
- Estados de carga.
- Mensajes de error.
- Mensajes de éxito.

La interfaz debe mantener una apariencia visual consistente en todas las páginas.

## Base de datos

- MySQL

## Autenticación

- express-session
- bcryptjs

## Gráficos

- Chart.js

## Comunicación con base de datos

Se puede utilizar `mysql2`.

---

# 4. Principios de desarrollo

El código debe cumplir los siguientes principios:

1. Código organizado y modular.
2. Separación entre rutas, controladores, modelos y vistas.
3. Validación tanto en frontend como backend.
4. Consultas SQL parametrizadas.
5. Contraseñas almacenadas mediante hash.
6. Protección de rutas privadas mediante sesiones.
7. Manejo correcto de errores.
8. Evitar duplicación innecesaria de código.
9. Nombres de variables, funciones y archivos claros.
10. Código preparado para futuras ampliaciones.
11. La información financiera debe conservar un historial confiable.
12. No eliminar información histórica de ventas o pagos de forma destructiva.
13. Utilizar transacciones de base de datos cuando una operación involucre múltiples inserciones o actualizaciones relacionadas.

---

# 5. Módulos principales

La primera versión debe contener:

1. Autenticación.
2. Dashboard.
3. Clientes.
4. Productos/servicios.
5. Ventas.
6. Abonos.
7. Estado de cuenta del cliente.
8. Historial de movimientos.
9. Reportes.
10. Configuración básica.

---

# 6. Autenticación

Debe existir una pantalla de inicio de sesión.

Campos:

- Correo electrónico.
- Contraseña.

Funciones:

- Iniciar sesión.
- Cerrar sesión.
- Mantener sesión mediante `express-session`.
- Proteger las rutas administrativas.
- Almacenar contraseñas usando `bcryptjs`.

Posteriormente se podrán agregar:

- Recuperación de contraseña.
- Roles.
- Administradores.
- Empleados.
- Permisos.

---

# 7. Dashboard

Después del inicio de sesión se debe mostrar un panel administrativo.

Debe mostrar como mínimo:

### Indicadores

- Ventas del día.
- Ventas del mes.
- Ventas a crédito.
- Abonos recibidos.
- Total pendiente por cobrar.
- Cantidad de clientes.
- Cantidad de clientes con deuda.

### Información adicional

- Ventas recientes.
- Abonos recientes.
- Clientes con mayor deuda.
- Productos/servicios más vendidos.
- Resumen de ventas por día.

### Gráficos

Utilizar Chart.js para mostrar:

- Ventas por día.
- Ventas por mes.
- Créditos/fiados por período.
- Abonos por período.
- Productos/servicios más vendidos.

El dashboard debe permitir seleccionar un rango de fechas cuando sea necesario.

---

# 8. Gestión de clientes

Crear un módulo llamado `Clientes`.

Funciones:

- Listar clientes.
- Crear cliente.
- Editar cliente.
- Consultar cliente.
- Buscar cliente.
- Activar/desactivar cliente.
- Consultar saldo pendiente.
- Consultar historial.

Campos sugeridos:

- ID.
- Nombre completo.
- Teléfono.
- Correo electrónico.
- Dirección.
- Documento o identificación (opcional).
- Observaciones.
- Estado.
- Fecha de creación.
- Fecha de actualización.

No todos los campos deben ser obligatorios.

---

# 9. Gestión de productos o servicios

El sistema debe utilizar un concepto general de `productos/servicios`, evitando nombres específicos de una industria.

Ejemplos:

- Producto físico.
- Bebida.
- Comida.
- Servicio.
- Accesorio.
- Artículo de tienda.

Campos:

- ID.
- Nombre.
- Descripción.
- Precio.
- Tipo: producto o servicio.
- Estado.
- Fecha de creación.
- Fecha de actualización.

Funciones:

- Crear.
- Editar.
- Consultar.
- Activar/desactivar.
- Buscar.
- Filtrar.

---

# 10. Regla importante sobre precios históricos

Cuando se registre una venta, el sistema debe guardar el precio que tenía el producto/servicio en el momento de la venta.

Por ejemplo:

Producto:

`Producto A`

Precio actual:

`$10.000`

Venta realizada:

`2 × $10.000 = $20.000`

Posteriormente el precio cambia a:

`$12.000`

La venta anterior debe continuar mostrando:

`2 × $10.000 = $20.000`

Por esta razón, `detalle_venta` debe almacenar el campo `precio_unitario`.

Nunca se debe recalcular una venta histórica utilizando el precio actual del producto.

---

# 11. Registro de ventas

Crear un módulo `Ventas`.

El usuario debe poder:

1. Seleccionar cliente.
2. Seleccionar productos/servicios.
3. Indicar cantidades.
4. Visualizar precios.
5. Calcular subtotales.
6. Calcular total.
7. Indicar forma de pago.
8. Registrar la venta.

Una venta puede ser:

- Pagada completamente.
- Parcialmente pagada.
- Completamente a crédito/fiada.

Ejemplo:

Cliente:

`Cliente A`

Productos:

| Producto | Cantidad | Precio | Subtotal |
|---|---:|---:|---:|
| Producto A | 2 | $10.000 | $20.000 |
| Producto B | 1 | $8.000 | $8.000 |

Total:

`$28.000`

Pago inicial:

`$10.000`

Saldo generado:

`$18.000`

---

# 12. Estados de una venta

Una venta puede tener estados como:

- `PAGADA`
- `PENDIENTE`
- `PARCIAL`
- `ANULADA`

No se debe borrar físicamente una venta que ya tenga movimientos financieros relacionados.

Para corregir una operación se debe implementar posteriormente un mecanismo de anulación o reversión.

---

# 13. Abonos

Crear módulo `Abonos`.

Debe permitir registrar pagos realizados por clientes que tienen una deuda.

Campos:

- Cliente.
- Fecha.
- Valor.
- Método de pago.
- Observación.

Métodos de pago iniciales:

- Efectivo.
- Transferencia.
- Otro.

Ejemplo:

Cliente:

`Cliente A`

Saldo:

`$50.000`

Abono:

`$20.000`

Nuevo saldo:

`$30.000`

---

# 14. Regla financiera principal

Nunca modificar manualmente el saldo de un cliente.

El sistema debe calcular:

```text
Saldo = Créditos/Ventas pendientes - Abonos
```

Ejemplo:

Ventas:

- $30.000
- $20.000
- $15.000

Total:

`$65.000`

Abonos:

- $20.000
- $10.000

Total:

`$30.000`

Saldo:

`$35.000`

Esta lógica debe utilizarse para las consultas de saldo.

Si posteriormente se utiliza un campo de saldo acumulado para mejorar el rendimiento, este debe considerarse un dato derivado y mantenerse consistente mediante transacciones.

---

# 15. Estado de cuenta del cliente

Cada cliente debe tener una página de detalle.

Ejemplo:

## Cliente A

**Saldo pendiente: $35.000**

### Resumen

- Total comprado a crédito.
- Total abonado.
- Saldo actual.
- Fecha de última compra.
- Fecha del último abono.

### Historial

| Fecha | Tipo | Descripción | Valor |
|---|---|---|---:|
| 16/08/2026 | Venta | Productos | $30.000 |
| 16/08/2026 | Abono | Efectivo | -$10.000 |
| 15/08/2026 | Venta | Productos | $20.000 |

El usuario debe poder filtrar el historial por fecha.

---

# 16. Antigüedad de deuda

El sistema debe poder determinar desde cuándo existe una deuda.

Ejemplo:

| Cliente | Saldo | Antigüedad |
|---|---:|---:|
| Cliente A | $85.000 | 3 días |
| Cliente B | $42.000 | 12 días |
| Cliente C | $120.000 | 35 días |

Categorías sugeridas:

- 0–7 días.
- 8–30 días.
- Más de 30 días.

Esto permitirá posteriormente crear reportes de morosidad.

---

# 17. Reportes

Crear un módulo de reportes.

Debe permitir seleccionar:

- Hoy.
- Ayer.
- Esta semana.
- Este mes.
- Mes anterior.
- Rango personalizado.

Reportes iniciales:

### Reporte de ventas

Mostrar:

- Cantidad de ventas.
- Total vendido.
- Total de ventas pagadas.
- Total de ventas a crédito.
- Total pendiente.

### Reporte de abonos

Mostrar:

- Cantidad de abonos.
- Total recibido.
- Métodos de pago.
- Abonos por día.

### Reporte de clientes

Mostrar:

- Cantidad total.
- Clientes con deuda.
- Clientes sin deuda.
- Clientes con mayor saldo.
- Clientes con deuda más antigua.

### Reporte de productos/servicios

Mostrar:

- Productos más vendidos.
- Cantidades vendidas.
- Total generado por producto/servicio.

---

# 18. Filtros

Los reportes deben permitir filtrar por:

- Fecha inicial.
- Fecha final.
- Cliente.
- Producto/servicio.
- Estado de venta.
- Método de pago.

---

# 19. Base de datos

Utilizar MySQL.

La estructura inicial recomendada es:

```text
usuarios
clientes
productos
ventas
detalle_venta
abonos
```

---

# 20. Tabla usuarios

Campos:

```text
id
nombre
email
password
rol
activo
created_at
updated_at
```

---

# 21. Tabla clientes

Campos:

```text
id
nombre
telefono
email
direccion
documento
observaciones
activo
created_at
updated_at
```

---

# 22. Tabla productos

Campos:

```text
id
nombre
descripcion
tipo
precio
activo
created_at
updated_at
```

---

# 23. Tabla ventas

Campos:

```text
id
cliente_id
fecha
subtotal
descuento
total
tipo_pago
estado
observaciones
created_at
updated_at
```

`tipo_pago` puede contener inicialmente:

```text
CONTADO
CREDITO
PARCIAL
```

---

# 24. Tabla detalle_venta

Campos:

```text
id
venta_id
producto_id
cantidad
precio_unitario
subtotal
created_at
```

Relaciones:

```text
ventas.id
    ↓
detalle_venta.venta_id

productos.id
    ↓
detalle_venta.producto_id
```

---

# 25. Tabla abonos

Campos:

```text
id
cliente_id
fecha
valor
metodo_pago
observacion
created_at
```

---

# 26. Relaciones

Modelo general:

```text
USUARIOS
   │
   │
   └── administra el sistema


CLIENTES
   │
   ├───────────────┐
   │               │
   ↓               ↓
VENTAS          ABONOS
   │
   ↓
DETALLE_VENTA
   │
   ↓
PRODUCTOS
```

Una venta pertenece a un cliente.

Una venta tiene uno o varios detalles.

Cada detalle corresponde a un producto/servicio.

Un cliente puede tener múltiples abonos.

---

# 27. Transacciones

Las operaciones financieras importantes deben utilizar transacciones SQL.

Por ejemplo, registrar una venta debe realizar:

1. Crear la venta.
2. Crear todos sus detalles.
3. Confirmar la transacción.

Si una operación falla:

```text
ROLLBACK
```

Si todo funciona correctamente:

```text
COMMIT
```

Esto evita que existan ventas incompletas.

---

# 28. Interfaz

La interfaz debe ser:

- Moderna.
- Limpia.
- Responsive.
- Compatible con computador, tablet y celular.
- Fácil de utilizar.
- Con navegación lateral en escritorio.
- Adaptada a dispositivos móviles.

Menú sugerido:

```text
Dashboard

Ventas
   ├── Nueva venta
   └── Historial

Clientes

Productos / Servicios

Abonos

Reportes

Configuración

Cerrar sesión
```

---

# 29. Componentes visuales

Utilizar **Tailwind CSS** para construir todos los componentes visuales.

Componentes mínimos:

- Navbar.
- Sidebar responsive.
- Cards.
- Tablas responsive.
- Formularios.
- Modales.
- Alertas.
- Badges.
- Botones.
- Paginación.
- Dropdowns.
- Estados de carga.
- Mensajes de error.
- Mensajes de éxito.

No utilizar Bootstrap.

Utilizar Chart.js para los gráficos y configurarlo de manera responsive.

Se puede utilizar SweetAlert2 para confirmaciones y mensajes, siempre que su apariencia se integre correctamente con el diseño general.

Todos los componentes deben mantener consistencia visual y utilizar las utilidades de Tailwind CSS.

La interfaz debe utilizar un enfoque mobile-first y comprobarse como mínimo en:

- 320px–480px: celulares.
- 481px–768px: tablets pequeñas y celulares grandes.
- 769px–1024px: tablets y laptops pequeñas.
- 1025px en adelante: laptops y PC.

No utilizar tamaños fijos innecesarios que rompan la interfaz en resoluciones diferentes.

---

# 30. Búsqueda y paginación

Las listas de:

- Clientes.
- Productos.
- Ventas.
- Abonos.

deben permitir:

- Buscar.
- Filtrar.
- Ordenar.
- Paginar.

No cargar miles de registros innecesariamente en una sola página.

---

# 31. Seguridad

Implementar como mínimo:

- Hash de contraseñas con bcryptjs.
- Sesiones.
- Middleware de autenticación.
- Consultas SQL parametrizadas.
- Validación de datos.
- Sanitización cuando corresponda.
- Protección de rutas administrativas.
- Manejo de errores sin mostrar información sensible.
- Variables de entorno para credenciales.
- No almacenar contraseñas en texto plano.

Crear un archivo `.env` para:

```text
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
SESSION_SECRET=
PORT=
```

El archivo `.env` no debe subirse a GitHub.

Crear `.env.example`.

---

# 32. Estructura del proyecto

Utilizar una estructura organizada como:

```text
sistema-ventas/
│
├── app.js
├── package.json
├── .env
├── .env.example
├── .gitignore
│
├── config/
│   └── database.js
│
├── controllers/
│   ├── authController.js
│   ├── clienteController.js
│   ├── productoController.js
│   ├── ventaController.js
│   ├── abonoController.js
│   └── reporteController.js
│
├── models/
│   ├── Usuario.js
│   ├── Cliente.js
│   ├── Producto.js
│   ├── Venta.js
│   └── Abono.js
│
├── routes/
│   ├── authRoutes.js
│   ├── clienteRoutes.js
│   ├── productoRoutes.js
│   ├── ventaRoutes.js
│   ├── abonoRoutes.js
│   └── reporteRoutes.js
│
├── middleware/
│   └── authMiddleware.js
│
├── views/
│   ├── layouts/
│   ├── partials/
│   ├── auth/
│   ├── dashboard/
│   ├── clientes/
│   ├── productos/
│   ├── ventas/
│   ├── abonos/
│   └── reportes/
│
├── public/
│   ├── css/
│   ├── js/
│   └── img/
│
└── database/
    └── database.sql
```

---

# 33. Flujo principal del sistema

```text
LOGIN
  ↓
DASHBOARD
  ↓
CLIENTES
  ↓
Seleccionar cliente
  ↓
NUEVA VENTA
  ↓
Seleccionar productos/servicios
  ↓
Calcular total
  ↓
Seleccionar forma de pago
  ↓
┌─────────────────────┐
│ ¿Pago completo?     │
└─────────┬───────────┘
          │
      ┌───┴───┐
      │       │
     SI       NO
      │       │
      ↓       ↓
  PAGADA   CRÉDITO
              │
              ↓
         SALDO PENDIENTE
              │
              ↓
           ABONOS
              │
              ↓
        REDUCIR SALDO
              │
              ↓
      ESTADO DE CUENTA
              │
              ↓
           REPORTES
```

---

# 34. Flujo de una venta a crédito

Ejemplo:

Cliente:

`Cliente A`

Compra:

```text
Producto A    2 × $15.000 = $30.000
Producto B    1 × $10.000 = $10.000
```

Total:

`$40.000`

Pago inicial:

`$10.000`

Saldo:

`$30.000`

El sistema debe registrar:

```text
VENTA
Total: $40.000
Tipo: PARCIAL

ABONO/PAGO
Valor: $10.000

SALDO
$30.000
```

---

# 35. Flujo de abono posterior

Cliente:

`Cliente A`

Saldo:

`$30.000`

Realiza abono:

`$15.000`

Nuevo saldo:

`$15.000`

Posteriormente realiza otro abono:

`$15.000`

Nuevo saldo:

`$0`

El cliente debe aparecer como:

`SIN DEUDA`

---

# 36. Reglas del negocio

Estas reglas deben cumplirse siempre:

1. Una venta debe tener al menos un detalle.
2. La cantidad de un producto debe ser mayor que cero.
3. El precio unitario no puede ser negativo.
4. El total de una venta debe coincidir con sus detalles.
5. Un abono debe ser mayor que cero.
6. No permitir abonos superiores al saldo pendiente, salvo que posteriormente se implemente manejo de saldo a favor.
7. Una venta histórica no debe cambiar si cambia el precio actual del producto.
8. Las ventas históricas no deben eliminarse físicamente.
9. Los abonos históricos no deben eliminarse físicamente.
10. Las operaciones financieras deben quedar registradas.
11. El saldo debe poder reconstruirse a partir del historial.
12. Los clientes y productos pueden desactivarse en lugar de eliminarse.
13. Los usuarios no autenticados no pueden acceder a las áreas administrativas.

---

# 37. Futuras funcionalidades

La arquitectura debe permitir agregar posteriormente:

## Inventario

- Entradas.
- Salidas.
- Stock.
- Alertas de inventario.
- Movimientos.

## Gastos

- Registrar gastos.
- Categorías.
- Reportes.
- Utilidad estimada.

## Proveedores

- Registrar proveedores.
- Compras.
- Cuentas por pagar.

## Usuarios

- Administrador.
- Empleado.
- Permisos.

## Notificaciones

- Recordatorios de pago.
- Avisos de deuda.
- WhatsApp.
- Correo electrónico.

## Exportación

- Excel.
- PDF.
- CSV.

## Copias de seguridad

- Backup de base de datos.
- Restauración.

---

# 38. Escalabilidad

Aunque la primera versión será pequeña, la aplicación debe diseñarse pensando en que puede crecer.

No crear lógica financiera directamente dentro de las vistas EJS.

Utilizar:

```text
Routes
   ↓
Controllers
   ↓
Models / Services
   ↓
Database
```

Las vistas solamente deben encargarse de mostrar información y enviar formularios.

---

# 39. Orden recomendado de desarrollo

No desarrollar todo simultáneamente.

Seguir este orden:

### Fase 1 — Configuración

- Crear proyecto Node.js.
- Instalar dependencias.
- Configurar Express.
- Configurar EJS.
- Configurar MySQL.
- Configurar `.env`.
- Crear estructura de carpetas.

### Fase 2 — Base de datos

- Crear `database.sql`.
- Crear tablas.
- Crear relaciones.
- Crear claves foráneas.
- Crear índices necesarios.
- Insertar datos iniciales.

### Fase 3 — Autenticación

- Login.
- Logout.
- Sesiones.
- Bcrypt.
- Middleware de autenticación.

### Fase 4 — Clientes

- CRUD.
- Búsqueda.
- Detalle.
- Estado de cuenta.

### Fase 5 — Productos/servicios

- CRUD.
- Precios.
- Activar/desactivar.

### Fase 6 — Ventas

- Crear venta.
- Agregar productos.
- Calcular total.
- Contado.
- Crédito.
- Pago parcial.
- Historial.

### Fase 7 — Abonos

- Registrar abono.
- Consultar saldo.
- Historial de pagos.

### Fase 8 — Dashboard

- Indicadores.
- Tablas.
- Gráficos.

### Fase 9 — Reportes

- Diarios.
- Mensuales.
- Rangos de fechas.
- Clientes.
- Productos.
- Deudas.

### Fase 10 — Mejoras

- Responsive.
- Validaciones.
- Seguridad.
- Optimización.
- Exportaciones.

---

# 40. Instrucción para Claude

Claude debe actuar como desarrollador senior y construir el proyecto de forma incremental.

No debe generar todo el sistema de una sola vez.

Debe trabajar fase por fase.

Para cada fase debe:

1. Explicar brevemente qué se va a implementar.
2. Indicar los archivos nuevos.
3. Indicar los archivos que se modificarán.
4. Proporcionar el código completo de cada archivo necesario.
5. No omitir partes importantes con frases como "aquí iría el resto del código".
6. Mantener compatibilidad con el código desarrollado anteriormente.
7. No cambiar tecnologías sin justificarlo.
8. No modificar la arquitectura sin explicar por qué.
9. Proporcionar los comandos necesarios para instalar dependencias.
10. Indicar cómo probar la funcionalidad.
11. Detectar y corregir errores antes de continuar con la siguiente fase.

Cuando se modifique un archivo existente, mostrar claramente el archivo completo actualizado para evitar confusiones.

Antes de implementar funcionalidades nuevas, verificar cómo están estructurados los archivos existentes.

---

# 41. Prompt inicial recomendado para Claude

Quiero que desarrolles conmigo una aplicación web de gestión de ventas, cuentas por cobrar y ventas a crédito.

El sistema debe ser completamente general y NO debe estar diseñado exclusivamente para hamburgueserías, restaurantes o un negocio específico.

Debe poder utilizarse en diferentes tipos de pequeños comercios y negocios que vendan productos o servicios y permitan a sus clientes comprar a crédito.

Stack obligatorio:

- Node.js
- Express.js
- EJS
- MySQL
- mysql2
- Tailwind CSS
- JavaScript
- express-session
- bcryptjs
- Chart.js

Requisitos obligatorios de interfaz:

- Utilizar Tailwind CSS como único framework principal de estilos.
- No utilizar Bootstrap.
- Diseñar con enfoque mobile-first.
- La interfaz debe ser completamente responsive para celulares, tablets, laptops y PC.
- El dashboard, sidebar, tablas, formularios, modales, botones y gráficos deben adaptarse a diferentes tamaños de pantalla.
- Evitar scroll horizontal innecesario.
- Las tablas deben tener una estrategia responsive adecuada para dispositivos pequeños.
- La navegación debe convertirse en un menú adaptable en celulares.
- Todas las vistas deben probarse en diferentes resoluciones.

Quiero una arquitectura modular utilizando:

- routes
- controllers
- models
- middleware
- views
- public
- config
- database

Los módulos iniciales serán:

- Autenticación.
- Dashboard.
- Clientes.
- Productos/servicios.
- Ventas.
- Ventas a crédito.
- Abonos.
- Estado de cuenta.
- Historial.
- Reportes.

La regla financiera principal es:

`Saldo pendiente = Total de ventas a crédito - Total de abonos`

Nunca quiero que el saldo dependa de una modificación manual.

Cada detalle de venta debe guardar el precio unitario utilizado en el momento de la venta, para que las ventas históricas no cambien cuando se modifique el precio actual del producto.

Las operaciones financieras importantes deben utilizar transacciones SQL.

Quiero que desarrolles el proyecto de manera incremental y profesional.

NO construyas todo de una vez.

Comienza únicamente con la Fase 1:

1. Estructura del proyecto.
2. package.json.
3. Instalación de dependencias.
4. Configuración de Express.
5. Configuración de EJS.
6. Configuración de MySQL.
7. Archivo `.env.example`.
8. `.gitignore`.
9. Archivo inicial `app.js`.
10. Una página inicial sencilla para comprobar que el proyecto funciona.

Después de terminar esa fase, explícame cómo ejecutarla y probarla.

No continúes automáticamente a la siguiente fase hasta que te lo indique.

---

# 42. Objetivo final

El resultado debe ser una aplicación web que permita a un pequeño negocio saber:

- Qué vendió.
- A quién le vendió.
- Qué productos o servicios vendió.
- Cuánto vendió.
- Cuánto le pagaron.
- Cuánto quedó pendiente.
- Quién le debe dinero.
- Cuánto le debe cada cliente.
- Desde cuándo existe la deuda.
- Cuánto ha recaudado.
- Cuánto ha vendido por día.
- Cuánto ha vendido por mes.
- Qué productos/servicios vende más.
- Qué clientes tienen mayores saldos pendientes.

La aplicación debe priorizar la **simplicidad para el usuario**, la **consistencia de los datos financieros**, la **seguridad**, una **experiencia responsive y mobile-first** y la **posibilidad de ampliar el sistema posteriormente**.

La interfaz debe ofrecer una experiencia equivalente y usable en celulares, tablets y computadores, sin limitar funcionalidades importantes por el tamaño de pantalla.
