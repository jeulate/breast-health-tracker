# Arquitectura – BI-RADS Tracker

## Resumen

BI-RADS Tracker es una plataforma modular de seguimiento y acompañamiento para pacientes con hallazgos mamarios BI-RADS 3. No realiza diagnósticos médicos.

---

## Arquitectura modular

```
src/
  app/           → Route Handlers y páginas (Next.js App Router)
  components/    → Componentes de React reutilizables
  features/      → Barriles públicos por dominio
  lib/           → Utilidades puras (JWT, hashing, validaciones, Redis client)
  repositories/  → Acceso a Redis (única capa que toca la base de datos)
  services/      → Lógica de negocio (orquesta repositorios)
  config/        → Validación centralizada de variables de entorno
  types/         → Tipos TypeScript compartidos
  middleware.ts  → Protección de rutas en Edge
```

### Separación de capas

| Capa           | Responsabilidad              | Puede usar             |
| -------------- | ---------------------------- | ---------------------- |
| Route Handlers | Recibir HTTP, responder JSON | Services               |
| Services       | Lógica de negocio            | Repositories, lib/     |
| Repositories   | Leer/escribir Redis          | lib/redis/client       |
| Middleware     | Proteger rutas               | jose (Edge-compatible) |

> Las páginas y Route Handlers **nunca** importan Redis directamente.

---

## Diseño de claves Redis

```
users:{userId}           → Hash con campos del usuario
users:email:{email}      → String → userId (índice inverso)
users:index              → Set con todos los userIds

patients:{patientId}     → Hash con campos del paciente
patients:index           → Set con todos los patientIds
```

### Razón del diseño

- Las búsquedas por ID son O(1) con HGETALL.
- El índice por email permite login sin scan completo.
- Los índices Set permiten listar todos los registros.
- Diseño preparado para migrar a PostgreSQL: cada "hash" equivale a una fila.

---

## Autenticación

1. `POST /api/auth/login` valida credenciales con bcryptjs.
2. Genera un JWT firmado con HS256 (jose) usando `AUTH_SECRET`.
3. Almacena el token en una cookie HTTP-only (`session`).
4. El middleware Edge verifica el JWT en cada request a `/dashboard`.
5. `GET /api/auth/me` devuelve el usuario actual leyendo la cookie.
6. `POST /api/auth/logout` elimina la cookie.

### Flujo

```
Client → POST /api/auth/login
       ← 200 + Set-Cookie: session=<JWT>
Client → GET /dashboard (cookie adjunta automáticamente)
Middleware verifica JWT → Next.js renderiza dashboard
```

---

## Preparación para Telegram (Fase 4)

- `Patient.telegramUserId` y `Patient.telegramChatId` ya están definidos en el tipo.
- Se ha reservado espacio en el repositorio de pacientes para estos campos.
- El bot de Telegram se integrará como un webhook en `src/app/api/telegram/webhook/route.ts`.
- La máquina de estados de conversación usará Redis como storage.

---

## Preparación para migrar a PostgreSQL

- Los repositorios son la **única** capa que toca la base de datos.
- Para migrar: reemplazar la implementación de `UserRepository` y `PatientRepository` por clientes de PostgreSQL (Drizzle ORM recomendado) sin tocar servicios ni Route Handlers.
- Los tipos TypeScript son agnósticos al motor de base de datos.
