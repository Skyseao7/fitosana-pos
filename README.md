# FITOSANA POS

Sistema POS web para la gestión de ventas, inventario, cajas, sucursales, usuarios y configuración operativa de FITOSANA.

La aplicación está construida con React y Vite en el frontend, usa Supabase como backend principal para autenticación y acceso a datos, y puede desplegarse en Firebase Hosting.

## Descripción general

Este proyecto centraliza el flujo operativo de un punto de venta:

- Inicio de sesión con Supabase.
- Gestión de productos, categorías y stock.
- Operación de caja y ventas desde la pantalla POS.
- Consulta de historial de ventas y reportes.
- Administración de sucursales, almacenes, impresoras y métodos de pago.
- Configuración de empresa, moneda, serialización y ticket.
- Control de usuarios, roles y permisos por módulo.

## Stack técnico

- `React 18`
- `Vite 5`
- `React Router DOM`
- `Styled Components`
- `Zustand`
- `@tanstack/react-query`
- `@tanstack/react-table`
- `Ant Design`
- `Supabase`
- `pdfmake` y `print-js` para generación e impresión de tickets/documentos
- `Firebase Hosting` para despliegue estático

## Estructura del proyecto

```text
fitosana-pos/
├─ public/                  # Assets públicos
├─ src/
│  ├─ assets/               # Imágenes, SVG y animaciones
│  ├─ components/           # UI por capas: atomos, moleculas, organismos, templates
│  ├─ context/              # Contextos globales, por ejemplo autenticación
│  ├─ hooks/                # Hooks y wrappers como Layout y ProtectedRoute
│  ├─ pages/                # Páginas principales del sistema
│  ├─ reports/              # Plantillas/reportes de tickets
│  ├─ routers/              # Definición de rutas
│  ├─ store/                # Estado global con Zustand
│  ├─ styles/               # Temas, variables, breakpoints y estilos globales
│  ├─ supabase/             # Configuración y CRUDs hacia Supabase
│  ├─ tanstack/             # Configuración de tablas/queries por módulo
│  ├─ utils/                # Utilidades generales
│  ├─ App.jsx               # Composición principal
│  ├─ index.js              # Barrel exports
│  └─ main.jsx              # Punto de entrada
├─ .firebaserc              # Proyecto Firebase
├─ firebase.json            # Configuración de hosting
├─ package.json
└─ vite.config.js
```

## Arquitectura resumida

### 1. Arranque de la app

El punto de entrada está en `src/main.jsx`, donde se monta:

- `BrowserRouter` para navegación.
- `QueryClientProvider` para manejo de caché y consultas con React Query.

### 2. Composición principal

`src/App.jsx` se encarga de:

- Aplicar el `ThemeProvider` con `styled-components`.
- Inicializar `AuthContextProvider`.
- Cargar estilos globales.
- Renderizar las rutas.
- Habilitar `ReactQueryDevtools`.

### 3. Autenticación

La autenticación se gestiona con Supabase:

- La conexión se configura en `src/supabase/supabase.config.jsx`.
- El contexto `src/context/AuthContent.jsx` escucha cambios de sesión con `supabase.auth.onAuthStateChange`.
- Cuando un usuario inicia sesión, el sistema intenta validar si ya existe en la base de datos y, si no existe, dispara el alta inicial mediante las funciones del módulo de usuarios/empresa.

### 4. Protección de rutas

`src/hooks/ProtectedRoute.jsx` controla:

- Acceso a rutas públicas como `/login`.
- Acceso a rutas autenticadas.
- Carga de permisos globales por usuario para determinar visibilidad operativa.

### 5. Estado y datos

La aplicación mezcla dos enfoques:

- `Zustand` para estado global por dominio: usuarios, productos, ventas, stock, cajas, tema, empresa, etc.
- `React Query` para consultas, caché y sincronización de datos remotos.

### 6. Acceso a datos

La carpeta `src/supabase/` contiene los módulos CRUD por entidad, por ejemplo:

- `crudProductos.jsx`
- `crudVenta.jsx`
- `crudStock.jsx`
- `crudUsuarios.jsx`
- `crudEmpresa.jsx`

Esto mantiene la lógica de acceso a datos separada de los componentes de UI.

## Módulos funcionales principales

De acuerdo con las rutas actuales del sistema, el proyecto cubre estos módulos:

- `Login`
- `Home`
- `Dashboard`
- `POS`
- `Productos`
- `Inventario`
- `Historial de ventas`
- `Reportes`
- `Configuraciones`
- `Categorías`
- `Clientes / Proveedores`
- `Métodos de pago`
- `Empresa`
- `Serialización de comprobantes`
- `Configuración de ticket`
- `Sucursales y caja`
- `Impresoras`
- `Usuarios`
- `Almacenes`
- `Mi perfil`

## Flujo de navegación

Las rutas están definidas en `src/routers/routes.jsx`.

Patrón general:

- `/login` para usuarios no autenticados.
- Rutas protegidas para usuarios autenticados envueltas por `Layout`.
- Un fallback `*` para página no encontrada.

Ejemplos de rutas:

- `/`
- `/dashboard`
- `/pos`
- `/productos`
- `/inventario`
- `/reportes`
- `/historialventas`
- `/configuracion`
- `/configuracion/categorias`
- `/configuracion/empresa`
- `/configuracion/usuarios`

## Requisitos previos

Antes de levantar el proyecto, asegúrate de tener:

- `Node.js` 18 o superior recomendado
- `npm`
- Un proyecto de `Supabase` con las tablas, vistas, funciones y políticas necesarias
- Opcionalmente `Firebase CLI` si vas a desplegar

## Impresión y PDFs

La utilidad `src/utils/CreatePdf.jsx` permite:

- generar documentos PDF en base64
- enviar documentos directamente a impresión desde el navegador

Esto se usa especialmente para tickets y comprobantes dentro del flujo POS.

## Convenciones del código

La base actual del proyecto sigue estas ideas:

- Componentes separados por niveles (`atomos`, `moleculas`, `organismos`, `templates`)
- Estado desacoplado por dominio en `store/`
- Acceso a datos aislado en `supabase/`
- Rutas centralizadas en `routers/`
- Temas y estilos globales en `styles/`

