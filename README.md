# node-demo-typescript

API REST de demostración construida con **Node.js**, **TypeScript**, **Express**, **Sequelize (v7)** y **MySQL**. Incluye autenticación JWT, OAuth 2.0 con Google, documentación Swagger, streams de datos y una estrategia de **concurrencia multi-proceso (cluster)** para escalar en máquinas multi-núcleo.

---

## Tabla de contenidos

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos](#requisitos)
5. [Puesta en marcha](#puesta-en-marcha)
6. [Scripts disponibles](#scripts-disponibles)
7. [Concurrencia y escalado](#concurrencia-y-escalado)
8. [Variables de entorno](#variables-de-entorno)
9. [Endpoints de la API](#endpoints-de-la-api)
10. [Autenticación](#autenticación)
11. [Modelos de datos](#modelos-de-datos)
12. [Swagger / Documentación](#swagger--documentación)
13. [Tests](#tests)
14. [Producción y despliegue](#producción-y-despliegue)
15. [Limitaciones conocidas](#limitaciones-conocidas)
16. [Cambios recientes y mantenimiento](#cambios-recientes-y-mantenimiento)

---

## Características

- API RESTful con Express 4 y TypeScript (compilación a `dist/`).
- **Autenticación JWT** (Bearer) con middleware `authJwt`.
- **OAuth 2.0 con Google** (passport + express-session).
- **Documentación interactiva** de la API con Swagger UI en `/docs`.
- **Sequelize v7** con decoradores (`@sequelize/core/decorators-legacy`) y modelos tipados.
- **Pool de conexiones** a MySQL configurable y por entorno (`DB_*`).
- **Concurrencia multi-proceso** con el módulo `cluster` de Node, reinicio automático de workers y **graceful shutdown**.
- Utilidades de streaming: respuestas en chunks, buffers y proxy hacia APIs externas (NASA, Picsum).
- Tests con **Jest + ts-jest + Supertest**.

---

## Stack tecnológico

| Capa            | Tecnología                                                            |
| --------------- | --------------------------------------------------------------------- |
| Lenguaje        | TypeScript ≥ 5.3                                                      |
| Runtime         | Node.js (probado con Node 24)                                         |
| Framework HTTP  | Express 4                                                             |
| ORM             | `@sequelize/core` (7.0.0-alpha) + `mysql2`                            |
| Seguridad       | `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `passport` (Google OAuth) |
| Validación      | `express-validator`                                                   |
| Documentación   | `swagger-jsdoc` + `swagger-ui-express`                                |
| Tests           | `jest`, `ts-jest`, `supertest`                                        |
| Concurrencia    | Módulo `cluster` nativo de Node (primario/workers)                    |

---

## Estructura del proyecto

```text
node-demo-typescript/
├── src/
│   ├── app.ts                       # Punto de entrada (carga dotenv + arranca concurrencia)
│   ├── concurrency.ts               # Estrategia de concurrencia (cluster, reinicios, shutdown)
│   ├── server.ts                    # Clase Server: Express, middlewares, rutas, OAuth, Swagger
│   ├── swagger.ts                   # Configuración de Swagger (/docs, /docs/json)
│   ├── controllers/                 # Controladores HTTP (auth, usuarios, post, tema, role, stream)
│   ├── repository/                  # Capa de acceso a datos (Sequelize)
│   ├── routes/                      # Routers de Express
│   ├── models/                      # Modelos Sequelize (Usuario, Post, Tema, UsuarioTema, Role)
│   ├── db/connection.ts             # Instancia de Sequelize + pool de conexiones
│   ├── docs/                        # Esquemas/annotations OpenAPI
│   ├── interfaces/                  # Tipos compartidos (UpdateUsuarioRequest)
│   └── validators/                  # authJwt, errorHandler, ApiError, tokenBlacklist, validators
├── tests/                           # Suites de Jest (specs por módulo + utils.test.ts)
├── .env.example                     # Plantilla de variables de entorno (commitada)
├── .github/workflows/               # Pipelines CI/CD (estrategia Push / CIOps)
│   ├── ci-cd-push.yml               # Push a develop/main/tag → tests + imagen GHCR
│   └── deploy.yml                   # Despliegue manual del artefacto publicado
├── Dockerfile                       # Imagen multi-stage (base → build → runtime)
├── .dockerignore                    # Excluye node_modules, dist, .env, .git del build
├── compose.yaml                     # Stack local: API + MySQL 8
├── compose.prod.yaml                # Plantilla de producción (red interna + proxy)
├── Makefile                         # Atajos para Docker (make up, make test, ...)
├── jest.config.js                   # Configuración de Jest (única fuente de verdad)
├── package.json
└── tsconfig.json
```

---

## Requisitos

- **Node.js ≥ 18** (se recomienda 20+; `os.availableParallelism` requiere Node 18.14+).
- **MySQL** local o remoto (por defecto `prueba_db`, usuario `root`).
- OPCIONAL, solo para OAuth de Google: credenciales en la consola de Google Cloud.

---

## Puesta en marcha

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno**

   ```bash
   # Windows
   copy .env.example .env
   # Linux/macOS
   cp .env.example .env
   ```

   Ajusta `DB_NAME`, `DB_USER`, `DB_PASSWORD`, etc. a tu MySQL. (Nota: `.env.example`
   está en `.gitignore`; se incluye como plantilla local.)

3. **Levantar la base de datos** (crea la BD si no existe):

   ```sql
   CREATE DATABASE IF NOT EXISTS prueba_db;
   ```

   Al arrancar, `db.authenticate()` valida la conexión antes de escuchar.
   La sincronización de modelos (`sync({ alter: false })`) se ejecuta al iniciar
   el servidor. Existe una función `inicializarBaseDatos()` en
   `src/db/connection.ts` (comentada) que permite crear los roles `ADMIN`/`USER`
   y un usuario administrador inicial.

4. **Arrancar en desarrollo** (con `tsx --watch`):

   ```bash
   npm run dev
   ```

   Verás en consola: `Servidor corriendo en puerto !! 8000` y
   `Docs disponibles en http://localhost:8000/docs`.

## Scripts disponibles

| Comando         | Descripción                                                        |
| --------------- | ------------------------------------------------------------------ |
| `npm run dev`   | Desarrollo con `tsx --watch src/app.ts`                            |
| `npm run build` | Compila TypeScript a `dist/` (`tsc`)                               |
| `npm run clean` | Elimina la carpeta `dist/` (usa `fs.rmSync` nativo)                |
| `npm start`     | Ejecuta el compilado `node dist/app.js`                            |
| `npm test`      | Ejecuta Jest con `jest.config.js` (`--runInBand`)                  |

---

## Concurrencia y escalado

Node.js ejecuta JavaScript en **un único hilo** (event loop). Una instancia
puede manejar mucha concurrencia de I/O, pero **no aprovecha más de un núcleo
de CPU**. Para resolverlo, este proyecto usa el módulo nativo **`cluster`**:

- **Proceso primario**: forkea N *workers* y reparte el tráfico entrante
  (balanceo por turnos).
- **Cada worker** corre una instancia completa del servidor Express con su
  propio event loop y su propio **pool de conexiones** a MySQL.
- **Reinicio automático**: si un worker muere (excepción no capturada, OOM,
  etc.), el primario lo vuelve a crear.
- **Protección anti crash-loop**: si los workers mueren demasiadas veces en
  poco tiempo (p. ej. la BD está caída), el primario sale con exit code ≠ 0 en
  lugar de reiniciar en bucle.
- **Graceful shutdown**: ante `SIGINT`/`SIGTERM`, el worker deja de aceptar
  conexiones, espera las peticiones en vuelo (`httpServer.close()`),
  desconecta conexiones keep-alive inactivas y cierra el pool de Sequelize.

### ¿Cómo decide el número de workers?

| Contexto                        | Workers                              |
| ------------------------------- | ------------------------------------ |
| `NODE_ENV=production` (sin var) | `os.availableParallelism()` (núcleos)|
| `WEB_CONCURRENCY` definida (≥1) | Valor de la variable                 |
| Cualquier otro (dev/test)       | `1` (un solo proceso, ideal en dev)  |

### Flujo de arranque

```text
src/app.ts  →  'dotenv/config'  →  start()  (concurrency.ts)
                                          ├── worker único?  →  Server.start()
                                          │                       (await DB + listen + shutdown)
                                          └── cluster        →  primario fork workers
                                                                   → cada worker hace lo anterior
```

### Buenas prácticas aplicadas

- `dotenv/config` se carga **antes** de importar módulos que leen `process.env`
  (evita valores `undefined` en `JWT_SECRET`, `PORT`, credenciales de BD, etc.).
- El servidor **no escucha hasta confirmar la conexión a BD**
  (`server.start()` hace `await db.authenticate()`); si falla, el proceso sale
  con un mensaje claro.
- Manejadores globales de `uncaughtException`/`unhandledRejection`: se registra
  y se aborta el proceso (estado indeterminado), dejando que el cluster o el
  orquestador reinicien el worker.
- **Pool de MySQL configurable** (`DB_POOL_*`): evita agotar las conexiones
  disponibles cuando varios workers comparten la BD.
- Apagado coordinado: el primario propaga la señal a todos los workers y se
  cierra el pool de BD antes de salir.

### Ejemplo para escalar en producción

```bash
# 8 workers explícitos (o déjalo vacío para usar los núcleos disponibles)
WEB_CONCURRENCY=8 NODE_ENV=production npm start
```

## Variables de entorno

| Variable               | Default        | Descripción                                           |
| ---------------------- | -------------- | ----------------------------------------------------- |
| `PORT`                 | `8000`         | Puerto HTTP del servidor                              |
| `NODE_ENV`             | `development`  | `production` activa N workers (núcleos)               |
| `JWT_SECRET`           | `secretKey`    | Secreto para firmar/verificar JWT                     |
| `SESSION_SECRET`       | `cats`         | Secreto de express-session (OAuth Google)             |
| `GOOGLE_CLIENT_ID`     | `""`           | Client ID de Google OAuth                             |
| `GOOGLE_CLIENT_SECRET` | `""`           | Client Secret de Google OAuth                         |
| `DB_HOST`              | `localhost`    | Host de MySQL                                         |
| `DB_PORT`              | `3306`         | Puerto de MySQL                                       |
| `DB_NAME`              | `prueba_db`    | Nombre de la base de datos                            |
| `DB_USER`              | `root`         | Usuario de MySQL                                      |
| `DB_PASSWORD`          | `1234`         | Contraseña de MySQL                                   |
| `DB_POOL_MAX`          | `10`           | Conexiones máx. del pool por worker                   |
| `DB_POOL_MIN`          | `0`            | Conexiones mín. del pool por worker                   |
| `DB_POOL_IDLE_MS`      | `10000`        | Tiempo máx. de inactividad de una conexión            |
| `DB_POOL_ACQUIRE_MS`   | `30000`        | Timeout para obtener conexión del pool                |
| `DB_POOL_EVICT_MS`     | `60000`        | Intervalo de limpieza de conexiones inactivas         |
| `DB_LOGGING`           | `false`        | `true` para loguear el SQL generado por Sequelize     |
| `WEB_CONCURRENCY`      | automático     | Nº de workers del cluster (≥ 1)                       |
| `SHUTDOWN_TIMEOUT_MS`  | `30000`        | Timeout del graceful shutdown antes de forzar salida  |

> **Nota sobre el pool**: el total de conexiones abiertas en MySQL es, de forma
> aproximada, `workers * DB_POOL_MAX`. Si tu MySQL tiene un límite bajo,
> ajusta `DB_POOL_MAX` (p. ej. `5`) o reduce `WEB_CONCURRENCY`.

### Archivos de entorno por comando

| Comando                | Carga                         |
| ---------------------- | ----------------------------- |
| `npm run dev`          | `.env.dev` (vía `tsx --env-file`) |
| `npm start` / tests    | `.env` (`dotenv/config`)      |
| Plataforma (Render/…)  | Variables reales inyectadas (tienen prioridad sobre cualquier archivo) |

---

## Endpoints de la API

Todas las rutas bajo `/api` (excepto `/api/auth`) requieren el header:

```http
Authorization: Bearer <token>
```

### Autenticación (`/api/auth`) — sin JWT

| Método | Ruta                     | Descripción                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| POST   | `/api/auth/signup`       | Registrar usuario (`name`, `email`, `password`) |
| POST   | `/api/auth/login`        | Iniciar sesión → devuelve `{ token }`          |
| POST   | `/api/auth/logout`       | Revoca el token (blacklist en memoria)         |
| GET    | `/api/auth/hashPassword` | Devuelve un hash de ejemplo de `111111`        |

### Usuarios (`/api/usuarios`)

| Método | Ruta                    | Descripción                            |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/api/usuarios`         | Listar usuarios                        |
| GET    | `/api/usuarios/:id`     | Obtener usuario por id                 |
| POST   | `/api/usuarios`         | Crear usuario (valida `name`, `email`) |
| POST   | `/api/usuarios/addTema` | "Like" de usuario a un tema            |
| PUT    | `/api/usuarios`         | Actualizar usuario                     |
| DELETE | `/api/usuarios/:id`     | Eliminar usuario (placeholder)         |

### Posts (`/api/post`)

| Método | Ruta                  | Descripción                     |
| ------ | --------------------- | ------------------------------- |
| GET    | `/api/post`           | Listar posts                    |
| GET    | `/api/post/:id`       | Obtener post por id             |
| GET    | `/api/post/posts/:id` | Posts de un usuario (con temas) |
| POST   | `/api/post`           | Crear post                      |
| DELETE | `/api/post/:id`       | Eliminar post (placeholder)     |

### Temas (`/api/tema`) y Roles (`/api/role`)

| Método | Ruta            | Descripción                  |
| ------ | --------------- | ---------------------------- |
| GET    | `/api/tema`     | Listar temas                 |
| GET    | `/api/tema/:id` | Obtener tema por id          |
| POST   | `/api/tema`     | Crear tema (nombre único)    |
| DELETE | `/api/tema/:id` | Eliminar tema (placeholder)  |
| GET    | `/api/role`     | Listar roles                 |
| POST   | `/api/role`     | Crear rol                    |
| DELETE | `/api/role/:id` | Eliminar rol (placeholder)   |

### Utilidades / streaming (`/api/utils`)

| Método | Ruta                     | Descripción                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/utils/stream`      | Responde un stream de texto en chunks         |
| POST   | `/api/utils/buffer`      | Convierte el body en Buffer y devuelve info   |
| GET    | `/api/utils/nasa-stream` | Proxy hacia la API de la NASA (APOD)          |
| GET    | `/api/utils/image-buffer`| Descarga una imagen de Picsum como buffer     |

### OAuth Google y páginas auxiliares

| Método | Ruta                  | Descripción                               |
| ------ | --------------------- | ----------------------------------------- |
| GET    | `/main`               | Página con enlace "Iniciar sesión con Google" |
| GET    | `/auth/google`        | Inicia el flujo OAuth con Google          |
| GET    | `/auth/google/callback` | Callback de Google OAuth                |
| GET    | `/protected`          | Página protegida (solo con sesión activa) |
| GET    | `/auth/failure`       | Mensaje de error del flujo OAuth          |

> La descripción detallada y los esquemas de ejemplo están disponibles en
> **Swagger**: `http://localhost:8000/docs`.

## Autenticación

### JWT (API)

1. `POST /api/auth/login` con `{ email, password }` devuelve un `token`.
2. Envía el token en cada petición protegida:

   ```http
   Authorization: Bearer <token>
   ```

3. `POST /api/auth/logout` agrega el token a una **blacklist en memoria** con
   expiración (`src/validators/tokenBlacklist.ts`). El middleware `authJwt`
   rechaza tokens revocados con `401`.

> ⚠️ La blacklist es en memoria: con cluster, cada worker tiene la suya.
> Para invalidar tokens de forma global en producción usa **Redis**.

### OAuth 2.0 con Google

- Requiere `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
- Flujo: `/auth/google` → consentimiento → callback `/auth/google/callback`
  → `/protected`.
- Usa `passport` + `express-session` (secret configurable con `SESSION_SECRET`).
- Prueba rápida en `GET /main`.

---

## Modelos de datos

| Modelo        | Campos (resumen)                                 | Relaciones                              |
| ------------- | ------------------------------------------------ | --------------------------------------- |
| `Role`        | `id`, `nombre` (único), `descripcion`            | `1:N` → Usuario                         |
| `Usuario`     | `id`, `name`, `email` (único), `password`, `isActive`, `roleId` | N:1 → Role; 1:N → Post |
| `Post`        | `id`, `title`, `body`, `isActive`, `usuarioId`   | N:1 → Usuario; N:M → Tema (`post_tema`)|
| `Tema`        | `id`, `name`, `descripcion`, `isActive`          | 1:N → UsuarioTema                       |
| `UsuarioTema` | `id`, `usuarioId`, `temaId`                      | Tabla puente "likes" de temas           |

Los modelos están definidos en `src/models/` usando decoradores de
`@sequelize/core/decorators-legacy`. La sincronización automática
(`sync({ alter: false })`) se lanza al iniciar el servidor.

---

## Swagger / Documentación

- **UI interactiva**: `http://localhost:8000/docs`
- **Spec JSON**: `http://localhost:8000/docs/json`

La spec se genera con `swagger-jsdoc` a partir de las anotaciones JSDoc de
`src/docs/**/*.ts` y de los logs de Swagger en `src/swagger.ts`.

---

## Tests

```bash
npm test
```

25 suites / **175 test unitarios** (Jest + ts-jest + Supertest). Todas las
pruebas se ejecutan con **mocks**: no requieren base de datos, red externa ni
procesos hijos.

### 1. Servidor (`Server`)

**`tests/index.spec.ts`** (existente)
- Inicializa Express y configura las variables de entorno.
- Registra los middlewares obligatorios (json, static, cors, passport).
- Registra las rutas de la API (`/api/auth`, `/api/usuarios`, `/api/role`, `/api/post`, `/api/tema`, `/api/utils`).
- Inicia el servidor y sincroniza los modelos (`db.sync({ alter: false })`).
- `isLoggerIn`: llama a `next()` si `req.user` existe.
- `isLoggerIn`: responde `401` si el usuario no está autenticado.

**`tests/server.extra.spec.ts`**
- `getPort` usa `8000` como puerto por defecto.
- `getPort` respeta `process.env.PORT`.
- `ensureDbConnected` resuelve cuando la BD autentica correctamente.
- `ensureDbConnected` lanza el error guardado si la autenticación falló en el constructor.
- Registra las rutas OAuth de Google y protege `/protected` con `isLoggerIn`.
- `dbConnection` propaga el error de `db.authenticate` al guardado del constructor.

### 2. Validadores (`tests/validators/`)

**`authJwt.spec.ts`**
- Sin cabecera `Authorization` → `ApiError 401 "No token provided"`.
- Cabecera que no arranca con `Bearer ` → `ApiError 401`.
- Token en blacklist → `ApiError 401 "Token revoked"` sin verificar el JWT.
- Token válido → asigna `req.user` y llama a `next()`.
- Token inválido o expirado → `ApiError 401 "Invalid token"`.

**`tokenBlacklist.spec.ts`**
- Un token en blacklist no expirado devuelve `true`.
- TTL por defecto de 1 hora.
- Un token expirado deja de estar en blacklist al consultarse.
- Un token desconocido nunca está en blacklist.
- `cleanupBlacklist` elimina solo los tokens vencidos.

**`validateHelper.spec.ts`**
- Llama a `next()` cuando no hay errores de validación.
- Responde `403` con los errores cuando la validación falla.

**`apiError.spec.ts`**
- Expone `status`, `message` y `details`.
- `details` es opcional.
- `instanceof ApiError` funciona (por `setPrototypeOf`).

**`errorHandler.spec.ts`**
- Responde el `status` y `details` para un `ApiError`.
- Responde `500` y loguea el error para un error genérico.

**`user.validator.spec.ts`** (integración vía `usuario.router` con Supertest)
- `POST` válido supera la validación y llega al controlador (201).
- `POST` sin `name` responde `403`.
- `POST` sin `email` responde `403`.
- `POST` con email inválido responde `403`.
- `PUT` sin `email` pasa la validación (campo opcional).
- `PUT` con email inválido responde `403` (opcional pero validado si viene).
- `PUT` sin `name` responde `403`.

### 3. Repositorios (`tests/repositories/`)

**`auth.repository.spec.ts`**
- `hashPassword` genera el formato `salt$derived` (salt 32 hex, derived 128 hex).
- `hashPassword` usa un salt distinto para la misma contraseña.
- `signup` crea el usuario con la contraseña hasheada si el email es nuevo.
- `signup` devuelve `null` si el email ya existe.
- `login` devuelve un JWT con credenciales válidas (firmado con `expiresIn: 1h`).
- `login` devuelve `null` con contraseña incorrecta.
- `login` devuelve `null` si el usuario no existe.
- `logout` agrega el token a la blacklist con su `exp`.
- `logout` re-lanza el error si el token no se puede decodificar.

**`usuario.repository.spec.ts`**
- `findUsuarios` devuelve la lista completa.
- `findUsuario` devuelve el usuario / `null` si no existe.
- `createUsuario` rechaza un email duplicado (`null`).
- `createUsuario` hashea la contraseña y crea el usuario (con timestamps).
- `likeTema` falla si el usuario destino no existe (`{ error: 'usuario' }`).
- `likeTema` falla si el tema no existe (`{ error: 'tema' }`).
- `likeTema` falla si el like ya existe (`{ error: 'exists' }`).
- `likeTema` registra el like si todo es válido (`{ response }`).
- `updateUsuario` devuelve `false` si el usuario no existe.
- `updateUsuario` actualiza solo los campos del body.
- `updatePassword` devuelve `false` si el usuario no existe.
- `updatePassword` guarda la contraseña hasheada.
- `deleteUsuario` devuelve `false` si el usuario no existe.
- `deleteUsuario` elimina al usuario existente.

**`tema.repository.spec.ts`**
- `findTemas` devuelve la lista; `findTema` devuelve el tema o `null`.
- `createTema` devuelve `null` si el nombre ya existe.
- `createTema` crea con `isActive: true` y timestamps.
- `updateTema` devuelve `false` si no existe y aplica `set()` + `save()` si existe.
- `deleteTema` devuelve `false` si no existe y elimina si existe.

**`post.repository.spec.ts`**
- `findPosts` devuelve la lista; `findPost` devuelve el post o `null`.
- `createPost` crea el post con timestamps.
- `updatePost` devuelve `false` si no existe y aplica `set()` + `save()` si existe.
- `findPostsByUsuario` filtra por `usuarioId` e incluye los temas.

**`role.repository.spec.ts`**
- `findRoles` devuelve la lista; `createRole` crea el rol con timestamps.
- `updateRole` lanza un error si el rol no existe.
- `updateRole` actualiza los campos del body y devuelve el rol.

**`stream.repository.spec.ts`**
- `createStream` expone los chunks de texto en un `Readable`.
- `createBuffer` serializa el body a JSON.
- `createBuffer` usa el buffer por defecto si el body está vacío.
- `nasaStream`: error tipado (`502`) si la API responde con error.
- `nasaStream`: devuelve JSON si `content-type` es `application/json`.
- `nasaStream`: lee binario vía `getReader` si el cuerpo lo expone.
- `nasaStream`: usa `arrayBuffer` como fallback para contenido `image/*`.
- `nasaStream`: hace fallback a texto si no es JSON ni imagen.
- `nasaStream`: devuelve error `502` si `fetch` lanza una excepción.
- `imageBuffer`: devuelve longitud y slice hex de la imagen.
- `imageBuffer`: devuelve `null` si la respuesta no trae cuerpo.
- `imageBuffer`: devuelve `null` si `fetch` lanza una excepción.

### 4. Controladores (`tests/controllers/`) — repositorios mockeados

**`auth.controller.spec.ts`**
- `signup`: `400` si falta name/email/password, `409` si el email existe, `201` en éxito, y propaga errores a `next`.
- `login`: `400` si faltan credenciales, `401` si son inválidas, `200` con el token.
- `logout`: `400` sin cabecera Bearer, `200` agregando el token a la blacklist.
- `hashPasswordTest`: `400` sin password, `200` con el hash.

**`usuarios.controller.spec.ts`**
- `getUsuarios` → `200`; `getUsuario` → `200` / `404`.
- `postUsuario` → `409` email duplicado / `201` creado / `500` en error.
- `postLikeTema` → `409` (usuario, tema o like duplicado) / `201` en éxito.
- `putUsuario` → excluye `email` y `password` del body; `200` / `409` / `500`.
- `eliminarUsuario` → `200` / `409`.

**`tema.controller.spec.ts`**
- `getTemas` → `200`; `getTema` → `200` / `404`.
- `postTema` → `409` duplicado / `200` creado.
- `putTema` y `eliminarTema` → `200` / `409`.

**`post.controller.spec.ts`**
- `getPosts` → `200`; `getPost` → `200` / `404`.
- `postPost` → `201` / `500`; `putPost` → `200` / `409`.
- `deletePost` → `200` con el `id` (placeholder).
- `getPostsByUsuario` → `200` con posts / `404` sin posts.

**`role.controller.spec.ts`**
- `getRoles` → `200`; `postRole` → `201`; `putRole` → `201` / `500`; `deleteRole` → `200` con el `id`.

**`stream.controller.spec.ts`**
- `getStream` fija `Content-Type: text/plain` y hace *pipe* del stream.
- `postBuffer` devuelve la info del buffer creado.
- `nasaStream` → JSON / error (`502`) / binario con `Cache-Control: no-cache` / texto plano.
- `imageBuffer` → `200` con los datos / `502` si la API falla / propaga errores a `next`.

### 5. Utilidades e infraestructura

**`tests/logger.spec.ts`**
- `info` escribe a consola y al archivo con el formato `[timestamp] [nivel] [contexto] mensaje | meta`.
- `warn` usa `console.warn` y la etiqueta `[WARN]`.
- `error` con meta `Error` incluye mensaje y stack en la línea.
- Un objeto cíclico no rompe el log (cae a `String(value)`).
- Un valor primitivo se serializa con `String()`.
- Si falla la escritura al archivo, el log de consola igual se emite.

**`tests/swagger.spec.ts`**
- Monta la UI en `/docs` y expone el JSON de la spec en `/docs/json`.
- `GET /docs/json` devuelve la spec con `Cache-Control: no-store`.
- El middleware de `/docs` añade `no-store` y continúa (`next()`).

**`tests/concurrency.spec.ts`**
- `NODE_ENV=test` → siempre 1 worker.
- `WEB_CONCURRENCY` entero ≥ 1 fuerza el número de workers.
- `WEB_CONCURRENCY` no entero se ignora en desarrollo.
- `WEB_CONCURRENCY` 0 o negativo se ignora.
- En producción usa un worker por núcleo (`os.availableParallelism`).
- En producción sin `availableParallelism` usa `os.cpus()` como fallback.

**`tests/db.connection.spec.ts`**
- Usa valores por defecto sin variables de entorno.
- Sin CA configurada el TLS conecta sin verificar el certificado.
- `DB_SSL=false` desactiva el TLS (`'off'`).
- Un `DB_PORT` inválido cae al puerto por defecto.
- Una URL `mysql://...` se parsea y se reporta como `viaUrl`.
- Un protocolo no soportado lanza error al cargar el módulo.
- `DB_SSL_CA_PATH` habilita la verificación de certificado.

### Utilidades (rutas) — `tests/utils.test.ts` (existente)

- `GET /api/utils/stream` transmite los chunks de texto (Supertest).
- `POST /api/utils/buffer` devuelve la info del buffer creado.
- Login + acceso a una ruta protegida con JWT.

### Notas de configuración

- Existe una única fuente de configuración de Jest: **`jest.config.js`**.
- `testMatch` se limita a `tests/**/*.{spec,test}.ts` y se ignora `dist/`.
- La carpeta `tests/` está **excluida del `tsconfig.json` de compilación**
  (`include: ["src"]`, `exclude: ["tests"]`), por lo que el editor puede marcar
  `Cannot find name 'jest'` en los `.spec.ts`. Jest + ts-jest los ejecutan sin
  problemas: los tipos de Jest se resuelven desde el `tsconfig.json` raíz
  (`"types": ["jest", "node"]`) y los globales existen en tiempo de ejecución.

---

## Producción y despliegue

1. Compilar:

   ```bash
   npm run build
   ```

2. Ejecutar con workers:

   ```bash
   WEB_CONCURRENCY=8 NODE_ENV=production npm start
   ```

3. Variables importantes en producción:

   - `JWT_SECRET` y `SESSION_SECRET` aleatorios y largos.
   - `DB_POOL_*` acordes al `max_connections` de tu MySQL.
   - `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` si usas OAuth Google
     (ajusta `callbackURL` en `src/server.ts` a tu dominio real).
   - Un gestor de procesos (systemd, PM2, Docker/K8s) que envíe `SIGTERM` para
     aprovechar el **graceful shutdown**.

4. (Recomendado) Sustituir la blacklist de tokens en memoria y el
   `MemoryStore` de sesiones por **Redis** cuando el despliegue sea multi-proceso
   o multi-instancia.

### Docker

El proyecto incluye contenedorización completa para desarrollo y producción:

| Archivo             | Propósito                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `Dockerfile`        | Imagen **multi-stage** (`base` → `build` → `runtime`) con Node 24 |
| `.dockerignore`     | Excluye `node_modules`, `dist`, `.env`, `.git`, etc. del build    |
| `compose.yaml`      | Stack local: **API + MySQL 8** con healthchecks y volumen de BD   |
| `compose.prod.yaml` | Plantilla de producción: red interna, sin publicar MySQL, imagen OCI |

**Flujo multi-stage del Dockerfile:**

```text
base   (node:24-alpine)  → npm ci + copia tsconfig.json
build  (base)            → compila TypeScript → dist/
runtime(node:24-alpine)  → npm ci --omit=dev + dist/ + usuario sin root
```

**Levantar en local (desarrollo):**

```bash
# 1. Crea tu .env a partir de la plantilla (commitada)
copy .env.example .env

# 2. Construye y arranca API + MySQL
docker compose up -d --build

# 3. Comprueba el estado
docker compose ps
docker compose logs -f app
```

La API queda disponible en `http://localhost:8000` (docs en `/docs`). Compose
echa un vistazo a tu `.env` para las credenciales de BD y sobrescribe
`DB_HOST=db` automáticamente dentro de la red.

**Producción (host único, sin orquestador):**

```bash
# Crea la red para el proxy reverso (solo la primera vez)
docker network create traefik

# Variables del deploy (ajústalas o usa el .env)
export REGISTRY=ghcr.io
export IMAGE_NAME=claudiovargas/node-demo-typescript
export IMAGE_TAG=1.2.3
export DB_PASSWORD='secreto-muy-largo'

docker compose -f compose.prod.yaml up -d --build
```

> ⚠️ `compose.prod.yaml` no sustituye a un orquestador real (K8s/Swarm); espera
> un proxy reverso (Caddy/Traefik/nginx) en la red externa `traefik` y no
> publica MySQL al exterior.

## CI/CD — Estrategia Push (CIOps)

El repo dispone de pipelines en `.github/workflows/` que implementan la
**estrategia Push**: el CI se dispara exclusivamente por **`push`** a
`develop`/`main` (o un tag `v*`), y cada commit que pasa las pruebas publica
automáticamente un artefacto (la imagen OCI) listo para desplegar.

### Workflows

| Workflow           | Trigger                       | Qué hace                                                              |
| ------------------ | ----------------------------- | --------------------------------------------------------------------- |
| `ci-cd-push.yml`   | Push a `develop`, `main` o tag `v*` | 1) Tests (Node 20/22/24) → 2) Build Docker → 3) **Smoke test E2E (Docker + MySQL)** → 4) Push a GHCR |
| `deploy.yml`       | Manual (`workflow_dispatch`)  | Despliega la imagen ya publicada a un entorno (plantilla SSH/K8s)     |

### Publicación en GHCR (GitHub Container Registry)

El job `docker-build` usa `docker/metadata-action` para generar los tags de la
imagen según el evento:

| Evento        | Etiquetas publicadas en `ghcr.io/<usuario>/node-demo-typescript` |
| ------------- | ---------------------------------------------------------------- |
| Rama `develop`| `develop`, `latest` (solo si `main`)                              |
| Rama `main`   | `main`, `latest`                                                  |
| Tag `v1.2.3`  | `1.2.3`, `1.2`, `latest` (si es la default)                       |

El push a GHCR usa el permiso `packages: write` con el `GITHUB_TOKEN`
automático de GitHub Actions; si publicas el paquete como **privado**, recuerda
añadir al contenedor/producto consumidor el token con `read:packages`.

### Despliegue (CIOps)

El pipeline **no despliega en producción automáticamente**: publica el
artefacto y lo deja listo. El despliegue se lanza desde
**Actions → Despliegue manual** (o mediante un runner/CD externo que lea la
imagen de GHCR). La rama `develop` queda lista para entornos de staging y un tag
`v*` para producción. Esto sigue la práctica **CIOps**: el artefacto (imagen)
es el único resultado del CI/CD y el despliegue es reproducible a partir de él.

### Ejecutar manualmente en local todo lo que hace el CI

```bash
npm ci && npm run build && npm test
docker compose build
docker compose up -d

```

### Subir a hub.docker

```bash
ejemplo para subir a hub.docker
docker tag node-demo:local srdarus/node_typescript:v1.0
docker push srdarus/node_typescript:v1.0
```

## Limitaciones conocidas

- **Blacklist de tokens en memoria** (`tokenBlacklist.ts`): no compartida entre
  workers/instancias. En cluster un token revocado en un worker sigue válido en
  otro. Solución recomendada: Redis.
- **express-session con `MemoryStore`** por defecto: no apto para producción;
  usar `connect-redis` u otro store persistente en despliegues reales.
- **`callbackURL` de Google OAuth** hardcodeado a
  `http://localhost:8000/auth/google/callback`: hay que cambiarlo por el dominio
  real en producción.
- **Sincronización de modelos en cada arranque** (`sync({ alter: false })`):
  práctica aceptable para demos; en producción se recomienda usar **migraciones**
  (p. ej. `sequelize-cli`).
- **`likeTema`** (`usuario.repository.ts`) usa comprobaciones manuales
  (findOne antes de create) que no son atómicas; con alto volumen conviene
  añadir un índice único `(usuarioId, temaId)` y capturar el error de duplicado.
- Varios controladores devuelven errores genéricos con typos
  (`"Contecte con el administrador"`) y ocultan la excepción: en producción se
  recomienda loguear el error real y devolver una respuesta estandarizada.

---

## Cambios recientes y mantenimiento

Este repositorio fue revisado y ajustado recientemente. Los cambios principales:

1. **Estrategia de concurrencia**: nuevo `src/concurrency.ts` con **cluster**,
   reintento de workers, anti crash-loop y **graceful shutdown**
   (SIGINT/SIGTERM + cierre de pool de BD).
2. **Arranque seguro**: `src/app.ts` carga `dotenv/config` primero; el servidor
   espera a la BD antes de escuchar (`server.start()` devuelve el `http.Server`).
3. **CORS corregido**: el middleware ahora se registra con `app.use(cors(...))`
   (antes la configuración no llegaba a aplicarse).
4. **Pool de MySQL configurable** mediante variables `DB_POOL_*` y credenciales
   vía `DB_*` en `src/db/connection.ts`.
5. **Build corregido**: `tsconfig.json` incluye solo `src/`, por lo que `tsc`
   emite `dist/app.js` (coincide con `main` y `npm start`). Se añadió
   `npm run clean`.
6. **Jest unificado**: una sola `jest.config.js`, `testMatch` restringido a
   `tests/**/*.{spec,test}.ts`, aviso TS151002 silenciado, y mocks corregidos en
   `tests/index.spec.ts` (rutas `../src/...`).
7. **Documentación**: este `README.md` y la plantilla `.env.example`.

### Docker + CI/CD (añadido)

8. **Contenedorización**: `Dockerfile` multi-stage (deps → build → runtime), `.dockerignore`,
   `compose.yaml` (API + MySQL 8 con healthchecks) y `compose.prod.yaml` (plantilla de
   producción con red externa para proxy reverso).
9. **CI/CD Push (CIOps)**: `.github/workflows/ci-cd-push.yml` ejecuta tests multi-versión,
   build de la imagen con caché, **smoke test E2E (Docker + MySQL)** y publica la imagen
   en GHCR (`packages: write`). `.github/workflows/deploy.yml` permite el despliegue
   manual del artefacto publicado.
10. **Arranque sobre BD vacía**: `src/server.ts` ahora usa `db.sync({ alter: false })`
    (en vez de `sync()` individuales de Tema/Usuario/Post) que respeta el orden de las
    FK — antes fallaba con `ER_FK_CANNOT_OPEN_PARENT` creando `Usuarios` antes que
    `Roles`, lo que derribaba el contenedor (unhandled rejection). El `.catch` evita
    que un fallo de sincronización mate al worker.

---

## Licencia

ISC (ver `package.json`).